import React, { useState } from 'react';
import { Wifi, ArrowRight, CheckCircle2, AlertCircle, Phone, Lock, LogIn } from 'lucide-react';
import { supabase, type WifiSettings } from '../lib/supabase';

interface CustomerPortalProps {
  settings: WifiSettings;
  onSwitchToAdmin: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  settings,
  onSwitchToAdmin,
}) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionSuccess, setSessionSuccess] = useState<any | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;

    setVerifying(true);
    setErrorMsg(null);

    try {
      const { data: voucher, error } = await supabase
        .from('vouchers')
        .select('*, plan:voucher_plans(*)')
        .eq('code', voucherCode.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (!voucher) {
        setErrorMsg('Invalid voucher code. Please check your voucher ticket and try again.');
        setVerifying(false);
        return;
      }

      if (voucher.status === 'used' || voucher.status === 'expired') {
        setErrorMsg(`This voucher has already been ${voucher.status}. Please use a valid voucher.`);
        setVerifying(false);
        return;
      }

      if (voucher.status === 'available') {
        await supabase
          .from('vouchers')
          .update({
            status: 'active',
            activated_at: new Date().toISOString(),
          })
          .eq('id', voucher.id);
      }

      setSessionSuccess({
        voucherCode: voucher.code,
        planName: voucher.plan?.name || 'Standard Pass',
        durationMinutes: voucher.plan?.duration_minutes || 60,
        speed: `${voucher.plan?.download_speed_mbps || 15} Mbps`,
      });
    } catch (err: any) {
      console.error('Portal verify error:', err);
      setErrorMsg(err.message || 'Connection error with authentication server.');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisconnect = () => {
    setSessionSuccess(null);
    setVoucherCode('');
    setErrorMsg(null);
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
          <span>Connected to <strong>{settings.ssid_name || 'GUEST WIFI'}</strong></span>
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
          /* Connected Success View */
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
            <h2 style={{ fontSize: '1.15rem', color: '#15803d', marginBottom: '6px' }}>
              Connected to Internet
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#166534', marginBottom: '14px' }}>
              Active Plan: <strong>{sessionSuccess.planName}</strong>
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
              marginBottom: '16px',
            }}>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>Speed</span>
                <strong style={{ color: 'var(--text-main)' }}>{sessionSuccess.speed}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>Duration</span>
                <strong style={{ color: 'var(--text-main)' }}>{sessionSuccess.durationMinutes} Mins</strong>
              </div>
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
