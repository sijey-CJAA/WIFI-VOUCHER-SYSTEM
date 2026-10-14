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
      // Query voucher directly from Supabase
      const { data: voucher, error } = await supabase
        .from('vouchers')
        .select('*, plan:voucher_plans(*)')
        .eq('code', voucherCode.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (!voucher) {
        setErrorMsg('Invalid voucher code. Please check your ticket and try again.');
        setVerifying(false);
        return;
      }

      if (voucher.status === 'used' || voucher.status === 'expired') {
        setErrorMsg(`This voucher has already been ${voucher.status}. Please obtain a new code.`);
        setVerifying(false);
        return;
      }

      // Mark voucher active if available
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
      padding: '32px 20px',
      background: 'radial-gradient(circle at 50% 10%, rgba(37, 99, 235, 0.15) 0%, transparent 60%), #0a0d14',
    }}>
      {/* Top Switcher to Admin */}
      <div style={{ width: '100%', maxWidth: '440px', display: 'flex', justifyContent: 'flex-end' }}>
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
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '36px 28px',
        textAlign: 'center',
        margin: '20px 0',
      }}>
        {/* Network Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '999px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          fontSize: '0.82rem',
          color: '#e2e8f0',
          marginBottom: '20px',
        }}>
          <Wifi size={14} color={settings.brand_color || '#3b82f6'} />
          <span>Connected to <strong>{settings.ssid_name || 'TEST WIFI'}</strong></span>
        </div>

        {/* Brand Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          background: `linear-gradient(135deg, ${settings.brand_color || '#3b82f6'} 0%, #06b6d4 100%)`,
          margin: '0 auto 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 10px 28px ${settings.brand_color}55`,
        }}>
          <Wifi size={36} color="#ffffff" />
        </div>

        <h1 style={{ fontSize: '1.6rem', color: '#ffffff', marginBottom: '8px', lineHeight: 1.2 }}>
          {settings.portal_title || 'High-Speed Guest WiFi'}
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.4 }}>
          {settings.portal_subtitle || 'Enter your voucher code to connect instantly'}
        </p>

        {sessionSuccess ? (
          /* Connected Success View */
          <div style={{
            padding: '24px 20px',
            borderRadius: '16px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#10b981',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '1.3rem', color: '#34d399', marginBottom: '8px' }}>
              Internet Connected!
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Plan: <strong>{sessionSuccess.planName}</strong>
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              background: 'rgba(0,0,0,0.3)',
              padding: '14px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              marginBottom: '20px',
            }}>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.78rem' }}>Speed</span>
                <strong style={{ color: '#fff' }}>{sessionSuccess.speed}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.78rem' }}>Duration</span>
                <strong style={{ color: '#fff' }}>{sessionSuccess.durationMinutes} Mins</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDisconnect}
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.85rem', padding: '10px' }}
            >
              Disconnect Session
            </button>
          </div>
        ) : (
          /* Voucher Input Form */
          <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {errorMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '10px',
                color: '#fb7185',
                fontSize: '0.85rem',
                textAlign: 'left',
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-dim)' }} />
              <input
                type="text"
                required
                placeholder="ENTER VOUCHER CODE"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                className="form-input font-mono"
                style={{
                  paddingLeft: '42px',
                  textAlign: 'center',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  textTransform: 'uppercase',
                  height: '48px',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                background: `linear-gradient(135deg, ${settings.brand_color || '#2563eb'} 0%, #1d4ed8 100%)`,
              }}
            >
              {verifying ? (
                <span>Verifying with Database...</span>
              ) : (
                <>
                  <span>Connect to Internet</span>
                  <ArrowRight size={18} />
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
        maxWidth: '440px',
        padding: '0 10px',
      }}>
        {settings.support_phone && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
            <Phone size={13} color="#34d399" />
            <span>Customer Assistance: <strong>{settings.support_phone}</strong></span>
          </div>
        )}
        <p style={{ lineHeight: 1.4 }}>
          {settings.terms_notice || 'By connecting, you agree to fair use and terms of acceptable service.'}
        </p>
      </div>
    </div>
  );
};
