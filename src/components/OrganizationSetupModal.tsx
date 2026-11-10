import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  X,
  Sparkles,
  PenTool,
  ShieldCheck,
  Globe,
  Briefcase,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { OrganizationProfile } from '../types.ts';
import { SignaturePad } from './SignaturePad.tsx';
import { CURRENCY_RATES } from '../lib/currency.ts';

interface OrganizationSetupModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMandatoryOnboarding?: boolean;
}

export const OrganizationSetupModal: React.FC<OrganizationSetupModalProps> = ({
  isOpen,
  onClose,
  isMandatoryOnboarding = false,
}) => {
  const {
    organizationProfile,
    updateOrganizationProfile,
    isOrgModalOpen,
    setIsOrgModalOpen,
    showToast,
    currency,
    setCurrency,
  } = useApp();

  const showModal = isOpen !== undefined ? isOpen : isOrgModalOpen;

  const [formData, setFormData] = useState<OrganizationProfile>({
    id: organizationProfile?.id || 'org-main',
    companyName: organizationProfile?.companyName || '',
    phone: organizationProfile?.phone || '',
    email: organizationProfile?.email || '',
    industry: organizationProfile?.industry || 'Wholesale & Distribution',
    businessType: organizationProfile?.businessType || 'Private Limited',
    addressStreet: organizationProfile?.addressStreet || '',
    city: organizationProfile?.city || '',
    state: organizationProfile?.state || '',
    country: organizationProfile?.country || 'Kenya',
    postalCode: organizationProfile?.postalCode || '',
    taxNumber: organizationProfile?.taxNumber || '',
    baseCurrency: organizationProfile?.baseCurrency || currency || 'USD',
    fiscalYear: organizationProfile?.fiscalYear || 'Jan - Dec',
    signatoryName: organizationProfile?.signatoryName || '',
    signatoryDesignation: organizationProfile?.signatoryDesignation || 'Managing Director',
    signatureDataUrl: organizationProfile?.signatureDataUrl || '',
    stampDataUrl: organizationProfile?.stampDataUrl || '',
    website: organizationProfile?.website || '',
    isConfigured: organizationProfile?.isConfigured || false,
    createdAt: organizationProfile?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [activeStep, setActiveStep] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (organizationProfile) {
      setFormData(organizationProfile);
    }
  }, [organizationProfile]);

  if (!showModal) return null;

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!formData.companyName.trim()) {
      errs.companyName = 'Company name is required';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Business phone number is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateAll = () => {
    const errs: Record<string, string> = {};
    if (!formData.companyName.trim()) {
      errs.companyName = 'Company name is required';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Business phone number is required';
    }
    if (!formData.signatoryName.trim()) {
      errs.signatoryName = 'Authorized Signatory name is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      showToast('Please provide Company Name, Phone Number, and Signatory Name.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated: OrganizationProfile = {
        ...formData,
        isConfigured: true,
        updatedAt: new Date().toISOString(),
      };
      await updateOrganizationProfile(updated);
      setCurrency(formData.baseCurrency);
      showToast('Zoho Books Organization profile & signature saved successfully!', 'success');

      if (onClose) onClose();
      else setIsOrgModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save organization profile:', err);
      showToast('Error saving organization profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const autofillDemoProfile = () => {
    setFormData({
      ...formData,
      companyName: 'Mwangi Global Traders Ltd',
      phone: '+254 700 123 456',
      email: 'accounts@mwangitraders.com',
      industry: 'Wholesale & Distribution',
      businessType: 'Private Limited',
      addressStreet: 'Enterprise Road, Industrial Area, Block C-4',
      city: 'Nairobi',
      state: 'Nairobi County',
      country: 'Kenya',
      postalCode: '00100',
      taxNumber: 'P051928471Z',
      baseCurrency: 'USD',
      fiscalYear: 'Jan - Dec',
      signatoryName: 'Frankline Mwangi',
      signatoryDesignation: 'Managing Director & Founder',
      website: 'www.mwangitraders.com',
      isConfigured: true,
      updatedAt: new Date().toISOString(),
    });
    setErrors({});
    showToast('Loaded standard Zoho Books organization profile!', 'info');
  };

  const handleSignatureSave = (dataUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      signatureDataUrl: dataUrl,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Zoho Books Styled Header */}
        <div className="relative px-6 py-5 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-linear-to-tr from-indigo-500 to-blue-600 p-2.5 flex items-center justify-center shadow-lg text-white">
                <Building2 className="w-full h-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                    Zoho Books Organization
                  </span>
                  {formData.isConfigured && (
                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                  Business Profile & Authorized Signature
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={autofillDemoProfile}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                title="Fill with demo company info"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>Auto-fill Sample</span>
              </button>

              {(!isMandatoryOnboarding || formData.isConfigured) && (
                <button
                  type="button"
                  onClick={() => {
                    if (onClose) onClose();
                    else setIsOrgModalOpen(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Stepper Tabs */}
          <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-2 ${
                activeStep === 1
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold">1</span>
              <span>Company & Phone</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setActiveStep(2);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-2 ${
                activeStep === 2
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold">2</span>
              <span>Address & Tax</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setActiveStep(3)}
              }
              className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all text-center flex items-center justify-center gap-2 ${
                activeStep === 3
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold">3</span>
              <span>Authorized Signature</span>
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* STEP 1: COMPANY NAME & PHONE NUMBER */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Organization Setup:</strong> Your Company Name, Business Phone Number, and Authorized Signature appear automatically on all official Invoices, Purchase Orders, POS Receipts, and Account Statements.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Company / Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => {
                        setFormData({ ...formData, companyName: e.target.value });
                        if (errors.companyName) setErrors({ ...errors, companyName: '' });
                      }}
                      placeholder="e.g. Mwangi Global Traders Ltd / Apex Supply Co"
                      className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                        errors.companyName ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                  </div>
                  {errors.companyName && <p className="text-[11px] text-rose-500">{errors.companyName}</p>}
                </div>

                {/* Business Phone Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Business Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      placeholder="e.g. +254 700 123 456 / +1 555 234 5678"
                      className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                        errors.phone ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-[11px] text-rose-500">{errors.phone}</p>}
                </div>

                {/* Business Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Official Business Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="billing@yourcompany.com"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Industry / Business Category */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Industry / Business Category
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Wholesale & Distribution">Wholesale & Distribution</option>
                      <option value="Retail & Supermarket">Retail & Supermarket</option>
                      <option value="Manufacturing & Processing">Manufacturing & Processing</option>
                      <option value="Construction & Hardware">Construction & Hardware</option>
                      <option value="Agriculture & Farm Supplies">Agriculture & Farm Supplies</option>
                      <option value="Healthcare & Pharmacy">Healthcare & Pharmacy</option>
                      <option value="Logistics & Freight">Logistics & Freight</option>
                      <option value="IT & Professional Services">IT & Professional Services</option>
                      <option value="General Trading">General Trading</option>
                    </select>
                  </div>
                </div>

                {/* Business Legal Structure */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Business Legal Structure
                  </label>
                  <div className="relative">
                    <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Private Limited">Private Limited Company (Ltd / LLC)</option>
                      <option value="Sole Proprietorship">Sole Proprietorship / Individual</option>
                      <option value="Partnership">Partnership Firm</option>
                      <option value="Corporation">Corporation / Public Ltd</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setActiveStep(2);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next: Address & Tax</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ADDRESS & TAX REGISTRATION */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Street Address */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Registered Business Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.addressStreet}
                      onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                      placeholder="e.g. Enterprise Road, Industrial Area, Plot 42"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">City / Town</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Nairobi / New York / Mumbai"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* State / Province */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">State / Region</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Nairobi County / California"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Country */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Country</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="e.g. Kenya, United States, India, UK"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Tax / VAT / GST Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tax Registration Number (VAT / GSTIN / TIN / PIN)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.taxNumber}
                      onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                      placeholder="e.g. P051928471Z or 27AABCT3518Q1ZV"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                    />
                  </div>
                </div>

                {/* Base Currency */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Base Currency</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={formData.baseCurrency}
                      onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                    >
                      {Object.values(CURRENCY_RATES).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.symbol}) - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Fiscal Year */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Fiscal Year Cycle</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={formData.fiscalYear}
                      onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Jan - Dec">January - December (Standard Calendar)</option>
                      <option value="Apr - Mar">April - March (India, UK, etc.)</option>
                      <option value="Jul - Jun">July - June (Kenya, Australia, etc.)</option>
                      <option value="Oct - Sep">October - September (US Govt)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next: Authorized Signature</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AUTHORIZED SIGNATORY & SIGNATURE CANVAS */}
          {activeStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Signatory Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Authorized Signatory Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.signatoryName}
                    onChange={(e) => {
                      setFormData({ ...formData, signatoryName: e.target.value });
                      if (errors.signatoryName) setErrors({ ...errors, signatoryName: '' });
                    }}
                    placeholder="e.g. Frankline Mwangi"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                      errors.signatoryName ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                  {errors.signatoryName && <p className="text-[11px] text-rose-500">{errors.signatoryName}</p>}
                </div>

                {/* Signatory Designation */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Signatory Title / Designation
                  </label>
                  <input
                    type="text"
                    value={formData.signatoryDesignation}
                    onChange={(e) => setFormData({ ...formData, signatoryDesignation: e.target.value })}
                    placeholder="e.g. Managing Director / Finance Officer / Owner"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Digital Signature Drawing Pad */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Authorized Digital Signature & Seal</span>
                  </label>
                  {formData.signatureDataUrl && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Signature Captured
                    </span>
                  )}
                </div>

                <SignaturePad
                  initialSignature={formData.signatureDataUrl}
                  onSaveSignature={handleSignatureSave}
                  signerName={formData.signatoryName || 'Authorized Signatory'}
                />
              </div>

              {/* Summary Preview Pill */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" /> Zoho Books Document Preview:
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Header will display <strong>{formData.companyName || 'Your Company Name'}</strong> (Phone: {formData.phone || 'N/A'}, Tax: {formData.taxNumber || 'None'}).
                  Invoices & bills will conclude with signature for <strong>{formData.signatoryName || 'Signatory'}</strong> ({formData.signatoryDesignation}).
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving Profile...' : 'Save & Activate Organization Profile'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
