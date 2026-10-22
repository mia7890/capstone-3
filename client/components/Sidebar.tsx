import React from 'react';
import { PageId } from '../types';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  userRole?: 'admin' | 'staff';
  pendingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  userRole = 'admin',
  pendingCount = 0,
}) => {
  const isAdmin = userRole === 'admin';

  return (
    <aside className="icon-sidebar">
      <div className="sidebar-brand" onClick={() => onNavigate('page-home')}>
        <div className="sidebar-logo-wrap">
          <div className="sidebar-logo">LP</div>
        </div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-title">Loop Place</div>
          <div className="sidebar-brand-sub">
            {isAdmin ? 'Admin Console' : 'Staff Portal'}
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-label">GENERAL</div>

          <button
            className={`rail-btn ${activePage === 'page-home' ? 'active' : ''}`}
            onClick={() => onNavigate('page-home')}
          >
            <span className="rail-icon">
              <svg viewBox="0 0 24 24">
                <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
              </svg>
            </span>
            <span className="rail-text">{isAdmin ? 'Dashboard' : 'My Dashboard'}</span>
          </button>

          <button
            className={`rail-btn ${activePage === 'page-inventory' ? 'active' : ''}`}
            onClick={() => onNavigate('page-inventory')}
          >
            <span className="rail-icon">
              <svg viewBox="0 0 24 24">
                <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" />
              </svg>
            </span>
            <span className="rail-text">
              {isAdmin ? 'Inventory' : 'My Assigned Stock'}
            </span>
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">OPERATIONS</div>

          <button
            className={`rail-btn ${activePage === 'page-stock-in' ? 'active' : ''}`}
            onClick={() => onNavigate('page-stock-in')}
          >
            <span className="rail-icon">
              <svg viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
              </svg>
            </span>
            <span className="rail-text">Stock In</span>
          </button>

          <button
            className={`rail-btn ${activePage === 'page-deduct' ? 'active' : ''}`}
            onClick={() => onNavigate('page-deduct')}
          >
            <span className="rail-icon">
              <svg viewBox="0 0 24 24">
                <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 12.5c-2.49 0-4.5-2.01-4.5-4.5S11.51 5.5 14 5.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-7c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z" />
              </svg>
            </span>
            <span className="rail-text">Deduct Stock</span>
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">{isAdmin ? 'MANAGEMENT' : 'REPORTS'}</div>

          {isAdmin && (
            <button
              className={`rail-btn ${activePage === 'page-forecast' ? 'active' : ''}`}
              onClick={() => onNavigate('page-forecast')}
            >
              <span className="rail-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
                </svg>
              </span>
              <span className="rail-text">Demand Forecast</span>
            </button>
          )}

          <button
            className={`rail-btn ${activePage === 'page-analytics' ? 'active' : ''}`}
            onClick={() => onNavigate('page-analytics')}
          >
            <span className="rail-icon">
              <svg viewBox="0 0 24 24">
                <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
              </svg>
            </span>
            <span className="rail-text">
              {isAdmin ? 'Sales Reports' : 'My Sales History'}
            </span>
          </button>

          {isAdmin && (
            <button
              className={`rail-btn ${activePage === 'page-admin' ? 'active' : ''}`}
              onClick={() => onNavigate('page-admin')}
            >
              <span className="rail-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </span>
              <span className="rail-text">Staff &amp; Access</span>
              {pendingCount > 0 && <span className="rail-badge">{pendingCount}</span>}
            </button>
          )}
        </div>
      </nav>

      <div className="sidebar-footer">
        <button className="rail-btn" onClick={() => window.print()}>
          <span className="rail-icon">
            <svg viewBox="0 0 24 24">
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
            </svg>
          </span>
          <span className="rail-text">Print Page</span>
        </button>
        <div className="sidebar-copyright">© 2026 Loop Place Gadgets</div>
      </div>
    </aside>
  );
};

export const MobileNav: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  userRole = 'admin',
}) => {
  const isAdmin = userRole === 'admin';

  return (
    <nav className="mobile-nav">
      <button
        className={`mob-btn ${activePage === 'page-home' ? 'active' : ''}`}
        onClick={() => onNavigate('page-home')}
      >
        <svg viewBox="0 0 24 24">
          <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
        </svg>
        <span>Home</span>
      </button>
      <button
        className={`mob-btn ${activePage === 'page-stock-in' ? 'active' : ''}`}
        onClick={() => onNavigate('page-stock-in')}
      >
        <svg viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
        </svg>
        <span>Stock In</span>
      </button>
      <button
        className={`mob-btn ${activePage === 'page-deduct' ? 'active' : ''}`}
        onClick={() => onNavigate('page-deduct')}
      >
        <svg viewBox="0 0 24 24">
          <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
        <span>Deduct</span>
      </button>
      <button
        className={`mob-btn ${activePage === 'page-inventory' ? 'active' : ''}`}
        onClick={() => onNavigate('page-inventory')}
      >
        <svg viewBox="0 0 24 24">
          <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1z" />
        </svg>
        <span>Stocks</span>
      </button>
      {isAdmin ? (
        <button
          className={`mob-btn ${activePage === 'page-admin' ? 'active' : ''}`}
          onClick={() => onNavigate('page-admin')}
        >
          <svg viewBox="0 0 24 24">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
          <span>Staff</span>
        </button>
      ) : (
        <button
          className={`mob-btn ${activePage === 'page-analytics' ? 'active' : ''}`}
          onClick={() => onNavigate('page-analytics')}
        >
          <svg viewBox="0 0 24 24">
            <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
          </svg>
          <span>Sales</span>
        </button>
      )}
    </nav>
  );
};
