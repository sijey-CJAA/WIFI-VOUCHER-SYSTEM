# WiFi-Vouch — Hotspot Management & Voucher Billing System

A modern, high-performance WiFi Hotspot Controller and Captive Portal system powered by **React 19**, **TypeScript**, **Vite**, and **Supabase**.

---

## 📖 Table of Contents
- [How It Works (System Architecture)](#-how-it-works-system-architecture)
- [The Customer Experience](#-the-customer-experience)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Getting Started Locally](#-getting-started-locally)
- [Vercel Deployment Guide](#-vercel-deployment-guide)
- [Router Hardware Integration (MikroTik & OpenWrt)](#-router-hardware-integration-mikrotik--openwrt)
- [Frequently Asked Questions (FAQ)](#-frequently-asked-questions-faq)

---

## 🌐 How It Works (System Architecture)

A real-world commercial WiFi voucher system operates across three tiers:

```
┌────────────────────────────────────────────────────────┐
│                   1. GUEST CLIENT                      │
│      Customer Phone / Laptop (iOS / Android / PC)      │
└───────────────────────────┬────────────────────────────┘
                            │ Connects to Open Wi-Fi (No password)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   2. NETWORK GATEWAY                   │
│         Hardware Router (MikroTik / OpenWrt)           │
│                                                        │
│  • Blocks general internet for unauthenticated devices │
│  • Walled Garden allows ONLY Portal & Supabase traffic │
│  • Redirects phone probe to Captive Portal URL         │
└───────────────────────────┬────────────────────────────┘
                            │ Redirects to Portal URL
                            ▼
┌────────────────────────────────────────────────────────┐
│             3. CLOUD / WEB APPLICATION                 │
│         Vercel Frontend + Supabase Database            │
│                                                        │
│  • Displays clean login card                           │
│  • Validates voucher code with Supabase                │
│  • Signals router to unlock full internet access       │
└────────────────────────────────────────────────────────┘
```

---

## 📱 The Customer Experience

Many people ask: *"If the user connects to Wi-Fi first, doesn't that give them free internet?"*  
**No!** Connecting to the Wi-Fi antenna is separate from having internet access:

1. **Open Wi-Fi Network**: The customer sees your network name (e.g., `VOUCHER-WIFI-5G`) with **no password** (open lock).
2. **Wi-Fi Association**: The customer taps the network. The phone connects to the antenna, but **internet access is 100% blocked**.
3. **Automatic Sign-In Popup**: The phone's operating system (Android / iOS) sends an internet probe. The router intercepts this probe and **automatically displays the "Sign in to Wi-Fi" popup**.
4. **Voucher Validation**: The customer enters their voucher code. The web app checks the Supabase database to verify:
   - Is the voucher valid?
   - Has it expired or already been used?
   - What speed (Mbps) and time limit apply?
5. **Access Unlocked**: The system marks the voucher `active`, and the router opens the firewall gate, granting the customer high-speed internet.

---

## ✨ Key Features

- **🎫 Batch Voucher Generator**:
  - Generate random voucher codes in bulk (5, 10, 20, 50+).
  - Assign customizable prefixes (e.g., `VIP-`, `CAFE-`, `VOUCH-`).
  - Set validity durations, download/upload speeds, and max devices.
  - Print vouchers directly with one click for customer ticketing.

- **⚙️ Hotspot & Hardware Setup**:
  - Configure SSID broadcast name and gateway IP (`192.168.88.1`).
  - Set primary/secondary DNS servers (`1.1.1.1`, `8.8.8.8`).
  - Configure default bandwidth queues and session/idle timeouts.
  - Built-in gateway ping diagnostic test.

- **📜 Automated Router Scripts**:
  - Generates ready-to-run configuration scripts for **MikroTik RouterOS** (`.rsc`) and **OpenWrt / Nodogsplash** (`.sh`).
  - Includes pre-configured **Walled Garden** rules whitelisting your Vercel domain and Supabase endpoints.

- **📱 Customer Captive Portal**:
  - Distraction-free, responsive customer voucher entry page.
  - Real-time connection feedback with speed tier and remaining duration.

- **👁️ Live Portal Preview Modal**:
  - Built-in realistic mobile mockup to preview branding changes before deployment.

- **🌓 Plain, Professional Design**:
  - Clean, high-contrast dashboard with instant Light / Dark mode toggle.
  - Zero bloated neon glows, radial meshes, or glassmorphism.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL + Row-Level Security)
- **Hosting**: [Vercel](https://vercel.com/) (Automated CI/CD with SPA rewrites)

---

## 🚀 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/sijey-CJAA/WIFI-VOUCHER-SYSTEM.git
cd WIFI-VOUCHER-SYSTEM
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Initialize Supabase Database
Run the SQL migration in [`supabase/schema.sql`](./supabase/schema.sql) in your **Supabase Dashboard > SQL Editor**.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) to view the admin dashboard.

To test on your mobile phone on the same local Wi-Fi:
```bash
npm run dev -- --host
```

---

## ☁️ Vercel Deployment Guide

This project is configured with [`vercel.json`](./vercel.json) to handle Single Page Application (SPA) routing.

1. Push your repository to **GitHub**.
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your GitHub repository (`WIFI-VOUCHER-SYSTEM`).
4. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
5. Click **Deploy**.

Once deployed, your URLs will be:
- **Admin Dashboard**: `https://your-project.vercel.app/`
- **Customer Captive Portal**: `https://your-project.vercel.app/?portal=true`

---

## 📡 Router Hardware Integration (MikroTik & OpenWrt)

### Option 1: MikroTik RouterOS
1. Log in to your MikroTik router using **WinBox** or SSH.
2. In your WiFi-Vouch dashboard, click **"Router CLI Script"**.
3. Select **MikroTik RouterOS (.rsc)** and click **Copy Script**.
4. Open the MikroTik terminal, paste the script, and press `Enter`.
5. The router will configure:
   - Hotspot server on `wlan1` with your SSID.
   - IP address pool for guests.
   - Walled Garden whitelist for `*.vercel.app` and `*.supabase.co`.
   - Automatic HTTP 302 redirection to your portal URL.

### Option 2: OpenWrt (with Nodogsplash)
1. Install Nodogsplash on your OpenWrt router:
   ```bash
   opkg update && opkg install nodogsplash
   ```
2. Copy the script from the **OpenWrt (.sh)** tab in the dashboard.
3. Paste into your OpenWrt SSH terminal.

---

## ❓ Frequently Asked Questions (FAQ)

### Why can't a standard Windows laptop hotspot act as a full captive portal?
Windows Mobile Hotspot is designed only as a simple internet connection bridge. It enforces WPA2 passwords and lacks an internal firewall / DNS hijacking engine to redirect unauthenticated clients to a custom port. For production use, a dedicated router (like MikroTik or OpenWrt) or software gateway (like MyPublicWiFi) is recommended.

### How does the customer phone load the Vercel site without internet?
Through the router's **Walled Garden** feature. The router permits DNS and HTTP traffic strictly to your Vercel domain and Supabase API, while keeping all other websites (YouTube, Google, social media) blocked until the voucher is verified.

### Can I run the captive portal completely offline without internet?
Yes. MikroTik routers support storing custom HTML/JS hotspot files directly on the router's local flash storage.

---

## 📄 License
This project is open-source under the [MIT License](./LICENSE).
