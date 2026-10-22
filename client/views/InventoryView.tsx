import React, { useState } from 'react';
import { PageId, peso } from '../types';
import { StickerCard } from '../components/BarcodeSticker';
import { ConfirmModal } from '../components/ConfirmModal';

interface InventoryViewProps {
  appState: any;
  onNavigate: (page: PageId) => void;
  onStateUpdated: (newState: any, msg: string) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  appState,
  onNavigate,
  onStateUpdated,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<'list' | 'stickers'>('list');
  const [filterQ, setFilterQ] = useState<string>('');
  const [showStickerPrice, setShowStickerPrice] = useState<boolean>(true);
  const [edits, setEdits] = useState<
    Record<string, { quantity?: number; costPrice?: number; sellingPrice?: number }>
  >({});
  const [pendingUpdate, setPendingUpdate] = useState<{
    item: any;
    quantity: number;
    costPrice: number;
    sellingPrice: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const filteredList = appState.inventory.filter((i: any) => {
    if (!filterQ.trim()) return true;
    const q = filterQ.toLowerCase();
    return `${i.sku} ${i.model} ${i.storage} ${i.color} ${i.brand}`.toLowerCase().includes(q);
  });

  const handleFieldChange = (
    sku: string,
    field: 'quantity' | 'costPrice' | 'sellingPrice',
    val: string,
    fallback: number,
  ) => {
    setEdits((prev) => ({
      ...prev,
      [sku]: {
        ...prev[sku],
        [field]: Math.max(0, Math.round(Number(val) ?? fallback)),
      },
    }));
  };

  const handleRequestSaveRow = (item: any) => {
    const rowEdit = edits[item.sku] || {};
    const quantity = rowEdit.quantity ?? item.quantity;
    const costPrice = rowEdit.costPrice ?? item.costPrice;
    const sellingPrice = rowEdit.sellingPrice ?? item.sellingPrice;

    if (
      quantity === item.quantity &&
      costPrice === item.costPrice &&
      sellingPrice === item.sellingPrice
    ) {
      onNotify(`No changes made to ${item.model} (${item.color}).`, true);
      return;
    }

    if (quantity < 0 || quantity > 999) {
      onNotify('Stock quantity must be between 0 and 999 pcs.', true);
      return;
    }
    if (costPrice < 500) {
      onNotify('Buy Cost must be at least PHP 500.', true);
      return;
    }
    if (sellingPrice <= costPrice) {
      onNotify(
        `Invalid Price: Sell Price (${peso(sellingPrice)}) must be higher than Buy Cost (${peso(costPrice)}).`,
        true,
      );
      return;
    }

    setPendingUpdate({ item, quantity, costPrice, sellingPrice });
  };

  const handleConfirmSaveRow = async () => {
    if (!pendingUpdate || isSaving) return;
    setIsSaving(true);
    const { item, quantity, costPrice, sellingPrice } = pendingUpdate;
    try {
      const res = await fetch(`/api/inventory/${encodeURIComponent(item.sku)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, costPrice, sellingPrice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      setPendingUpdate(null);
      setEdits((prev) => {
        const next = { ...prev };
        delete next[item.sku];
        return next;
      });
      onStateUpdated(data.state, data.message);
    } catch (err: any) {
      onNotify(err.message, true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="view-page active">
      <div className="pill-tabs no-print">
        <button
          className={`pill-tab ${subTab === 'list' ? 'active' : ''}`}
          onClick={() => setSubTab('list')}
        >
          Current Stock List
        </button>
        <button
          className={`pill-tab ${subTab === 'stickers' ? 'active' : ''}`}
          onClick={() => setSubTab('stickers')}
        >
          Box Barcode Stickers
        </button>
      </div>

      {subTab === 'list' && (
        <div className="surface-card">
          <div className="surface-head no-print">
            <div>
              <div className="surface-title">All Gadgets in Stock</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={filterQ}
                onChange={(e) => setFilterQ(e.target.value)}
                placeholder="Search model, storage, or color..."
                style={{ width: '230px' }}
              />
              <button
                className="btn-pill btn-dark btn-sm"
                onClick={() => onNavigate('page-stock-in')}
              >
                + Add Stock
              </button>
            </div>
          </div>

          {filteredList.length === 0 ? (
            <div
              style={{
                padding: '28px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              No gadgets in stock yet. Click <strong>+ Add Stock</strong> to add inventory.
            </div>
          ) : (
            <div className="clean-table-wrap">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Gadget & Details</th>
                    <th>In Stock</th>
                    <th>Buy Cost (PHP)</th>
                    <th>Sell Price (PHP)</th>
                    <th>Profit / Unit</th>
                    <th>Status</th>
                    <th className="no-print">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((i: any) => {
                    const rowEdit = edits[i.sku] || {};
                    const qty = rowEdit.quantity ?? i.quantity;
                    const cost = rowEdit.costPrice ?? i.costPrice;
                    const price = rowEdit.sellingPrice ?? i.sellingPrice;
                    const unitProfit = price - cost;
                    const marginPct = price > 0 ? Math.round((unitProfit / price) * 100) : 0;
                    const hasChanges =
                      qty !== i.quantity || cost !== i.costPrice || price !== i.sellingPrice;

                    return (
                      <tr key={i.sku}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div>
                            <strong>{i.model}</strong> ({i.storage})
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {i.color} • {i.condition}
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            max={999}
                            value={qty}
                            onChange={(e) =>
                              handleFieldChange(i.sku, 'quantity', e.target.value, i.quantity)
                            }
                            style={{ width: '76px', padding: '6px 8px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={500}
                            step={100}
                            value={cost}
                            onChange={(e) =>
                              handleFieldChange(i.sku, 'costPrice', e.target.value, i.costPrice)
                            }
                            style={{ width: '105px', padding: '6px 8px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={500}
                            step={100}
                            value={price}
                            onChange={(e) =>
                              handleFieldChange(
                                i.sku,
                                'sellingPrice',
                                e.target.value,
                                i.sellingPrice,
                              )
                            }
                            style={{ width: '105px', padding: '6px 8px' }}
                          />
                        </td>
                        <td
                          style={{
                            color: unitProfit > 0 ? '#059669' : '#be123c',
                            fontWeight: 800,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {unitProfit > 0 ? `+${peso(unitProfit)}` : peso(unitProfit)} ({marginPct}
                          %)
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span
                            className={`status-pill ${
                              qty === 0 ? 'failed' : qty <= i.lowStockThreshold ? 'amber' : 'success'
                            }`}
                          >
                            <span className="status-dot" />
                            {qty === 0
                              ? 'Out of Stock'
                              : qty <= i.lowStockThreshold
                              ? 'Low Stock'
                              : 'Good Stock'}
                          </span>
                        </td>
                        <td className="no-print" style={{ whiteSpace: 'nowrap' }}>
                          <button
                            className={`btn-pill btn-sm ${hasChanges ? 'btn-dark' : 'btn-soft'}`}
                            onClick={() => handleRequestSaveRow(i)}
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {subTab === 'stickers' && (
        <div className="surface-card">
          <div className="surface-head">
            <div>
              <div className="surface-title">Printable Barcode Stickers Catalog</div>
            </div>
            <div
              className="no-print"
              style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
            >
              <label
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={showStickerPrice}
                  onChange={(e) => setShowStickerPrice(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <span>Display Price on Sticker</span>
              </label>
              <button className="btn-pill btn-dark btn-sm" onClick={() => window.print()}>
                Print Sticker Sheet
              </button>
            </div>
          </div>
          <div className="sticker-grid">
            {appState.inventory.map((s: any) => (
              <StickerCard key={s.sku} item={s} showPrice={showStickerPrice} />
            ))}
          </div>
        </div>
      )}

      {/* INVENTORY UPDATE CONFIRMATION MODAL */}
      <ConfirmModal
        open={Boolean(pendingUpdate)}
        badgeText="Confirm Stock / Price Edit"
        badgeTone="amber"
        title={
          pendingUpdate
            ? `Update ${pendingUpdate.item.model} ${pendingUpdate.item.storage} (${pendingUpdate.item.color})`
            : 'Update Inventory'
        }
        subtitle="Review the changes below before updating the inventory database."
        confirmLabel="Confirm & Save Changes"
        confirmTone="dark"
        isBusy={isSaving}
        onConfirm={handleConfirmSaveRow}
        onCancel={() => setPendingUpdate(null)}
      >
        {pendingUpdate && (
          <div className="modal-list-box">
            <div className="modal-list-row">
              <span>Stock On Hand</span>
              <strong>
                {pendingUpdate.item.quantity} pcs → {pendingUpdate.quantity} pcs
              </strong>
            </div>
            <div className="modal-list-row">
              <span>Buy Cost</span>
              <strong>
                {peso(pendingUpdate.item.costPrice)} → {peso(pendingUpdate.costPrice)}
              </strong>
            </div>
            <div className="modal-list-row">
              <span>Sell Price</span>
              <strong>
                {peso(pendingUpdate.item.sellingPrice)} → {peso(pendingUpdate.sellingPrice)}
              </strong>
            </div>
            <div className="modal-list-row">
              <span>Profit per Unit</span>
              <strong style={{ color: '#059669' }}>
                +{peso(pendingUpdate.sellingPrice - pendingUpdate.costPrice)} / unit
              </strong>
            </div>
          </div>
        )}
      </ConfirmModal>
    </section>
  );
};
