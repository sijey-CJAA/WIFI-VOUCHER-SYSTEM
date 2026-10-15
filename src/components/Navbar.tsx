import React from 'react';
import { Wifi, Sliders, Ticket, Terminal, Smartphone, LogOut, Database, UserCheck, Sun, Moon } from 'lucide-react';

export type ActiveTab = 'wifi-setup' | 'vouchers' | 'router-script' | 'portal-preview';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: any;
  onLogout: () => void;
  ssid: string;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  ssid,
  theme = 'light',
  onToggleTheme,
}) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-card)',
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
        height: '64px',
        gap: '20px',
      }}>
        {/* Brand & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab('wifi-setup')}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}>
              <Wifi size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', lineHeight: 1.1 }}>
                WiFi-Vouch
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.02em' }}>
                Hotspot Controller
              </div>
            </div>
          </div>

          {/* Active SSID Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.78rem',
          }}>
            <span style={{ color: 'var(--text-muted)' }}>SSID:</span>
            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{ssid || 'VOUCHER-WIFI-5G'}</span>
          </div>

          {/* Supabase Status Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}>
            <Database size={13} color="var(--accent-emerald)" />
            <span>Supabase: Wifi-VOuch</span>
            <span className="pulse-dot" style={{ backgroundColor: '#16a34a' }} />
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('wifi-setup')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: activeTab === 'wifi-setup' ? '1px solid var(--border-color)' : '1px solid transparent',
              background: activeTab === 'wifi-setup' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'wifi-setup' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <Sliders size={15} />
            <span>WiFi Setup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vouchers')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: activeTab === 'vouchers' ? '1px solid var(--border-color)' : '1px solid transparent',
              background: activeTab === 'vouchers' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'vouchers' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <Ticket size={15} />
            <span>Voucher Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('router-script')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: activeTab === 'router-script' ? '1px solid var(--border-color)' : '1px solid transparent',
              background: activeTab === 'router-script' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'router-script' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <Terminal size={15} />
            <span>Router Script</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('portal-preview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: activeTab === 'portal-preview' ? '1px solid var(--border-color)' : '1px solid transparent',
              background: activeTab === 'portal-preview' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'portal-preview' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <Smartphone size={15} />
            <span>Portal Preview</span>
          </button>
        </nav>

        {/* User Session, Theme Toggle & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-secondary)',
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
          }}>
            <UserCheck size={15} color="var(--accent-emerald)" />
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Administrator'}
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
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
