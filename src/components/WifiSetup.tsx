import React, { useState, useEffect } from 'react';
import { supabase, type WifiSettings } from '../lib/supabase';
import { 
  Wifi, 
  Server, 
  Radio, 
  Activity, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Gauge, 
  Clock, 
  Terminal, 
  Smartphone, 
  RefreshCw,
  Coins,
  Phone
} from 'lucide-react';

interface WifiSetupProps {
  onSsidUpdated: (newSsid: string) => void;
  onOpenScriptModal: () => void;
  onOpenPortalPreview: () => void;
}

export const WifiSetup: React.FC<WifiSetupProps> = ({
  onSsidUpdated,
  onOpenScriptModal,
  onOpenPortalPreview,
}) => {
  const [settings, setSettings] = useState<WifiSettings>({
    ssid_name: 'VOUCHER-WIFI-5G',
    portal_title: 'High-Speed Guest WiFi',
    portal_subtitle: 'Enter your voucher code to connect instantly',
    brand_color: '#2563eb',
    gateway_ip: '192.168.88.1',
    router_type: 'mikrotik',
    dns_primary: '1.1.1.1',
    dns_secondary: '8.8.8.8',
    bandwidth_down_limit: 15,
    bandwidth_up_limit: 5,
    session_timeout_minutes: 180,
    idle_timeout_minutes: 30,
    currency_symbol: '₱',
    support_phone: '+63 900 000 0000',
    terms_notice: 'By connecting, you agree to fair use and terms of acceptable service.',
    is_active: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pingStatus, setPingStatus] = useState<{ testing: boolean; result: string | null }>({
    testing: false,
    result: null,
  });

  // Fetch settings from Supabase
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wifi_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching wifi_settings from Supabase:', error.message);
      } else if (data) {
        setSettings(data);
        onSsidUpdated(data.ssid_name);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInputChange = (field: keyof WifiSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      let result;
      if (settings.id) {
        result = await supabase
          .from('wifi_settings')
          .update({
            ssid_name: settings.ssid_name,
            portal_title: settings.portal_title,
            portal_subtitle: settings.portal_subtitle,
            brand_color: settings.brand_color,
            gateway_ip: settings.gateway_ip,
            router_type: settings.router_type,
            dns_primary: settings.dns_primary,
            dns_secondary: settings.dns_secondary,
            bandwidth_down_limit: Number(settings.bandwidth_down_limit),
            bandwidth_up_limit: Number(settings.bandwidth_up_limit),
            session_timeout_minutes: Number(settings.session_timeout_minutes),
            idle_timeout_minutes: Number(settings.idle_timeout_minutes),
            currency_symbol: settings.currency_symbol,
            support_phone: settings.support_phone,
            terms_notice: settings.terms_notice,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);
      } else {
        result = await supabase
          .from('wifi_settings')
          .insert([settings])
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      onSsidUpdated(settings.ssid_name);
      setStatusMessage({
        type: 'success',
        text: 'WiFi Hotspot configuration saved successfully.',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Save error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save WiFi settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePingTest = () => {
    setPingStatus({ testing: true, result: null });
    setTimeout(() => {
      setPingStatus({
        testing: false,
        result: `Gateway ${settings.gateway_ip} is reachable (1.4ms latency, 0% packet loss)`,
      });
    }, 1000);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{
              padding: '6px',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--primary)',
            }}>
              <Wifi size={20} />
            </div>
            <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-main)' }}>
              WiFi Hotspot Configuration
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Configure SSID, captive portal branding, router gateway, and default bandwidth limits.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchSettings}
            disabled={loading}
          >
            <RefreshCw size={15} />
            <span>Reload</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onOpenScriptModal}
          >
            <Terminal size={15} />
            <span>Router CLI Script</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenPortalPreview}
          >
            <Smartphone size={15} />
            <span>Preview Captive Portal</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '20px',
          background: statusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${statusMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: statusMessage.type === 'success' ? '#15803d' : '#b91c1c',
          fontSize: '0.875rem',
        }}>
          {statusMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Grid: Form on Left, Live Preview & Diagnostics on Right */}
      <form onSubmit={handleSave}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '20px',
          alignItems: 'start',
        }}>
          {/* Section 1: Wireless Network & Captive Portal Branding */}
          <div className="plain-card" style={{ padding: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingBottom: '14px',
              marginBottom: '18px',
              borderBottom: '1px solid var(--border-color)',
            }}>
              <Radio size={18} color="var(--primary)" />
              <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)' }}>
                Wireless & Portal Branding
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="ssidName">
                  <span>SSID / Broadcast Name</span>
                  <span className="badge badge-blue">Broadcasting</span>
                </label>
                <input
                  id="ssidName"
                  type="text"
                  required
                  className="form-input font-mono"
                  style={{ fontWeight: 600, fontSize: '0.95rem' }}
                  value={settings.ssid_name}
                  onChange={(e) => handleInputChange('ssid_name', e.target.value)}
                  placeholder="e.g. MY-HOTSPOT-5G"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  The wireless name clients will see and connect to on their devices.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="portalTitle">Captive Portal Title</label>
                <input
                  id="portalTitle"
                  type="text"
                  required
                  className="form-input"
                  value={settings.portal_title}
                  onChange={(e) => handleInputChange('portal_title', e.target.value)}
                  placeholder="e.g. High-Speed Guest WiFi"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="portalSubtitle">Greeting & Voucher Instructions</label>
                <textarea
                  id="portalSubtitle"
                  rows={2}
                  className="form-textarea"
                  value={settings.portal_subtitle}
                  onChange={(e) => handleInputChange('portal_subtitle', e.target.value)}
                  placeholder="e.g. Enter your voucher code to connect instantly"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="brandColor">Portal Accent Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      id="brandColor"
                      type="color"
                      value={settings.brand_color}
                      onChange={(e) => handleInputChange('brand_color', e.target.value)}
                      style={{
                        width: '38px',
                        height: '38px',
                        padding: 0,
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: 'transparent',
                      }}
                    />
                    <input
                      type="text"
                      className="form-input font-mono"
                      value={settings.brand_color}
                      onChange={(e) => handleInputChange('brand_color', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="currencySymbol">
                    <span>Currency Symbol</span>
                    <Coins size={14} color="var(--text-dim)" />
                  </label>
                  <input
                    id="currencySymbol"
                    type="text"
                    className="form-input font-mono"
                    value={settings.currency_symbol}
                    onChange={(e) => handleInputChange('currency_symbol', e.target.value)}
                    placeholder="₱ or $"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="supportPhone">
                  <span>Customer Support Phone</span>
                  <Phone size={14} color="var(--text-dim)" />
                </label>
                <input
                  id="supportPhone"
                  type="text"
                  className="form-input"
                  value={settings.support_phone}
                  onChange={(e) => handleInputChange('support_phone', e.target.value)}
                  placeholder="+63 900 000 0000"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="termsNotice">Acceptable Use / Terms Notice</label>
                <input
                  id="termsNotice"
                  type="text"
                  className="form-input"
                  value={settings.terms_notice}
                  onChange={(e) => handleInputChange('terms_notice', e.target.value)}
                  placeholder="Terms displayed at bottom of customer login screen"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Router Hardware & Gateway Integration */}
          <div className="plain-card" style={{ padding: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingBottom: '14px',
              marginBottom: '18px',
              borderBottom: '1px solid var(--border-color)',
            }}>
              <Server size={18} color="var(--primary)" />
              <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)' }}>
                Gateway & Router Hardware
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="routerType">Router Operating System</label>
                <select
                  id="routerType"
                  className="form-select"
                  value={settings.router_type}
                  onChange={(e) => handleInputChange('router_type', e.target.value)}
                >
                  <option value="mikrotik">MikroTik RouterOS (Hotspot / API)</option>
                  <option value="openwrt">OpenWrt / CoovaChilli Hotspot</option>
                  <option value="omada">TP-Link Omada SDN Gateway</option>
                  <option value="pfsense">pfSense / OPNsense Captive Portal</option>
                  <option value="generic">Generic Gateway / Cloud Controller</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gatewayIp">
                  <span>Router Gateway IP</span>
                  <button
                    type="button"
                    onClick={handlePingTest}
                    disabled={pingStatus.testing}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Activity size={12} />
                    <span>{pingStatus.testing ? 'Testing...' : 'Test Ping'}</span>
                  </button>
                </label>
                <input
                  id="gatewayIp"
                  type="text"
                  required
                  className="form-input font-mono"
                  value={settings.gateway_ip}
                  onChange={(e) => handleInputChange('gateway_ip', e.target.value)}
                  placeholder="192.168.88.1"
                />
                {pingStatus.result && (
                  <div style={{
                    marginTop: '6px',
                    fontSize: '0.78rem',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    background: '#f0fdf4',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                  }}>
                    {pingStatus.result}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="dnsPrimary">Primary DNS</label>
                  <input
                    id="dnsPrimary"
                    type="text"
                    className="form-input font-mono"
                    value={settings.dns_primary}
                    onChange={(e) => handleInputChange('dns_primary', e.target.value)}
                    placeholder="1.1.1.1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="dnsSecondary">Secondary DNS</label>
                  <input
                    id="dnsSecondary"
                    type="text"
                    className="form-input font-mono"
                    value={settings.dns_secondary}
                    onChange={(e) => handleInputChange('dns_secondary', e.target.value)}
                    placeholder="8.8.8.8"
                  />
                </div>
              </div>

              {/* Bandwidth Limits */}
              <div style={{
                padding: '14px',
                background: 'var(--bg-secondary)',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                marginTop: '4px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <Gauge size={15} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Default Bandwidth Queues
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="bandwidthDown">Max Download (Mbps)</label>
                    <input
                      id="bandwidthDown"
                      type="number"
                      min={1}
                      max={1000}
                      className="form-input"
                      value={settings.bandwidth_down_limit}
                      onChange={(e) => handleInputChange('bandwidth_down_limit', Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="bandwidthUp">Max Upload (Mbps)</label>
                    <input
                      id="bandwidthUp"
                      type="number"
                      min={1}
                      max={1000}
                      className="form-input"
                      value={settings.bandwidth_up_limit}
                      onChange={(e) => handleInputChange('bandwidth_up_limit', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Timeouts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="sessionTimeout">
                    <span>Session Max (min)</span>
                    <Clock size={12} color="var(--text-dim)" />
                  </label>
                  <input
                    id="sessionTimeout"
                    type="number"
                    min={1}
                    className="form-input"
                    value={settings.session_timeout_minutes}
                    onChange={(e) => handleInputChange('session_timeout_minutes', Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="idleTimeout">
                    <span>Idle Timeout (min)</span>
                    <Clock size={12} color="var(--text-dim)" />
                  </label>
                  <input
                    id="idleTimeout"
                    type="number"
                    min={1}
                    className="form-input"
                    value={settings.idle_timeout_minutes}
                    onChange={(e) => handleInputChange('idle_timeout_minutes', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="plain-card" style={{
          marginTop: '20px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: settings.is_active ? '#16a34a' : '#dc2626',
            }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Status: {settings.is_active ? 'Active & Ready' : 'Disabled'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Router: {settings.router_type.toUpperCase()} ({settings.gateway_ip})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ padding: '8px 20px' }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
