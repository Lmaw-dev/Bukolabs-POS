import { useState } from 'react';
import type { AuthenticatedUser } from '../types/auth';
import { login } from '../services/auth';
import { User, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import logo from '../../imports/logo1.png';

interface LoginPageProps {
  onLogin: (user: AuthenticatedUser) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await login(email.trim(), password);
      onLogin(user);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4"
      style={{
        background: 'linear-gradient(135deg, #003534 0%, #005656 50%, #003534 100%)'
      }}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute left-[20%] top-[10%] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full opacity-10 blur-3xl"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(0,122,94,0.28), rgba(0,122,94,0.08) 48%, transparent 75%)',
            animation: 'blobMorph 22s ease-in-out infinite'
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,122,94,0.05)] to-transparent" />
        <div className="absolute left-1/2 top-20 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-[rgba(0,122,94,0.05)] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 bg-cyan-400/5 blur-3xl" />
      </div>

      {/* Glass-morphism login card */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl p-8 shadow-2xl backdrop-blur-xl"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        {/* Header */}
        <div className="mb-1 text-center">
          <div
            className="mx-auto mb-2 flex h-32 w-32 items-center justify-center"
          >
            <img src={logo} alt="N&Ns Logo" className="h-32 w-32 object-contain" />
          </div>
          <h1
            className="mb-2 text-[28px]"
            style={{
              color: '#f1f5f9',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              letterSpacing: 0
            }}
          >
            Sign In
          </h1>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Log in to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              className="block mb-2 text-sm"
              style={{ color: '#94a3b8' }}
            >
              Email
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: '#94a3b8' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f1f5f9'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#008967';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,137,103,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div>
            <label
              className="block mb-2 text-sm"
              style={{ color: '#94a3b8' }}
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: '#94a3b8' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f1f5f9'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#008967';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0,137,103,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                style={{ color: '#94a3b8' }}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#fca5a5'
              }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-white transition-all disabled:cursor-not-allowed disabled:opacity-70 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #008967 0%, #003534 100%)',
              fontWeight: 600
            }}
            disabled={isSubmitting}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #00a777 0%, #005656 100%)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 208, 132, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #008967 0%, #003534 100%)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
            onMouseDown={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 208, 132, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1), inset 0 2px 5px rgba(0, 0, 0, 0.3)';
                const ripple = document.createElement('span');
                ripple.className = 'absolute rounded-full bg-white/30 animate-ripple';
                const rect = e.currentTarget.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                e.currentTarget.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
              }
            }}
            onMouseUp={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 208, 132, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes blobMorph {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
            border-radius: 44% 56% 52% 48% / 50% 52% 48% 50%;
          }
          33% {
            transform: translate(18px, -14px) scale(1.05);
            border-radius: 56% 44% 47% 53% / 54% 46% 54% 46%;
          }
          66% {
            transform: translate(-16px, 18px) scale(0.95);
            border-radius: 47% 53% 55% 45% / 48% 52% 44% 56%;
          }
        }
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animate-ripple {
          animation: ripple 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
