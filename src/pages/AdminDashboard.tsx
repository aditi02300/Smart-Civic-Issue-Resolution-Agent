import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { navigate } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { Complaint, ComplaintStatus, Severity } from '@/lib/types';
import { STATUS_COLORS } from '@/lib/types';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

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

  const escalationThresholds: Record<Severity, number> = {
    High: 4,
    Medium: 12,
    Low: 24,
  };

  const escalatedIds = useMemo(() => {
    const now = Date.now();
    const ids = new Set<string>();
    complaints.forEach((c) => {
      if (c.status === 'Resolved') return;
      const created = new Date(c.created_at).getTime();
      const hoursElapsed = (now - created) / (1000 * 60 * 60);
      const threshold = escalationThresholds[c.severity || 'Low'];
      if (hoursElapsed > threshold) {
        ids.add(c.id);
      }
    });
    return ids;
  }, [complaints]);

  const escalatedCount = escalatedIds.size;

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={fetchComplaints}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total" value={complaints.length} color="bg-slate-900" />
          <StatCard label="Pending" value={complaints.filter((c) => c.status === 'Submitted').length} color="bg-blue-500" />
          <StatCard label="In Progress" value={complaints.filter((c) => c.status === 'In Progress').length} color="bg-amber-500" />
          <StatCard label="Resolved" value={complaints.filter((c) => c.status === 'Resolved').length} color="bg-emerald-500" />
        </div>

        {/* Escalation Banner */}
        {escalatedCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium mb-6">
            <span className="text-lg">⚠️</span>
            {escalatedCount} complaint{escalatedCount !== 1 ? 's' : ''} require{escalatedCount !== 1 ? 's' : ''} escalation
          </div>
        )}

        {/* Complaints Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200">
            <p className="text-lg font-medium">No complaints yet</p>
            <p className="text-sm mt-1">Complaints will appear here once submitted.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Issue</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => {
                  const isEscalated = escalatedIds.has(c.id);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedComplaint(c)}
                      className={`cursor-pointer hover:bg-slate-50 transition-colors ${isEscalated ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'}`}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-slate-500">{c.tracking_id}</td>
                      <td className="px-4 py-3 text-sm text-slate-900 max-w-xs truncate">{c.issue || 'Unclassified'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{c.department || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          c.severity === 'High'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : c.severity === 'Medium'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {c.severity || 'Low'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          STATUS_COLORS[c.status]
                            ? `${STATUS_COLORS[c.status].bg} ${STATUS_COLORS[c.status].text} ${STATUS_COLORS[c.status].border}`
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedComplaint(null)}>
            <div
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">Complaint Details</h2>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <span className="text-slate-500 text-xl leading-none">✕</span>
                </button>
              </div>
              <div className="p-5 space-y-4">
                <DetailRow label="Tracking ID" value={selectedComplaint.tracking_id} />
                <DetailRow label="Issue" value={selectedComplaint.issue || 'Unclassified'} />
                <DetailRow label="Description" value={selectedComplaint.complaint_text} />
                <DetailRow label="Department" value={selectedComplaint.department || '—'} />
                <DetailRow label="Location" value={selectedComplaint.location || '—'} />
                <DetailRow label="Category" value={selectedComplaint.category || '—'} />
                <DetailRow label="Severity" value={selectedComplaint.severity || 'Low'} />
                <DetailRow label="Status" value={selectedComplaint.status} />
                {selectedComplaint.reason && (
                  <DetailRow label="Reason" value={selectedComplaint.reason} />
                )}
                <DetailRow label="Created" value={new Date(selectedComplaint.created_at).toLocaleString()} />
                {selectedComplaint.image_url && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Image</p>
                    <img
                      src={selectedComplaint.image_url}
                      alt="Complaint"
                      className="w-full h-48 object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-slate-900 mt-0.5">{value}</p>
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