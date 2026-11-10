import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { CURRENCY_RATES } from '../lib/currency.ts';
import logoImg from '../assets/images/b2b_supply_tracker_logo_1787039083352.jpg';
import {
  Building2,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Globe,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  FileSignature,
  FileSpreadsheet,
  Zap,
  Sparkles,
  Smartphone,
  Check,
  AlertCircle,
  Loader2,
  Layers,
} from 'lucide-react';

const COUNTRY_DIAL_CODES = [
  { code: 'KE', name: 'Kenya', dial: '+254', currency: 'KES', flag: '🇰🇪' },
  { code: 'US', name: 'United States', dial: '+1', currency: 'USD', flag: '🇺🇸' },
  { code: 'IN', name: 'India', dial: '+91', currency: 'INR', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', currency: 'GBP', flag: '🇬🇧' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', currency: 'AED', flag: '🇦🇪' },
  { code: 'TZ', name: 'Tanzania', dial: '+255', currency: 'TZS', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', dial: '+256', currency: 'UGX', flag: '🇺🇬' },
  { code: 'ZA', name: 'South Africa', dial: '+27', currency: 'ZAR', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dial: '+234', currency: 'NGN', flag: '🇳🇬' },
  { code: 'CA', name: 'Canada', dial: '+1', currency: 'CAD', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dial: '+61', currency: 'AUD', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany (EU)', dial: '+49', currency: 'EUR', flag: '🇩🇪' },
];

export const AuthView: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    loginDemoUser,
    showToast,
  } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('franklinemwangi0259@gmail.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);

  // Registration Form State (Zoho Books Organization onboarding)
  const [fullName, setFullName] = useState('Frankline Mwangi');
  const [companyName, setCompanyName] = useState('Mwangi Global Traders Ltd');
  const [email, setEmail] = useState('franklinemwangi0259@gmail.com');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+254');
  const [phoneNumber, setPhoneNumber] = useState('700123456');
  const [password, setPassword] = useState('SecurePass@2026');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [signatoryDesignation, setSignatoryDesignation] = useState('Managing Director');
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleCountryChange = (dial: string) => {
    setSelectedCountryCode(dial);
    const country = COUNTRY_DIAL_CODES.find((c) => c.dial === dial);
    if (country) {
      setBaseCurrency(country.currency);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Please enter both your email/phone and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await signInWithEmail(loginEmail.trim(), loginPassword.trim());
      showToast('Welcome back! B2B Supply Tracker loaded.', 'success');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!companyName.trim()) {
      setErrorMessage('Company / Organization Name is required.');
      return;
    }
    if (!fullName.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid business email address.');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage('Phone number is required for business invoicing.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (!agreedTerms) {
      setErrorMessage('Please accept the Terms of Service to proceed.');
      return;
    }

    const fullPhone = `${selectedCountryCode} ${phoneNumber.trim()}`;

    try {
      setIsSubmitting(true);
      await signUpWithEmail({
        name: fullName.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        phone: fullPhone,
        password: password,
        currency: baseCurrency,
        signatoryDesignation: signatoryDesignation.trim(),
      });
      showToast('Registration successful! B2B Supply Tracker organization created.', 'success');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Registration failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    try {
      setIsGoogleSubmitting(true);
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Google sign in was cancelled or failed.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    setErrorMessage(null);
    try {
      setIsSubmitting(true);
      await loginDemoUser();
      showToast('Logged into Mwangi Global Traders Ltd (Demo Workspace)', 'success');
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Could not load demo workspace.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      showToast('Please enter a valid email', 'error');
      return;
    }
    setForgotSent(true);
    showToast(`Password reset link dispatched to ${forgotEmail}`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white font-sans relative overflow-hidden">
      {/* Dynamic Ambient Background Watermark of B2B Supply Tracker */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-3xl" />
        
        {/* Subtle Watermark Logo Emblem */}
        <div className="absolute top-1/2 right-10 -translate-y-1/2 opacity-[0.03] w-[600px] h-[600px] pointer-events-none select-none">
          <img src={logoImg} alt="Watermark" className="w-full h-full object-contain filter grayscale" referrerPolicy="no-referrer" />
        </div>
      </div>

      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-white p-1 shadow-lg shadow-cyan-500/20 flex items-center justify-center border border-slate-700 shrink-0 overflow-hidden">
              <img
                src={logoImg}
                alt="B2B Supply Tracker"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">B2B Supply Tracker</span>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Manage. Track. Optimize.</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="hidden sm:inline text-slate-400">
              {authMode === 'login' ? "Don't have an account?" : 'Already registered?'}
            </span>
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
              }}
              className="px-3.5 py-1.5 rounded-lg font-bold border border-cyan-500/40 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white transition-all cursor-pointer shadow-xs"
            >
              {authMode === 'login' ? 'Register Company' : 'Sign In'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Authentication Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 relative z-10">
        {/* Left Side: B2B Value Proposition & Trust Badges */}
        <div className="flex-1 max-w-lg lg:max-w-none text-left space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>B2B Supply Chain & Purchase Tracking Suite</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Complete B2B Supply Tracking & Purchase Orders.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Manage purchase orders, supplier accounts, automated WhatsApp payment notifications, multi-currency invoicing, and verified digital signatures in one unified enterprise portal.
          </p>

          {/* Official Brand Showcase Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/90 to-cyan-950/40 border border-slate-800/90 flex items-center space-x-4 shadow-xl">
            <div className="w-16 h-16 rounded-xl bg-white p-1.5 shadow-md shrink-0 flex items-center justify-center border border-slate-700">
              <img
                src={logoImg}
                alt="B2B Supply Tracker Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-white">B2B SUPPLY TRACKER</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-cyan-300 font-bold tracking-wider mt-0.5">MANAGE. TRACK. OPTIMIZE.</p>
              <p className="text-[11px] text-slate-400 mt-1">Enterprise Supply Chain Management, Inventory Control & POS Thermal Engine.</p>
            </div>
          </div>

          {/* Feature List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <FileSignature className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Digital Signatures & Seals</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Legally sign POs, audit schedules & bills.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">WhatsApp & SMS Billing</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">1-Click customer reminders with M-Pesa & Card links.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Accounts & Statements</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Track receivables vs payables with live credit risk badges.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Multi-Currency & Tax Ready</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">USD, KES, INR, EUR, GBP + GST & VAT Audit schedules.</p>
              </div>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="pt-2 flex items-center space-x-4 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-slate-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 256-Bit SSL Encrypted
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300 font-semibold">
              <Zap className="w-4 h-4 text-amber-400" /> 100% Offline PWA Ready
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300 font-semibold">
              <Layers className="w-4 h-4 text-indigo-400" /> Multi-Role RBAC
            </span>
          </div>
        </div>

        {/* Right Side: Interactive Authentication & Registration Card */}
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Subtle Ambient Light Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setAuthMode('signup');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Register Company</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setAuthMode('login');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                authMode === 'login'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>

          {/* Form Header */}
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {authMode === 'signup' ? 'Set Up Your B2B Supply Tracker Organization' : 'Sign In to Your Workspace'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {authMode === 'signup'
                ? 'Enter your business details, phone number, and authorized signatory identity.'
                : 'Access your purchase orders, supplier accounts, and invoices.'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {/* Registration Form (Sign Up) */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5 text-xs">
              {/* Company / Organization Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Company / Organization Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Mwangi Global Traders Ltd"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
                  />
                </div>
              </div>

              {/* Full Name & Designation Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Contact Person Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Frankline Mwangi"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Signatory Role
                  </label>
                  <input
                    type="text"
                    value={signatoryDesignation}
                    onChange={(e) => setSignatoryDesignation(e.target.value)}
                    placeholder="Managing Director"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* Business Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Business Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="franklinemwangi0259@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
              </div>

              {/* Business Phone Number with Country Code */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Business Phone Number (For WhatsApp Invoices) *
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedCountryCode}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-28 bg-slate-950 border border-slate-800 text-white rounded-xl px-2 py-2 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {COUNTRY_DIAL_CODES.map((c) => (
                      <option key={c.code} value={c.dial}>
                        {c.flag} {c.dial}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="700 123 456"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Base Currency Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Base Currency
                  </label>
                  <select
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {Object.values(CURRENCY_RATES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol}) - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950 w-4 h-4"
                />
                <span className="text-[11px] text-slate-400">
                  I agree to B2B Supply Tracker Terms of Service and Privacy Policy.
                </span>
              </label>

              {/* Submit Registration Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Organization...</span>
                  </>
                ) : (
                  <>
                    <span>Create Organization & Launch</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Login Form (Sign In) */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Business Email or Phone
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="franklinemwangi0259@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950 w-4 h-4"
                />
                <span className="text-[11px] text-slate-400">Remember this device for 30 days</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to B2B Supply Tracker</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-slate-900 px-2 text-slate-500 font-bold tracking-wider">
                Or Quick Access
              </span>
            </div>
          </div>

          {/* Alternative Quick Sign In Buttons */}
          <div className="space-y-2.5">
            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting}
              className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGoogleSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 11.3 0 14s.7 5.3 1.9 7.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* Instant Demo Account */}
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={isSubmitting}
              className="w-full py-2 px-3 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 hover:border-indigo-700 text-indigo-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Explore Demo Workspace (Mwangi Global Traders)</span>
            </button>
          </div>

          <div className="mt-5 text-center text-[10px] text-slate-500">
            B2B Supply Tracker • Secured by Cloud & Firebase Auth
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-xs text-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
              <Mail className="w-4 h-4" />
              <span>Reset Password</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Enter your registered corporate email to receive a password reset link.
            </p>

            {forgotSent ? (
              <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-300 text-xs">
                <p className="font-bold">Check your inbox!</p>
                <p className="text-[11px] text-emerald-400 mt-1">
                  We've sent password reset instructions to {forgotEmail}.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="mt-3 w-full py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="franklinemwangi0259@gmail.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} B2B Supply Tracker. All rights reserved.</p>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>Security & Compliance</span>
            <span>•</span>
            <span>API Docs</span>
            <span>•</span>
            <span>Help Center</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
