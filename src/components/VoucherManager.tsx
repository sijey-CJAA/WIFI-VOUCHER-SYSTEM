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
  Tag,
  Layers
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
        setStatusMsg(`Generated ${batchCount} new vouchers.`);
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
            Issue access tokens, manage rate plans, and export codes for guest customers.
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
            <span>Refresh</span>
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
                    <h4 style={{ fontSize: '1rem', marginBottom: '2px', color: 'var(--text-main)' }}>
                      {p.name}
                    </h4>
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
                  gap: '6px',
                  fontSize: '0.75rem',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-color)',
                }}>
                  <span className="badge badge-blue">
                    {p.download_speed_mbps}M / {p.upload_speed_mbps}M
                  </span>
                  <span className="badge badge-emerald">
                    {p.max_devices} Device
                  </span>
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
            Generate Voucher Batch
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

      {/* Vouchers Table */}
      <div className="plain-card" style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={16} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-main)' }}>
              Voucher Inventory ({filteredVouchers.length})
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search code or plan..."
                className="form-input"
                style={{ paddingLeft: '30px', fontSize: '0.825rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: '130px', fontSize: '0.825rem' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                <th style={{ padding: '10px 14px' }}>Code</th>
                <th style={{ padding: '10px 14px' }}>Plan</th>
                <th style={{ padding: '10px 14px' }}>Price</th>
                <th style={{ padding: '10px 14px' }}>Speed</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px' }}>Created</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                    No vouchers found. Click "Generate Batch" above to create codes.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => (
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
                      <span className={`badge ${v.status === 'available' ? 'badge-emerald' : v.status === 'active' ? 'badge-blue' : 'badge-amber'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                      {new Date(v.created_at).toLocaleDateString()} {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
      </div>
    </div>
  );
};
