import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Brain,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Calendar,
  Target,
  ShieldCheck,
  GraduationCap,
  ArrowLeft,
  Flame,
  Zap,
  Clock,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';

export const Login = ({ initialMode = 'signin' }) => {
  const { signIn, signUp, isAuthenticated, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'signin' | 'signup'
  const [mode, setMode] = useState(initialMode);

  // Sign In State
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up State
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    branch: 'Computer Science & Engineering',
    semester: 6
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  // Status & errors
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickLoginRole, setQuickLoginRole] = useState(null);

  // If already authenticated, redirect
  if (isAuthenticated && !authLoading) {
    const destination = location.state?.from?.pathname || (isAdmin ? '/admin' : '/dashboard');
    return <Navigate to={destination} replace />;
  }

  // Handle Sign In Input
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (generalError) setGeneralError('');
  };

  const validateLogin = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!loginData.email.trim()) {
      errs.loginEmail = 'Email is required';
    } else if (!emailRegex.test(loginData.email.trim())) {
      errs.loginEmail = 'Valid email required';
    }
    if (!loginData.password) {
      errs.loginPassword = 'Password is required';
    } else if (loginData.password.length < 6) {
      errs.loginPassword = 'Minimum 6 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin() || isSubmitting) return;

    setIsSubmitting(true);
    setGeneralError('');

    try {
      const res = await signIn({
        email: loginData.email.trim(),
        password: loginData.password
      });

      const userRole = res?.user?.role || res?.session?.user?.role || 'student';
      const targetDestination = location.state?.from?.pathname || (userRole === 'admin' ? '/admin' : '/dashboard');
      navigate(targetDestination, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      let message = 'Failed to sign in. Please check your credentials.';
      if (err.message) {
        if (err.message.includes('Invalid') || err.message.includes('INVALID_CREDENTIALS')) {
          message = 'Invalid email or password. Please verify and retry.';
        } else if (err.message.includes('Email not confirmed')) {
          message = 'Your email address is not confirmed yet.';
        } else {
          message = err.message;
        }
      }
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Sign Up Input
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (generalError) setGeneralError('');
  };

  const validateRegister = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!registerData.fullName.trim()) {
      errs.fullName = 'Full name is required';
    }
    if (!registerData.email.trim()) {
      errs.registerEmail = 'Email is required';
    } else if (!emailRegex.test(registerData.email.trim())) {
      errs.registerEmail = 'Valid email required';
    }
    if (!registerData.password) {
      errs.registerPassword = 'Password is required';
    } else if (registerData.password.length < 6) {
      errs.registerPassword = 'At least 6 characters';
    }
    if (!registerData.confirmPassword) {
      errs.confirmPassword = 'Confirm your password';
    } else if (registerData.password !== registerData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegister() || isSubmitting) return;

    setIsSubmitting(true);
    setGeneralError('');

    try {
      const res = await signUp({
        email: registerData.email.trim(),
        password: registerData.password,
        fullName: registerData.fullName.trim(),
        role: 'student',
        branch: registerData.branch,
        semester: Number(registerData.semester)
      });

      if (res?.confirmationRequired) {
        setEmailConfirmationRequired(true);
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Registration error:', err);
      let message = 'Registration failed. Please verify your details.';
      if (err.message) {
        if (err.message.includes('already registered')) {
          message = 'This email is already registered. Please sign in instead.';
        } else {
          message = err.message;
        }
      }
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1-Click Instant Demo Login
  const handleQuickLogin = async (roleType) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setQuickLoginRole(roleType);
    setGeneralError('');

    const credentials =
      roleType === 'admin'
        ? { email: 'wopipi3442@omanarts.com', password: 'Admin@123', redirect: '/admin' }
        : { email: 'student@gmail.com', password: 'Student@123', redirect: '/dashboard' };

    try {
      await signIn({
        email: credentials.email,
        password: credentials.password
      });

      navigate(credentials.redirect, { replace: true });
    } catch (err) {
      console.error('Quick demo login error:', err);
      setGeneralError(`Quick login failed: ${err.message || 'Please retry.'}`);
    } finally {
      setIsSubmitting(false);
      setQuickLoginRole(null);
    }
  };

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-slate-50 flex flex-col justify-between select-none relative">
      {/* Dynamic Ambient Glows */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-indigo-200/35 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-violet-200/35 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

      {/* 1. Header (Clean & balanced) */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between shrink-0">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 block leading-none">
              AI Study<span className="text-indigo-600">Planner</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Adaptive Academic OS
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Platform Active</span>
          </div>
          <Link
            to="/"
            className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* 2. Main Center Card (Expanded proportions, no awkward empty borders) */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-2 min-h-0">
        <div className="w-full max-w-5xl h-full max-h-[610px] bg-white border border-slate-200 rounded-3xl shadow-xl shadow-indigo-950/5 overflow-hidden flex flex-col md:flex-row relative">
          
          {/* ================= PANEL 1: SIGN IN (LEFT) ================= */}
          <div
            className={`w-full md:w-1/2 p-6 sm:p-9 flex flex-col justify-between transition-all duration-500 overflow-y-auto ${
              mode === 'signin' ? 'opacity-100 z-10' : 'md:opacity-20 max-md:hidden'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  <Lock className="w-3.5 h-3.5" />
                  Sign In
                </span>
                <span className="text-xs font-semibold text-slate-400">Student Portal</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-4">
                Log in to resume your active timetable and study sessions.
              </p>

              {generalError && mode === 'signin' && (
                <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{generalError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5" noValidate>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      name="email"
                      type="email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      placeholder="student@gmail.com"
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                        errors.loginEmail ? 'border-red-400 focus:ring-red-400/20' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                  {errors.loginEmail && <p className="mt-1 text-xs text-red-600 font-semibold">{errors.loginEmail}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Password</label>
                    <span className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer">
                      Forgot password?
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      name="password"
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={handleLoginChange}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                        errors.loginPassword ? 'border-red-400 focus:ring-red-400/20' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.loginPassword && <p className="mt-1 text-xs text-red-600 font-semibold">{errors.loginPassword}</p>}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting && !quickLoginRole}
                  className="w-full justify-center shadow-md shadow-indigo-600/20 font-bold py-2.5 rounded-xl text-xs sm:text-sm mt-2"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>
            </div>

            {/* ⚡ 1-Click Quick Demo Login Section */}
            <div className="pt-4 border-t border-slate-100 mt-3">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  1-Click Quick Demo Login
                </span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  Instant Access
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 🎓 Student Pass */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleQuickLogin('student')}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    quickLoginRole === 'student'
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200'
                      : 'bg-slate-50/70 border-slate-200 hover:border-indigo-400 hover:bg-white shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block leading-tight">
                      Student Demo
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate font-medium">
                      student@gmail.com
                    </span>
                  </div>
                </button>

                {/* 🛡️ Admin Pass */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleQuickLogin('admin')}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    quickLoginRole === 'admin'
                      ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-200'
                      : 'bg-slate-50/70 border-slate-200 hover:border-amber-400 hover:bg-white shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="w-2 h-2 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block leading-tight">
                      Admin Console
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate font-medium">
                      Platform Control
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Mobile Switch Button */}
            <div className="md:hidden mt-3 text-center">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Need an account? Create one here →
              </button>
            </div>
          </div>

          {/* ================= PANEL 2: SIGN UP (RIGHT) ================= */}
          <div
            className={`w-full md:w-1/2 p-6 sm:p-9 flex flex-col justify-between transition-all duration-500 overflow-y-auto ${
              mode === 'signup' ? 'opacity-100 z-10' : 'md:opacity-20 max-md:hidden'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                  <User className="w-3.5 h-3.5" />
                  Sign Up
                </span>
                <span className="text-xs font-semibold text-slate-400">New Registration</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Create student account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-4">
                Initialize your branch syllabus and automated timetable.
              </p>

              {generalError && mode === 'signup' && (
                <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{generalError}</span>
                </div>
              )}

              {emailConfirmationRequired ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Check Your Email</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Verification link sent. Once confirmed, you can sign in to your study dashboard.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmailConfirmationRequired(false);
                      setMode('signin');
                    }}
                  >
                    Go to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3" noValidate>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      name="fullName"
                      type="text"
                      value={registerData.fullName}
                      onChange={handleRegisterChange}
                      placeholder="e.g. Rahul Sharma"
                      className={`w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                        errors.fullName ? 'border-red-400 focus:ring-red-400/20' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600'
                      }`}
                    />
                    {errors.fullName && <p className="mt-1 text-xs text-red-600 font-semibold">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">University Email</label>
                    <input
                      name="email"
                      type="email"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      placeholder="rahul@college.edu"
                      className={`w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                        errors.registerEmail ? 'border-red-400 focus:ring-red-400/20' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600'
                      }`}
                    />
                    {errors.registerEmail && <p className="mt-1 text-xs text-red-600 font-semibold">{errors.registerEmail}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Branch</label>
                      <select
                        name="branch"
                        value={registerData.branch}
                        onChange={handleRegisterChange}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      >
                        <option value="Computer Science & Engineering">CSE</option>
                        <option value="Information Technology">IT</option>
                        <option value="Electronics & Communication">ECE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                      <select
                        name="semester"
                        value={registerData.semester}
                        onChange={handleRegisterChange}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                      <div className="relative">
                        <input
                          name="password"
                          type={showRegisterPassword ? 'text' : 'password'}
                          value={registerData.password}
                          onChange={handleRegisterChange}
                          placeholder="••••••••"
                          className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                            errors.registerPassword ? 'border-red-400' : 'border-slate-200 focus:ring-indigo-500/20'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Confirm</label>
                      <div className="relative">
                        <input
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={registerData.confirmPassword}
                          onChange={handleRegisterChange}
                          placeholder="••••••••"
                          className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                            errors.confirmPassword ? 'border-red-400' : 'border-slate-200 focus:ring-indigo-500/20'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSubmitting}
                    className="w-full justify-center shadow-md shadow-indigo-600/20 font-bold py-2.5 rounded-xl text-xs sm:text-sm mt-1"
                  >
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </form>
              )}
            </div>

            {/* Mobile Switch Button */}
            <div className="md:hidden mt-3 text-center">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Already have an account? Sign In →
              </button>
            </div>
          </div>

          {/* ================= SLIDING CONTENT OVERLAY (DESKTOP ONLY) ================= */}
          <div
            className={`hidden md:flex absolute top-0 bottom-0 left-0 w-1/2 z-20 bg-gradient-to-br from-indigo-50/95 via-white to-violet-50/95 border-r border-slate-200/90 p-8 sm:p-10 flex-col justify-between transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-xl ${
              mode === 'signin' ? 'translate-x-full border-l border-r-0' : 'translate-x-0'
            }`}
          >
            {mode === 'signin' ? (
              /* Content shown when user is on Sign In (Overlay on RIGHT) */
              <div className="flex flex-col justify-between h-full animate-in fade-in duration-500">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black tracking-wide mb-5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    New to AI Study Planner?
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                    Take control of your university exams.
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md">
                    Generate an adaptive daily timetable that automatically balances exam countdowns, daily available hours, and restorative 10-minute rest breaks.
                  </p>

                  <div className="mt-7 space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/90 border border-slate-200 shadow-2xs">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900">Capacity-Aware Planning</p>
                        <p className="text-[11px] text-slate-500">Zero timetable conflicts or burnouts</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/90 border border-slate-200 shadow-2xs">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900">Targeted Weak Topics</p>
                        <p className="text-[11px] text-slate-500">Instant quizzes pinpoint syllabus gaps</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/90 border border-slate-200 shadow-2xs">
                      <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold shrink-0">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900">Guilt-Free Rescheduling</p>
                        <p className="text-[11px] text-slate-500">Auto moves missed blocks to buffer slots</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-200/80">
                  <p className="text-xs font-semibold text-slate-500 mb-2.5">
                    Don’t have an account yet?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setGeneralError('');
                      setErrors({});
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-black text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Create Student Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Content shown when user is on Sign Up (Overlay on LEFT) */
              <div className="flex flex-col justify-between h-full animate-in fade-in duration-500">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black tracking-wide mb-5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Already Registered?
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                    Pick up right where you left off.
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md">
                    Sign in to log completed focus sessions, view your updated study streak, and review today's adaptive recommendations.
                  </p>

                  <div className="mt-7 space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/90 border border-slate-200 shadow-2xs">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                        <Zap className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900">Instant 1-Click Access</p>
                        <p className="text-[11px] text-slate-500">Demo student and admin accounts ready</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/90 border border-slate-200 shadow-2xs">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                        <Flame className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900">Study Streak &amp; Analytics</p>
                        <p className="text-[11px] text-slate-500">Real-time mastery and progress tracking</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/90 border border-slate-200 shadow-2xs">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                        <Clock className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900">Cognitive Rest Enforced</p>
                        <p className="text-[11px] text-slate-500">Automated 10m intervals prevent burnout</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-200/80">
                  <p className="text-xs font-semibold text-slate-500 mb-2.5">
                    Already registered on the platform?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setGeneralError('');
                      setErrors({});
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-black text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Sign In to Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 3. Footer (Clean, balanced) */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-1 shrink-0">
        <p>© 2026 AI Study Planner. Built for Engineering Excellence.</p>
        <div className="flex items-center gap-4">
          <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
          <span>•</span>
          <span className="hover:text-slate-600 cursor-pointer">Security Audits</span>
          <span>•</span>
          <span className="hover:text-slate-600 cursor-pointer">Student Support</span>
        </div>
      </footer>
    </div>
  );
};

export default Login;
