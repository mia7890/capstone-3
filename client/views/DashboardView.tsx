import React, { useState } from 'react';
import { CHART_PALETTE, PageId, getColorHex, peso } from '../types';
import { DeviceIconSvg } from '../components/BarcodeSticker';

interface DashboardViewProps {
  appState: any;
  onNavigate: (page: PageId) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ appState, onNavigate }) => {
  const [darkMode, setDarkMode] = useState<'stock' | 'prevMonth'>('stock');
  const [showMonth, setShowMonth] = useState<boolean>(false);
  const [statMode, setStatMode] = useState<'stock' | 'channel' | 'fulfillment' | 'forecast'>('stock');

  const k = appState.kpis;

  // Compute previous month label dynamically
  const now = new Date();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthPrefix = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthLabel = prevMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const prevMonthRecord = (appState.analytics.monthlyBreakdown || []).find(
    (m: any) => m.month === prevMonthPrefix,
  );

  // Dark Hero Card
  const darkTitle =
    darkMode === 'stock'
      ? 'Projected Stock Revenue (On Hand)'
      : `${prevMonthLabel} Gross Revenue`;
  const darkValue =
    darkMode === 'stock'
      ? peso(k.projectedInventoryRevenue)
      : peso(prevMonthRecord ? prevMonthRecord.grossRevenue : 0);
  const darkMetaLeft =
    darkMode === 'stock'
      ? `${k.totalPhysicalUnits} Units in Stock`
      : `${prevMonthRecord ? prevMonthRecord.totalDeals : 0} Completed Deals`;
  const darkMetaRight =
    darkMode === 'stock'
      ? `+${peso(k.projectedInventoryProfit)} Projected Profit`
      : `+${peso(prevMonthRecord ? prevMonthRecord.netProfit : 0)} Net Profit`;

  // Light Hero Card
  const lightTitle = showMonth ? 'October 2026 Month-to-Date Sales' : "Today's Live Gross Sales";
  const lightValue = showMonth ? peso(k.currentMonthGross) : peso(k.todayGrossRevenue);
  const lightMetaLeft = showMonth
    ? `${k.currentMonthDeals} Deals (${k.currentMonthUnits} pcs)`
    : `${k.todayDealsCount} Deals (${k.todayUnitsSold} pcs today)`;
  const lightMetaRight = showMonth
    ? `+${peso(k.currentMonthProfit)} Net Profit`
    : `+${peso(k.todayNetProfit)} Net Profit`;

  // Right Column Accurate Multi-Slice Donut Computation
  const r = 76;
  const circ = 2 * Math.PI * r;
  let centerLabel = 'Total Stock';
  let centerVal = `${k.totalPhysicalUnits} pcs`;

  interface StatSegment {
    key: string;
    label: string;
    color: string;
    value: number;
    pct: number;
    icon: React.ReactNode;
    title: string;
    sub: string;
    rightVal: string;
    rightSub?: string;
  }

  let segments: StatSegment[] = [];

  if (statMode === 'stock') {
    const sortedInv = [...(appState.inventory || [])].sort(
      (a: any, b: any) => b.quantity - a.quantity,
    );
    const totalStock = k.totalPhysicalUnits;
    centerLabel = 'Total Stock';
    centerVal = `${totalStock} pcs`;

    segments = sortedInv.slice(0, 6).map((item: any, idx: number) => {
      const color = CHART_PALETTE[idx % CHART_PALETTE.length];
      const pct = totalStock > 0 ? Math.round((item.quantity / totalStock) * 100) : 0;
      return {
        key: item.sku,
        label: `${item.model} (${item.color})`,
        color,
        value: item.quantity,
        pct,
        icon: <DeviceIconSvg model={item.model} />,
        title: `${item.model} ${item.storage}`,
        sub: `${item.color} • ${pct}% of stock`,
        rightVal: `${item.quantity} pcs`,
        rightSub: `+${peso(item.unitProfit * item.quantity)} profit`,
      };
    });
  } else if (statMode === 'channel') {
    const chList = appState.analytics.channelBreakdown || [];
    const totalSoldUnits = chList.reduce((s: number, c: any) => s + c.units, 0);
    centerLabel = 'Units Sold';
    centerVal = `${totalSoldUnits} pcs`;

    segments = chList.map((c: any, idx: number) => {
      const color = CHART_PALETTE[idx % CHART_PALETTE.length];
      const pct = totalSoldUnits > 0 ? Math.round((c.units / totalSoldUnits) * 100) : 0;
      return {
        key: c.channel,
        label: `${c.channel} (${pct}%)`,
        color,
        value: c.units,
        pct,
        icon: <span>{c.channel.slice(0, 2).toUpperCase()}</span>,
        title: c.channel,
        sub: `${c.deals} deals (${pct}%)`,
        rightVal: `+${peso(c.profit)}`,
        rightSub: `${c.units} pcs sold`,
      };
    });
  } else if (statMode === 'fulfillment') {
    const fList = appState.analytics.fulfillmentBreakdown || [];
    const totalFulUnits = fList.reduce((s: number, f: any) => s + f.units, 0);
    centerLabel = 'All Deals';
    centerVal = `${k.totalAllTimeDeals}`;

    segments = fList.map((f: any, idx: number) => {
      const color = CHART_PALETTE[idx % CHART_PALETTE.length];
      const pct = totalFulUnits > 0 ? Math.round((f.units / totalFulUnits) * 100) : 0;
      return {
        key: f.method,
        label: `${f.method} (${pct}%)`,
        color,
        value: f.units,
        pct,
        icon: <span>{f.method.slice(0, 2).toUpperCase()}</span>,
        title: f.method,
        sub: `${f.deals} deals (${pct}%)`,
        rightVal: `+${peso(f.profit)}`,
        rightSub: `${f.units} pcs sold`,
      };
    });
  } else {
    const fList = appState.forecast || [];
    const total7d = fList.reduce((s: number, f: any) => s + f.forecast7DayStandard, 0);
    centerLabel = '7-Day Demand';
    centerVal = `${total7d} pcs`;

    segments = fList.slice(0, 5).map((f: any, idx: number) => {
      const color = CHART_PALETTE[idx % CHART_PALETTE.length];
      const pct = total7d > 0 ? Math.round((f.forecast7DayStandard / total7d) * 100) : 0;
      return {
        key: f.sku,
        label: `${f.model} (${f.color})`,
        color,
        value: f.forecast7DayStandard,
        pct,
        icon: <DeviceIconSvg model={f.model} />,
        title: `${f.model} ${f.storage}`,
        sub: `${f.color} • In Stock: ${f.currentStock} pcs`,
        rightVal: f.recommendedOrderQty > 0 ? `+${f.recommendedOrderQty} to buy` : 'Good Stock',
        rightSub: f.recommendedOrderQty > 0 ? peso(f.estimatedRestockCost) : undefined,
      };
    });
  }

  // Compute exact SVG stroke-dasharray / stroke-dashoffset for non-zero segments
  const totalSegmentValue = segments.reduce((s, seg) => s + seg.value, 0);
  let cumulativeLength = 0;
  const activeArcs = segments
    .filter((seg) => seg.value > 0 && totalSegmentValue > 0)
    .map((seg) => {
      const sliceLen = (seg.value / totalSegmentValue) * circ;
      const offset = cumulativeLength;
      cumulativeLength += sliceLen;
      return {
        key: seg.key,
        color: seg.color,
        dashArray: `${Math.max(1, sliceLen - (segments.filter((x) => x.value > 0).length > 1 ? 3 : 0))} ${circ}`,
        dashOffset: -offset,
      };
    });

  return (
    <section className="view-page active">
      <div className="dashboard-layout">
        {/* LEFT COLUMN */}
        <div>
          <div className="section-header-row">
            <div className="section-title">Sales & Stock Summary</div>
            <button className="section-link" onClick={() => onNavigate('page-analytics')}>
              See sales reports
            </button>
          </div>

          <div className="hero-cards-grid">
            {/* Dark Hero Card */}
            <div className="hero-card dark">
              <div className="hero-card-top">
                <div>
                  <div style={{ fontSize: '0.77rem', opacity: 0.72, fontWeight: 600 }}>
                    {darkTitle}
                  </div>
                  <div className="hero-big-amount">{darkValue}</div>
                </div>
                <button
                  className="btn-pill btn-soft btn-sm"
                  style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
                  onClick={() => setDarkMode(darkMode === 'stock' ? 'prevMonth' : 'stock')}
                >
                  Switch View
                </button>
              </div>
              <div className="hero-mid-meta">
                <span>{darkMetaLeft}</span>
                <span>•</span>
                <span style={{ color: '#86efac' }}>{darkMetaRight}</span>
              </div>
              <div className="hero-bottom-row">
                <span>{k.totalSkus} Gadget Variants</span>
                <span className="hero-brand-mark">LOOP PLACE</span>
              </div>
            </div>

            {/* Light Hero Card */}
            <div className="hero-card light">
              <div className="hero-card-top">
                <div>
                  <div
                    style={{
                      fontSize: '0.77rem',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    {lightTitle}
                  </div>
                  <div className="hero-big-amount">{lightValue}</div>
                </div>
                <span
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {showMonth ? 'Oct MTD' : 'Today'}
                </span>
              </div>
              <div className="hero-mid-meta" style={{ color: 'var(--text-muted)' }}>
                <span>{lightMetaLeft}</span>
                <span>•</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>{lightMetaRight}</span>
              </div>
              <div className="hero-bottom-row">
                <span>Toggle Today / Monthly</span>
                <button
                  type="button"
                  className={`toggle-switch-btn ${showMonth ? 'on' : ''}`}
                  onClick={() => setShowMonth(!showMonth)}
                  title="Toggle Today vs Month-to-Date"
                />
              </div>
            </div>
          </div>

          {/* Recent Sales */}
          <div className="section-header-row">
            <div className="section-title">Recent Sales</div>
            <button className="section-link" onClick={() => onNavigate('page-analytics')}>
              View all transactions
            </button>
          </div>

          <div className="floating-list-head">
            <div>Gadget & Buyer</div>
            <div>Date</div>
            <div style={{ textAlign: 'right' }}>Profit / Amount</div>
          </div>

          <div>
            {appState.salesHistory.length === 0 ? (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  padding: '28px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-soft)',
                }}
              >
                No sales recorded yet. Go to <strong>Deduct Stock</strong> when a buyer purchases a
                gadget.
              </div>
            ) : (
              appState.salesHistory.slice(0, 6).map((s: any) => {
                const swatch = getColorHex(s.color);
                const dateStr = new Date(s.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                return (
                  <div className="floating-row" key={s.id}>
                    <div className="row-item-left">
                      <div className="row-avatar">
                        <DeviceIconSvg model={s.model} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="row-title">
                          {s.quantity}x {s.model} ({s.storage})
                        </div>
                        <div className="row-sub" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            className="color-dot"
                            style={{ background: swatch.bg, borderColor: swatch.border }}
                          />
                          <span>
                            {s.color} • {s.clientName} ({s.channel})
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="row-date">{dateStr}</div>
                    <div className="row-amount">
                      <div style={{ color: '#059669' }}>+{peso(s.netProfit)}</div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {peso(s.totalRevenue)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Clean Statistic Card */}
        <div className="statistic-card">
          <div className="stat-top-bar">
            <div className="stat-heading">
              <span>Statistic</span>
            </div>
            <select
              className="stat-mode-select"
              value={statMode}
              onChange={(e) => setStatMode(e.target.value as any)}
            >
              <option value="stock">Stock Distribution</option>
              <option value="channel">Sales by Channel</option>
              <option value="fulfillment">Meet-up vs COD</option>
              <option value="forecast">7-Day Restock Need</option>
            </select>
          </div>

          <div className="donut-wrap">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={r} fill="none" stroke="#f1f3f7" strokeWidth="22" />
              {activeArcs.map((arc) => (
                <circle
                  key={arc.key}
                  cx="100"
                  cy="100"
                  r={r}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth="22"
                  strokeLinecap="butt"
                  strokeDasharray={arc.dashArray}
                  strokeDashoffset={arc.dashOffset}
                  transform="rotate(-90 100 100)"
                />
              ))}
            </svg>
            <div className="donut-center">
              <div className="donut-center-label">{centerLabel}</div>
              <div className="donut-center-value">{centerVal}</div>
            </div>
          </div>

          <div className="stat-list">
            {segments.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '20px 12px',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                No items in stock yet. Add stock in <strong>Stock In</strong> to see distribution.
              </div>
            ) : (
              segments.map((row) => (
                <div className="stat-item" key={row.key}>
                  <div className="stat-item-left">
                    <div
                      className="stat-icon"
                      style={{
                        background: `${row.color}18`,
                        color: row.color,
                        border: `1px solid ${row.color}40`,
                      }}
                    >
                      {row.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="stat-item-title">{row.title}</div>
                      <div className="stat-item-sub">{row.sub}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="stat-item-val">{row.rightVal}</div>
                    {row.rightSub && (
                      <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                        {row.rightSub}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
