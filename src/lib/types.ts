export type UserRole = 'citizen' | 'admin';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export type Severity = 'Low' | 'Medium' | 'High';

export type ComplaintCategory =
  | 'Waste Management'
  | 'Roads'
  | 'Electrical'
  | 'Water'
  | 'Drainage'
  | 'Other';

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export interface AnalysisResult {
  issue: string;
  category: ComplaintCategory;
  department: string;
  severity: Severity;
  reason: string;
}

export interface Complaint {
  id: string;
  complaint_text: string;
  location: string;
  image_url: string | null;
  issue: string | null;
  category: ComplaintCategory | null;
  department: string | null;
  severity: Severity | null;
  reason: string | null;
  status: ComplaintStatus;
  tracking_id: string;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_DEPARTMENT_MAP: Record<string, string> = {
  'Waste Management': 'Municipal Sanitation Department',
  'Roads': 'Public Works/Roads Department',
  'Electrical': 'Electrical Department',
  'Water': 'Water Board',
  'Drainage': 'Public Works',
  'Other': 'General Municipal Services',
};

export const STATUS_OPTIONS: ComplaintStatus[] = [
  'Submitted',
  'Under Review',
  'In Progress',
  'Resolved',
  'Rejected',
];

export function generateTrackingId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'CIV-';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; border: string; dot: string }> = {
  High: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  Medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  Low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
};

export const STATUS_COLORS: Record<ComplaintStatus, { bg: string; text: string; border: string; dot: string }> = {
  'Submitted': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  'Under Review': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  'In Progress': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  'Resolved': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Rejected': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' },
};
