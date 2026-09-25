import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Brain, Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';

export const Register = () => {
  const { signUp, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated && !authLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName.trim()) {
      errs.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setGeneralError('');

    try {
      const data = await signUp({
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim()
      });

      // Check if session is established or if email confirmation is required
      if (data?.session) {
        navigate('/dashboard', { replace: true });
      } else {
        // Supabase requires email confirmation before establishing session
        setEmailConfirmationRequired(true);
      }
    } catch (err) {
      console.error('Registration error:', err);
      let message = 'Failed to create student account. Please try again.';
      if (err.message) {
        if (err.message.includes('User already registered')) {
          message = 'An account with this email address already exists. Please sign in instead.';
        } else if (err.message.includes('Password should be')) {
          message = 'Password is too weak. Please use at least 6 characters.';
        } else {
          message = err.message;
        }
      }
      setGeneralError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // State: Email confirmation prompt
  if (emailConfirmationRequired) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900">
        <div className="w-full sm:max-w-md">
          <Card className="bg-white border-slate-200/90 shadow-xl p-8 rounded-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              We have sent a verification email to{' '}
              <span className="font-semibold text-slate-900">{formData.email}</span>. Please click the confirmation link in the email to activate your account.
            </p>
            <div className="space-y-3">
              <Link to="/login" className="block w-full">
                <Button variant="primary" size="lg" className="w-full shadow-md shadow-indigo-600/20">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform text-white">
            <Brain className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            AI Study<span className="text-indigo-600">Planner</span>
          </span>
        </Link>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
          Create student account
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Join to experience adaptive B.Tech CSE study planning
        </p>
      </div>

      <div className="w-full sm:max-w-md">
        <Card className="bg-white border-slate-200/90 shadow-xl p-8 rounded-2xl">
          {generalError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Rahul Sharma"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                    errors.fullName
                      ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                      : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rahul@college.edu"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                    errors.email
                      ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                      : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className={`w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                      : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={`w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                    errors.confirmPassword
                      ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                      : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-3 font-semibold shadow-md shadow-indigo-600/25"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
              {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
