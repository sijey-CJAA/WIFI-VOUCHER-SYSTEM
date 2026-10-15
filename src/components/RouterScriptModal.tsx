import React, { useState } from 'react';
import { Terminal, Copy, Check, X, Shield, Download } from 'lucide-react';
import type { WifiSettings } from '../lib/supabase';

interface RouterScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WifiSettings;
}

export const RouterScriptModal: React.FC<RouterScriptModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'mikrotik' | 'openwrt'>('mikrotik');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Generate MikroTik RouterOS Script dynamically using user's settings
  const mikrotikScript = `# ==============================================================================
# MIKROTIK ROUTEROS HOTSPOT AUTOMATION SCRIPT
# Generated for SSID: ${settings.ssid_name}
# Gateway IP: ${settings.gateway_ip} | Supabase Controller: Wifi-VOuch
# ==============================================================================

# 1. Setup IP Pool for Hotspot Guests
/ip pool add name=hs-pool-voucher ranges=${settings.gateway_ip.replace(/\\.[0-9]+$/, '.100')}-${settings.gateway_ip.replace(/\\.[0-9]+$/, '.254')}

# 2. Configure Hotspot Server Profile
/ip hotspot profile
add dns-name="hotspot.wifi-vouch.local" \\
    hotspot-address=${settings.gateway_ip} \\
    html-directory=hotspot \\
    login-by=http-chap,http-pap,cookie \\
    name=hsprof-vouch \\
    rate-limit="${settings.bandwidth_down_limit}M/${settings.bandwidth_up_limit}M"

# 3. Add Hotspot Server
/ip hotspot
add address-pool=hs-pool-voucher \\
    disabled=no \\
    interface=wlan1 \\
    name=hs-${settings.ssid_name.toLowerCase().replace(/[^a-z0-9]/g, '')} \\
    profile=hsprof-vouch

# 4. Configure Wireless Interface (SSID)
/interface wireless
set [ find default-name=wlan1 ] ssid="${settings.ssid_name}" mode=ap-bridge disabled=no

# 5. Whitelist Supabase & Controller in Walled Garden
/ip hotspot walled-garden
add comment="Supabase API" dst-host="*.supabase.co"
add comment="Supabase Database" dst-host="*.pooler.supabase.com"

# 6. Set DNS Servers
/ip dns
set allow-remote-requests=yes servers=${settings.dns_primary},${settings.dns_secondary}

# Done! Your WiFi Hotspot is now broadcasting "${settings.ssid_name}"
`;

  const openWrtScript = `# ==============================================================================
# OPENWRT / NODOGSPLASH CONFIGURATION
# SSID: ${settings.ssid_name} | Gateway: ${settings.gateway_ip}
# ==============================================================================

uci set wireless.@wifi-iface[0].ssid='${settings.ssid_name}'
uci set wireless.@wifi-iface[0].encryption='none'
uci commit wireless
wifi reload

# Nodogsplash Captive Portal Setup
uci set nodogsplash.@nodogsplash[0].gatewayname='${settings.portal_title}'
uci set nodogsplash.@nodogsplash[0].gatewayinterface='br-lan'
uci set nodogsplash.@nodogsplash[0].maxclients='250'
uci set nodogsplash.@nodogsplash[0].clientidletimeout='${settings.idle_timeout_minutes}'
uci set nodogsplash.@nodogsplash[0].clientforcetimeout='${settings.session_timeout_minutes}'
uci commit nodogsplash
/etc/init.d/nodogsplash restart
`;

  const currentScript = activeTab === 'mikrotik' ? mikrotikScript : openWrtScript;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([currentScript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = activeTab === 'mikrotik' ? 'mikrotik_hotspot.rsc' : 'openwrt_config.sh';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
        className="plain-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}>
              <Terminal size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)' }}>
                Router Configuration Script
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Config for SSID: <code style={{ color: 'var(--primary)', fontWeight: 600 }}>{settings.ssid_name}</code>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px 8px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab switch */}
        <div style={{
          padding: '8px 20px',
          background: 'var(--bg-secondary)',
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('mikrotik')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: activeTab === 'mikrotik' ? '1px solid var(--border-color)' : '1px solid transparent',
              background: activeTab === 'mikrotik' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'mikrotik' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.825rem',
              cursor: 'pointer',
            }}
          >
            MikroTik RouterOS (.rsc)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('openwrt')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: activeTab === 'openwrt' ? '1px solid var(--border-color)' : '1px solid transparent',
              background: activeTab === 'openwrt' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'openwrt' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.825rem',
              cursor: 'pointer',
            }}
          >
            OpenWrt / Nodogsplash (.sh)
          </button>
        </div>

        {/* Code View */}
        <div style={{
          flex: 1,
          padding: '16px 20px',
          overflowY: 'auto',
          background: '#0f172a',
        }}>
          <pre style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.825rem',
            lineHeight: 1.5,
            color: '#e2e8f0',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {currentScript}
          </pre>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            <Shield size={14} color="var(--accent-emerald)" />
            <span>Includes Walled-Garden rules for Supabase endpoints</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDownload}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <Download size={14} />
              <span>Download File</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCopy}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Script'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
