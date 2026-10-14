import React from 'react';
import { Wifi, Sliders, Ticket, Terminal, Smartphone, LogOut, Database, UserCheck } from 'lucide-react';

export type ActiveTab = 'wifi-setup' | 'vouchers' | 'router-script' | 'portal-preview';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: any;
  onLogout: () => void;
  ssid: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  ssid,
}) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(10, 13, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0 24px',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px',
        gap: '20px',
      }}>
        {/* Brand & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: '#fff',
            cursor: 'pointer',
          }} onClick={() => setActiveTab('wifi-setup')}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
            }}>
              <Wifi size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                WiFi-Vouch
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Hotspot Controller
              </div>
            </div>
          </div>

          {/* Active SSID Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            padding: '5px 12px',
            borderRadius: '999px',
            fontSize: '0.8rem',
          }}>
            <span style={{ color: 'var(--text-muted)' }}>SSID:</span>
            <span style={{ fontWeight: 600, color: '#60a5fa' }}>{ssid || 'VOUCHER-WIFI-5G'}</span>
          </div>

          {/* Supabase Status Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            color: '#34d399',
          }}>
            <Database size={13} />
            <span>Supabase: Wifi-VOuch</span>
            <span className="pulse-dot" style={{ backgroundColor: '#10b981', width: '6px', height: '6px' }} />
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('wifi-setup')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'wifi-setup' ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
              color: activeTab === 'wifi-setup' ? '#60a5fa' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              borderBottom: activeTab === 'wifi-setup' ? '2px solid #3b82f6' : '2px solid transparent',
            }}
          >
            <Sliders size={17} />
            <span>WiFi Setup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vouchers')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'vouchers' ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
              color: activeTab === 'vouchers' ? '#60a5fa' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              borderBottom: activeTab === 'vouchers' ? '2px solid #3b82f6' : '2px solid transparent',
            }}
          >
            <Ticket size={17} />
            <span>Voucher Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('router-script')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'router-script' ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
              color: activeTab === 'router-script' ? '#60a5fa' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              borderBottom: activeTab === 'router-script' ? '2px solid #3b82f6' : '2px solid transparent',
            }}
          >
            <Terminal size={17} />
            <span>Router Script</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('portal-preview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'portal-preview' ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
              color: activeTab === 'portal-preview' ? '#60a5fa' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              borderBottom: activeTab === 'portal-preview' ? '2px solid #3b82f6' : '2px solid transparent',
            }}
          >
            <Smartphone size={17} />
            <span>Portal Preview</span>
          </button>
        </nav>

        {/* User Session & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '6px 12px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
          }}>
            <UserCheck size={16} color="#34d399" />
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f3f4f6' }}>
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Hotspot Administrator'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                {user?.email || 'admin@wifi-voucher.local'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Sign Out"
            className="btn btn-secondary"
            style={{ padding: '8px 12px' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
