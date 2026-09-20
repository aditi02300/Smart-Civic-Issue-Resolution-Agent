import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { navigate } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { ComplaintStatus } from '@/lib/types';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('complaints')
        .select('status');

      if (queryError) throw queryError;

      const counts: Record<ComplaintStatus, number> = {
        Submitted: 0,
        'Under Review': 0,
        'In Progress': 0,
        Resolved: 0,
        Rejected: 0,
      };

      data?.forEach((c) => {
        const status = c.status as ComplaintStatus;
        if (counts[status] !== undefined) {
          counts[status]++;
        }
      });

      setStats({
        total: data?.length || 0,
        pending: counts.Submitted,
        inProgress: counts['In Progress'],
        resolved: counts.Resolved,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-white">
        <div className="max-w-2xl mx-auto">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={fetchStats}
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
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 rounded-xl border border-slate-200 hover:border-slate-300 transition-all text-sm font-medium"
          >
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total"
            value={stats.total}
            color="bg-slate-900"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            color="bg-blue-500"
          />
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            color="bg-amber-500"
          />
          <StatCard
            label="Resolved"
            value={stats.resolved}
            color="bg-emerald-500"
          />
        </div>
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