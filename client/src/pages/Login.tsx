import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMutation } from '@apollo/client/react';
import { LOGIN_MUTATION } from '@/graphql/mutations';
import { UserRole } from '@/types';
import { Loader2, AlertCircle, GraduationCap, User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, token, userRole } = useAuth();

  useEffect(() => {
    if (token) {
      if (userRole === UserRole.FACULTY) {
        navigate('/faculty-dashboard', { replace: true });
      } else {
        navigate('/student-dashboard', { replace: true });
      }
    }
  }, [token, userRole, navigate]);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [loginMutation, { loading: isLoading }] = useMutation<{ login: { token: string; user: any } }>(LOGIN_MUTATION, {
    onCompleted: (data) => {
      const { token, user } = data.login;
      login(user.role as UserRole, token, user);
      if (user.role === UserRole.FACULTY) {
        navigate('/faculty-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    },
    onError: (err: any) => {
      const code = err.graphQLErrors?.[0]?.extensions?.code;
      if (code === 'USER_NOT_FOUND') {
        setError('User not found. Redirecting to registration...');
        setTimeout(() => {
          navigate('/register');
        }, 2000);
      } else {
        setError(err.message || 'Invalid credentials');
      }
    }
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (identifier.includes('@') && !identifier.toLowerCase().endsWith('@ldce.ac.in')) {
      setError('Email must be an @ldce.ac.in address');
      return;
    }

    loginMutation({
      variables: {
        input: {
          identifier: identifier.trim(),
          password
        }
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgPrimary p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-card/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative z-10">
        {/* Header */}
        <div className="p-8 text-center border-b border-white/5 bg-black/20">
          <div className="w-16 h-16 bg-gradient-to-br from-accent to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/20 rotate-3">
            <GraduationCap className="text-white w-8 h-8 -rotate-3" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-textSecondary mt-2 text-sm">Sign in to SmartCampus Portal</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">
                  Email or Enrollment Number
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 h-5 w-5 text-textSecondary group-focus-within:text-accent transition-colors" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-textSecondary/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    placeholder="230280..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-textSecondary group-focus-within:text-accent transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white placeholder-textSecondary/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-textSecondary hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-error text-sm p-3 bg-error/10 border border-error/20 rounded-lg animate-pulse">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-accent hover:bg-accent/90 text-bgPrimary font-bold rounded-xl shadow-lg shadow-accent/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-4">
            <p className="text-sm text-textSecondary">New to SmartCampus?</p>
            <Link
              to="/register"
              className="w-full inline-flex items-center justify-center space-x-2 py-3 border border-white/10 rounded-xl text-white hover:bg-white/5 transition-colors group"
            >
              <span>Create New Account</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
