import React, { useState } from 'react';
import { peso } from '../types';

interface ForecastViewProps {
  appState: any;
  onNotify?: (msg: string, isError?: boolean) => void;
}

export const ForecastView: React.FC<ForecastViewProps> = ({ appState }) => {
  const [scenario, setScenario] = useState<'weekly' | 'nov30' | 'monthly'>('weekly');

  const fList = appState.forecast || [];
  const totalStockOnHand = (appState.inventory || []).reduce(
    (s: number, i: any) => s + Number(i.quantity || 0),
    0,
  );

  const getScenarioDemand = (f: any) =>
    scenario === 'nov30'
      ? f.forecastNov30Surge
      : scenario === 'monthly'
      ? f.forecast30DayStandard
      : f.forecast7DayStandard;

  const getRecommendedBuy = (f: any) =>
    scenario === 'nov30'
      ? f.recommendedNov30OrderQty
      : scenario === 'monthly'
      ? Math.max(0, f.forecast30DayStandard + f.safetyStock - f.currentStock)
      : f.recommendedOrderQty;

  const totalExpectedDemand = fList.reduce(
    (s: number, f: any) => s + getScenarioDemand(f),
    0,
  );

  const totalOrderUnits = fList.reduce(
    (s: number, f: any) => s + getRecommendedBuy(f),
    0,
  );

  const totalCapital = fList.reduce(
    (s: number, f: any) => s + getRecommendedBuy(f) * f.unitCost,
    0,
  );

  const totalProjectedProfit = fList.reduce(
    (s: number, f: any) => s + getRecommendedBuy(f) * f.unitProfit,
    0,
  );

  const periodLabel =
    scenario === 'nov30'
      ? 'Nov 30 Holiday Surge'
      : scenario === 'monthly'
      ? 'Next 30 Days'
      : 'Next 7 Days';

  return (
    <section className="view-page active">
      {/* Period Selector Tabs */}
      <div className="pill-tabs no-print">
        <button
          className={`pill-tab ${scenario === 'weekly' ? 'active' : ''}`}
          onClick={() => setScenario('weekly')}
        >
          Next 7 Days (Weekly Restock)
        </button>
        <button
          className={`pill-tab ${scenario === 'nov30' ? 'active' : ''}`}
          onClick={() => setScenario('nov30')}
        >
          Nov 30 Holiday & 13th-Month Surge
        </button>
        <button
          className={`pill-tab ${scenario === 'monthly' ? 'active' : ''}`}
          onClick={() => setScenario('monthly')}
        >
          Next 30 Days (Monthly)
        </button>
      </div>

      {/* 4 Clean Summary Cards */}
      <div className="kpi-strip">
        <div className="kpi-box">
          <div className="kpi-box-label">Current Stock On Hand</div>
          <div className="kpi-box-val">{totalStockOnHand} pcs</div>
          <div className="kpi-box-sub">
            {(appState.inventory || []).length} gadget variant(s) in stock
          </div>
        </div>

        <div className="kpi-box">
          <div className="kpi-box-label">Expected Sales ({periodLabel})</div>
          <div className="kpi-box-val">{totalExpectedDemand} pcs</div>
          <div className="kpi-box-sub">
            Top seller: <strong>{fList[0]?.model || 'iPhone 12 Mini'}</strong>
          </div>
        </div>

        <div className="kpi-box">
          <div className="kpi-box-label">Suggested to Buy</div>
          <div className="kpi-box-val" style={{ color: '#059669' }}>
            +{totalOrderUnits} pcs
          </div>
          <div className="kpi-box-sub">Restock Cost: {peso(totalCapital)}</div>
        </div>

        <div className="kpi-box">
          <div className="kpi-box-label">Expected Restock Profit</div>
          <div className="kpi-box-val" style={{ color: '#059669' }}>
            +{peso(totalProjectedProfit)}
          </div>
          <div className="kpi-box-sub">Based on current unit margins</div>
        </div>
      </div>

      {/* Clean 6-Column Demand & Restock Table */}
      <div className="surface-card">
        <div className="surface-head">
          <div>
            <div className="surface-title">Demand Forecast & Restock List ({periodLabel})</div>
          </div>
          <button
            type="button"
            className="btn-pill btn-dark btn-sm no-print"
            onClick={() => window.print()}
          >
            Print Restock List
          </button>
        </div>

        <div className="clean-table-wrap">
          <table className="clean-table">
            <thead>
              <tr>
                <th>Gadget Model</th>
                <th>Current Stock</th>
                <th>Avg. Daily Sales</th>
                <th>Expected Demand ({periodLabel})</th>
                <th>Suggested to Buy</th>
                <th>Restock Cost & Status</th>
              </tr>
            </thead>
            <tbody>
              {fList.map((f: any) => {
                const scenarioDemand = getScenarioDemand(f);
                const recOrder = getRecommendedBuy(f);
                const capCost = recOrder * f.unitCost;
                const estProfit = recOrder * f.unitProfit;
                const needsRestock = recOrder > 0;

                const statusClass =
                  f.currentStock === 0
                    ? 'failed'
                    : needsRestock
                    ? 'amber'
                    : 'success';
                const statusLabel =
                  f.currentStock === 0
                    ? 'Out of Stock'
                    : needsRestock
                    ? 'Restock Needed'
                    : 'Good Stock';

                return (
                  <tr key={f.sku}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{f.model}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {f.storage} • {f.color}
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <strong>{f.currentStock} pcs</strong>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700 }}>
                        ~{Math.max(1, Math.round(f.weightedDailyBurnRate))} pcs / day
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Fri & Sat: ~{Math.max(2, Math.round(f.weekendPeakBurnRate))}/day
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <strong>{scenarioDemand} pcs</strong>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {recOrder > 0 ? (
                        <div>
                          <div style={{ color: '#059669', fontWeight: 800 }}>
                            +{recOrder} pcs
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#059669' }}>
                            +{peso(estProfit)} profit
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                          0 pcs (Enough Stock)
                        </span>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                        {recOrder > 0 ? peso(capCost) : 'PHP 0'}
                      </div>
                      <span className={`status-pill ${statusClass}`}>
                        <span className="status-dot" />
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
