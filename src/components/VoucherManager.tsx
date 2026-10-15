import React, { useState, useEffect } from 'react';
import { supabase, type VoucherPlan, type Voucher } from '../lib/supabase';
import { 
  Ticket, 
  Plus, 
  Printer, 
  Search, 
  CheckCircle, 
  Clock, 
  Copy, 
  Check, 
  RefreshCw, 
  Layers,
  PowerOff,
  History,
  Radio,
  Edit2,
  X,
  Gauge
} from 'lucide-react';

interface VoucherManagerProps {
  currencySymbol: string;
}

type InventorySection = 'active' | 'unused' | 'history';

export const VoucherManager: React.FC<VoucherManagerProps> = ({ currencySymbol }) => {
  const [plans, setPlans] = useState<VoucherPlan[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [batchCount, setBatchCount] = useState<number>(5);
  const [prefix, setPrefix] = useState<string>('VOUCH');
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<InventorySection>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<VoucherPlan | null>(null);
  const [savingPlan, setSavingPlan] = useState<boolean>(false);
  const [, setTick] = useState<number>(Date.now());

  // Helper to calculate expiration & live remaining time
  const getVoucherExpiryInfo = (v: any) => {
    if (v.status === 'expired') {
      return { isExpired: true, remainingText: 'Expired', badgeClass: 'badge-rose' };
    }
    if (v.status === 'used' || v.status === 'disabled') {
      return { isExpired: true, remainingText: v.status.toUpperCase(), badgeClass: 'badge-amber' };
    }
    if (v.status === 'available') {
      const mins = v.plan?.duration_minutes || 60;
      return { 
        isExpired: false, 
        remainingText: `${mins >= 60 ? `${Math.round(mins / 60)}h` : `${mins}m`} validity`, 
        badgeClass: 'badge-emerald' 
      };
    }

    // Active voucher: calculate actual remaining time
    const activatedTime = v.activated_at ? new Date(v.activated_at).getTime() : new Date(v.created_at).getTime();
    const durationMs = (v.plan?.duration_minutes || 60) * 60 * 1000;
    const expiryTime = v.expires_at ? new Date(v.expires_at).getTime() : (activatedTime + durationMs);
    const diffMs = expiryTime - Date.now();

    if (diffMs <= 0) {
      return { isExpired: true, remainingText: 'Expired', badgeClass: 'badge-rose' };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const formatted = `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds.toString().padStart(2, '0')}s`;

    return { isExpired: false, remainingText: formatted, badgeClass: 'badge-blue' };
  };

  // Fetch plans and vouchers and auto-expire overdue vouchers
  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, vouchersRes] = await Promise.all([
        supabase.from('voucher_plans').select('*').order('price', { ascending: true }),
        supabase.from('vouchers').select('*, plan:voucher_plans(*)').order('created_at', { ascending: false }).limit(100),
      ]);

      if (plansRes.data) {
        setPlans(plansRes.data);
        if (plansRes.data.length > 0 && !selectedPlanId) {
          setSelectedPlanId(plansRes.data[0].id);
        }
      }

      if (vouchersRes.data) {
        const loaded = vouchersRes.data as any[];
        const outdatedIds: string[] = [];

        // Check if any active vouchers are already past expiration
        const processed = loaded.map((v) => {
          if (v.status === 'active') {
            const activatedTime = v.activated_at ? new Date(v.activated_at).getTime() : new Date(v.created_at).getTime();
            const durationMs = (v.plan?.duration_minutes || 60) * 60 * 1000;
            const expiryTime = v.expires_at ? new Date(v.expires_at).getTime() : (activatedTime + durationMs);
            if (Date.now() >= expiryTime) {
              outdatedIds.push(v.id);
              return { ...v, status: 'expired' };
            }
          }
          return v;
        });

        setVouchers(processed);

        // Auto-update outdated vouchers in Supabase
        if (outdatedIds.length > 0) {
          try {
            await supabase.from('vouchers').update({ status: 'expired' }).in('id', outdatedIds);
            await supabase.from('active_sessions').update({ 
              status: 'disconnected', 
              last_seen_at: new Date().toISOString() 
            }).in('voucher_id', outdatedIds);
            
            setStatusMsg(`Moved ${outdatedIds.length} overdue voucher(s) to History (Expired).`);
            setTimeout(() => setStatusMsg(null), 4000);
          } catch (updateErr) {
            console.warn('Auto-expire sync error:', updateErr);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load voucher data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1-Second live ticking interval for active voucher countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(Date.now());

      // Check if any active voucher has just reached expiration
      setVouchers((prev) => {
        let hasChanges = false;
        const newlyExpiredIds: string[] = [];

        const updated = prev.map((v: any) => {
          if (v.status === 'active') {
            const activatedTime = v.activated_at ? new Date(v.activated_at).getTime() : new Date(v.created_at).getTime();
            const durationMs = (v.plan?.duration_minutes || 60) * 60 * 1000;
            const expiryTime = v.expires_at ? new Date(v.expires_at).getTime() : (activatedTime + durationMs);
            if (Date.now() >= expiryTime) {
              hasChanges = true;
              newlyExpiredIds.push(v.id);
              return { ...v, status: 'expired' };
            }
          }
          return v;
        });

        if (hasChanges && newlyExpiredIds.length > 0) {
          supabase.from('vouchers').update({ status: 'expired' }).in('id', newlyExpiredIds).then(() => {
            supabase.from('active_sessions').update({ 
              status: 'disconnected', 
              last_seen_at: new Date().toISOString() 
            }).in('voucher_id', newlyExpiredIds);
          });
          setStatusMsg(`${newlyExpiredIds.length} voucher(s) finished and moved to History.`);
          setTimeout(() => setStatusMsg(null), 3500);
        }

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Manually end an active session on demand
  const handleTerminateSession = async (voucherId: string, code: string) => {
    try {
      await supabase.from('vouchers').update({ status: 'expired' }).eq('id', voucherId);
      await supabase.from('active_sessions').update({ 
        status: 'disconnected', 
        last_seen_at: new Date().toISOString() 
      }).eq('voucher_id', voucherId);

      setVouchers((prev) => prev.map((v) => v.id === voucherId ? { ...v, status: 'expired' } : v));
      setStatusMsg(`Ended session for voucher ${code} (Moved to History).`);
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      console.error('Error terminating voucher:', err);
      setStatusMsg(`Failed to end session: ${err.message}`);
    }
  };

  // Save Plan updates (Speed, Price, Validity)
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSavingPlan(true);

    try {
      const { error } = await supabase
        .from('voucher_plans')
        .update({
          name: editingPlan.name,
          price: Number(editingPlan.price),
          download_speed_mbps: Number(editingPlan.download_speed_mbps),
          upload_speed_mbps: Number(editingPlan.upload_speed_mbps),
          duration_minutes: Number(editingPlan.duration_minutes),
          max_devices: Number(editingPlan.max_devices),
        })
        .eq('id', editingPlan.id);

      if (error) throw error;

      setPlans((prev) => prev.map((p) => p.id === editingPlan.id ? { ...editingPlan } : p));
      setVouchers((prev) => prev.map((v) => {
        if (v.plan_id === editingPlan.id) {
          return { ...v, plan: { ...editingPlan } };
        }
        return v;
      }));

      setStatusMsg(`Updated "${editingPlan.name}": speed set to ${editingPlan.download_speed_mbps} Mbps / ${editingPlan.upload_speed_mbps} Mbps.`);
      setEditingPlan(null);
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      console.error('Save plan error:', err);
      setStatusMsg(`Failed to update plan: ${err.message}`);
    } finally {
      setSavingPlan(false);
    }
  };

  // Generate random voucher codes
  const generateVoucherCodes = async () => {
    if (!selectedPlanId) return;
    setGenerating(true);
    setStatusMsg(null);

    try {
      const batchId = 'BATCH-' + Date.now().toString(36).toUpperCase();
      const newVouchers: { code: string; plan_id: string; status: 'available'; batch_id: string }[] = [];

      for (let i = 0; i < batchCount; i++) {
        const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const code = `${prefix ? prefix.toUpperCase() + '-' : ''}${randomHex}-${randomNum}`;
        newVouchers.push({
          code,
          plan_id: selectedPlanId,
          status: 'available',
          batch_id: batchId,
        });
      }

      const { data, error } = await supabase.from('vouchers').insert(newVouchers).select('*, plan:voucher_plans(*)');

      if (error) throw error;

      if (data) {
        setVouchers((prev) => [...(data as any), ...prev]);
        setStatusMsg(`Generated ${batchCount} new vouchers in Unused section.`);
        setActiveSection('unused');
        setTimeout(() => setStatusMsg(null), 3500);
      }
    } catch (err: any) {
      console.error('Generation failed:', err);
      setStatusMsg(`Failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Group vouchers by category
  const activeVouchers = vouchers.filter((v) => v.status === 'active' && !getVoucherExpiryInfo(v).isExpired);
  const unusedVouchers = vouchers.filter((v) => v.status === 'available');
  const historyVouchers = vouchers.filter((v) => v.status === 'expired' || v.status === 'used' || v.status === 'disabled' || (v.status === 'active' && getVoucherExpiryInfo(v).isExpired));

  // Current display list based on active section & search query
  const getSectionVouchers = () => {
    let list: Voucher[] = [];
    if (activeSection === 'active') list = activeVouchers;
    else if (activeSection === 'unused') list = unusedVouchers;
    else if (activeSection === 'history') list = historyVouchers;

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter((v) => v.code.toLowerCase().includes(q) || (v.plan?.name && v.plan.name.toLowerCase().includes(q)));
  };

  const displayedList = getSectionVouchers();

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
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
              <Ticket size={20} />
            </div>
            <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-main)' }}>
              Voucher Management
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Generate access codes, monitor live active sessions, and review expired voucher history.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={15} />
            <span>Refresh & Sync</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrint}
          >
            <Printer size={15} />
            <span>Print Vouchers</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{
          padding: '10px 14px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '6px',
          color: '#15803d',
          marginBottom: '18px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle size={16} />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Plan Cards */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-main)' }}>
          Rate Plans
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px',
        }}>
          {plans.map((p) => {
            const isSelected = selectedPlanId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                className="plain-card"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                  borderWidth: isSelected ? '2px' : '1px',
                  backgroundColor: isSelected ? 'var(--bg-secondary)' : 'var(--bg-card)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '1rem', marginBottom: '2px', color: 'var(--text-main)' }}>
                        {p.name}
                      </h4>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPlan({ ...p });
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '2px 7px', fontSize: '0.72rem', gap: '3px' }}
                        title="Edit Speed and Plan Settings"
                      >
                        <Edit2 size={11} />
                        <span>Edit Speed</span>
                      </button>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      <span>{Math.round(p.duration_minutes / 60)}h validity</span>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {currencySymbol}{p.price}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-color)',
                }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className="badge badge-blue">
                      {p.download_speed_mbps}M Down / {p.upload_speed_mbps}M Up
                    </span>
                    <span className="badge badge-emerald">
                      {p.max_devices} Device
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Batch Generator Bar */}
      <div className="plain-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Layers size={16} color="var(--primary)" />
          <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-main)' }}>
            Quick Batch Voucher Generator
          </h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 160px',
          gap: '14px',
          alignItems: 'end',
        }}>
          <div className="form-group">
            <label className="form-label">Rate Plan</label>
            <select
              className="form-select"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {currencySymbol}{p.price}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Prefix</label>
            <input
              type="text"
              className="form-input font-mono"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="VOUCH"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Quantity</label>
            <select
              className="form-select"
              value={batchCount}
              onChange={(e) => setBatchCount(Number(e.target.value))}
            >
              <option value={5}>5 Vouchers</option>
              <option value={10}>10 Vouchers</option>
              <option value={20}>20 Vouchers</option>
              <option value={50}>50 Vouchers</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={generateVoucherCodes}
            disabled={generating || !selectedPlanId}
            style={{ height: '38px' }}
          >
            <Plus size={15} />
            <span>{generating ? 'Generating...' : 'Generate Batch'}</span>
          </button>
        </div>
      </div>

      {/* Divided Sections Container */}
      <div className="plain-card" style={{ padding: '20px' }}>
        {/* Section Navigation Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '18px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '14px',
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveSection('active')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: activeSection === 'active' ? '1px solid var(--border-color)' : '1px solid transparent',
                background: activeSection === 'active' ? 'var(--bg-secondary)' : 'transparent',
                color: activeSection === 'active' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <Radio size={15} color={activeSection === 'active' ? 'var(--primary)' : 'var(--text-dim)'} />
              <span>Active Sessions</span>
              <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                {activeVouchers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('unused')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: activeSection === 'unused' ? '1px solid var(--border-color)' : '1px solid transparent',
                background: activeSection === 'unused' ? 'var(--bg-secondary)' : 'transparent',
                color: activeSection === 'unused' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <Ticket size={15} color={activeSection === 'unused' ? 'var(--primary)' : 'var(--text-dim)'} />
              <span>Unused Vouchers</span>
              <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                {unusedVouchers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('history')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: activeSection === 'history' ? '1px solid var(--border-color)' : '1px solid transparent',
                background: activeSection === 'history' ? 'var(--bg-secondary)' : 'transparent',
                color: activeSection === 'history' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <History size={15} color={activeSection === 'history' ? 'var(--primary)' : 'var(--text-dim)'} />
              <span>Voucher History</span>
              <span className="badge badge-rose" style={{ fontSize: '0.7rem' }}>
                {historyVouchers.length}
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder={`Search in ${activeSection}...`}
              className="form-input"
              style={{ paddingLeft: '30px', fontSize: '0.825rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Section 1: Active Sessions */}
        {activeSection === 'active' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '10px 14px' }}>Voucher Code</th>
                  <th style={{ padding: '10px 14px' }}>Plan</th>
                  <th style={{ padding: '10px 14px' }}>Speed</th>
                  <th style={{ padding: '10px 14px' }}>Time Remaining (Live)</th>
                  <th style={{ padding: '10px 14px' }}>Activated At</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                      No active sessions running right now. When customers redeem vouchers, they will appear here live.
                    </td>
                  </tr>
                ) : (
                  displayedList.map((v) => {
                    const expiry = getVoucherExpiryInfo(v);
                    return (
                      <tr key={v.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.04em' }}>
                            {v.code}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                          {v.plan?.name || 'General Access'}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                          {v.plan?.download_speed_mbps || 15} Mbps
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                            <Clock size={13} />
                            <span>{expiry.remainingText}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                          {v.activated_at ? new Date(v.activated_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Just now'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(v.code)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Copy Code"
                            >
                              {copiedCode === v.code ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                              <span>{copiedCode === v.code ? 'Copied' : 'Copy'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTerminateSession(v.id, v.code)}
                              className="btn btn-danger"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              title="End Session Immediately"
                            >
                              <PowerOff size={13} />
                              <span>End Session</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Section 2: Unused / Available Vouchers */}
        {activeSection === 'unused' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '10px 14px' }}>Voucher Code</th>
                  <th style={{ padding: '10px 14px' }}>Plan</th>
                  <th style={{ padding: '10px 14px' }}>Price</th>
                  <th style={{ padding: '10px 14px' }}>Speed</th>
                  <th style={{ padding: '10px 14px' }}>Validity Duration</th>
                  <th style={{ padding: '10px 14px' }}>Created Date</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                      No unused vouchers available. Generate a batch above to create inventory!
                    </td>
                  </tr>
                ) : (
                  displayedList.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-main)', letterSpacing: '0.04em' }}>
                          {v.code}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                        {v.plan?.name || 'General Access'}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {currencySymbol}{v.plan?.price ?? 10}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                        {v.plan?.download_speed_mbps || 15} Mbps
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="badge badge-emerald">
                          {Math.round((v.plan?.duration_minutes || 60) / 60)}h Once Activated
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                        {new Date(v.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(v.code)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          title="Copy Code"
                        >
                          {copiedCode === v.code ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                          <span>{copiedCode === v.code ? 'Copied' : 'Copy'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Section 3: Voucher History (Expired & Used) */}
        {activeSection === 'history' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '10px 14px' }}>Voucher Code</th>
                  <th style={{ padding: '10px 14px' }}>Plan</th>
                  <th style={{ padding: '10px 14px' }}>Price</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                  <th style={{ padding: '10px 14px' }}>Activated At</th>
                  <th style={{ padding: '10px 14px' }}>Expired / Ended At</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                      No expired or finished vouchers in history yet.
                    </td>
                  </tr>
                ) : (
                  displayedList.map((v) => {
                    const activatedStr = v.activated_at 
                      ? new Date(v.activated_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                      : new Date(v.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                    
                    const expiredStr = v.expires_at 
                      ? new Date(v.expires_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                      : 'Expired';

                    return (
                      <tr key={v.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: 0.85 }}>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="font-mono" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                            {v.code}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                          {v.plan?.name || 'General Access'}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-dim)' }}>
                          {currencySymbol}{v.plan?.price ?? 10}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="badge badge-rose">
                            EXPIRED
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                          {activatedStr}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                          {expiredStr}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(v.code)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="Copy Code"
                          >
                            {copiedCode === v.code ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                            <span>{copiedCode === v.code ? 'Copied' : 'Copy'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rate Plan & Speed Editor Modal */}
      {editingPlan && (
        <div
          onClick={() => setEditingPlan(null)}
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
              maxWidth: '460px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gauge size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-main)' }}>Edit Speed & Rate Plan</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="btn btn-secondary"
                style={{ padding: '4px 8px' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Plan Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">
                    <span>Download Speed</span>
                    <span className="badge badge-blue">Mbps</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    required
                    className="form-input font-mono"
                    style={{ fontWeight: 600, fontSize: '1rem' }}
                    value={editingPlan.download_speed_mbps}
                    onChange={(e) => setEditingPlan({ ...editingPlan, download_speed_mbps: Number(e.target.value) })}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>e.g. 25, 50, 100 Mbps</span>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Upload Speed</span>
                    <span className="badge badge-blue">Mbps</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    required
                    className="form-input font-mono"
                    style={{ fontWeight: 600, fontSize: '1rem' }}
                    value={editingPlan.upload_speed_mbps}
                    onChange={(e) => setEditingPlan({ ...editingPlan, upload_speed_mbps: Number(e.target.value) })}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>e.g. 10, 25, 50 Mbps</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Price ({currencySymbol})</label>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    required
                    className="form-input"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    className="form-input"
                    value={editingPlan.duration_minutes}
                    onChange={(e) => setEditingPlan({ ...editingPlan, duration_minutes: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingPlan}
                >
                  {savingPlan ? 'Saving...' : 'Save Plan Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
