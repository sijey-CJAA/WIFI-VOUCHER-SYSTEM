import React, { useState, useEffect } from 'react';
import { Wifi, ArrowRight, CheckCircle2, AlertCircle, Phone, Lock, LogIn, Clock } from 'lucide-react';
import { supabase, type WifiSettings } from '../lib/supabase';

interface CustomerPortalProps {
  settings: WifiSettings;
  onSwitchToAdmin: () => void;
}

interface ActiveSessionData {
  voucherId: string;
  voucherCode: string;
  planName: string;
  durationMinutes: number;
  speed: string;
  activatedAt: string;
  expiresAt: string;
}

const STORAGE_KEY = 'wifi_portal_active_session';

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  settings,
  onSwitchToAdmin,
}) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionSuccess, setSessionSuccess] = useState<ActiveSessionData | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ActiveSessionData = JSON.parse(saved);
        if (new Date(parsed.expiresAt).getTime() > Date.now()) {
          return parsed;
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.warn('Error reading stored session:', e);
    }
    return null;
  });

  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Check saved session on mount and sync with Supabase
  useEffect(() => {
    if (!sessionSuccess) return;

    const checkActiveVoucher = async () => {
      try {
        const { data: voucher } = await supabase
          .from('vouchers')
          .select('*, plan:voucher_plans(*)')
          .eq('code', sessionSuccess.voucherCode)
          .maybeSingle();

        if (!voucher) {
          handleDisconnect();
          setErrorMsg('Voucher session not found.');
          return;
        }

        if (voucher.status === 'expired' || voucher.status === 'disabled') {
          handleDisconnect();
          setErrorMsg(`Session terminated: voucher is ${voucher.status}.`);
        }
      } catch (err: any) {
        console.warn('Background voucher check error:', err);
      }
    };

    checkActiveVoucher();
  }, []);

  // Countdown timer for active session
  useEffect(() => {
    if (!sessionSuccess) return;

    const updateTimer = () => {
      const now = Date.now();
      const expiry = new Date(sessionSuccess.expiresAt).getTime();
      const diffMs = expiry - now;

      if (diffMs <= 0) {
        setTimeRemaining('Expired');
        handleDisconnect();
        setErrorMsg('Your voucher session has expired. Please enter a new code.');
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const formatted = `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds.toString().padStart(2, '0')}s`;
      setTimeRemaining(formatted);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [sessionSuccess]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = voucherCode.trim().toUpperCase();
    if (!cleanCode) return;

    // Prevent burning multiple vouchers on the same device simultaneously
    if (sessionSuccess && new Date(sessionSuccess.expiresAt).getTime() > Date.now()) {
      setErrorMsg(`This device already has an active session for voucher ${sessionSuccess.voucherCode}. Please wait until it finishes before using another voucher.`);
      return;
    }

    setVerifying(true);
    setErrorMsg(null);

    try {
      const { data: voucher, error } = await supabase
        .from('vouchers')
        .select('*, plan:voucher_plans(*)')
        .eq('code', cleanCode)
        .maybeSingle();

      if (error) throw error;

      if (!voucher) {
        setErrorMsg('Invalid voucher code. Please check your voucher ticket and try again.');
        setVerifying(false);
        return;
      }

      if (voucher.status === 'used' || voucher.status === 'expired' || voucher.status === 'disabled') {
        setErrorMsg(`This voucher is ${voucher.status}. Please use a valid voucher.`);
        setVerifying(false);
        return;
      }

      const durationMins = voucher.plan?.duration_minutes || 60;
      const nowIso = new Date().toISOString();
      const activatedAt = voucher.activated_at || nowIso;
      
      // Calculate expiration based on activation time
      const expiresAt = voucher.expires_at || 
        new Date(new Date(activatedAt).getTime() + durationMins * 60 * 1000).toISOString();

      // Check if already expired based on time
      if (new Date(expiresAt).getTime() <= Date.now()) {
        await supabase
          .from('vouchers')
          .update({ status: 'expired' })
          .eq('id', voucher.id);

        setErrorMsg('This voucher has already expired.');
        setVerifying(false);
        return;
      }

      // Mark voucher active if it was available
      if (voucher.status === 'available') {
        await supabase
          .from('vouchers')
          .update({
            status: 'active',
            activated_at: activatedAt,
            expires_at: expiresAt,
          })
          .eq('id', voucher.id);
      }

      // Record in active_sessions
      try {
        await supabase
          .from('active_sessions')
          .insert([
            {
              voucher_id: voucher.id,
              voucher_code: voucher.code,
              status: 'online',
              connected_at: activatedAt,
              last_seen_at: nowIso,
            },
          ]);
      } catch (sessionErr) {
        console.warn('Session logging non-fatal error:', sessionErr);
      }

      const sessionData: ActiveSessionData = {
        voucherId: voucher.id,
        voucherCode: voucher.code,
        planName: voucher.plan?.name || 'Standard Pass',
        durationMinutes: durationMins,
        speed: `${voucher.plan?.download_speed_mbps || 15} Mbps`,
        activatedAt: activatedAt,
        expiresAt: expiresAt,
      };

      // Persist to localStorage so refreshing keeps the user logged in
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      setSessionSuccess(sessionData);
    } catch (err: any) {
      console.error('Portal verify error:', err);
      setErrorMsg(err.message || 'Connection error with authentication server.');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisconnect = async () => {
    if (sessionSuccess?.voucherId) {
      try {
        await supabase
          .from('active_sessions')
          .update({ status: 'disconnected', last_seen_at: new Date().toISOString() })
          .eq('voucher_id', sessionSuccess.voucherId)
          .eq('status', 'online');
      } catch (err) {
        console.warn('Disconnect logging error:', err);
      }
    }

    localStorage.removeItem(STORAGE_KEY);
    setSessionSuccess(null);
    setVoucherCode('');
    setTimeRemaining('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px 16px',
      backgroundColor: 'var(--bg-primary)',
    }}>
      {/* Top Switcher to Admin */}
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onSwitchToAdmin}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
        >
          <LogIn size={14} />
          <span>Admin Login</span>
        </button>
      </div>

      {/* Main Captive Portal Card */}
      <div className="plain-card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '32px 24px',
        textAlign: 'center',
        margin: '16px 0',
      }}>
        {/* Network Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '6px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          marginBottom: '18px',
        }}>
          <Wifi size={13} color="var(--primary)" />
          <span>Network: <strong>{settings.ssid_name || 'GUEST WIFI'}</strong></span>
        </div>

        {/* Brand Icon */}
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '8px',
          background: settings.brand_color || 'var(--primary)',
          margin: '0 auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
        }}>
          <Wifi size={28} />
        </div>

        <h1 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '6px' }}>
          {settings.portal_title || 'Guest WiFi Access'}
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.4 }}>
          {settings.portal_subtitle || 'Enter your voucher code to connect instantly'}
        </p>

        {sessionSuccess ? (
          /* Connected Success View (Persisted across refreshes) */
          <div style={{
            padding: '20px',
            borderRadius: '8px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            textAlign: 'center',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#16a34a',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
            }}>
              <CheckCircle2 size={24} />
            </div>
            <h2 style={{ fontSize: '1.15rem', color: '#15803d', marginBottom: '4px' }}>
              Connected to Internet
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#166534', marginBottom: '14px' }}>
              Plan: <strong>{sessionSuccess.planName}</strong>
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              background: '#ffffff',
              border: '1px solid #dcfce7',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '0.825rem',
              marginBottom: '12px',
            }}>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>Speed Limit</span>
                <strong style={{ color: 'var(--text-main)' }}>{sessionSuccess.speed}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>Voucher Code</span>
                <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{sessionSuccess.voucherCode}</strong>
              </div>
            </div>

            {/* Time Remaining Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: '#ffffff',
              border: '1px solid #dcfce7',
              borderRadius: '6px',
              fontSize: '0.8rem',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534' }}>
                <Clock size={14} />
                <span>Time Remaining:</span>
              </div>
              <strong style={{ color: '#15803d', fontFamily: 'var(--font-mono)' }}>
                {timeRemaining || 'Active'}
              </strong>
            </div>

            <button
              type="button"
              onClick={handleDisconnect}
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.825rem', padding: '8px' }}
            >
              Disconnect Session
            </button>
          </div>
        ) : (
          /* Voucher Input Form */
          <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {errorMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#b91c1c',
                fontSize: '0.825rem',
                textAlign: 'left',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-dim)' }} />
              <input
                type="text"
                required
                placeholder="ENTER VOUCHER CODE"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                className="form-input font-mono"
                style={{
                  paddingLeft: '36px',
                  textAlign: 'center',
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  height: '42px',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '0.9rem',
              }}
            >
              {verifying ? (
                <span>Verifying voucher...</span>
              ) : (
                <>
                  <span>Connect to Internet</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer Support Info */}
      <div style={{
        textAlign: 'center',
        fontSize: '0.78rem',
        color: 'var(--text-dim)',
        maxWidth: '420px',
        padding: '0 10px',
      }}>
        {settings.support_phone && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
            <Phone size={13} color="var(--primary)" />
            <span>Support: <strong>{settings.support_phone}</strong></span>
          </div>
        )}
        <p style={{ lineHeight: 1.4 }}>
          {settings.terms_notice || 'By connecting, you agree to fair use and terms of service.'}
        </p>
      </div>
    </div>
  );
};
