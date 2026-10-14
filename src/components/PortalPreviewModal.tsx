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

  // Close on Escape key
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
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(10px)',
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
          marginBottom: '10px',
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
            }}
          >
            <X size={16} />
            <span>Close Preview</span>
          </button>
        </div>


        {/* Realistic Mobile Device Frame */}
        <div style={{
          width: '380px',
          height: '740px',
          borderRadius: '44px',
          background: '#090d16',
          border: '10px solid #1e293b',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 0 2px rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Mobile Speaker / Camera Notch */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120px',
            height: '18px',
            borderRadius: '999px',
            background: '#1e293b',
            zIndex: 10,
          }} />

          {/* Mobile Status Bar */}
          <div style={{
            padding: '12px 24px 8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            marginTop: '16px',
          }}>
            <span>9:41</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wifi size={14} color={settings.brand_color || '#3b82f6'} />
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>

          {/* Captive Portal Screen Content */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 20px',
            overflowY: 'auto',
            textAlign: 'center',
          }}>
            {/* Top Branding */}
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginBottom: '16px',
              }}>
                <Wifi size={12} color={settings.brand_color || '#3b82f6'} />
                <span>Connected to <strong>{settings.ssid_name}</strong></span>
              </div>

              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: `linear-gradient(135deg, ${settings.brand_color || '#3b82f6'} 0%, #06b6d4 100%)`,
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 24px ${settings.brand_color}55`,
              }}>
                <Wifi size={32} color="#ffffff" />
              </div>

              <h2 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '6px' }}>
                {settings.portal_title || 'High-Speed Guest WiFi'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                {settings.portal_subtitle || 'Enter your voucher code to connect instantly'}
              </p>

              {sessionSuccess ? (
                /* Connected State */
                <div style={{
                  padding: '20px',
                  borderRadius: '16px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#10b981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}>
                    <CheckCircle2 size={26} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', color: '#34d399', marginBottom: '6px' }}>
                    Internet Connected!
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Plan: <strong>{sessionSuccess.planName}</strong>
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    marginBottom: '16px',
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block' }}>Speed</span>
                      <strong>{sessionSuccess.speed}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block' }}>Duration</span>
                      <strong>{sessionSuccess.durationMinutes} Mins</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}
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
                      padding: '10px',
                      background: 'rgba(244, 63, 94, 0.15)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      borderRadius: '8px',
                      color: '#fb7185',
                      fontSize: '0.78rem',
                      textAlign: 'left',
                    }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-dim)' }} />
                    <input
                      type="text"
                      required
                      placeholder="ENTER VOUCHER CODE"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      className="form-input font-mono"
                      style={{
                        paddingLeft: '38px',
                        textAlign: 'center',
                        letterSpacing: '0.08em',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        textTransform: 'uppercase',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verifying}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: `linear-gradient(135deg, ${settings.brand_color || '#2563eb'} 0%, #1d4ed8 100%)`,
                    }}
                  >
                    {verifying ? (
                      <span>Verifying with Supabase...</span>
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

            {/* Bottom Support & Terms */}
            <div style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '6px' }}>
                <Phone size={12} color="#34d399" />
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
            bottom: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '130px',
            height: '4px',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.25)',
          }} />
        </div>
      </div>
    </div>
  );
};
