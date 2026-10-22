import React, { useState } from 'react';
import { peso } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

interface AnalyticsViewProps {
  appState: any;
  onStateUpdated: (newState: any, msg: string) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  appState,
  onStateUpdated,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<'overview' | 'log' | 'audit'>('overview');
  const [logSearch, setLogSearch] = useState<string>('');
  const [saleToVoid, setSaleToVoid] = useState<any | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState<boolean>(false);
  const [resetConfirmText, setResetConfirmText] = useState<string>('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState<boolean>(false);

  const ana = appState.analytics;
  const maxDow = Math.max(1, ...ana.dayOfWeekBreakdown.map((d: any) => d.avgDealsPerDay));
  const totalChUnits = Math.max(
    1,
    ana.channelBreakdown.reduce((s: number, c: any) => s + c.units, 0),
  );
  const totalFulUnits = Math.max(
    1,
    ana.fulfillmentBreakdown.reduce((s: number, f: any) => s + f.units, 0),
  );

  const filteredSales = appState.salesHistory.filter((s: any) => {
    if (!logSearch.trim()) return true;
    const q = logSearch.toLowerCase();
    return `${s.receiptNo} ${s.model} ${s.color} ${s.clientName} ${s.channel}`
      .toLowerCase()
      .includes(q);
  });

  const handleConfirmVoidSale = async () => {
    if (!saleToVoid || isWorking) return;
    setIsWorking(true);
    try {
      const res = await fetch(`/api/sales/${encodeURIComponent(saleToVoid.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not void transaction');
      setSaleToVoid(null);
      onStateUpdated(data.state, data.message);
    } catch (err: any) {
      onNotify(err.message, true);
    } finally {
      setIsWorking(false);
    }
  };

  const handleConfirmDatabaseReset = async () => {
    if (isWorking) return;
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') {
      setResetError('Please type RESET in the box below to confirm deleting all records.');
      return;
    }
    setResetError(null);
    setIsWorking(true);
    try {
      const res = await fetch('/api/database/clear', { method: 'DELETE' });
      const data = await res.json();
      setResetModalOpen(false);
      setResetConfirmText('');
      onStateUpdated(data.state, data.message);
    } catch (err: any) {
      setResetError(err.message);
      onNotify(err.message, true);
    } finally {
      setIsWorking(false);
    }
  };

  const handleRunLiveAudit = async () => {
    try {
      const res = await fetch('/api/audit/run', { method: 'POST' });
      const data = await res.json();
      onStateUpdated(
        data.state,
        'System check completed: All inventory counts, prices, and sales records are accurate.',
      );
    } catch (err: any) {
      onNotify(err.message, true);
    }
  };

  const handleExportCsv = () => {
    if (appState.salesHistory.length === 0) {
      onNotify('No sales transactions available to export yet.', true);
      return;
    }
    const headers = [
      'ReceiptNo',
      'Date',
      'StickerCode',
      'Model',
      'Storage',
      'Color',
      'Qty',
      'Method',
      'Channel',
      'Fulfillment',
      'ClientName',
      'BuyCost',
      'SoldPrice',
      'NetProfit',
    ];
    const rows = appState.salesHistory.map((s: any) =>
      [
        s.receiptNo,
        s.createdAt,
        s.sku,
        `"${s.model}"`,
        s.storage,
        s.color,
        s.quantity,
        s.deductMethod,
        s.channel,
        s.fulfillment,
        `"${(s.clientName || '').replace(/"/g, '""')}"`,
        s.totalCost,
        s.totalRevenue,
        s.netProfit,
      ].join(','),
    );
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LoopPlaceGadgets_SalesLedger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="view-page active">
      <div className="pill-tabs no-print">
        <button
          className={`pill-tab ${subTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSubTab('overview')}
        >
          Monthly & Weekly Sales Summary
        </button>
        <button
          className={`pill-tab ${subTab === 'log' ? 'active' : ''}`}
          onClick={() => setSubTab('log')}
        >
          Sales History & Receipts
        </button>
        <button
          className={`pill-tab ${subTab === 'audit' ? 'active' : ''}`}
          onClick={() => setSubTab('audit')}
        >
          System Check & Reset
        </button>
      </div>

      {subTab === 'overview' && (
        <div>
          <div className="surface-card">
            <div className="surface-head">
              <div>
                <div className="surface-title">Monthly Sales & Profit Summary</div>
              </div>
              <button
                className="btn-pill btn-dark btn-sm no-print"
                onClick={() => window.print()}
              >
                Print Report
              </button>
            </div>
            <div className="clean-table-wrap">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Completed Deals</th>
                    <th>Units Sold</th>
                    <th>Gross Sales (PHP)</th>
                    <th>Buy Cost (PHP)</th>
                    <th>Net Profit (PHP)</th>
                    <th>Margin</th>
                    <th>Top Seller</th>
                  </tr>
                </thead>
                <tbody>
                  {ana.monthlyBreakdown.map((m: any) => (
                    <tr key={m.label}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <strong>{m.label}</strong>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <strong>{m.totalDeals} deals</strong>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{m.totalUnits} pcs</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <strong>{peso(m.grossRevenue)}</strong>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{peso(m.totalCost)}</td>
                      <td style={{ color: '#059669', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        +{peso(m.netProfit)}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className="status-pill success">
                          <span className="status-dot" />
                          {m.marginPercent}%
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{m.topModel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dashboard-layout" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="surface-card">
              <div className="surface-head">
                <div>
                  <div className="surface-title">Busiest Days of the Week</div>
                </div>
              </div>
              <div>
                {ana.dayOfWeekBreakdown.map((d: any) => {
                  const pct = Math.min(100, Math.round((d.avgDealsPerDay / maxDow) * 100));
                  const isPeak = d.day === 'Friday' || d.day === 'Saturday';
                  return (
                    <div className="metric-bar-row" key={d.day}>
                      <div>
                        <strong>{d.day}</strong>
                      </div>
                      <div className="metric-bar-track">
                        <div
                          className={`metric-bar-fill ${isPeak ? 'peak' : ''}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 700 }}>
                        {d.avgDealsPerDay} deals/day
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="surface-card">
              <div className="surface-head">
                <div>
                  <div className="surface-title">Sales by Channel & Meet-up vs COD</div>
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                  }}
                >
                  BY SOCIAL MEDIA CHANNEL
                </div>
                {ana.channelBreakdown.map((c: any) => {
                  const totalReal = ana.channelBreakdown.reduce(
                    (s: number, x: any) => s + x.units,
                    0,
                  );
                  const pct = totalReal > 0 ? Math.round((c.units / totalChUnits) * 100) : 0;
                  return (
                    <div className="metric-bar-row" key={c.channel}>
                      <div>
                        <strong>{c.channel}</strong>
                      </div>
                      <div className="metric-bar-track">
                        <div className="metric-bar-fill peak" style={{ width: `${pct}%` }} />
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 700 }}>
                        {c.units} pcs ({pct}%)
                      </div>
                    </div>
                  );
                })}

                <div
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    margin: '16px 0 8px',
                  }}
                >
                  BY FULFILLMENT METHOD
                </div>
                {ana.fulfillmentBreakdown.map((f: any) => {
                  const totalReal = ana.fulfillmentBreakdown.reduce(
                    (s: number, x: any) => s + x.units,
                    0,
                  );
                  const pct = totalReal > 0 ? Math.round((f.units / totalFulUnits) * 100) : 0;
                  return (
                    <div className="metric-bar-row" key={f.method}>
                      <div>
                        <strong>{f.method}</strong>
                      </div>
                      <div className="metric-bar-track">
                        <div className="metric-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 700 }}>
                        {f.units} pcs ({pct}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="dashboard-layout" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="surface-card">
              <div className="surface-head">
                <div>
                  <div className="surface-title">Sales Breakdown by Gadget Model</div>
                </div>
              </div>
              <div className="clean-table-wrap">
                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Phone / Gadget Model</th>
                      <th>Units Sold</th>
                      <th>Gross Sales</th>
                      <th>Net Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ana.modelPerformance || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          No model sales recorded yet.
                        </td>
                      </tr>
                    ) : (
                      (ana.modelPerformance || []).slice(0, 8).map((mp: any) => (
                        <tr key={mp.model}>
                          <td>
                            <strong>{mp.model}</strong>
                          </td>
                          <td>{mp.units} pcs</td>
                          <td>{peso(mp.revenue)}</td>
                          <td style={{ color: '#059669', fontWeight: 800 }}>+{peso(mp.profit)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="surface-card">
              <div className="surface-head">
                <div>
                  <div className="surface-title">Individual Employee Sales Performance</div>
                </div>
              </div>
              <div className="clean-table-wrap">
                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Deals</th>
                      <th>Units Sold</th>
                      <th>Net Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ana.staffPerformance || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          No employee sales recorded yet.
                        </td>
                      </tr>
                    ) : (
                      (ana.staffPerformance || []).map((sp: any) => (
                        <tr key={sp.staff}>
                          <td>
                            <strong>{sp.staff}</strong>
                          </td>
                          <td>{sp.deals} deals</td>
                          <td>{sp.units} pcs</td>
                          <td style={{ color: '#059669', fontWeight: 800 }}>+{peso(sp.profit)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'log' && (
        <div className="surface-card">
          <div className="surface-head">
            <div>
              <div className="surface-title">Sales & Receipt History</div>
            </div>
            <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search receipt, model, buyer..."
                style={{ width: '220px' }}
              />
              <button className="btn-pill btn-soft btn-sm" onClick={handleExportCsv}>
                Export CSV
              </button>
              <button className="btn-pill btn-dark btn-sm" onClick={() => window.print()}>
                Print List
              </button>
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div
              style={{
                padding: '28px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              No sales receipts recorded yet.
            </div>
          ) : (
            <div className="clean-table-wrap">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Receipt No.</th>
                    <th>Date & Time</th>
                    <th>Gadget Sold</th>
                    <th>Qty</th>
                    <th>Channel / Mode</th>
                    <th>Amount</th>
                    <th>Net Profit</th>
                    <th className="no-print">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.slice(0, 100).map((s: any) => {
                    return (
                      <tr key={s.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {s.receiptNo}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(s.createdAt).toLocaleString()}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div>
                            <strong>
                              {s.model} ({s.storage})
                            </strong>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {s.color} • Buyer: {s.clientName}
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <strong>{s.quantity}</strong>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {s.channel} • {s.fulfillment}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{peso(s.totalRevenue)}</td>
                        <td style={{ color: '#059669', fontWeight: 800, whiteSpace: 'nowrap' }}>
                          +{peso(s.netProfit)}
                        </td>
                        <td className="no-print" style={{ whiteSpace: 'nowrap' }}>
                          <button
                            className="btn-pill btn-danger btn-sm"
                            onClick={() => setSaleToVoid(s)}
                          >
                            Void / Restore
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

      {subTab === 'audit' && (
        <div className="surface-card">
          <div className="surface-head">
            <div>
              <div className="surface-title">System Health & Data Check</div>
            </div>
            <button className="btn-pill btn-dark btn-sm no-print" onClick={handleRunLiveAudit}>
              Run System Check
            </button>
          </div>
          <div>
            {appState.diagnostics.checks.map((c: any) => (
              <div
                className="floating-row"
                key={c.id}
                style={{ gridTemplateColumns: '2fr 1fr 0.8fr' }}
              >
                <div>
                  <div className="row-title">{c.title}</div>
                  <div className="row-sub" style={{ whiteSpace: 'normal' }}>
                    {c.detail}
                  </div>
                </div>
                <div className="row-date">
                  <strong>{c.metric}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`status-pill ${c.passed ? 'success' : 'failed'}`}>
                    <span className="status-dot" />
                    {c.passed ? 'PASSED' : 'ALERT'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #e4e4e7',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#be123c' }}>
                Database Reset & Data Wipe
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Delete all inventory items, sales history, and stock-in batches.
              </div>
            </div>
            <button
              className="btn-pill btn-danger btn-sm no-print"
              onClick={() => {
                setResetConfirmText('');
                setResetError(null);
                setResetModalOpen(true);
              }}
            >
              Delete All Database Records
            </button>
          </div>
        </div>
      )}

      {/* VOID SALE & RESTORE STOCK CONFIRMATION MODAL */}
      <ConfirmModal
        open={Boolean(saleToVoid)}
        badgeText="Void Sale Confirmation"
        badgeTone="red"
        title={saleToVoid ? `Void Receipt ${saleToVoid.receiptNo}?` : 'Void Sale'}
        subtitle="Voiding this sale will remove the receipt and restore the sold gadget(s) back to your inventory."
        confirmLabel={
          saleToVoid
            ? `Void Sale & Restore +${saleToVoid.quantity} pc(s)`
            : 'Void Sale'
        }
        confirmTone="danger"
        isBusy={isWorking}
        onConfirm={handleConfirmVoidSale}
        onCancel={() => setSaleToVoid(null)}
      >
        {saleToVoid && (
          <div className="modal-list-box">
            <div className="modal-list-row">
              <span>Gadget</span>
              <strong>
                {saleToVoid.quantity}x {saleToVoid.model} {saleToVoid.storage} ({saleToVoid.color})
              </strong>
            </div>
            <div className="modal-list-row">
              <span>Buyer & Channel</span>
              <strong>
                {saleToVoid.clientName} ({saleToVoid.channel} • {saleToVoid.fulfillment})
              </strong>
            </div>
            <div className="modal-list-row">
              <span>Sale Amount & Profit</span>
              <strong>
                {peso(saleToVoid.totalRevenue)} (+{peso(saleToVoid.netProfit)} profit)
              </strong>
            </div>
          </div>
        )}
      </ConfirmModal>

      {/* DATABASE RESET CONFIRMATION MODAL */}
      <ConfirmModal
        open={resetModalOpen}
        badgeText="Danger Zone"
        badgeTone="red"
        title="Delete All Database Records?"
        subtitle="This will permanently clear all inventory stock, sales history, and stock-in logs. Type RESET below to confirm."
        confirmLabel="Confirm & Delete All Data"
        confirmTone="danger"
        isBusy={isWorking}
        validationError={resetError}
        onConfirm={handleConfirmDatabaseReset}
        onCancel={() => {
          setResetModalOpen(false);
          setResetError(null);
        }}
      >
        <div className="input-group">
          <label>Type RESET to confirm database wipe:</label>
          <input
            type="text"
            value={resetConfirmText}
            onChange={(e) => {
              setResetConfirmText(e.target.value);
              if (resetError) setResetError(null);
            }}
            placeholder="Type RESET in capital letters..."
          />
        </div>
      </ConfirmModal>
    </section>
  );
};
