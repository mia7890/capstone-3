import React, { useState } from 'react';
import {
  BulkManualRow,
  MODEL_PRICES,
  MR_VENTURA_SAMPLE_NOTE,
  STANDARD_BATCH_NOTE,
  peso,
  getColorHex,
} from '../types';
import { StickerCard } from '../components/BarcodeSticker';
import { ConfirmModal } from '../components/ConfirmModal';

interface StockInViewProps {
  appState: any;
  activeStaff: string;
  onStateUpdated: (newState: any, msg: string) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const StockInView: React.FC<StockInViewProps> = ({
  appState,
  activeStaff,
  onStateUpdated,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<'note' | 'manual'>('note');
  const [rawNote, setRawNote] = useState<string>(MR_VENTURA_SAMPLE_NOTE);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [generatedStickers, setGeneratedStickers] = useState<any[]>([]);
  const [isWorking, setIsWorking] = useState<boolean>(false);

  // Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [confirmSource, setConfirmSource] = useState<'NOTE_PASTE' | 'MANUAL_DROPDOWN'>('NOTE_PASTE');
  const [itemsToConfirm, setItemsToConfirm] = useState<any[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [assignedTo, setAssignedTo] = useState<string>(activeStaff || 'All Staff');

  const [bulkRows, setBulkRows] = useState<BulkManualRow[]>([
    {
      brand: 'Apple iPhone',
      model: 'iPhone 12 Mini',
      storage: '128GB',
      color: 'Black',
      condition: 'Pre-Owned (Smooth)',
      quantity: 10,
      costPrice: 13500,
      sellingPrice: 16500,
    },
    {
      brand: 'Apple iPhone',
      model: 'iPhone 13',
      storage: '128GB',
      color: 'Pink',
      condition: 'Pre-Owned (Smooth)',
      quantity: 8,
      costPrice: 18200,
      sellingPrice: 21500,
    },
  ]);

  const opts = appState.catalogOptions;

  const handleLoadNote = (type: 'ventura' | 'standard') => {
    setRawNote(type === 'ventura' ? MR_VENTURA_SAMPLE_NOTE : STANDARD_BATCH_NOTE);
    setParsedItems([]);
    onNotify(
      type === 'ventura' ? 'Loaded sample shorthand note.' : 'Loaded standard stock-in note.',
    );
  };

  const handlePreviewNote = async (): Promise<any[] | null> => {
    if (!rawNote.trim()) {
      onNotify('Please paste a stock note first.', true);
      return null;
    }
    try {
      const res = await fetch('/api/stock-in/parse-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not parse note');
      const items = data.items || [];
      if (items.length === 0) {
        onNotify('No valid gadget lines found in the note. Please check the format.', true);
        return null;
      }
      setParsedItems(items);
      return items;
    } catch (err: any) {
      onNotify(err.message, true);
      return null;
    }
  };

  const updateParsedRow = (idx: number, field: string, val: string) => {
    setParsedItems((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        [field]: Math.max(0, Math.round(Number(val) || 0)),
      };
      return next;
    });
  };

  const validateStockItems = (items: any[]): string | null => {
    if (!items || items.length === 0) {
      return 'Please add at least 1 gadget row before saving.';
    }
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const rowLabel = `Row #${i + 1} (${row.model} ${row.storage} ${row.color})`;
      if (!row.quantity || Number(row.quantity) < 1 || Number(row.quantity) > 500) {
        return `${rowLabel}: Quantity must be between 1 and 500 pcs.`;
      }
      if (!row.costPrice || Number(row.costPrice) < 500) {
        return `${rowLabel}: Buy Cost must be at least PHP 500.`;
      }
      if (!row.sellingPrice || Number(row.sellingPrice) < 500) {
        return `${rowLabel}: Sell Price must be at least PHP 500.`;
      }
      if (Number(row.sellingPrice) <= Number(row.costPrice)) {
        return `${rowLabel}: Sell Price (${peso(row.sellingPrice)}) must be higher than Buy Cost (${peso(row.costPrice)}).`;
      }
    }
    return null;
  };

  const handlePrepareCommitNote = async () => {
    let list = parsedItems;
    if (list.length === 0) {
      const fetched = await handlePreviewNote();
      if (!fetched) return;
      list = fetched;
    }
    const err = validateStockItems(list);
    if (err) {
      onNotify(err, true);
      return;
    }
    setValidationError(null);
    setConfirmSource('NOTE_PASTE');
    setItemsToConfirm(list);
    setConfirmModalOpen(true);
  };

  const handlePrepareCommitBulk = () => {
    const err = validateStockItems(bulkRows);
    if (err) {
      onNotify(err, true);
      return;
    }
    setValidationError(null);
    setConfirmSource('MANUAL_DROPDOWN');
    setItemsToConfirm(bulkRows);
    setConfirmModalOpen(true);
  };

  const handleConfirmCommit = async () => {
    if (isWorking) return;
    const err = validateStockItems(itemsToConfirm);
    if (err) {
      setValidationError(err);
      return;
    }
    setIsWorking(true);
    try {
      const res = await fetch('/api/stock-in/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: confirmSource,
          rawNote: confirmSource === 'NOTE_PASTE' ? rawNote : undefined,
          handledBy: activeStaff,
          assignedTo,
          items: itemsToConfirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Stock-in failed');
      setConfirmModalOpen(false);
      setParsedItems([]);
      setGeneratedStickers(data.generatedStickers || []);
      onStateUpdated(data.state, data.message);
    } catch (err: any) {
      setValidationError(err.message);
      onNotify(err.message, true);
    } finally {
      setIsWorking(false);
    }
  };

  const addBulkRow = () => {
    setBulkRows((prev) => [
      ...prev,
      {
        brand: 'Apple iPhone',
        model: 'iPhone 12 Mini',
        storage: '128GB',
        color: 'White',
        condition: 'Pre-Owned (Smooth)',
        quantity: 5,
        costPrice: 13500,
        sellingPrice: 16500,
      },
    ]);
  };

  const addPresetBulkRows = () => {
    setBulkRows((prev) => [
      ...prev,
      {
        brand: 'Apple iPhone',
        model: 'iPhone 11',
        storage: '128GB',
        color: 'Black',
        condition: 'Brand New (Sealed)',
        quantity: 3,
        costPrice: 13500,
        sellingPrice: 16500,
      },
      {
        brand: 'Apple iPhone',
        model: 'iPhone 11',
        storage: '128GB',
        color: 'Red',
        condition: 'Class B',
        quantity: 4,
        costPrice: 11000,
        sellingPrice: 13800,
      },
      {
        brand: 'Apple iPhone',
        model: 'iPhone 11',
        storage: '64GB',
        color: 'Graphite',
        condition: 'Class C',
        quantity: 5,
        costPrice: 8800,
        sellingPrice: 11200,
      },
    ]);
    onNotify('Added Multi-Grade Set (Brand New, Class B, Class C).');
  };

  const duplicateBulkRow = (idx: number) => {
    setBulkRows((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, { ...prev[idx] });
      return next;
    });
  };

  const removeBulkRow = (idx: number) => {
    if (bulkRows.length <= 1) {
      onNotify('Keep at least 1 row in the list.', true);
      return;
    }
    setBulkRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateBulkRow = (idx: number, field: keyof BulkManualRow, val: string) => {
    setBulkRows((prev) => {
      const next = [...prev];
      const row = { ...next[idx] };
      if (field === 'brand') {
        row.brand = val;
        const models = opts.modelsByBrand[val] || ['iPhone 12 Mini'];
        row.model = models[0];
        const def = MODEL_PRICES[row.model];
        if (def) {
          row.costPrice = def.cost;
          row.sellingPrice = def.price;
          row.storage = def.storage;
        }
      } else if (field === 'model') {
        row.model = val;
        const def = MODEL_PRICES[val];
        if (def) {
          row.costPrice = def.cost;
          row.sellingPrice = def.price;
          row.storage = def.storage;
        }
      } else if (field === 'quantity' || field === 'costPrice' || field === 'sellingPrice') {
        (row as any)[field] = Math.max(0, Math.round(Number(val) || 0));
      } else {
        (row as any)[field] = val;
      }
      next[idx] = row;
      return next;
    });
  };

  const bulkTotalUnits = bulkRows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const bulkTotalCapital = bulkRows.reduce(
    (s, r) => s + (Number(r.quantity) || 0) * (Number(r.costPrice) || 0),
    0,
  );
  const bulkTotalProfit = bulkRows.reduce(
    (s, r) =>
      s + (Number(r.quantity) || 0) * ((Number(r.sellingPrice) || 0) - (Number(r.costPrice) || 0)),
    0,
  );

  const confirmTotalUnits = itemsToConfirm.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const confirmTotalCapital = itemsToConfirm.reduce(
    (s, r) => s + (Number(r.quantity) || 0) * (Number(r.costPrice) || 0),
    0,
  );
  const confirmTotalProfit = itemsToConfirm.reduce(
    (s, r) =>
      s + (Number(r.quantity) || 0) * ((Number(r.sellingPrice) || 0) - (Number(r.costPrice) || 0)),
    0,
  );

  return (
    <section className="view-page active">
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div className="pill-tabs" style={{ marginBottom: 0 }}>
          <button
            className={`pill-tab ${subTab === 'note' ? 'active' : ''}`}
            onClick={() => setSubTab('note')}
          >
            Option A: Copy &amp; Paste from Notes
          </button>
          <button
            className={`pill-tab ${subTab === 'manual' ? 'active' : ''}`}
            onClick={() => setSubTab('manual')}
          >
            Option B: Bulk Selection Form (Multi-Item / Grading)
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Assign Batch To:
          </span>
          <select
            style={{ width: 'auto', padding: '7px 12px', fontSize: '0.82rem', fontWeight: 700 }}
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="All Staff">Shared (All Staff)</option>
            {(opts?.staff || []).map((st: string) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* OPTION 1: SMART NOTE COPY-PASTE */}
      {subTab === 'note' && (
        <div className="surface-card no-print">
          <div className="surface-head">
            <div>
              <div className="surface-title">Copy & Paste Stock Note</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-pill btn-dark btn-sm"
                onClick={() => handleLoadNote('ventura')}
              >
                Load Sample Note
              </button>
              <button
                type="button"
                className="btn-pill btn-soft btn-sm"
                onClick={() => handleLoadNote('standard')}
              >
                Load Standard Note
              </button>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label>Paste Stock Note:</label>
            <textarea
              value={rawNote}
              onChange={(e) => setRawNote(e.target.value)}
              placeholder="12MINI 64 (4) - 7,000 // 28,000"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-pill btn-dark"
              disabled={isWorking}
              onClick={handlePrepareCommitNote}
            >
              Review & Add to Inventory
            </button>
            <button type="button" className="btn-pill btn-soft" onClick={handlePreviewNote}>
              Preview List First
            </button>
          </div>

          {parsedItems.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginBottom: '12px',
                  color: 'var(--text-dark)',
                }}
              >
                {parsedItems.length} Variant(s) •{' '}
                {parsedItems.reduce((s, i) => s + Number(i.quantity || 0), 0)} Units • Total Cost:{' '}
                {peso(
                  parsedItems.reduce(
                    (s, i) => s + Number(i.quantity || 0) * Number(i.costPrice || 0),
                    0,
                  ),
                )}{' '}
                •{' '}
                <span style={{ color: '#059669' }}>
                  Expected Profit: +
                  {peso(
                    parsedItems.reduce(
                      (s, i) =>
                        s +
                        Number(i.quantity || 0) *
                          (Number(i.sellingPrice || 0) - Number(i.costPrice || 0)),
                      0,
                    ),
                  )}
                </span>
              </div>

              <div className="clean-table-wrap">
                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Details</th>
                      <th>Qty</th>
                      <th>Buy Cost (PHP)</th>
                      <th>Sell Price (PHP)</th>
                      <th>Profit / Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedItems.map((item, idx) => {
                      const unitProfit = Number(item.sellingPrice) - Number(item.costPrice);
                      return (
                        <tr key={item.sku + idx}>
                          <td>
                            <strong>{item.model}</strong>
                          </td>
                          <td>
                            <div>
                              {item.storage} • {item.color}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {item.condition}
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              min={1}
                              max={500}
                              value={item.quantity}
                              style={{ width: '74px', padding: '6px 8px' }}
                              onChange={(e) => updateParsedRow(idx, 'quantity', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={500}
                              step={100}
                              value={item.costPrice}
                              style={{ width: '105px', padding: '6px 8px' }}
                              onChange={(e) => updateParsedRow(idx, 'costPrice', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={500}
                              step={100}
                              value={item.sellingPrice}
                              style={{ width: '105px', padding: '6px 8px' }}
                              onChange={(e) => updateParsedRow(idx, 'sellingPrice', e.target.value)}
                            />
                          </td>
                          <td
                            style={{
                              color: unitProfit > 0 ? '#059669' : '#be123c',
                              fontWeight: 800,
                            }}
                          >
                            {unitProfit > 0 ? `+${peso(unitProfit)}` : peso(unitProfit)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OPTION 2: CLEAN, UNCLUTTERED BULK MANUAL DROPDOWN ENTRY */}
      {subTab === 'manual' && (
        <div className="surface-card no-print">
          <div className="surface-head">
            <div>
              <div className="surface-title">Bulk Manual Stock-In</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button type="button" className="btn-pill btn-soft btn-sm" onClick={addBulkRow}>
                + Add Another Row
              </button>
              <button
                type="button"
                className="btn-pill btn-soft btn-sm"
                onClick={addPresetBulkRows}
              >
                + Add Multi-Grade Set (Brand New / Class B / Class C)
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bulkRows.map((row, idx) => {
              const models = opts.modelsByBrand[row.brand] || ['iPhone 12 Mini'];
              const unitProfit = (Number(row.sellingPrice) || 0) - (Number(row.costPrice) || 0);
              const isInvalidMargin = unitProfit <= 0;

              return (
                <div className="clean-bulk-row" key={idx}>
                  <div className="clean-bulk-grid">
                    <div className="input-group">
                      <label>Brand (Row #{idx + 1})</label>
                      <select
                        value={row.brand}
                        onChange={(e) => updateBulkRow(idx, 'brand', e.target.value)}
                      >
                        {opts.brands.map((b: string) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Gadget Model</label>
                      <select
                        value={row.model}
                        onChange={(e) => updateBulkRow(idx, 'model', e.target.value)}
                      >
                        {models.map((m: string) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Storage</label>
                      <select
                        value={row.storage}
                        onChange={(e) => updateBulkRow(idx, 'storage', e.target.value)}
                      >
                        {opts.storages.map((s: string) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Color</label>
                      <select
                        value={row.color}
                        onChange={(e) => updateBulkRow(idx, 'color', e.target.value)}
                      >
                        {opts.colors.map((c: string) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Condition</label>
                      <select
                        value={row.condition}
                        onChange={(e) => updateBulkRow(idx, 'condition', e.target.value)}
                      >
                        {opts.conditions.map((c: string) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Qty (pcs)</label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={row.quantity}
                        onChange={(e) => updateBulkRow(idx, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="input-group">
                      <label>Buy Cost (PHP)</label>
                      <input
                        type="number"
                        min={500}
                        step={100}
                        value={row.costPrice}
                        onChange={(e) => updateBulkRow(idx, 'costPrice', e.target.value)}
                      />
                    </div>
                    <div className="input-group">
                      <label>Sell Price (PHP)</label>
                      <input
                        type="number"
                        min={500}
                        step={100}
                        value={row.sellingPrice}
                        onChange={(e) => updateBulkRow(idx, 'sellingPrice', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="clean-bulk-footer">
                    <span
                      style={{
                        fontSize: '0.79rem',
                        fontWeight: 700,
                        color: isInvalidMargin ? '#be123c' : '#059669',
                      }}
                    >
                      {isInvalidMargin
                        ? 'Sell Price must be higher than Buy Cost'
                        : `Profit: +${peso(unitProfit)} per unit (+${peso(unitProfit * row.quantity)} total)`}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-pill btn-soft btn-sm"
                        onClick={() => duplicateBulkRow(idx)}
                      >
                        Copy Row
                      </button>
                      <button
                        type="button"
                        className="btn-pill btn-danger btn-sm"
                        onClick={() => removeBulkRow(idx)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '18px',
              paddingTop: '14px',
              borderTop: '1px solid #e4e4e7',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="btn-pill btn-soft btn-sm" onClick={addBulkRow}>
                + Add Row
              </button>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                {bulkRows.length} Row(s) • {bulkTotalUnits} Units • Cost: {peso(bulkTotalCapital)} •{' '}
                <span style={{ color: '#059669' }}>Profit: +{peso(bulkTotalProfit)}</span>
              </span>
            </div>
            <button
              type="button"
              className="btn-pill btn-dark"
              disabled={isWorking}
              onClick={handlePrepareCommitBulk}
            >
              Review & Save All Rows
            </button>
          </div>
        </div>
      )}

      {/* GENERATED BARCODE STICKERS */}
      {generatedStickers.length > 0 && (
        <div className="surface-card">
          <div className="surface-head">
            <div>
              <div className="surface-title">Box Barcode Stickers</div>
            </div>
            <button
              type="button"
              className="btn-pill btn-dark btn-sm no-print"
              onClick={() => window.print()}
            >
              Print Stickers
            </button>
          </div>
          <div className="sticker-grid">
            {generatedStickers.map((s) => (
              <StickerCard key={s.sku} item={s} showPrice={true} />
            ))}
          </div>
        </div>
      )}

      {/* CLEAN, ZERO-SCROLLBAR STOCK-IN HISTORY */}
      <div className="surface-card no-print">
        <div className="surface-head">
          <div>
            <div className="surface-title">Stock-In History</div>
          </div>
        </div>
        {appState.stockInHistory.length === 0 ? (
          <div
            style={{
              padding: '28px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.86rem',
            }}
          >
            No stock-in batches recorded yet.
          </div>
        ) : (
          <div className="clean-table-wrap">
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Batch & Date</th>
                  <th>Gadgets Added</th>
                  <th>Total Units</th>
                  <th>Total Cost</th>
                  <th>Expected Profit</th>
                </tr>
              </thead>
              <tbody>
                {appState.stockInHistory.map((b: any) => (
                  <tr key={b.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800 }}>
                        {b.batchCode}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(b.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        •{' '}
                        {new Date(b.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td>
                      <div className="history-gadgets-wrap">
                        {b.items.map((i: any, idx: number) => {
                          const swatch = getColorHex(i.color);
                          return (
                            <div className="history-gadget-card" key={i.sku + idx}>
                              <span className="history-chip-qty">+{i.quantityAdded} pcs</span>
                              <span className="history-chip-model">{i.model}</span>
                              <span className="history-chip-sub">
                                <span
                                  className="color-dot"
                                  style={{
                                    background: swatch.bg,
                                    borderColor: swatch.border,
                                    width: '9px',
                                    height: '9px',
                                  }}
                                />
                                {i.storage} ({i.color})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 800 }}>
                      {b.totalUnits} pcs
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {peso(b.totalCapitalCost)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', color: '#059669', fontWeight: 800 }}>
                      +{peso(b.projectedNetProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STOCK-IN CONFIRMATION MODAL */}
      <ConfirmModal
        open={confirmModalOpen}
        badgeText={confirmSource === 'NOTE_PASTE' ? 'Confirm Note Stock-In' : 'Confirm Bulk Stock-In'}
        badgeTone="green"
        title="Confirm Incoming Stock Batch"
        subtitle={`Review the ${itemsToConfirm.length} gadget variant(s) below before adding them to inventory.`}
        confirmLabel={`Confirm & Add +${confirmTotalUnits} Units`}
        confirmTone="dark"
        isBusy={isWorking}
        validationError={validationError}
        onConfirm={handleConfirmCommit}
        onCancel={() => setConfirmModalOpen(false)}
      >
        <div
          style={{
            fontSize: '0.84rem',
            fontWeight: 700,
            marginBottom: '12px',
            color: 'var(--text-dark)',
          }}
        >
          {itemsToConfirm.length} Variant(s) • +{confirmTotalUnits} Units • Cost:{' '}
          {peso(confirmTotalCapital)} •{' '}
          <span style={{ color: '#059669' }}>Profit: +{peso(confirmTotalProfit)}</span>
        </div>

        <div className="modal-list-box">
          {itemsToConfirm.map((item, idx) => {
            const uProfit = Number(item.sellingPrice) - Number(item.costPrice);
            return (
              <div className="modal-list-row" key={idx}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.86rem' }}>
                    +{item.quantity} pcs • {item.model} {item.storage} ({item.color})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.condition}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    Sell: {peso(item.sellingPrice)}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>
                    +{peso(uProfit * item.quantity)} profit
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ConfirmModal>
    </section>
  );
};
