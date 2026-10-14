-- ==============================================================================
-- WIFI VOUCHER SYSTEM - SUPABASE DATABASE SCHEMA
-- Project: Wifi-VOuch (ref: tjdivlwutirvbrlrtwdz)
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    organization TEXT DEFAULT 'Wifi Voucher System',
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'staff', 'operator')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Automatic Profile Creation Trigger on Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, organization, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'organization', 'Wifi Voucher System'),
        'admin'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. WIFI & HOTSPOT SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.wifi_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ssid_name TEXT NOT NULL DEFAULT 'VOUCHER-WIFI-5G',
    portal_title TEXT NOT NULL DEFAULT 'High-Speed Guest WiFi',
    portal_subtitle TEXT DEFAULT 'Enter your purchased voucher code to access the internet',
    brand_color TEXT DEFAULT '#3b82f6',
    gateway_ip TEXT DEFAULT '192.168.88.1',
    router_type TEXT DEFAULT 'mikrotik' CHECK (router_type IN ('mikrotik', 'openwrt', 'omada', 'pfsense', 'generic')),
    dns_primary TEXT DEFAULT '1.1.1.1',
    dns_secondary TEXT DEFAULT '8.8.8.8',
    bandwidth_down_limit INT DEFAULT 15, -- Mbps
    bandwidth_up_limit INT DEFAULT 5,    -- Mbps
    session_timeout_minutes INT DEFAULT 180,
    idle_timeout_minutes INT DEFAULT 30,
    currency_symbol TEXT DEFAULT '₱',
    support_phone TEXT DEFAULT '+63 900 000 0000',
    terms_notice TEXT DEFAULT 'By connecting, you agree to fair use and terms of acceptable service.',
    is_active BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default settings row if table is empty
INSERT INTO public.wifi_settings (
    ssid_name,
    portal_title,
    portal_subtitle,
    brand_color,
    gateway_ip,
    router_type,
    bandwidth_down_limit,
    bandwidth_up_limit,
    session_timeout_minutes,
    currency_symbol
)
SELECT 
    'VOUCHER-WIFI-5G',
    'High-Speed Guest WiFi',
    'Enter your voucher code to connect instantly',
    '#3b82f6',
    '192.168.88.1',
    'mikrotik',
    15,
    5,
    180,
    '₱'
WHERE NOT EXISTS (SELECT 1 FROM public.wifi_settings);


-- 3. VOUCHER PLANS / RATES TABLE
CREATE TABLE IF NOT EXISTS public.voucher_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    duration_minutes INT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
    data_limit_mb INT DEFAULT NULL, -- NULL indicates unlimited data
    max_devices INT DEFAULT 1,
    download_speed_mbps INT DEFAULT 15,
    upload_speed_mbps INT DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Default voucher plans seed
INSERT INTO public.voucher_plans (name, duration_minutes, price, data_limit_mb, max_devices, download_speed_mbps, upload_speed_mbps)
SELECT '1 Hour Access', 60, 5.00, NULL, 1, 10, 5
WHERE NOT EXISTS (SELECT 1 FROM public.voucher_plans WHERE name = '1 Hour Access');

INSERT INTO public.voucher_plans (name, duration_minutes, price, data_limit_mb, max_devices, download_speed_mbps, upload_speed_mbps)
SELECT '3 Hours Access', 180, 15.00, NULL, 1, 15, 5
WHERE NOT EXISTS (SELECT 1 FROM public.voucher_plans WHERE name = '3 Hours Access');

INSERT INTO public.voucher_plans (name, duration_minutes, price, data_limit_mb, max_devices, download_speed_mbps, upload_speed_mbps)
SELECT '1 Day VIP Pass', 1440, 30.00, NULL, 2, 25, 10
WHERE NOT EXISTS (SELECT 1 FROM public.voucher_plans WHERE name = '1 Day VIP Pass');


-- 4. VOUCHERS TABLE
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    plan_id UUID REFERENCES public.voucher_plans(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'active', 'used', 'expired', 'disabled')),
    batch_id TEXT,
    claimed_by_mac TEXT,
    claimed_by_ip TEXT,
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON public.vouchers(status);


-- 5. ACTIVE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.active_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID REFERENCES public.vouchers(id) ON DELETE CASCADE,
    voucher_code TEXT NOT NULL,
    mac_address TEXT,
    ip_address TEXT,
    device_name TEXT,
    bytes_in BIGINT DEFAULT 0,
    bytes_out BIGINT DEFAULT 0,
    connected_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_seen_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'online' CHECK (status IN ('online', 'idle', 'disconnected'))
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_mac ON public.active_sessions(mac_address);


-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wifi_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles: Authenticated users can read all profiles and update their own
CREATE POLICY "Allow authenticated read profiles" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Wifi Settings:
-- Public / captive portal can read active WiFi configuration
CREATE POLICY "Public read wifi settings" ON public.wifi_settings
    FOR SELECT TO anon, authenticated USING (is_active = true);

-- Only authenticated users (admins) can insert or update wifi settings
CREATE POLICY "Admins manage wifi settings" ON public.wifi_settings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Voucher Plans:
-- Anyone can see active voucher plans
CREATE POLICY "Public read active voucher plans" ON public.voucher_plans
    FOR SELECT TO anon, authenticated USING (is_active = true);

-- Authenticated admins can manage all voucher plans
CREATE POLICY "Admins manage voucher plans" ON public.voucher_plans
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vouchers:
-- Public can check if a voucher code exists and is valid
CREATE POLICY "Public verify voucher code" ON public.vouchers
    FOR SELECT TO anon USING (status IN ('available', 'active'));

-- Admins have full access to vouchers
CREATE POLICY "Admins manage vouchers" ON public.vouchers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Active Sessions:
-- Admins can view and manage sessions
CREATE POLICY "Admins manage active sessions" ON public.active_sessions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anon create or update own session" ON public.active_sessions
    FOR INSERT TO anon WITH CHECK (true);
