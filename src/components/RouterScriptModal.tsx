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
  const [activeTab, setActiveTab] = useState<'mikrotik' | 'openwrt' | 'walledgarden'>('mikrotik');

  // Close on Escape key
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
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
      >

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#06b6d4',
            }}>
              <Terminal size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Router Configuration Script</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Syncing SSID: <code style={{ color: '#60a5fa' }}>{settings.ssid_name}</code>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px 10px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div style={{
          padding: '12px 24px',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          gap: '10px',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('mikrotik')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'mikrotik' ? 'rgba(37, 99, 235, 0.3)' : 'transparent',
              color: activeTab === 'mikrotik' ? '#60a5fa' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            MikroTik RouterOS (.rsc)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('openwrt')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'openwrt' ? 'rgba(37, 99, 235, 0.3)' : 'transparent',
              color: activeTab === 'openwrt' ? '#60a5fa' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            OpenWrt / Nodogsplash (.sh)
          </button>
        </div>

        {/* Code View */}
        <div style={{
          flex: 1,
          padding: '20px 24px',
          overflowY: 'auto',
          background: '#070a10',
        }}>
          <pre style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            color: '#a5f3fc',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {currentScript}
          </pre>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 22, 35, 0.9)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <Shield size={14} color="#10b981" />
            <span>Includes Walled-Garden rules for Supabase endpoints</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDownload}
            >
              <Download size={16} />
              <span>Download File</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCopy}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Script'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
