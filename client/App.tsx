import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthUser, PageId } from './types';
import { Sidebar, MobileNav } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardView } from './views/DashboardView';
import { StockInView } from './views/StockInView';
import { DeductStockView } from './views/DeductStockView';
import { InventoryView } from './views/InventoryView';
import { ForecastView } from './views/ForecastView';
import { AnalyticsView } from './views/AnalyticsView';
import { AdminView } from './views/AdminView';
import { LoginView } from './views/LoginView';

interface ToastItem {
  id: number;
  message: string;
  isError: boolean;
}

function matchesStaffUser(fieldValue: string | undefined, user: AuthUser): boolean {
  if (!fieldValue) return false;
  const val = fieldValue.toLowerCase();
  const full = user.name.toLowerCase();
  const tokens = full.split(/\s+/).filter((t) => t.length > 2 && t !== 'admin' && t !== 'staff');
  if (val.includes(full)) return true;
  return tokens.some((tk) => val.includes(tk));
}

function buildStaffScopedState(rawState: any, user: AuthUser) {
  if (!rawState || user.role === 'admin') return rawState;

  const scopedInventory = (rawState.inventory || []).filter((item: any) => {
    const assigned = item.assignedTo || 'All Staff';
    if (assigned === 'All Staff') return true;
    return matchesStaffUser(assigned, user);
  });

  const scopedSales = (rawState.salesHistory || []).filter((s: any) =>
    matchesStaffUser(s.handledBy, user),
  );

  const scopedStockIn = (rawState.stockInHistory || []).filter((b: any) =>
    matchesStaffUser(b.handledBy, user),
  );

  const totalPhysicalUnits = scopedInventory.reduce(
    (sum: number, i: any) => sum + (Number(i.quantity) || 0),
    0,
  );
  const totalInventoryCost = scopedInventory.reduce(
    (sum: number, i: any) => sum + (Number(i.quantity) || 0) * (Number(i.costPrice) || 0),
    0,
  );
  const projectedInventoryRevenue = scopedInventory.reduce(
    (sum: number, i: any) => sum + (Number(i.quantity) || 0) * (Number(i.sellingPrice) || 0),
    0,
  );
  const projectedInventoryProfit = projectedInventoryRevenue - totalInventoryCost;

  const nowIso = new Date().toISOString();
  const todayPrefix = nowIso.slice(0, 10);
  const monthPrefix = nowIso.slice(0, 7);

  const todaySales = scopedSales.filter((s: any) => (s.createdAt || '').slice(0, 10) === todayPrefix);
  const monthSales = scopedSales.filter((s: any) => (s.createdAt || '').slice(0, 7) === monthPrefix);

  const channelMap = new Map<string, any>();
  const fulfillmentMap = new Map<string, any>();
  const modelMap = new Map<string, any>();

  for (const s of scopedSales) {
    if (!channelMap.has(s.channel)) {
      channelMap.set(s.channel, { channel: s.channel, deals: 0, units: 0, revenue: 0, profit: 0 });
    }
    const c = channelMap.get(s.channel);
    c.deals += 1;
    c.units += s.quantity;
    c.revenue += s.totalRevenue;
    c.profit += s.netProfit;

    if (!fulfillmentMap.has(s.fulfillment)) {
      fulfillmentMap.set(s.fulfillment, {
        method: s.fulfillment,
        deals: 0,
        units: 0,
        revenue: 0,
        profit: 0,
      });
    }
    const f = fulfillmentMap.get(s.fulfillment);
    f.deals += 1;
    f.units += s.quantity;
    f.revenue += s.totalRevenue;
    f.profit += s.netProfit;

    if (!modelMap.has(s.model)) {
      modelMap.set(s.model, {
        model: s.model,
        deals: 0,
        units: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      });
    }
    const m = modelMap.get(s.model);
    m.deals += 1;
    m.units += s.quantity;
    m.revenue += s.totalRevenue;
    m.cost += s.totalCost;
    m.profit += s.netProfit;
  }

  return {
    ...rawState,
    inventory: scopedInventory,
    salesHistory: scopedSales,
    stockInHistory: scopedStockIn,
    kpis: {
      ...rawState.kpis,
      totalSkus: scopedInventory.length,
      totalPhysicalUnits,
      totalInventoryCost,
      projectedInventoryRevenue,
      projectedInventoryProfit,
      todayDealsCount: todaySales.length,
      todayUnitsSold: todaySales.reduce((s: number, x: any) => s + x.quantity, 0),
      todayGrossRevenue: todaySales.reduce((s: number, x: any) => s + x.totalRevenue, 0),
      todayNetProfit: todaySales.reduce((s: number, x: any) => s + x.netProfit, 0),
      currentMonthDeals: monthSales.length,
      currentMonthUnits: monthSales.reduce((s: number, x: any) => s + x.quantity, 0),
      currentMonthGross: monthSales.reduce((s: number, x: any) => s + x.totalRevenue, 0),
      currentMonthProfit: monthSales.reduce((s: number, x: any) => s + x.netProfit, 0),
      lowStockCount: scopedInventory.filter((i: any) => i.quantity <= i.lowStockThreshold).length,
      totalAllTimeDeals: scopedSales.length,
    },
    analytics: {
      ...rawState.analytics,
      channelBreakdown: Array.from(channelMap.values()),
      fulfillmentBreakdown: Array.from(fulfillmentMap.values()),
      modelPerformance: Array.from(modelMap.values()),
      staffPerformance: [
        {
          staff: user.name,
          deals: scopedSales.length,
          units: scopedSales.reduce((s: number, x: any) => s + x.quantity, 0),
          revenue: scopedSales.reduce((s: number, x: any) => s + x.totalRevenue, 0),
          profit: scopedSales.reduce((s: number, x: any) => s + x.netProfit, 0),
        },
      ],
    },
  };
}

export const App: React.FC = () => {
  const [appState, setAppState] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem('lpg_auth_token') || '');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('lpg_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activePage, setActivePage] = useState<PageId>('page-home');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [activeToast, setActiveToast] = useState<ToastItem | null>(null);
  const toastTimerRef = useRef<any>(null);

  const notify = useCallback((message: string, isError = false) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setActiveToast({ id: Date.now(), message, isError });
    toastTimerRef.current = setTimeout(() => {
      setActiveToast(null);
      toastTimerRef.current = null;
    }, 2800);
  }, []);

  useEffect(() => {
    fetch('/api/bootstrap')
      .then((res) => res.json())
      .then((data) => {
        setAppState(data);
      })
      .catch((err) => {
        notify('Error loading system state: ' + err.message, true);
      });
  }, [notify]);

  // Verify existing session token on mount
  useEffect(() => {
    if (!authToken) return;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Session expired');
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
          localStorage.setItem('lpg_auth_user', JSON.stringify(data.user));
        }
      })
      .catch(() => {
        setAuthToken('');
        setCurrentUser(null);
        localStorage.removeItem('lpg_auth_token');
        localStorage.removeItem('lpg_auth_user');
      });
  }, [authToken]);

  const handleLoginSuccess = (token: string, user: AuthUser) => {
    setAuthToken(token);
    setCurrentUser(user);
    setActivePage('page-home');
    localStorage.setItem('lpg_auth_token', token);
    localStorage.setItem('lpg_auth_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (_) {}
    }
    setAuthToken('');
    setCurrentUser(null);
    setActivePage('page-home');
    localStorage.removeItem('lpg_auth_token');
    localStorage.removeItem('lpg_auth_user');
    notify('Signed out of your account.', false);
  };

  const handleStateUpdated = useCallback(
    (newState: any, msg: string) => {
      setAppState(newState);
      if (msg) notify(msg, false);
    },
    [notify],
  );

  const handleGlobalSearch = (q: string) => {
    setGlobalSearch(q);
    if (q.trim()) {
      setActivePage('page-deduct');
    }
  };

  const effectiveState = useMemo(() => {
    if (!appState || !currentUser) return appState;
    return buildStaffScopedState(appState, currentUser);
  }, [appState, currentUser]);

  if (!appState) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#18181b',
          color: '#ffffff',
          fontWeight: 700,
        }}
      >
        Loading Loop Place Gadgets IMS...
      </div>
    );
  }

  if (!currentUser || !authToken) {
    return (
      <>
        <LoginView onLoginSuccess={handleLoginSuccess} onNotify={notify} />
        {activeToast && (
          <div className="toast-stack">
            <div className={`toast-item ${activeToast.isError ? 'error' : ''}`}>
              {activeToast.message}
            </div>
          </div>
        )}
      </>
    );
  }

  const activeStaffLabel = currentUser.name;
  const isAdmin = currentUser.role === 'admin';

  return (
    <>
      <div className="app-shell">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          userRole={currentUser.role}
        />

        <main className="main-canvas">
          <TopBar
            globalSearch={globalSearch}
            onGlobalSearch={handleGlobalSearch}
            currentUser={currentUser}
            onLogout={handleLogout}
          />

          {activePage === 'page-home' && (
            <DashboardView appState={effectiveState} onNavigate={setActivePage} />
          )}

          {activePage === 'page-stock-in' && (
            <StockInView
              appState={effectiveState}
              activeStaff={activeStaffLabel}
              onStateUpdated={handleStateUpdated}
              onNotify={notify}
            />
          )}

          {activePage === 'page-deduct' && (
            <DeductStockView
              appState={effectiveState}
              activeStaff={activeStaffLabel}
              initialSearch={globalSearch}
              initialSubTab="manual"
              onNavigate={setActivePage}
              onStateUpdated={handleStateUpdated}
              onNotify={notify}
            />
          )}

          {activePage === 'page-inventory' && (
            <InventoryView
              appState={effectiveState}
              onNavigate={setActivePage}
              onStateUpdated={handleStateUpdated}
              onNotify={notify}
            />
          )}

          {activePage === 'page-forecast' && isAdmin && (
            <ForecastView appState={effectiveState} onNotify={notify} />
          )}

          {activePage === 'page-analytics' && (
            <AnalyticsView
              appState={effectiveState}
              onStateUpdated={handleStateUpdated}
              onNotify={notify}
            />
          )}

          {activePage === 'page-admin' && isAdmin && (
            <AdminView
              appState={appState}
              authToken={authToken}
              onStateUpdated={handleStateUpdated}
              onNotify={notify}
            />
          )}
        </main>

        <MobileNav
          activePage={activePage}
          onNavigate={setActivePage}
          userRole={currentUser.role}
        />
      </div>

      {activeToast && (
        <div className="toast-stack">
          <div className={`toast-item ${activeToast.isError ? 'error' : ''}`}>
            {activeToast.message}
          </div>
        </div>
      )}
    </>
  );
};
