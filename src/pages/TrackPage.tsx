import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Loader2, AlertTriangle, MapPin, Building, Tag, FileText, Calendar, Hash, Check } from 'lucide-react';
import { navigate } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { Complaint } from '@/lib/types';
import { SEVERITY_COLORS, STATUS_COLORS } from '@/lib/types';

type ComplaintStatus = 'Submitted' | 'Under Review' | 'In Progress' | 'Resolved' | 'Rejected';

const STAGES: ComplaintStatus[] = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];

function getStageIndex(status: ComplaintStatus): number {
  switch (status) {
    case 'Submitted': return 0;
    case 'Under Review': return 1;
    case 'In Progress': return 2;
    case 'Resolved': return 3;
    case 'Rejected': return -1;
    default: return 0;
  }
}

function getStageClassName(stageIndex: number, currentIndex: number): string {
  if (currentIndex < 0) return 'timeline-stage';
  if (stageIndex < currentIndex) return 'timeline-stage completed';
  if (stageIndex === currentIndex) return 'timeline-stage active';
  return 'timeline-stage';
}

export default function TrackPage() {
  const [trackingId, setTrackingId] = useState('');
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (id?: string) => {
    const query = (id || trackingId).trim();
    if (!query) {
      setError('Please enter a tracking ID.');
      return;
    }
    setLoading(true);
    setError(null);
    setComplaint(null);

    try {
      const { data, error: queryError } = await supabase
        .from('complaints')
        .select('*')
        .eq('tracking_id', query)
        .maybeSingle();

      if (queryError) throw queryError;
      if (!data) {
        setError('Complaint not found. Please check the tracking ID and try again.');
        return;
      }
      setComplaint(data as Complaint);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find complaint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hash = window.location.hash;
    const queryString = hash.split('?')[1];
    if (queryString) {
      const params = new URLSearchParams(queryString);
      const id = params.get('id');
      if (id) {
        setTrackingId(id);
        search(id);
      }
    }
  }, []);

  const currentStageIndex = complaint ? getStageIndex(complaint.status as ComplaintStatus) : -1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-2xl mx-auto px-6 pt-20 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('landing')}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Track Complaint</h1>
            <p className="text-sm text-slate-500">Enter your tracking ID to check the status.</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                placeholder="CIV-XXXXXXXX"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-700 placeholder:text-slate-400 font-mono"
              />
            </div>
            <button
              onClick={() => search()}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Result */}
        {complaint && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-[fadeIn_0.4s_ease]">
            {/* Status Timeline */}
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Status Timeline</span>
                <span className="text-xs text-slate-400 font-mono">{complaint.tracking_id}</span>
              </div>
              <div className="timeline">
                <div className={`timeline-track stage-${currentStageIndex + 1}`}>
                  <div className="timeline-line"></div>
                  {STAGES.map((stage, i) => (
                    <div key={stage} className={getStageClassName(i, currentStageIndex)}>
                      <div className="timeline-dot">
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="timeline-label">{stage}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current status badge */}
              {complaint.status !== 'Rejected' && (
                <div className="mt-4 flex items-center gap-3">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${STATUS_COLORS[complaint.status as keyof typeof STATUS_COLORS].bg} ${STATUS_COLORS[complaint.status as keyof typeof STATUS_COLORS].text} ${STATUS_COLORS[complaint.status as keyof typeof STATUS_COLORS].border}`}>
                    <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[complaint.status as keyof typeof STATUS_COLORS].dot}`} />
                    {complaint.status}
                  </span>
                  {complaint.severity && (
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${SEVERITY_COLORS[complaint.severity as keyof typeof SEVERITY_COLORS].bg} ${SEVERITY_COLORS[complaint.severity as keyof typeof SEVERITY_COLORS].text} ${SEVERITY_COLORS[complaint.severity as keyof typeof SEVERITY_COLORS].border}`}>
                      <span className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[complaint.severity as keyof typeof SEVERITY_COLORS].dot}`} />
                      {complaint.severity} Priority
                    </span>
                  )}
                </div>
              )}

              {/* Rejected status indicator */}
              {complaint.status === 'Rejected' && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Complaint Rejected</p>
                    <p className="text-sm">This complaint has been reviewed and rejected.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              {complaint.issue && (
                <DetailRow icon={<FileText className="w-4 h-4" />} label="Issue" value={complaint.issue} />
              )}
              {complaint.category && (
                <DetailRow icon={<Tag className="w-4 h-4" />} label="Category" value={complaint.category} />
              )}
              {complaint.department && (
                <DetailRow icon={<Building className="w-4 h-4" />} label="Department" value={complaint.department} />
              )}
              <DetailRow icon={<MapPin className="w-4 h-4" />} label="Location" value={complaint.location} />
              <DetailRow icon={<FileText className="w-4 h-4" />} label="Complaint" value={complaint.complaint_text} />
              {complaint.reason && (
                <DetailRow icon={<AlertTriangle className="w-4 h-4" />} label="AI Assessment" value={complaint.reason} />
              )}
              <DetailRow
                icon={<Calendar className="w-4 h-4" />}
                label="Submitted"
                value={new Date(complaint.created_at).toLocaleString()}
              />
            </div>

            {complaint.image_url && (
              <div className="px-6 pb-6">
                <img src={complaint.image_url} alt="Complaint" className="rounded-xl border border-slate-200 max-h-64 w-auto" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-slate-500">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
      </div>
    </div>
  );
}