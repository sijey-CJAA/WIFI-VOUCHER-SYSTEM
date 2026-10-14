import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tjdivlwutirvbrlrtwdz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_7umaz2ezLBZj_kHSU6QdMg_ywJmQ5tc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface WifiSettings {
  id?: string;
  ssid_name: string;
  portal_title: string;
  portal_subtitle: string;
  brand_color: string;
  gateway_ip: string;
  router_type: 'mikrotik' | 'openwrt' | 'omada' | 'pfsense' | 'generic';
  dns_primary: string;
  dns_secondary: string;
  bandwidth_down_limit: number;
  bandwidth_up_limit: number;
  session_timeout_minutes: number;
  idle_timeout_minutes: number;
  currency_symbol: string;
  support_phone: string;
  terms_notice: string;
  is_active: boolean;
  updated_at?: string;
}

export interface VoucherPlan {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  data_limit_mb: number | null;
  max_devices: number;
  download_speed_mbps: number;
  upload_speed_mbps: number;
  is_active: boolean;
  created_at?: string;
}

export interface Voucher {
  id: string;
  code: string;
  plan_id?: string;
  plan?: VoucherPlan;
  status: 'available' | 'active' | 'used' | 'expired' | 'disabled';
  batch_id?: string;
  claimed_by_mac?: string;
  claimed_by_ip?: string;
  activated_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface ActiveSession {
  id: string;
  voucher_code: string;
  mac_address: string;
  ip_address: string;
  device_name: string;
  bytes_in: number;
  bytes_out: number;
  connected_at: string;
  last_seen_at: string;
  status: 'online' | 'idle' | 'disconnected';
}
