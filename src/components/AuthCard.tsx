import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wifi, ShieldCheck, Mail, Lock, User, ArrowRight, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

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
      padding: '24px 16px',
      position: 'relative'
    }}>
      {/* Background ambient orbs */}
      <div style={{
        position: 'absolute',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%)',
        top: '10%',
        left: '20%',
        pointerEvents: 'none',
        filter: 'blur(40px)',
      }} />

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '36px 32px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
            boxShadow: '0 8px 24px rgba(6, 182, 212, 0.35)',
            marginBottom: '16px',
          }}>
            <Wifi size={32} color="#ffffff" />
          </div>

          <h1 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>
            WiFi-Vouch
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Hotspot Management & Voucher Billing System
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '12px',
            padding: '4px 12px',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '999px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.78rem',
            color: '#34d399',
            fontWeight: 500
          }}>
            <span className="pulse-dot" style={{ backgroundColor: '#10b981' }} />
            Supabase DB Connected: <code>Wifi-VOuch</code>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid var(--border-color)',
        }}>
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(null); setSuccessMsg(null); }}
            style={{
              padding: '10px 0',
              borderRadius: '8px',
              border: 'none',
              background: !isSignUp ? 'rgba(37, 99, 235, 0.3)' : 'transparent',
              color: !isSignUp ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(null); setSuccessMsg(null); }}
            style={{
              padding: '10px 0',
              borderRadius: '8px',
              border: 'none',
              background: isSignUp ? 'rgba(37, 99, 235, 0.3)' : 'transparent',
              color: isSignUp ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
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
            gap: '10px',
            padding: '12px 14px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '10px',
            color: '#fb7185',
            fontSize: '0.85rem',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 14px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            color: '#34d399',
            fontSize: '0.85rem',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{successMsg}</div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-dim)' }} />
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="e.g. John Doe (Hotspot Admin)"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-dim)' }} />
              <input
                id="email"
                type="email"
                required
                placeholder="admin@wifivoucher.local"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-dim)' }} />
              <input
                id="password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••••••"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', marginTop: '6px' }}
          >
            {loading ? (
              <span>Authenticating with Supabase...</span>
            ) : (
              <>
                <span>{isSignUp ? 'Create Admin Account' : 'Sign In to Dashboard'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Bypass for Instant Testing */}
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
            Want to test without signing up or confirming an email first?
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onDemoLogin}
            style={{
              width: '100%',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            <Sparkles size={16} color="#fbbf24" />
            <span>Enter as Guest Administrator (Live Supabase DB)</span>
          </button>

          {onSwitchToCustomer && (
            <button
              type="button"
              className="btn btn-emerald"
              onClick={onSwitchToCustomer}
              style={{
                width: '100%',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Wifi size={16} />
              <span>Customer Portal (Enter Voucher Code)</span>
            </button>
          )}
        </div>


        {/* Security & Organization Notice */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '20px',
          color: 'var(--text-dim)',
          fontSize: '0.78rem'
        }}>
          <ShieldCheck size={14} color="#06b6d4" />
          <span>Organization: Wifi Voucher System (Supabase Tokyo)</span>
        </div>
      </div>
    </div>
  );
};
