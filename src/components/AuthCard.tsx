import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wifi, ShieldCheck, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

interface AuthCardProps {
  onAuthSuccess: (user: any) => void;
  onDemoLogin: () => void;
  onSwitchToCustomer?: () => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({ onAuthSuccess, onDemoLogin, onSwitchToCustomer }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              organization: 'Wifi Voucher System',
            },
          },
        });

        if (error) throw error;

        if (data?.user && !data.session) {
          setSuccessMsg('Account created! Please check your email inbox to verify your account or use Demo Admin Mode below.');
        } else if (data?.user) {
          setSuccessMsg('Account created and logged in!');
          onAuthSuccess(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (data?.user) {
          onAuthSuccess(data.user);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      backgroundColor: 'var(--bg-primary)',
    }}>
      <div className="plain-card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '32px 28px',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            background: 'var(--primary)',
            color: '#ffffff',
            marginBottom: '14px',
          }}>
            <Wifi size={24} />
          </div>

          <h1 style={{ fontSize: '1.45rem', marginBottom: '4px', color: 'var(--text-main)' }}>
            WiFi-Vouch
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Hotspot Management & Voucher Billing
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '12px',
            padding: '4px 10px',
            background: 'var(--bg-secondary)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}>
            <span className="pulse-dot" style={{ backgroundColor: '#16a34a' }} />
            <span>Database: Connected</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--bg-secondary)',
          padding: '3px',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid var(--border-color)',
        }}>
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(null); setSuccessMsg(null); }}
            style={{
              padding: '8px 0',
              borderRadius: '4px',
              border: 'none',
              background: !isSignUp ? 'var(--bg-card)' : 'transparent',
              color: !isSignUp ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: !isSignUp ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(null); setSuccessMsg(null); }}
            style={{
              padding: '8px 0',
              borderRadius: '4px',
              border: 'none',
              background: isSignUp ? 'var(--bg-card)' : 'transparent',
              color: isSignUp ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: isSignUp ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Banners */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#b91c1c',
            fontSize: '0.82rem',
            marginBottom: '16px',
            textAlign: 'left',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            color: '#15803d',
            fontSize: '0.82rem',
            marginBottom: '16px',
            textAlign: 'left',
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{successMsg}</div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-dim)' }} />
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-dim)' }} />
              <input
                id="email"
                type="email"
                required
                placeholder="admin@example.com"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-dim)' }} />
              <input
                id="password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••••••"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '10px', marginTop: '4px' }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isSignUp ? 'Create Admin Account' : 'Sign In'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Bypass for Instant Testing */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
            Quick access options:
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onDemoLogin}
            style={{
              width: '100%',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '8px',
            }}
          >
            <KeyRound size={15} />
            <span>Continue as Demo Administrator</span>
          </button>

          {onSwitchToCustomer && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onSwitchToCustomer}
              style={{
                width: '100%',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Wifi size={15} />
              <span>Customer Portal (Enter Voucher)</span>
            </button>
          )}
        </div>

        {/* Security & Organization Notice */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '18px',
          color: 'var(--text-dim)',
          fontSize: '0.75rem',
        }}>
          <ShieldCheck size={14} />
          <span>WiFi Voucher Management System</span>
        </div>
      </div>
    </div>
  );
};
