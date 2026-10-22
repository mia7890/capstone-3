import React, { useCallback, useEffect, useState } from 'react';
import { AuthUser, getColorHex, peso } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

interface AdminViewProps {
  appState: any;
  authToken: string;
  onStateUpdated: (newState: any, msg: string) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  appState,
  authToken,
  onStateUpdated,
  onNotify,
}) => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'accounts' | 'performance'>('accounts');
  const [issuedCodeBanner, setIssuedCodeBanner] = useState<{
    name: string;
    email: string;
    code: string;
    actionLabel: string;
  } | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    type: 'delete' | 'deactivate';
    user: AuthUser;
  } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err: any) {
      onNotify('Failed to load staff accounts: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  }, [authToken, onNotify]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleApprove = async (u: AuthUser) => {
    try {
      const res = await fetch(`/api/admin/approve/${u.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Approval failed.');
      setIssuedCodeBanner({
        name: u.name,
        email: u.email,
        code: data.accessCode,
        actionLabel: 'Approved & Access Code Emailed',
      });
      onNotify(data.message, false);
      fetchUsers();
    } catch (err: any) {
      onNotify(err.message, true);
    }
  };

  const handleResetCode = async (u: AuthUser) => {
    try {
      const res = await fetch(`/api/admin/users/${u.id}/reset-code`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed.');
      setIssuedCodeBanner({
        name: u.name,
        email: u.email,
        code: data.accessCode,
        actionLabel: 'New Access Code Generated & Emailed',
      });
      onNotify(data.message, false);
      fetchUsers();
    } catch (err: any) {
      onNotify(err.message, true);
    }
  };

  const handleReactivate = async (u: AuthUser) => {
    try {
      const res = await fetch(`/api/admin/users/${u.id}/reactivate`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reactivation failed.');
      setIssuedCodeBanner({
        name: u.name,
        email: u.email,
        code: data.accessCode,
        actionLabel: 'Account Reactivated & New Code Issued',
      });
      onNotify(data.message, false);
      fetchUsers();
    } catch (err: any) {
      onNotify(err.message, true);
    }
  };

  const executeConfirmAction = async () => {
    if (!confirmTarget) return;
    const { type, user } = confirmTarget;
    try {
      if (type === 'delete') {
        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Delete failed.');
        onNotify(data.message, false);
      } else {
        const res = await fetch(`/api/admin/users/${user.id}/deactivate`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Deactivation failed.');
        onNotify(data.message, false);
      }
      setConfirmTarget(null);
      fetchUsers();
    } catch (err: any) {
      onNotify(err.message, true);
    }
  };

  const handleAssignStock = async (sku: string, assignedTo: string) => {
    try {
      const res = await fetch(`/api/inventory/${encodeURIComponent(sku)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to assign inventory.');
      onStateUpdated(data.state, `Assigned ${sku} to ${assignedTo}.`);
    } catch (err: any) {
      onNotify(err.message, true);
    }
  };

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const activeUsers = users.filter((u) => u.status === 'active');
  const inventory = appState.inventory || [];
  const salesHistory = appState.salesHistory || [];
  const staffPerformance = appState.analytics?.staffPerformance || [];

  const getUserMetrics = (u: AuthUser) => {
    const firstName = u.name.split(' ')[0].toLowerCase();
    const fullLower = u.name.toLowerCase();
    const assignedUnits = inventory
      .filter((item: any) => {
        const a = (item.assignedTo || '').toLowerCase();
        return a.includes(fullLower) || (firstName.length > 2 && a.includes(firstName));
      })
      .reduce((sum: number, i: any) => sum + (Number(i.quantity) || 0), 0);

    const personalSales = salesHistory.filter((s: any) => {
      const h = (s.handledBy || '').toLowerCase();
      return h.includes(fullLower) || (firstName.length > 2 && h.includes(firstName));
    });

    const totalRevenue = personalSales.reduce(
      (sum: number, s: any) => sum + (Number(s.totalRevenue) || 0),
      0,
    );
    const totalDeals = personalSales.length;

    return { assignedUnits, totalRevenue, totalDeals };
  };

  const assignableOptions = ['All Staff', ...activeUsers.map((u) => u.name)];

  return (
    <section className="view-page active">
      {/* Top KPI Row */}
      <div className="kpi-strip">
        <div className="kpi-box">
          <div className="kpi-box-label">Pending Registrations</div>
          <div
            className="kpi-box-val"
            style={{ color: pendingUsers.length > 0 ? '#b45309' : '#18181b' }}
          >
            {pendingUsers.length} Request{pendingUsers.length === 1 ? '' : 's'}
          </div>
          <div className="kpi-box-sub">New staff awaiting approval</div>
        </div>

        <div className="kpi-box">
          <div className="kpi-box-label">Active Accounts</div>
          <div className="kpi-box-val">{activeUsers.length} Active</div>
          <div className="kpi-box-sub">{users.length} total registered users</div>
        </div>

        <div className="kpi-box">
          <div className="kpi-box-label">Master Business Stock</div>
          <div className="kpi-box-val" style={{ color: '#1d4ed8' }}>
            {appState.kpis?.totalPhysicalUnits || 0} pcs
          </div>
          <div className="kpi-box-sub">Across all staff &amp; locations</div>
        </div>

        <div className="kpi-box">
          <div className="kpi-box-label">Master Net Profit (Month)</div>
          <div className="kpi-box-val" style={{ color: '#065f46' }}>
            {peso(appState.kpis?.currentMonthProfit || 0)}
          </div>
          <div className="kpi-box-sub">{appState.kpis?.currentMonthDeals || 0} total deals</div>
        </div>
      </div>

      {/* Issued Access Code Notification Banner */}
      {issuedCodeBanner && (
        <div
          className="surface-card"
          style={{
            border: '2px solid #3b82f6',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#1d4ed8',
                textTransform: 'uppercase',
              }}
            >
              ✓ {issuedCodeBanner.actionLabel}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: 2 }}>
              {issuedCodeBanner.name} ({issuedCodeBanner.email})
            </div>
            <div style={{ fontSize: '0.8rem', color: '#52525b', marginTop: 2 }}>
              An automated access email has been dispatched to{' '}
              <strong>{issuedCodeBanner.email}</strong>. You can also copy the code directly below:
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                background: '#18181b',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: 12,
                fontFamily: 'monospace',
                fontSize: '1.25rem',
                fontWeight: 900,
                letterSpacing: '0.18em',
              }}
            >
              {issuedCodeBanner.code}
            </div>
            <button
              type="button"
              className="btn-pill btn-blue btn-sm"
              onClick={() => {
                navigator.clipboard?.writeText(issuedCodeBanner.code);
                onNotify(`Copied access code ${issuedCodeBanner.code} to clipboard!`, false);
              }}
            >
              Copy Code
            </button>
            <button
              type="button"
              className="btn-pill btn-soft btn-sm"
              onClick={() => setIssuedCodeBanner(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div className="pill-tabs" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className={`pill-tab ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            Staff Accounts &amp; Approvals ({pendingUsers.length} Pending)
          </button>
          <button
            type="button"
            className={`pill-tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            Employee Sales &amp; Stock Assignment
          </button>
        </div>

        <button
          type="button"
          className="btn-pill btn-soft btn-sm"
          onClick={fetchUsers}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Accounts'}
        </button>
      </div>

      {activeTab === 'accounts' ? (
        <>
          {/* Pending Approvals Card */}
          <div className="surface-card">
            <div className="surface-head">
              <div>
                <div className="surface-title">Pending Employee Registrations</div>
                <div className="surface-sub">
                  New staff requests awaiting owner approval. Approving generates and emails a
                  unique 6-digit access code.
                </div>
              </div>
              <span className={`status-pill ${pendingUsers.length > 0 ? 'amber' : 'success'}`}>
                <span className="status-dot" />
                {pendingUsers.length} Pending
              </span>
            </div>

            {pendingUsers.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: 14,
                  color: '#71717a',
                  fontSize: '0.85rem',
                }}
              >
                No pending employee registration requests right now.
              </div>
            ) : (
              <div className="clean-table-wrap">
                <table className="clean-table">
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>Email Address</th>
                      <th>Requested Role</th>
                      <th>Submitted On</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.name}</strong>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span className="status-pill process">Staff Account</span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: '#71717a' }}>
                          {new Date(u.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              className="btn-pill btn-dark btn-sm"
                              onClick={() => handleApprove(u)}
                            >
                              Approve &amp; Email Code
                            </button>
                            <button
                              type="button"
                              className="btn-pill btn-danger btn-sm"
                              onClick={() => setConfirmTarget({ type: 'delete', user: u })}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* All Registered Accounts Card */}
          <div className="surface-card">
            <div className="surface-head">
              <div>
                <div className="surface-title">Registered Staff &amp; Admin Accounts</div>
                <div className="surface-sub">
                  Manage access codes, monitor individual assigned stock, or deactivate/remove
                  employees who leave.
                </div>
              </div>
            </div>

            <div className="clean-table-wrap">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Name &amp; Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>6-Digit Access Code</th>
                    <th>Assigned Stock</th>
                    <th>Personal Sales</th>
                    <th>Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const metrics = getUserMetrics(u);
                    return (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.name}</strong>
                          <div style={{ fontSize: '0.74rem', color: '#71717a' }}>{u.email}</div>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              u.role === 'admin' ? 'success' : 'process'
                            }`}
                          >
                            {u.role === 'admin' ? 'Owner / Admin' : 'Staff'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              u.status === 'active'
                                ? 'success'
                                : u.status === 'pending'
                                ? 'amber'
                                : 'failed'
                            }`}
                          >
                            <span className="status-dot" />
                            {u.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {u.accessCode ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <code
                                style={{
                                  background: '#f4f4f5',
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  fontWeight: 800,
                                  letterSpacing: '0.1em',
                                }}
                              >
                                {u.accessCode}
                              </code>
                              <button
                                type="button"
                                className="quick-chip-btn"
                                style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                                onClick={() => {
                                  navigator.clipboard?.writeText(u.accessCode || '');
                                  onNotify(`Copied ${u.name}'s access code!`, false);
                                }}
                              >
                                Copy
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                              Awaiting approval
                            </span>
                          )}
                        </td>
                        <td>
                          <strong>
                            {u.role === 'admin'
                              ? `${appState.kpis?.totalPhysicalUnits || 0} pcs (All)`
                              : `${metrics.assignedUnits} pcs`}
                          </strong>
                        </td>
                        <td>
                          <strong>{peso(metrics.totalRevenue)}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#71717a' }}>
                            {metrics.totalDeals} deal(s)
                          </div>
                        </td>
                        <td>
                          {u.role === 'admin' ? (
                            <span
                              style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 600 }}
                            >
                              Primary Owner
                            </span>
                          ) : (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {u.status === 'active' && (
                                <>
                                  <button
                                    type="button"
                                    className="btn-pill btn-soft btn-sm"
                                    onClick={() => handleResetCode(u)}
                                  >
                                    New Code
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-pill btn-soft btn-sm"
                                    style={{ color: '#92400e' }}
                                    onClick={() =>
                                      setConfirmTarget({ type: 'deactivate', user: u })
                                    }
                                  >
                                    Deactivate
                                  </button>
                                </>
                              )}
                              {u.status === 'deactivated' && (
                                <button
                                  type="button"
                                  className="btn-pill btn-blue btn-sm"
                                  onClick={() => handleReactivate(u)}
                                >
                                  Reactivate
                                </button>
                              )}
                              {u.status === 'pending' && (
                                <button
                                  type="button"
                                  className="btn-pill btn-dark btn-sm"
                                  onClick={() => handleApprove(u)}
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn-pill btn-danger btn-sm"
                                onClick={() => setConfirmTarget({ type: 'delete', user: u })}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Employee Sales Performance Breakdown */}
          <div className="surface-card">
            <div className="surface-head">
              <div>
                <div className="surface-title">Individual Employee Sales Performance</div>
                <div className="surface-sub">
                  Real-time sales breakdown by staff member across all channels and meet-ups.
                </div>
              </div>
            </div>

            <div className="clean-table-wrap">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Completed Deals</th>
                    <th>Gadgets Sold</th>
                    <th>Gross Sales Revenue</th>
                    <th>Net Profit Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {staffPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#71717a' }}>
                        No sales transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    staffPerformance.map((sp: any) => (
                      <tr key={sp.staff}>
                        <td>
                          <strong>{sp.staff}</strong>
                        </td>
                        <td>{sp.deals} deals</td>
                        <td>
                          <strong>{sp.units} pcs</strong>
                        </td>
                        <td>{peso(sp.revenue)}</td>
                        <td style={{ color: '#065f46', fontWeight: 800 }}>+{peso(sp.profit)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inventory Assignment per Employee */}
          <div className="surface-card">
            <div className="surface-head">
              <div>
                <div className="surface-title">Assign Inventory to Specific Employees</div>
                <div className="surface-sub">
                  Staff accounts can only view and deduct inventory assigned to them (or Shared
                  stock).
                </div>
              </div>
            </div>

            <div className="clean-table-wrap">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Gadget Model</th>
                    <th>Specs &amp; Grade</th>
                    <th>In Stock</th>
                    <th>Selling Price</th>
                    <th>Assigned Staff Member</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#71717a' }}>
                        No inventory items currently in stock.
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item: any) => {
                      const dot = getColorHex(item.color);
                      return (
                        <tr key={item.sku}>
                          <td>
                            <strong>{item.model}</strong>
                            <div style={{ fontSize: '0.72rem', color: '#71717a' }}>{item.brand}</div>
                          </td>
                          <td>
                            <span className="storage-tag" style={{ marginRight: 6 }}>
                              {item.storage}
                            </span>
                            <span
                              className="color-dot"
                              style={{ background: dot.bg, borderColor: dot.border }}
                            />
                            <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{item.color}</span>
                            <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: 2 }}>
                              {item.condition}
                            </div>
                          </td>
                          <td>
                            <strong>{item.quantity} pcs</strong>
                          </td>
                          <td>{peso(item.sellingPrice)}</td>
                          <td>
                            <select
                              style={{ padding: '7px 10px', fontSize: '0.8rem', maxWidth: 230 }}
                              value={item.assignedTo || 'All Staff'}
                              onChange={(e) => handleAssignStock(item.sku, e.target.value)}
                            >
                              {assignableOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt === 'All Staff' ? 'Shared (All Staff)' : opt}
                                </option>
                              ))}
                              {item.assignedTo && !assignableOptions.includes(item.assignedTo) && (
                                <option value={item.assignedTo}>{item.assignedTo}</option>
                              )}
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        open={Boolean(confirmTarget)}
        title={
          confirmTarget?.type === 'delete'
            ? 'Delete Employee Account'
            : 'Deactivate Employee Account'
        }
        subtitle={
          confirmTarget?.type === 'delete'
            ? `Are you sure you want to permanently delete ${confirmTarget?.user.name}'s account?`
            : `Are you sure you want to deactivate ${confirmTarget?.user.name}'s login access?`
        }
        confirmLabel={confirmTarget?.type === 'delete' ? 'Yes, Delete Account' : 'Yes, Deactivate'}
        tone="danger"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={executeConfirmAction}
      >
        {confirmTarget && (
          <div className="modal-list-box">
            <div className="modal-list-row">
              <span>Employee Name</span>
              <strong>{confirmTarget.user.name}</strong>
            </div>
            <div className="modal-list-row">
              <span>Email</span>
              <strong>{confirmTarget.user.email}</strong>
            </div>
            <div className="modal-list-row">
              <span>Current Status</span>
              <strong>{confirmTarget.user.status.toUpperCase()}</strong>
            </div>
          </div>
        )}
      </ConfirmModal>
    </section>
  );
};
