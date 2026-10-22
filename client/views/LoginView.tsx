import React, { useState } from 'react';
import { AuthUser } from '../types';

interface LoginViewProps {
  onLoginSuccess: (token: string, user: AuthUser) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onNotify }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);
  const [forgotSentInfo, setForgotSentInfo] = useState<{
    message: string;
    codePreview: string;
  } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setForgotSentInfo(null);
    if (!email.trim() || !accessCode.trim()) {
      setErrorMsg('Please enter both your registered email and 6-digit access code.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), accessCode: accessCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid login credentials.');
      }
      onLoginSuccess(data.token, data.user);
      onNotify(`Welcome back, ${data.user.name}!`, false);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotAccessCode = async () => {
    setErrorMsg(null);
    setForgotSentInfo(null);
    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address first, then click "Forgot Access Code?".');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Could not recover access code.');
      }
      setForgotSentInfo({
        message: data.message,
        codePreview: data.accessCodePreview,
      });
      onNotify(data.message, false);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRegSuccessMsg(null);
    if (!regName.trim() || !regEmail.trim()) {
      setErrorMsg('Please provide your full name and email address.');
      return;
    }
    if (!regEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName.trim(), email: regEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
      }
      setRegSuccessMsg(
        data.message ||
          'Registration sent! Your account is now in the Admin Pending tab waiting for approval.',
      );
      setRegName('');
      setRegEmail('');
      onNotify('Registration request submitted for admin approval.', false);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoCode: string) => {
    setMode('login');
    setErrorMsg(null);
    setForgotSentInfo(null);
    setEmail(demoEmail);
    setAccessCode(demoCode);
  };

  return (
    <div className="auth-page-wrap">
      <div className="auth-card">
        <div className="auth-brand-header">
          <div className="auth-brand-logo">LP</div>
          <div>
            <h1 className="auth-brand-title">Loop Place Gadgets</h1>
            <p className="auth-brand-sub">Inventory &amp; Sales Management Platform</p>
          </div>
        </div>

        <div className="pill-tabs" style={{ width: '100%', display: 'flex', marginBottom: 20 }}>
          <button
            type="button"
            className={`pill-tab ${mode === 'login' ? 'active' : ''}`}
            style={{ flex: 1, textAlign: 'center' }}
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setRegSuccessMsg(null);
            }}
          >
            Sign In with Access Code
          </button>
          <button
            type="button"
            className={`pill-tab ${mode === 'register' ? 'active' : ''}`}
            style={{ flex: 1, textAlign: 'center' }}
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
              setForgotSentInfo(null);
            }}
          >
            Employee Registration
          </button>
        </div>

        {errorMsg && (
          <div className="validation-banner" style={{ marginBottom: 16 }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {forgotSentInfo && mode === 'login' && (
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #93c5fd',
              color: '#1e3a8a',
              borderRadius: 14,
              padding: '12px 14px',
              fontSize: '0.81rem',
              fontWeight: 600,
              marginBottom: 16,
              lineHeight: 1.45,
            }}
          >
            <div>✓ {forgotSentInfo.message}</div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Demo Preview Code (would be emailed in production):</span>
              <code
                style={{
                  background: '#18181b',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                }}
              >
                {forgotSentInfo.codePreview}
              </code>
              <button
                type="button"
                className="quick-chip-btn"
                style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                onClick={() => setAccessCode(forgotSentInfo.codePreview)}
              >
                Use Code
              </button>
            </div>
          </div>
        )}

        {regSuccessMsg && mode === 'register' && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              borderRadius: 14,
              padding: '12px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: 16,
              lineHeight: 1.45,
            }}
          >
            ✓ {regSuccessMsg}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="input-group">
              <label>Registered Email Address</label>
              <input
                type="email"
                placeholder="e.g. ventura@loopplace.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>6-Digit Access Code</label>
                <button
                  type="button"
                  onClick={handleForgotAccessCode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Forgot Access Code?
                </button>
              </div>
              <input
                type="text"
                placeholder="Enter 6-digit access code"
                maxLength={6}
                style={{
                  letterSpacing: '0.2em',
                  fontWeight: 800,
                  fontSize: '1rem',
                }}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                required
              />
              <div style={{ fontSize: '0.73rem', color: '#71717a', marginTop: 4 }}>
                Enter the unique 6-digit code sent to your email upon admin approval.
              </div>
            </div>

            <button
              type="submit"
              className="btn-pill btn-dark"
              style={{ width: '100%', padding: '13px', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In to Dashboard'}
            </button>

            <div className="auth-demo-box">
              <div className="auth-demo-title">Quick Account Switcher (Click to Auto-Fill):</div>
              <div className="auth-demo-row">
                <button
                  type="button"
                  className="quick-chip-btn"
                  onClick={() => fillDemoAccount('ventura@loopplace.ph', '000000')}
                >
                  <strong>Owner / Admin:</strong> Mr. Ventura / Sandrix (000000)
                </button>
                <button
                  type="button"
                  className="quick-chip-btn"
                  onClick={() => fillDemoAccount('carla@loopplace.ph', '111111')}
                >
                  <strong>Staff 1:</strong> Admin Carla (111111)
                </button>
                <button
                  type="button"
                  className="quick-chip-btn"
                  onClick={() => fillDemoAccount('jomar@loopplace.ph', '222222')}
                >
                  <strong>Staff 2:</strong> Admin Jomar (222222)
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '10px 12px',
                fontSize: '0.78rem',
                color: '#475569',
                lineHeight: 1.45,
              }}
            >
              <strong>How Employee Registration Works:</strong> Submit your name and email below. Your
              request goes to the Admin&apos;s <strong>Pending Approvals</strong> tab. Once approved,
              your unique 6-digit access code is emailed to you.
            </div>

            <div className="input-group">
              <label>Employee Full Name</label>
              <input
                type="text"
                placeholder="e.g. Pia (Field Sales & Meet-up Staff)"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Employee Email Address</label>
              <input
                type="email"
                placeholder="e.g. pia@loopplace.ph"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-pill btn-blue"
              style={{ width: '100%', padding: '13px', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? 'Submitting Request...' : 'Request Account Approval'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
