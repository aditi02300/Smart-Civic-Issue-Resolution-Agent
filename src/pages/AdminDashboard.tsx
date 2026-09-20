import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Loader2, Filter, Search, ChevronDown, MapPin, Calendar, RefreshCw } from 'lucide-react';
import { navigate } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { Complaint, ComplaintStatus, Severity } from '@/lib/types';
import { SEVERITY_COLORS, STATUS_COLORS, STATUS_OPTIONS } from '@/lib/types';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setComplaints((data || []) as Complaint[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const updateStatus = async (id: string, status: ComplaintStatus) => {
    setUpdatingId(id);
    try {
      const { error: updateError } = await supabase
        .from('complaints')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (updateError) throw updateError;
      setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          c.tracking_id.toLowerCase().includes(q) ||
          c.complaint_text.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          (c.issue?.toLowerCase().includes(q) ?? false) ||
          (c.category?.toLowerCase().includes(q) ?? false) ||
          (c.department?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [complaints, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = complaints.length;
    const byStatus = STATUS_OPTIONS.reduce((acc, s) => {
      acc[s] = complaints.filter((c) => c.status === s).length;
      return acc;
    }, {} as Record<ComplaintStatus, number>);
    const highSeverity = complaints.filter((c) => c.severity === 'High').length;
    return { total, byStatus, highSeverity };
  }, [complaints]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('landing')}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-sm text-slate-500">Manage and route civic complaints.</p>
            </div>
          </div>
          <button
            onClick={fetchComplaints}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 rounded-xl border border-slate-200 hover:border-slate-300 transition-all text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total" value={stats.total} color="bg-slate-900" />
          <StatCard label="In Progress" value={stats.byStatus['In Progress']} color="bg-amber-500" />
          <StatCard label="Resolved" value={stats.byStatus['Resolved']} color="bg-emerald-500" />
          <StatCard label="High Severity" value={stats.highSeverity} color="bg-red-500" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tracking ID, issue, location, category..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | 'All')}
              className="appearance-none pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium text-slate-700 bg-white cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Complaint list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg font-medium">No complaints found</p>
            <p className="text-sm mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                onStatusChange={updateStatus}
                updating={updatingId === c.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-10 rounded-full ${color}`} />
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500 font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ComplaintCard({
  complaint,
  onStatusChange,
  updating,
}: {
  complaint: Complaint;
  onStatusChange: (id: string, status: ComplaintStatus) => void;
  updating: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400">{complaint.tracking_id}</span>
              {complaint.severity && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${SEVERITY_COLORS[complaint.severity as Severity].bg} ${SEVERITY_COLORS[complaint.severity as Severity].text} ${SEVERITY_COLORS[complaint.severity as Severity].border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_COLORS[complaint.severity as Severity].dot}`} />
                  {complaint.severity}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-slate-900 truncate">
              {complaint.issue || 'Unclassified Issue'}
            </h3>
            <p className="text-sm text-slate-500 line-clamp-2 mt-1">{complaint.complaint_text}</p>
          </div>
          {complaint.image_url && (
            <img src={complaint.image_url} alt="" className="w-16 h-16 rounded-lg border border-slate-200 object-cover flex-shrink-0" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-4">
          {complaint.category && (
            <span className="flex items-center gap-1">
              <span className="font-medium">{complaint.category}</span>
            </span>
          )}
          {complaint.department && (
            <span className="flex items-center gap-1">
              <span>{complaint.department}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {complaint.location}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(complaint.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[complaint.status].bg} ${STATUS_COLORS[complaint.status].text} ${STATUS_COLORS[complaint.status].border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[complaint.status].dot}`} />
            {complaint.status}
          </span>
          <div className="relative">
            <select
              value={complaint.status}
              onChange={(e) => onStatusChange(complaint.id, e.target.value as ComplaintStatus)}
              disabled={updating}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:border-slate-300 transition-all cursor-pointer disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
          {updating && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
        </div>
      </div>
    </div>
  );
}
