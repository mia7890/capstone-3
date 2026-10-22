import React from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeTone?: 'blue' | 'green' | 'amber' | 'red';
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: 'dark' | 'blue' | 'green' | 'danger';
  isBusy?: boolean;
  validationError?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  subtitle,
  badgeText,
  badgeTone = 'blue',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmTone = 'dark',
  isBusy = false,
  validationError,
  onConfirm,
  onCancel,
  children,
}) => {
  if (!open) return null;

  const badgeColors: Record<string, { bg: string; text: string }> = {
    blue: { bg: '#dbeafe', text: '#1d4ed8' },
    green: { bg: '#d1fae5', text: '#047857' },
    amber: { bg: '#fef3c7', text: '#b45309' },
    red: { bg: '#fee2e2', text: '#be123c' },
  };
  const bStyle = badgeColors[badgeTone] || badgeColors.blue;

  const btnClass =
    confirmTone === 'danger'
      ? 'btn-pill btn-danger'
      : confirmTone === 'green'
      ? 'btn-pill btn-emerald'
      : confirmTone === 'blue'
      ? 'btn-pill btn-blue'
      : 'btn-pill btn-dark';

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            {badgeText && (
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 11px',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: bStyle.bg,
                  color: bStyle.text,
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                {badgeText}
              </span>
            )}
            <div className="modal-title">{title}</div>
            {subtitle && <div className="modal-sub">{subtitle}</div>}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onCancel}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {validationError && (
            <div className="validation-banner">
              <strong>Action Required:</strong> {validationError}
            </div>
          )}
          {children}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-pill btn-soft" onClick={onCancel} disabled={isBusy}>
            {cancelLabel}
          </button>
          <button type="button" className={btnClass} onClick={onConfirm} disabled={isBusy}>
            {isBusy ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
