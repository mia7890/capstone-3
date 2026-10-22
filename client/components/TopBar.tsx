import React from 'react';
import { AuthUser } from '../types';

interface TopBarProps {
  globalSearch: string;
  onGlobalSearch: (q: string) => void;
  currentUser: AuthUser;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  globalSearch,
  onGlobalSearch,
  currentUser,
  onLogout,
}) => {
  const initials = currentUser.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="canvas-topbar">
      <div className="greeting-box">
        <div className="avatar-circle">{initials || 'LP'}</div>
        <div>
          <div className="greeting-title">Greetings, {currentUser.name}</div>
          <div className="greeting-sub">
            {isAdmin
              ? 'Loop Place Gadgets • Admin Master Access (All Stock & Sales)'
              : 'Loop Place Gadgets • Staff Account (Assigned Stock & Personal Sales)'}
          </div>
        </div>
      </div>

      <div className="top-search-pill">
        <svg viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          type="text"
          value={globalSearch}
          placeholder="Search gadget model, storage, or color..."
          onChange={(e) => onGlobalSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="account-select-wrap" style={{ padding: '8px 14px' }}>
          <svg viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
            {currentUser.name} ({isAdmin ? 'Admin' : 'Staff'})
          </span>
        </div>

        <button
          type="button"
          className="btn-pill btn-soft btn-sm"
          onClick={onLogout}
          title="Sign out of current account"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};
