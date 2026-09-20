import { useRouter } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import { AuthProvider } from '@/lib/auth';
import WelcomePage from '@/pages/WelcomePage';
import LandingPage from '@/pages/LandingPage';
import ReportPage from '@/pages/ReportPage';
import TrackPage from '@/pages/TrackPage';
import AdminDashboard from '@/pages/AdminDashboard';
import AuthPage from '@/pages/AuthPage';
import UserBar from '@/components/UserBar';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { page } = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Public pages: welcome and auth are visible to anyone
  if (page === 'welcome') return <WelcomePage />;
  if (page === 'auth') return <AuthPage />;

  // Everything else requires sign-in
  if (!user) return <WelcomePage />;

  return (
    <>
      <UserBar />
      {page === 'report' && <ReportPage />}
      {page === 'track' && <TrackPage />}
      {page === 'admin' && <AdminDashboard />}
      {page === 'landing' && <LandingPage />}
      {page !== 'report' && page !== 'track' && page !== 'admin' && page !== 'landing' && <LandingPage />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
