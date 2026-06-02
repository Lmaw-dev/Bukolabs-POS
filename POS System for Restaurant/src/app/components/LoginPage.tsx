import { useState } from 'react';
import { UserRole } from '../App';
import { User, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import logo from '../../imports/logo1.png';

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === 'admin' && password === 'admin123') {
      onLogin('admin');
    } else if ((username === 'staff' || username === 'cashier') && password === 'staff123') {
      onLogin('staff');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
      }}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Glass-morphism login card */}
      <div
        className="relative z-10 rounded-2xl shadow-2xl p-8 w-full max-w-md backdrop-blur-xl"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src={logo} alt="N&Ns Logo" className="w-32 h-32 object-contain" />
          </div>
          <h1
            className="text-[28px] mb-2"
            style={{
              color: '#f1f5f9',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.02em'
            }}
          >
            N&Ns POS System
          </h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Sign in to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block mb-2 text-sm"
              style={{ color: '#94a3b8' }}
            >
              Username
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: '#64748b' }}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f1f5f9'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter username"
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
                style={{ color: '#64748b' }}
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
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)';
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
                style={{ color: '#64748b' }}
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
            className="w-full py-3 rounded-xl text-white transition-all"
            style={{
              background: '#10b981',
              fontWeight: 600
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#059669';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#10b981';
            }}
          >
            Sign In
          </button>
        </form>

        {/* Demo credentials */}
        <div
          className="mt-6 p-4 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <p
            className="text-xs mb-3"
            style={{ color: '#475569' }}
          >
            Demo Accounts
          </p>

          <div className="space-y-2">
            {/* Admin pill */}
            <div
              className="flex items-center justify-between p-3 rounded-lg"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#7c3aed' }}
                />
                <span className="text-sm" style={{ color: '#94a3b8' }}>Admin</span>
              </div>
              <div className="text-xs" style={{ color: '#475569' }}>
                admin / admin123
              </div>
            </div>

            {/* Cashier pill */}
            <div
              className="flex items-center justify-between p-3 rounded-lg"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#0284c7' }}
                />
                <span className="text-sm" style={{ color: '#94a3b8' }}>Cashier</span>
              </div>
              <div className="text-xs" style={{ color: '#475569' }}>
                staff / staff123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
