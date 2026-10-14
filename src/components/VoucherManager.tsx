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
  Zap,
  Tag
} from 'lucide-react';


interface VoucherManagerProps {
  currencySymbol: string;
}

export const VoucherManager: React.FC<VoucherManagerProps> = ({ currencySymbol }) => {
  const [plans, setPlans] = useState<VoucherPlan[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [batchCount, setBatchCount] = useState<number>(5);
  const [prefix, setPrefix] = useState<string>('VOUCH');
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Fetch plans and vouchers
  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, vouchersRes] = await Promise.all([
        supabase.from('voucher_plans').select('*').order('price', { ascending: true }),
        supabase.from('vouchers').select('*, plan:voucher_plans(*)').order('created_at', { ascending: false }).limit(50),
      ]);

      if (plansRes.data) {
        setPlans(plansRes.data);
        if (plansRes.data.length > 0 && !selectedPlanId) {
          setSelectedPlanId(plansRes.data[0].id);
        }
      }

      if (vouchersRes.data) {
        setVouchers(vouchersRes.data as any);
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
        setStatusMsg(`Generated ${batchCount} new vouchers!`);
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

  // Filter vouchers
  const filteredVouchers = vouchers.filter((v) => {
    const matchesFilter = filterStatus === 'all' || v.status === filterStatus;
    const matchesSearch = v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.plan?.name && v.plan.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '28px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              padding: '8px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              color: '#06b6d4',
            }}>
              <Ticket size={24} />
            </div>
            <h1 style={{ fontSize: '1.85rem', margin: 0 }}>Voucher Management & Generator</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Issue access tokens, manage pricing tiers, and print vouchers for clients.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrint}
          >
            <Printer size={16} />
            <span>Print Vouchers</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{
          padding: '12px 18px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px',
          color: '#34d399',
          marginBottom: '20px',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle size={18} />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Plan Cards */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', color: '#e2e8f0' }}>Active Rate Plans</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
        }}>
          {plans.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedPlanId(p.id)}
              className="glass-panel"
              style={{
                padding: '20px',
                cursor: 'pointer',
                borderColor: selectedPlanId === p.id ? '#3b82f6' : 'var(--border-color)',
                boxShadow: selectedPlanId === p.id ? '0 0 20px rgba(59, 130, 246, 0.25)' : 'var(--shadow-card)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{p.name}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    <span>{Math.round(p.duration_minutes / 60)} Hour{p.duration_minutes > 60 ? 's' : ''} Validity</span>
                  </div>
                </div>
                <div style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: '#60a5fa',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {currencySymbol}{p.price}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '8px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              }}>
                <span className="badge badge-blue">
                  {p.download_speed_mbps}M / {p.upload_speed_mbps}M
                </span>
                <span className="badge badge-emerald">
                  {p.max_devices} Device
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Batch Generator Bar */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Zap size={18} color="#fbbf24" />
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Quick Batch Voucher Generator</h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 160px',
          gap: '16px',
          alignItems: 'end',
        }}>
          <div className="form-group">
            <label className="form-label">Assign Plan</label>
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
            <label className="form-label">Code Prefix</label>
            <input
              type="text"
              className="form-input font-mono"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="VOUCH"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Batch Quantity</label>
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
            style={{ height: '42px' }}
          >
            <Plus size={16} />
            <span>{generating ? 'Generating...' : 'Generate Batch'}</span>
          </button>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={18} color="#3b82f6" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Voucher Inventory ({filteredVouchers.length})</h3>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search code or plan..."
                className="form-input"
                style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: '140px', fontSize: '0.85rem' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '12px 16px' }}>Voucher Code</th>
                <th style={{ padding: '12px 16px' }}>Plan</th>
                <th style={{ padding: '12px 16px' }}>Price</th>
                <th style={{ padding: '12px 16px' }}>Speed</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Created</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                    No vouchers found. Click "Generate Batch" above to create vouchers!
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="font-mono" style={{ fontWeight: 700, color: '#f3f4f6', letterSpacing: '0.05em' }}>
                        {v.code}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {v.plan?.name || 'General Access'}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#60a5fa' }}>
                      {currencySymbol}{v.plan?.price ?? 10}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      {v.plan?.download_speed_mbps || 15} Mbps
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${v.status === 'available' ? 'badge-emerald' : v.status === 'active' ? 'badge-blue' : 'badge-amber'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      {new Date(v.created_at).toLocaleDateString()} {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(v.code)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        title="Copy Code"
                      >
                        {copiedCode === v.code ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                        <span>{copiedCode === v.code ? 'Copied' : 'Copy'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
