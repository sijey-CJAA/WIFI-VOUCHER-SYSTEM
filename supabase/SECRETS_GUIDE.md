# 🔐 Supabase & Repository Secrets Configuration

This folder stores database migrations, configuration, and secrets management guidelines for the **Wifi Voucher System**.

---

## 1. GitHub Repository Secrets Setup

To prevent sensitive keys from being exposed in git commits while enabling continuous integration and deployment, configure the following secrets in GitHub:

### How to Add Secrets to GitHub:
1. Navigate to your GitHub repository: `https://github.com/sijey-CJAA/WIFI-VOUCHER-SYSTEM`
2. Click **Settings** (tab at the top)
3. In the left sidebar, expand **Secrets and variables** ➡️ **Actions**
4. Click the green button: **New repository secret**
5. Add each of the following keys:

| Secret Name | Recommended Value | Notes |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://tjdivlwutirvbrlrtwdz.supabase.co` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_7umaz2ezLBZj_kHSU6QdMg_ywJmQ5tc` | Publishable / Anon Client Key |
| `SUPABASE_PROJECT_REF` | `tjdivlwutirvbrlrtwdz` | Project reference identifier |
| `SUPABASE_DB_PASSWORD` | `FhxVGx8CXI9jmAMF` | Database Master Password |
| `DATABASE_URL` | `postgresql://postgres:FhxVGx8CXI9jmAMF@db.tjdivlwutirvbrlrtwdz.supabase.co:5432/postgres` | Direct PostgreSQL Connection |

> ⚠️ **IMPORTANT**: Never commit `.env` or plain database passwords to GitHub. The root `.gitignore` is already configured to exclude `.env` files.

---

## 2. Supabase CLI Setup & Database Linking

To link this repository with your remote Supabase project from the command line:

```bash
# 1. Log in to your Supabase CLI account
npx supabase login

# 2. Link your local project to your remote Supabase project
npx supabase link --project-ref tjdivlwutirvbrlrtwdz

# 3. Enter your database password when prompted:
# FhxVGx8CXI9jmAMF

# 4. Push migrations or schema:
npx supabase db push
```

---

## 3. Applying the Database Schema (SQL Editor)

You can apply the complete database schema in 1-click via the Supabase Web Dashboard:

1. Open your Supabase Dashboard: [https://supabase.com/dashboard/project/tjdivlwutirvbrlrtwdz](https://supabase.com/dashboard/project/tjdivlwutirvbrlrtwdz)
2. In the left navigation, click **SQL Editor** (`>_` icon)
3. Click **New Query**
4. Copy the entire contents of [`supabase/schema.sql`](./schema.sql)
5. Paste it into the query editor and click **Run** (or `Ctrl + Enter`)
6. Tables created:
   - `profiles` (User metadata & roles)
   - `wifi_settings` (SSID, Gateway IP, Router Brand, Portal Branding)
   - `voucher_plans` (Pre-configured rates & speed limits)
   - `vouchers` (Generated voucher codes & redemption status)
   - `active_sessions` (Real-time connected devices & bandwidth)
   - Secure Row Level Security (RLS) policies for all tables
