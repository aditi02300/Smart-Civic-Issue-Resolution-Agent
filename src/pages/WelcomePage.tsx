import { useEffect, useState } from 'react';
import { Building2, ArrowRight, LogIn, Trash2, Wrench, Zap, Droplets, Activity, MapPin } from 'lucide-react';
import { navigate } from '@/lib/router';
import { useAuth } from '@/lib/auth';

export default function WelcomePage() {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => { setMounted(true); }, []);

  const features = [
    { icon: Trash2, label: 'Waste Management', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Wrench, label: 'Roads', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Zap, label: 'Electrical', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: Droplets, label: 'Water', color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { icon: Activity, label: 'Drainage', color: 'text-teal-600', bg: 'bg-teal-50' },
    { icon: MapPin, label: 'Other', color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center justify-center min-h-screen px-6 py-16">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <Building2 className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-slate-600">Civic Issue Resolution Platform</span>
        </div>

        {/* Title */}
        <h1
          className={`text-5xl md:text-7xl font-bold text-center text-slate-900 mb-4 tracking-tight transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          Smart Civic Issue
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            Resolution Agent
          </span>
        </h1>

        {/* Tagline */}
        <p
          className={`text-lg md:text-xl text-slate-500 mb-6 font-light tracking-wide transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          Report. Understand. Route. Resolve.
        </p>

        {/* Description */}
        <p
          className={`text-base text-slate-500 text-center max-w-xl leading-relaxed mb-12 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          A platform that helps citizens report civic issues in their community and get them
          automatically routed to the right department for faster resolution — from waste
          management to road repairs, water supply, and more.
        </p>

        {/* Buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-4 mb-16 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <button
            onClick={() => navigate('auth', { mode: 'signup' })}
            className="group flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all hover:scale-105 hover:shadow-xl"
          >
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate('auth', { mode: 'signin' })}
            className="group flex items-center gap-2 px-8 py-4 bg-white text-slate-700 rounded-xl font-medium border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all hover:scale-105"
          >
            <LogIn className="w-4 h-4 text-slate-500" />
            Sign In
          </button>
        </div>

        {/* Category icons */}
        <div
          className={`flex flex-wrap items-center justify-center gap-3 max-w-2xl transition-all duration-700 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        >
          {features.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/70 backdrop-blur-sm rounded-full border border-slate-200/60 hover:shadow-md transition-all hover:scale-105"
            >
              <div className={`w-7 h-7 rounded-full ${f.bg} flex items-center justify-center`}>
                <f.icon className={`w-4 h-4 ${f.color}`} />
              </div>
              <span className="text-sm font-medium text-slate-600">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Already signed in indicator */}
        {!loading && user && (
          <div
            className={`mt-8 transition-all duration-700 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          >
            <button
              onClick={() => navigate('landing')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              You're already signed in — go to dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
