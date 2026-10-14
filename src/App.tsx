import { useState, useEffect } from 'react';
import { supabase, type WifiSettings } from './lib/supabase';
import { AuthCard } from './components/AuthCard';
import { Navbar, type ActiveTab } from './components/Navbar';

import { WifiSetup } from './components/WifiSetup';
import { VoucherManager } from './components/VoucherManager';
import { RouterScriptModal } from './components/RouterScriptModal';
import { PortalPreviewModal } from './components/PortalPreviewModal';

import { CustomerPortal } from './components/CustomerPortal';

function App() {
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isCustomerView, setIsCustomerView] = useState<boolean>(() => {
    return window.location.search.includes('portal=true') || window.location.hash.includes('portal');
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('wifi-setup');
  const [currentSsid, setCurrentSsid] = useState<string>('VOUCHER-WIFI-5G');
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [isPortalModalOpen, setIsPortalModalOpen] = useState<boolean>(false);
  const [wifiSettings, setWifiSettings] = useState<WifiSettings>({
    ssid_name: 'VOUCHER-WIFI-5G',
    portal_title: 'High-Speed Guest WiFi',
    portal_subtitle: 'Enter your voucher code to connect instantly',
    brand_color: '#3b82f6',
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

  // Check Supabase session on startup
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
    });

    // Also fetch initial wifi settings
    supabase.from('wifi_settings').select('*').limit(1).maybeSingle().then(({ data }) => {
      if (data) {
        setWifiSettings(data);
        setCurrentSsid(data.ssid_name);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setIsDemoMode(false);
  };

  const handleDemoLogin = () => {
    setIsDemoMode(true);
    setSessionUser({
      id: 'demo-admin-id',
      email: 'admin@wifi-voucher.local',
      user_metadata: {
        full_name: 'Hotspot Superadmin',
        organization: 'Wifi Voucher System',
      },
    });
  };

  const handleSsidUpdate = (newSsid: string) => {
    setCurrentSsid(newSsid);
    setWifiSettings((prev) => ({ ...prev, ssid_name: newSsid }));
  };

  // If customer view is active, show the Captive Portal page
  if (isCustomerView) {
    return (
      <CustomerPortal
        settings={wifiSettings}
        onSwitchToAdmin={() => setIsCustomerView(false)}
      />
    );
  }

  // If not logged in and not in demo mode, show Auth Card
  if (!sessionUser && !isDemoMode) {
    return (
      <AuthCard
        onAuthSuccess={(user) => setSessionUser(user)}
        onDemoLogin={handleDemoLogin}
        onSwitchToCustomer={() => setIsCustomerView(true)}
      />
    );
  }


  return (
    <div className="app-container">
      {/* Top Sticky Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'router-script') {
            setIsScriptModalOpen(true);
          } else if (tab === 'portal-preview') {
            setIsPortalModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        user={sessionUser}
        onLogout={handleLogout}
        ssid={currentSsid}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: '60px' }}>
        {activeTab === 'wifi-setup' && (
          <WifiSetup
            onSsidUpdated={handleSsidUpdate}
            onOpenScriptModal={() => setIsScriptModalOpen(true)}
            onOpenPortalPreview={() => setIsPortalModalOpen(true)}
          />
        )}

        {activeTab === 'vouchers' && (
          <VoucherManager currencySymbol={wifiSettings.currency_symbol || '₱'} />
        )}
      </main>

      {/* Modals */}
      <RouterScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        settings={wifiSettings}
      />

      <PortalPreviewModal
        isOpen={isPortalModalOpen}
        onClose={() => setIsPortalModalOpen(false)}
        settings={wifiSettings}
      />
    </div>
  );
}

export default App;
