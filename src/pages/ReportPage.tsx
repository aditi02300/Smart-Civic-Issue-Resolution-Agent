import { useState, useRef } from 'react';
import { ArrowLeft, ImagePlus, Loader2, Send, X, Bot, MapPin, AlertTriangle, Building, Tag, FileText, CheckCircle2 } from 'lucide-react';
import { navigate } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { AnalysisResult, ComplaintCategory, Severity } from '@/lib/types';
import { generateTrackingId, SEVERITY_COLORS } from '@/lib/types';

interface FormState {
  complaint: string;
  location: string;
  image: File | null;
  imageUrl: string | null;
}

export default function ReportPage() {
  const [form, setForm] = useState<FormState>({ complaint: '', location: '', image: null, imageUrl: null });
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }
    setForm((f) => ({ ...f, image: file }));
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const removeImage = () => {
    setForm((f) => ({ ...f, image: null, imageUrl: null }));
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const analyzeComplaint = async () => {
    if (form.complaint.trim().length < 10) {
      setError('Please enter a complaint of at least 10 characters.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      let imageUrl: string | null = null;

      if (form.image) {
        const ext = form.image.name.split('.').pop() || 'jpg';
        const fileName = `complaint-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('complaint-images')
          .upload(fileName, form.image);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('complaint-images')
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
        setForm((f) => ({ ...f, imageUrl }));
      }

      const { data, error: fnError } = await supabase.functions.invoke('analyze-complaint', {
        body: {
          description: form.complaint.trim(),
          location: form.location.trim(),
          ...(imageUrl ? { image_url: imageUrl } : {}),
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to analyze complaint.');
      }

      if (!data || !data.issue || !data.category || !data.department || !data.severity || !data.reason) {
        throw new Error('AI returned an incomplete analysis. Please try again.');
      }

      const validCategories: ComplaintCategory[] = ['Waste Management', 'Roads', 'Electrical', 'Water', 'Drainage', 'Other'];
      const validSeverities: Severity[] = ['Low', 'Medium', 'High'];

      const result: AnalysisResult = {
        issue: data.issue,
        category: validCategories.includes(data.category) ? data.category : 'Other',
        department: data.department,
        severity: validSeverities.includes(data.severity) ? data.severity : 'Low',
        reason: data.reason,
      };

      setAnalysis(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze complaint. Please try again.';
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const submitComplaint = async () => {
    setSubmitting(true);
    setError(null);

    let aiCategory: ComplaintCategory = 'Other';
    let aiSeverity: Severity = 'Medium';
    let aiDepartment = 'General Municipal Services';
    let aiIssue = form.complaint.trim();
    let aiReason = form.complaint.trim();

    if (analysis) {
      aiCategory = analysis.category || aiCategory;
      aiSeverity = analysis.severity || aiSeverity;
      aiDepartment = analysis.department || aiDepartment;
      aiIssue = analysis.issue || aiIssue;
      aiReason = analysis.reason || aiReason;
    }

    try {
      const trackingId = generateTrackingId();
      const { error: insertError } = await supabase.from('complaints').insert({
        complaint_text: form.complaint.trim(),
        location: form.location.trim(),
        image_url: form.imageUrl || null,
        issue: aiIssue,
        category: aiCategory,
        department: aiDepartment,
        severity: aiSeverity,
        reason: aiReason,
        status: 'Submitted',
        tracking_id: trackingId,
      });

      if (insertError) throw insertError;
      setSubmittedId(trackingId);
    } catch (err) {
      console.error('Supabase insert error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ complaint: '', location: '', image: null, imageUrl: null });
    setAnalysis(null);
    setSubmittedId(null);
    setImagePreview(null);
    setError(null);
  };

  if (submittedId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Complaint Submitted</h2>
          <p className="text-slate-500 mb-6">Your complaint has been registered and routed to the relevant department.</p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-500 mb-1">Your Tracking ID</p>
            <p className="text-2xl font-bold text-slate-900 tracking-wider">{submittedId}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('track', { id: submittedId })}
              className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all"
            >
              Track This Complaint
            </button>
            <button
              onClick={resetForm}
              className="flex-1 px-6 py-3 bg-white text-slate-700 rounded-xl font-medium border border-slate-200 hover:border-slate-300 transition-all"
            >
              Report Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-3xl mx-auto px-6 pt-20 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('landing')}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Report an Issue</h1>
            <p className="text-sm text-slate-500">Describe the problem and let AI route it to the right department.</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
          <div className="space-y-6">
            {/* Complaint textarea */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Complaint
              </label>
              <textarea
                value={form.complaint}
                onChange={(e) => setForm((f) => ({ ...f, complaint: e.target.value }))}
                placeholder="There is garbage accumulating near the main road..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none text-slate-700 placeholder:text-slate-400"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. MG Road, Sector 14, near City Mall"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-700 placeholder:text-slate-400"
              />
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Image <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-40 w-auto rounded-xl border border-slate-200" />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all w-full text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                    <ImagePlus className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Upload a photo</p>
                    <p className="text-xs text-slate-400">JPG, PNG up to 5 MB</p>
                  </div>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Analyze button */}
            <button
              onClick={analyzeComplaint}
              disabled={analyzing}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Complaint...
                </>
              ) : (
                <>
                  <Bot className="w-5 h-5" />
                  Analyze Complaint
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Analysis Card */}
        {analyzing && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="p-10 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
              <p className="font-semibold text-slate-900">Analyzing Complaint...</p>
              <p className="text-xs text-slate-500 mt-1">Contacting AI edge service to classify issue, department, and severity</p>
            </div>
          </div>
        )}

        {error && !analyzing && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden mb-6">
            <div className="p-5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-700 text-sm">Analysis Failed</p>
                <p className="text-xs text-slate-600 mt-1">{error}</p>
                <button
                  onClick={submitComplaint}
                  disabled={submitting}
                  className="mt-3 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Anyway'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {analysis && !analyzing && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 animate-[fadeIn_0.4s_ease]">
            <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">AI Analysis</h3>
                <p className="text-xs text-slate-500">Automated classification & routing</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <AnalysisRow icon={<FileText className="w-4 h-4" />} label="Issue" value={analysis.issue} />
              <AnalysisRow icon={<Tag className="w-4 h-4" />} label="Category" value={analysis.category} />
              <AnalysisRow icon={<Building className="w-4 h-4" />} label="Department" value={analysis.department} />
              <AnalysisRow icon={<MapPin className="w-4 h-4" />} label="Location" value={form.location || 'Not specified'} />
              <div className="flex items-start gap-3 py-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Severity</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${SEVERITY_COLORS[analysis.severity as Severity].bg} ${SEVERITY_COLORS[analysis.severity as Severity].text} ${SEVERITY_COLORS[analysis.severity as Severity].border}`}>
                      <span className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[analysis.severity as Severity].dot}`} />
                      {analysis.severity}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2 border-t border-slate-100 pt-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Reason</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{analysis.reason}</p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="px-6 pb-6">
              <button
                onClick={submitComplaint}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Complaint
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalysisRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-slate-500">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}
