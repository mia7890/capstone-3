import React, { useEffect, useRef, useState } from 'react';
import { PageId, peso, playScannerBeep } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { StickerCard } from '../components/BarcodeSticker';

interface DeductStockViewProps {
  appState: any;
  activeStaff: string;
  initialSearch?: string;
  initialSubTab?: 'camera' | 'manual';
  onNavigate?: (page: PageId) => void;
  onStateUpdated: (newState: any, msg: string) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const DeductStockView: React.FC<DeductStockViewProps> = ({
  appState,
  activeStaff,
  initialSearch = '',
  initialSubTab = 'camera',
  onNavigate,
  onStateUpdated,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<'camera' | 'manual'>(initialSubTab);
  const [channel, setChannel] = useState<string>('TikTok');
  const [fulfillment, setFulfillment] = useState<string>('Meet-up');
  const [clientName, setClientName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [scanCodeInput, setScanCodeInput] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [showStickersPreview, setShowStickersPreview] = useState<boolean>(false);
  const [cameraHint, setCameraHint] = useState<string>('Scanning barcode...');
  const [lastSaleResult, setLastSaleResult] = useState<{ sale: any; updatedItem: any } | null>(
    null,
  );
  const [brandFilter, setBrandFilter] = useState<string>('ALL');
  const [manualSearch, setManualSearch] = useState<string>(initialSearch);
  const [qtyBySku, setQtyBySku] = useState<Record<string, number>>({});
  const [isWorking, setIsWorking] = useState<boolean>(false);

  // Pending Deduction Confirmation Modal State
  const [pendingItem, setPendingItem] = useState<any | null>(null);
  const [pendingQty, setPendingQty] = useState<number>(1);
  const [pendingUnitPrice, setPendingUnitPrice] = useState<number>(0);
  const [pendingMethod, setPendingMethod] = useState<'BARCODE_SCAN' | 'MANUAL_PICK'>(
    'MANUAL_PICK',
  );
  const [modalError, setModalError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (initialSearch) {
      setSubTab('manual');
      setManualSearch(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'qr_code', 'code_39', 'ean_13'],
        });
        setCameraHint('Camera Active — Point at the barcode sticker on the back of the box');
        timerRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes && codes.length > 0 && codes[0].rawValue) {
              playScannerBeep();
              requestDeductValidation(codes[0].rawValue.trim(), 'BARCODE_SCAN', 1);
            }
          } catch (_) {}
        }, 550);
      } else {
        setCameraHint('Camera Active — Point at sticker or tap a gadget chip below');
      }
    } catch (_) {
      setCameraHint('Camera hardware not detected — tap any gadget below to scan & validate:');
    }
  };

  const stopCamera = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const requestDeductValidation = (
    codeOrSku: string,
    method: 'BARCODE_SCAN' | 'MANUAL_PICK',
    requestedQty = 1,
  ) => {
    const clean = (codeOrSku || '').trim().toUpperCase();
    if (!clean) {
      onNotify('Please scan or enter a valid sticker code first.', true);
      return;
    }

    const found = appState.inventory.find(
      (i: any) =>
        i.sku.toUpperCase() === clean ||
        `${i.model} ${i.storage} ${i.color}`.toUpperCase().includes(clean),
    );

    if (!found) {
      onNotify(`No gadget found matching code "${codeOrSku}".`, true);
      return;
    }

    if (found.quantity <= 0) {
      onNotify(
        `Cannot deduct ${found.model} (${found.color}): Out of stock (0 pcs remaining).`,
        true,
      );
      return;
    }

    const qty = Math.round(Number(requestedQty) || 1);
    if (qty < 1) {
      onNotify('Quantity to deduct must be at least 1 pc.', true);
      return;
    }
    if (qty > found.quantity) {
      onNotify(
        `Cannot deduct ${qty} pcs of ${found.model} (${found.color}) — only ${found.quantity} pcs in stock.`,
        true,
      );
      return;
    }

    setModalError(null);
    setPendingItem(found);
    setPendingQty(qty);
    setPendingUnitPrice(found.sellingPrice);
    setPendingMethod(method);
  };

  const handleConfirmDeduct = async () => {
    if (!pendingItem || isWorking) return;

    if (pendingQty < 1 || pendingQty > pendingItem.quantity) {
      setModalError(
        `Invalid quantity: Please enter between 1 and ${pendingItem.quantity} pcs.`,
      );
      return;
    }
    if (!pendingUnitPrice || pendingUnitPrice < 500) {
      setModalError('Please enter a valid selling price per unit (at least PHP 500).');
      return;
    }

    setModalError(null);
    setIsWorking(true);
    try {
      const res = await fetch('/api/stock-out/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeOrSku: pendingItem.sku,
          quantity: pendingQty,
          customSellingPrice: pendingUnitPrice,
          deductMethod: pendingMethod,
          channel,
          fulfillment,
          clientName: clientName.trim() || 'Verified Buyer',
          location: location.trim() || 'Metro Manila Meet-up',
          handledBy: activeStaff,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Deduction failed');
      setPendingItem(null);
      setLastSaleResult({ sale: data.sale, updatedItem: data.updatedItem });
      onStateUpdated(data.state, data.message);
    } catch (err: any) {
      setModalError(err.message);
      onNotify(err.message, true);
    } finally {
      setTimeout(() => setIsWorking(false), 280);
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = scanCodeInput.trim();
    if (!code) {
      onNotify('Please enter or scan a sticker code first.', true);
      return;
    }
    playScannerBeep();
    requestDeductValidation(code, 'BARCODE_SCAN', 1);
    setScanCodeInput('');
  };

  const inStockChips = appState.inventory.filter((i: any) => i.quantity > 0);

  const filteredGadgets = appState.inventory.filter((i: any) => {
    if (brandFilter !== 'ALL' && i.brand !== brandFilter) return false;
    if (manualSearch.trim()) {
      const q = manualSearch.toLowerCase();
      return `${i.model} ${i.storage} ${i.color} ${i.sku}`.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <section className="view-page active">
      <div className="pill-tabs no-print">
        <button
          className={`pill-tab ${subTab === 'manual' ? 'active' : ''}`}
          onClick={() => {
            stopCamera();
            setSubTab('manual');
          }}
        >
          Option 1: Manual Search &amp; Select (Preferred / Fast Sales)
        </button>
        <button
          className={`pill-tab ${subTab === 'camera' ? 'active' : ''}`}
          onClick={() => setSubTab('camera')}
        >
          Option 2: Scan Barcode Sticker (Optional)
        </button>
      </div>

      {/* Sale Context Bar */}
      <div className="surface-card no-print" style={{ padding: '16px 22px' }}>
        <div className="form-grid">
          <div className="input-group">
            <label>Sales Channel</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="TikTok">TikTok Shop / Page</option>
              <option value="Facebook">Facebook Marketplace / Page</option>
              <option value="Instagram">Instagram Shop</option>
              <option value="Referral">Walk-in / Referral</option>
            </select>
          </div>
          <div className="input-group">
            <label>Fulfillment Mode</label>
            <select value={fulfillment} onChange={(e) => setFulfillment(e.target.value)}>
              <option value="Meet-up">Meet-up (Checked & Paid)</option>
              <option value="COD">Cash on Delivery (COD)</option>
            </select>
          </div>
          <div className="input-group">
            <label>Client / Buyer Name *</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Jayson Dela Cruz"
            />
          </div>
          <div className="input-group">
            <label>Meet-up / COD Location *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. SM North EDSA / Trinoma QC"
            />
          </div>
        </div>
      </div>

      {/* OPTION 1: CAMERA BARCODE SCANNER */}
      {subTab === 'camera' && (
        <div className="surface-card">
          <div className="surface-head">
            <div>
              <div className="surface-title">Phone / Web Camera Barcode Scanner</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Scan box stickers with camera or type sticker code to deduct.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn-pill btn-sm ${showStickersPreview ? 'btn-dark' : 'btn-soft'}`}
                onClick={() => setShowStickersPreview(!showStickersPreview)}
              >
                {showStickersPreview ? 'Hide Barcode Stickers' : 'Show Barcode Stickers'}
              </button>
              {onNavigate && (
                <button
                  type="button"
                  className="btn-pill btn-soft btn-sm"
                  onClick={() => onNavigate('page-inventory')}
                >
                  Full Sticker Catalog ➔
                </button>
              )}
              {!cameraActive ? (
                <button type="button" className="btn-pill btn-dark btn-sm" onClick={startCamera}>
                  Open Camera Scanner
                </button>
              ) : (
                <button type="button" className="btn-pill btn-soft btn-sm" onClick={stopCamera}>
                  Close Camera
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Barcode Sticker Cards */}
          {showStickersPreview && (
            <div
              style={{
                marginBottom: '18px',
                padding: '16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                  Box Barcode Stickers (Scan with camera or click any sticker to deduct):
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    className="btn-pill btn-soft btn-sm"
                    onClick={() => onNavigate('page-inventory')}
                  >
                    Open Printable Sticker Sheet ➔
                  </button>
                )}
              </div>
              <div className="sticker-grid">
                {inStockChips.map((s: any) => (
                  <div
                    key={s.sku}
                    style={{ cursor: 'pointer', transition: 'transform 0.12s ease' }}
                    onClick={() => {
                      playScannerBeep();
                      requestDeductValidation(s.sku, 'BARCODE_SCAN', 1);
                    }}
                    title="Click to scan & deduct this box sticker"
                  >
                    <StickerCard item={s} showPrice={true} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {cameraActive && (
            <div className="camera-stage">
              <div
                style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--accent-blue)' }}
              >
                Point camera at the barcode sticker on the box
              </div>
              <div className="camera-frame">
                <video ref={videoRef} playsInline muted autoPlay />
                <div className="laser-line" />
              </div>
              <div style={{ fontSize: '0.78rem', color: '#a1a1aa', marginBottom: '12px' }}>
                {cameraHint}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {inStockChips.map((i: any) => (
                  <button
                    key={i.sku}
                    type="button"
                    className="btn-pill btn-soft btn-sm"
                    onClick={() => {
                      playScannerBeep();
                      requestDeductValidation(i.sku, 'BARCODE_SCAN', 1);
                    }}
                  >
                    Scan {i.model} {i.storage} ({i.color})
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={handleCodeSubmit}
            style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}
          >
            <input
              type="text"
              value={scanCodeInput}
              onChange={(e) => setScanCodeInput(e.target.value)}
              placeholder="Scan or type sticker code..."
              style={{ flex: 1, minWidth: '210px' }}
            />
            <button type="submit" className="btn-pill btn-dark">
              Verify & Deduct
            </button>
          </form>

          {inStockChips.length > 0 && (
            <>
              <div
                style={{
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                  fontWeight: 600,
                }}
              >
                Tap an item below to scan & verify:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {inStockChips.map((i: any) => (
                  <button
                    key={i.sku}
                    type="button"
                    className="btn-pill btn-soft btn-sm"
                    onClick={() => {
                      playScannerBeep();
                      requestDeductValidation(i.sku, 'BARCODE_SCAN', 1);
                    }}
                  >
                    {i.model} {i.storage} ({i.color}) • {i.quantity} left
                  </button>
                ))}
              </div>
            </>
          )}

          {lastSaleResult && (
            <div
              style={{
                marginTop: '16px',
                padding: '16px 20px',
                borderRadius: '18px',
                background: 'var(--pill-green-bg)',
                color: 'var(--pill-green-text)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.94rem' }}>
                    Confirmed Sale: {lastSaleResult.sale.quantity}x {lastSaleResult.sale.model}{' '}
                    {lastSaleResult.sale.storage} ({lastSaleResult.sale.color})
                  </div>
                  <div style={{ fontSize: '0.79rem', opacity: 0.85 }}>
                    Receipt {lastSaleResult.sale.receiptNo} • Buyer:{' '}
                    <strong>{lastSaleResult.sale.clientName}</strong> ({lastSaleResult.sale.channel}{' '}
                    / {lastSaleResult.sale.fulfillment}) • Remaining Stock:{' '}
                    <strong>
                      {lastSaleResult.updatedItem ? lastSaleResult.updatedItem.quantity : '-'} pcs
                    </strong>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.02rem' }}>
                  +{peso(lastSaleResult.sale.netProfit)} Profit
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OPTION 2: MANUAL SEARCH & PICK */}
      {subTab === 'manual' && (
        <div className="surface-card">
          <div className="surface-head">
            <div>
              <div className="surface-title">Manual Gadget Selection</div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'All', val: 'ALL' },
                { label: 'iPhones', val: 'Apple iPhone' },
                { label: 'iPads', val: 'Apple iPad' },
                { label: 'AirPods', val: 'Apple AirPods' },
                { label: 'Samsung', val: 'Samsung' },
              ].map((b) => (
                <button
                  key={b.val}
                  type="button"
                  className={`btn-pill btn-sm ${
                    brandFilter === b.val ? 'btn-dark' : 'btn-soft'
                  }`}
                  onClick={() => setBrandFilter(b.val)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={manualSearch}
              onChange={(e) => setManualSearch(e.target.value)}
              placeholder="Search gadget model, storage, or color..."
            />
          </div>

          {filteredGadgets.length === 0 ? (
            <div
              style={{
                padding: '28px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              No gadgets found matching your filter.
            </div>
          ) : (
            <div className="gadget-cards-grid">
              {filteredGadgets.map((i: any) => {
                const qtyVal = qtyBySku[i.sku] ?? 1;
                return (
                  <div className="gadget-card" key={i.sku}>
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                        }}
                      >
                        <span className={`status-pill ${i.quantity > 0 ? 'success' : 'failed'}`}>
                          <span className="status-dot" />
                          {i.quantity} in stock
                        </span>
                      </div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 800 }}>{i.model}</div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                          marginTop: '2px',
                        }}
                      >
                        {i.storage} • {i.color} ({i.condition})
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '10px',
                        borderTop: '1px solid #e4e4e7',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800 }}>
                          {peso(i.sellingPrice)}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: '#059669', fontWeight: 700 }}>
                          +{peso(i.unitProfit)} profit
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          min={1}
                          max={Math.max(1, i.quantity)}
                          value={qtyVal}
                          onChange={(e) =>
                            setQtyBySku((prev) => ({
                              ...prev,
                              [i.sku]: Math.max(1, Number(e.target.value) || 1),
                            }))
                          }
                          style={{ width: '58px', padding: '6px 8px', textAlign: 'center' }}
                        />
                        <button
                          type="button"
                          className="btn-pill btn-dark btn-sm"
                          disabled={i.quantity <= 0}
                          onClick={() => requestDeductValidation(i.sku, 'MANUAL_PICK', qtyVal)}
                        >
                          Deduct
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SALE & STOCK DEDUCTION CONFIRMATION MODAL */}
      <ConfirmModal
        open={Boolean(pendingItem)}
        badgeText={
          pendingMethod === 'BARCODE_SCAN'
            ? 'Barcode Scan Verification'
            : 'Manual Sale Verification'
        }
        badgeTone="blue"
        title={
          pendingItem
            ? `Confirm Sale: ${pendingItem.model} ${pendingItem.storage} (${pendingItem.color})`
            : 'Confirm Deduction'
        }
        subtitle="Verify the quantity and buyer details below before deducting stock from inventory."
        confirmLabel={
          pendingItem
            ? `Confirm Sale & Deduct ${pendingQty} pc(s)`
            : 'Confirm & Deduct'
        }
        confirmTone="dark"
        isBusy={isWorking}
        validationError={modalError}
        onConfirm={handleConfirmDeduct}
        onCancel={() => {
          setPendingItem(null);
          setModalError(null);
        }}
      >
        {pendingItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-dark)' }}>
              Stock: {pendingItem.quantity} pcs → {Math.max(0, pendingItem.quantity - pendingQty)}{' '}
              pcs • Sale Amount: {peso(pendingUnitPrice * pendingQty)} •{' '}
              <span style={{ color: '#059669' }}>
                Profit: +{peso((pendingUnitPrice - pendingItem.costPrice) * pendingQty)}
              </span>
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="input-group">
                <label>Quantity to Deduct (Max {pendingItem.quantity} pcs) *</label>
                <input
                  type="number"
                  min={1}
                  max={pendingItem.quantity}
                  value={pendingQty}
                  onChange={(e) =>
                    setPendingQty(
                      Math.min(
                        pendingItem.quantity,
                        Math.max(1, Math.round(Number(e.target.value) || 1)),
                      ),
                    )
                  }
                />
              </div>

              <div className="input-group">
                <label>Selling / Dealer Price per Unit (PHP) *</label>
                <input
                  type="number"
                  min={500}
                  step={100}
                  value={pendingUnitPrice}
                  onChange={(e) => setPendingUnitPrice(Math.round(Number(e.target.value) || 0))}
                />
              </div>

              <div className="input-group">
                <label>Client / Buyer Name (Optional)</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if (modalError) setModalError(null);
                  }}
                  placeholder="Optional buyer name..."
                />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {['Walk-in Buyer', 'Bulk Dealer Order', 'TikTok Meet-up Buyer'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="quick-chip-btn"
                      onClick={() => {
                        setClientName(preset);
                        if (modalError) setModalError(null);
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>Meet-up / COD Location (Optional)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (modalError) setModalError(null);
                  }}
                  placeholder="Optional meet-up or COD location..."
                />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {['SM North EDSA', 'Trinoma QC', 'Gateway Cubao', 'Metro Manila COD'].map(
                    (loc) => (
                      <button
                        key={loc}
                        type="button"
                        className="quick-chip-btn"
                        onClick={() => {
                          setLocation(loc);
                          if (modalError) setModalError(null);
                        }}
                      >
                        {loc}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </ConfirmModal>
    </section>
  );
};
