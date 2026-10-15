import React, { useState } from 'react';
import { Wifi, X, ArrowRight, CheckCircle2, AlertCircle, Phone, Lock } from 'lucide-react';
import { supabase, type WifiSettings } from '../lib/supabase';

interface PortalPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WifiSettings;
}

export const PortalPreviewModal: React.FC<PortalPreviewModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionSuccess, setSessionSuccess] = useState<any | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

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
        setErrorMsg('Invalid voucher code. Please check your ticket and try again.');
        setVerifying(false);
        return;
      }

      if (voucher.status === 'used' || voucher.status === 'expired') {
        setErrorMsg(`This voucher has already been ${voucher.status}.`);
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
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Close Button above phone */}
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '8px',
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
            }}
          >
            <X size={15} />
            <span>Close Preview</span>
          </button>
        </div>

        {/* Clean Mobile Device Frame */}
        <div style={{
          width: '360px',
          height: '700px',
          borderRadius: '32px',
          background: 'var(--bg-primary)',
          border: '8px solid var(--border-color)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Mobile Speaker Notch */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90px',
            height: '14px',
            borderRadius: '999px',
            background: 'var(--border-color)',
            zIndex: 10,
          }} />

          {/* Mobile Status Bar */}
          <div style={{
            padding: '10px 20px 6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            marginTop: '12px',
          }}>
            <span>9:41</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wifi size={13} color="var(--primary)" />
              <span>WiFi</span>
              <span>100%</span>
            </div>
          </div>

          {/* Captive Portal Screen Content */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px 16px',
            overflowY: 'auto',
            textAlign: 'center',
          }}>
            {/* Top Branding */}
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '6px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginBottom: '16px',
              }}>
                <Wifi size={12} color="var(--primary)" />
                <span>Connected to <strong>{settings.ssid_name}</strong></span>
              </div>

              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: settings.brand_color || 'var(--primary)',
                margin: '0 auto 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}>
                <Wifi size={24} />
              </div>

              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                {settings.portal_title || 'Guest WiFi Access'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                {settings.portal_subtitle || 'Enter your voucher code to connect instantly'}
              </p>

              {sessionSuccess ? (
                /* Connected State */
                <div style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: '#16a34a',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                  }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', color: '#15803d', marginBottom: '4px' }}>
                    Connected to Internet
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#166534', marginBottom: '12px' }}>
                    Plan: <strong>{sessionSuccess.planName}</strong>
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                    background: '#ffffff',
                    border: '1px solid #dcfce7',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    marginBottom: '12px',
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block' }}>Speed</span>
                      <strong>{sessionSuccess.speed}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block' }}>Duration</span>
                      <strong>{sessionSuccess.durationMinutes}m</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '0.75rem', padding: '6px' }}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                /* Voucher Input Form */
                <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {errorMsg && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 10px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      color: '#b91c1c',
                      fontSize: '0.75rem',
                      textAlign: 'left',
                    }}>
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-dim)' }} />
                    <input
                      type="text"
                      required
                      placeholder="ENTER VOUCHER CODE"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      className="form-input font-mono"
                      style={{
                        paddingLeft: '34px',
                        textAlign: 'center',
                        letterSpacing: '0.05em',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        height: '38px',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verifying}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '0.85rem',
                    }}
                  >
                    {verifying ? (
                      <span>Verifying...</span>
                    ) : (
                      <>
                        <span>Connect to Internet</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Bottom Support & Terms */}
            <div style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-color)',
              fontSize: '0.7rem',
              color: 'var(--text-dim)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                <Phone size={11} color="var(--primary)" />
                <span>Support: <strong>{settings.support_phone}</strong></span>
              </div>
              <p style={{ lineHeight: 1.3 }}>
                {settings.terms_notice}
              </p>
            </div>
          </div>

          {/* Mobile Home Bar indicator */}
          <div style={{
            position: 'absolute',
            bottom: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100px',
            height: '3px',
            borderRadius: '999px',
            background: 'var(--border-color)',
          }} />
        </div>
      </div>
    </div>
  );
};
