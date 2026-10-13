import { useState, useRef } from 'react';
import { MessageCircle, Mail, Copy, Check, ArrowRight, ArrowLeft, AlertCircle, ExternalLink, Loader2, Database, ShieldCheck } from 'lucide-react';
import SEO from '../components/common/SEO';
import { useSubmitInquiry } from '../hooks/useLeads';

const contactBreadcrumbs = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.apoorvpatelphotography.com/' },
    { '@type': 'ListItem', position: 2, name: 'Contact', item: 'https://www.apoorvpatelphotography.com/contact' },
  ],
};

type InquiryType = 'photography' | 'editing' | 'training' | 'general';

interface FormErrors {
  name?: string;
  email?: string;
  mobile?: string;
  eventDate?: string;
  eventType?: string;
  editingType?: string;
  course?: string;
  general?: string;
}

export default function Contact() {
  const { submit: submitToDb, submitting: dbSubmitting } = useSubmitInquiry();

  const [formType, setFormType] = useState<InquiryType>('photography');
  const [isPrepared, setIsPrepared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasOpenedExternal, setHasOpenedExternal] = useState(false);
  const [submittedToDb, setSubmittedToDb] = useState(false);
  const [dbInquiryId, setDbInquiryId] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const formLoadTime = useRef(Date.now());


  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    whatsapp: '',
    email: '',
    eventType: '',
    eventDate: '',
    location: '',
    services: '',
    editingType: '',
    numPhotos: '',
    deliveryDate: '',
    reference: '',
    course: '',
    experience: '',
    batch: '',
    modePreference: '',
    message: '',
    budget: '',
  });

  const businessEmail = import.meta.env.VITE_BUSINESS_EMAIL || 'contact@apoorvpatelphotography.com';
  const businessWhatsAppRaw = import.meta.env.VITE_WHATSAPP_NUMBER || '';
  const businessWhatsAppClean = businessWhatsAppRaw.replace(/\D/g, '');
  const isWhatsAppConfigured = Boolean(
    businessWhatsAppClean &&
    businessWhatsAppClean.length >= 8 &&
    businessWhatsAppClean.length <= 15
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Please provide your full name (minimum 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Please provide your email address.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address (e.g. name@domain.com).';
    }

    // Phone validation: allow optional +, digits, spaces, dashes (min 7 digits)
    const phoneDigits = formData.mobile.replace(/\D/g, '');
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Please provide your contact phone or mobile number.';
    } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      newErrors.mobile = 'Please enter a valid phone number with 7-15 digits.';
    }

    if (formType === 'photography') {
      if (!formData.eventType) {
        newErrors.eventType = 'Please select an event type for your photography inquiry.';
      }
      if (formData.eventDate) {
        const selectedDate = new Date(formData.eventDate);
        if (isNaN(selectedDate.getTime())) {
          newErrors.eventDate = 'Please select a valid event date.';
        }
      }
    }

    if (formType === 'editing' && !formData.editingType) {
      newErrors.editingType = 'Please select a post-production / editing service type.';
    }

    if (formType === 'training' && !formData.course) {
      newErrors.course = 'Please choose a course or workshop.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getCategoryTitle = () => {
    switch (formType) {
      case 'photography': return 'Photography / Videography Inquiry';
      case 'editing': return 'Post-Production & Editing Inquiry';
      case 'training': return 'Masterclass & Training Inquiry';
      case 'general': return 'General Studio Inquiry';
    }
  };

  const generateInquiryMessage = (): string => {
    const lines: string[] = [
      `*${getCategoryTitle()}*`,
      `Studio: Apoorv Patel Photography`,
      `-----------------------------------------`,
      `• *Client Name:* ${formData.name.trim()}`,
      `• *Email:* ${formData.email.trim()}`,
      `• *Mobile:* ${formData.mobile.trim()}`,
    ];

    if (formData.whatsapp.trim()) {
      lines.push(`• *WhatsApp:* ${formData.whatsapp.trim()}`);
    }

    if (formType === 'photography') {
      if (formData.eventType) lines.push(`• *Event Type:* ${formData.eventType}`);
      if (formData.eventDate) lines.push(`• *Target Date:* ${formData.eventDate}`);
      if (formData.location.trim()) lines.push(`• *Event Location:* ${formData.location.trim()}`);
      if (formData.budget.trim()) lines.push(`• *Budget Range:* ${formData.budget.trim()}`);
    } else if (formType === 'editing') {
      if (formData.editingType) lines.push(`• *Editing Service:* ${formData.editingType}`);
      if (formData.numPhotos.trim()) lines.push(`• *Photo/Video Count:* ${formData.numPhotos.trim()}`);
    } else if (formType === 'training') {
      if (formData.course) lines.push(`• *Selected Course:* ${formData.course}`);
      if (formData.experience) lines.push(`• *Experience Level:* ${formData.experience}`);
    }

    if (formData.message.trim()) {
      lines.push(`-----------------------------------------`);
      lines.push(`*Client Message / Requirements:*`);
      lines.push(formData.message.trim());
    }

    lines.push(`-----------------------------------------`);
    lines.push(`Sent via apoorvpatelphotography.com`);

    return lines.join('\n');
  };

  const handlePrepareInquiry = (e: React.FormEvent) => {
    e.preventDefault();

    // Anti-spam honeypot detection
    if (honeypot.trim().length > 0) {
      console.warn('Spam submission suppressed by honeypot.');
      return;
    }

    if (!validate()) {
      setErrors(prev => ({
        ...prev,
        general: 'Please correct the highlighted fields before proceeding.',
      }));
      return;
    }
    setIsPrepared(true);
    setHasOpenedExternal(false);
    setDbError(null);
  };

  const handleSaveToDatabase = async () => {
    // Anti-spam timing check (minimum 1 second interaction)
    if (Date.now() - formLoadTime.current < 1000) {
      setDbError('Submission was received too quickly. Please review your details.');
      return;
    }

    setDbError(null);
    const result = await submitToDb({
      name: formData.name,
      email: formData.email,
      phone: formData.mobile,
      eventType: formType === 'photography' ? formData.eventType : getCategoryTitle(),
      eventDate: formData.eventDate || undefined,
      location: formData.location || undefined,
      budget: formData.budget || undefined,
      message: generateInquiryMessage(),
    });

    if (result.success) {
      setSubmittedToDb(true);
      setDbInquiryId(result.id || `APP-${Date.now().toString().slice(-6)}`);
    } else {
      setDbError(result.error || 'Failed to submit inquiry to studio database. You can still reach us via WhatsApp or Email below.');
    }
  };


  const handleCopyMessage = async () => {
    const message = generateInquiryMessage();
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handleOpenWhatsApp = () => {
    if (!isWhatsAppConfigured) return;
    const message = generateInquiryMessage();
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${businessWhatsAppClean}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setHasOpenedExternal(true);
  };

  const handleOpenEmail = () => {
    const message = generateInquiryMessage();
    const subject = encodeURIComponent(`[Website Inquiry] ${getCategoryTitle()} - ${formData.name.trim()}`);
    const body = encodeURIComponent(message);
    const url = `mailto:${businessEmail}?subject=${subject}&body=${body}`;
    window.location.href = url;
    setHasOpenedExternal(true);
  };

  const inputClass = (hasError?: boolean) =>
    `w-full bg-transparent border-0 border-b ${
      hasError ? 'border-error focus:border-error' : 'border-outline-variant/50 focus:border-tertiary'
    } text-on-surface py-3 px-0 focus:ring-0 transition-colors duration-300 font-body text-[16px] placeholder:text-on-surface-variant/50`;

  const labelClass = 'block font-body text-[12px] font-bold tracking-[0.15em] uppercase text-on-surface-variant mb-2';

  const tabs = [
    { id: 'photography' as const, label: 'Photography / Videography' },
    { id: 'editing' as const, label: 'Editing' },
    { id: 'training' as const, label: 'Training' },
    { id: 'general' as const, label: 'General' },
  ];

  return (
    <main className="pt-[104px]">
      <SEO
        title="Book Your Date | Contact Apoorv Patel Photography — Inquiries & Quotes"
        description="Connect directly with Apoorv Patel for wedding bookings, portrait sessions, editing services, or photography course enrollment across India and the UK."
        canonicalPath="/contact"
        image="/images/logo.png"
        schema={contactBreadcrumbs}
      />
      <header className="px-5 md:px-16 py-[100px] md:py-[120px] max-w-[1440px] mx-auto text-center">
        <h1 className="font-display text-[40px] md:text-[72px] text-on-background mb-6 leading-[1.1] tracking-[-0.02em] font-semibold">
          Get in Touch
        </h1>
        <p className="font-body text-[18px] text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          Ready to capture your special moments? Prepare your inquiry below to connect with us directly via WhatsApp or Email.
        </p>
      </header>

      <section className="px-5 md:px-16 pb-[120px] max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form or Prepared Action Step */}
          <div className="lg:col-span-7 bg-surface-container-lowest p-8 md:p-12 border border-outline-variant/10 rounded-sm">
            {isPrepared ? (
              /* Action Step (Replaces false submission message) */
              <div className="space-y-8 animate-fade-in">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary/15 text-tertiary text-xs font-semibold uppercase tracking-wider mb-3">
                    <Check size={14} /> Inquiry Compiled
                  </div>
                  <h2 className="font-display text-[28px] md:text-[36px] text-on-background leading-tight mb-2">
                    Inquiry Ready to Dispatch
                  </h2>
                  <p className="font-body text-[15px] text-on-surface-variant leading-relaxed">
                    Your inquiry details have been structured below. Please choose your preferred channel to send them directly to our studio.
                  </p>
                </div>

                {/* Important Dispatch Instructions */}
                <div className="bg-surface-container-low border border-tertiary/30 p-5 rounded-sm space-y-2">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-tertiary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-body text-[14px] font-semibold text-on-surface">
                        Complete Sending in Your App
                      </p>
                      <p className="font-body text-[13px] text-on-surface-variant leading-relaxed">
                        Clicking <strong>Send via WhatsApp</strong> or <strong>Send via Email</strong> will launch the app with your pre-filled inquiry. You must hit <strong>Send</strong> inside the app so we receive your booking request.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Database Submission & Confirmation Section */}
                <div className="bg-surface-container-low border border-outline-variant/20 p-5 rounded-sm space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Database size={18} className="text-tertiary" />
                      <span className="font-body text-[14px] font-semibold text-on-surface">
                        Option: Register Directly in Studio System
                      </span>
                    </div>
                    {submittedToDb && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <ShieldCheck size={14} /> Registered #{dbInquiryId}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-[13px] text-on-surface-variant leading-relaxed">
                    Instantly save your booking inquiry to our private studio records. Our team will review your dates and get back to you via email or phone.
                  </p>

                  {submittedToDb ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-sm space-y-1 text-sm text-emerald-300">
                      <p className="font-semibold flex items-center gap-2">
                        <Check size={16} /> Inquiry recorded successfully!
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Reference ID: <code className="text-emerald-400 font-mono font-bold">{dbInquiryId}</code>. You may also notify us immediately via WhatsApp or Email below if your event is urgent.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {dbError && (
                        <div className="mb-3 p-3 bg-error/15 border border-error/30 rounded-sm flex items-start gap-2 text-error text-xs">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <span>{dbError}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveToDatabase}
                        disabled={dbSubmitting}
                        className="w-full bg-surface-container-high hover:bg-surface-container-highest border border-tertiary/40 hover:border-tertiary text-on-surface hover:text-tertiary font-body text-[13px] font-semibold tracking-[0.05em] px-5 py-3 rounded-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {dbSubmitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Registering inquiry in studio database...</span>
                          </>
                        ) : (
                          <>
                            <Database size={16} className="text-tertiary" />
                            <span>Save Inquiry to Studio Database</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct Action Buttons */}
                <div className={`grid ${isWhatsAppConfigured ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                  {isWhatsAppConfigured && (
                    <button
                      type="button"
                      onClick={handleOpenWhatsApp}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-body text-[14px] font-semibold tracking-[0.05em] px-6 py-4 rounded-sm flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer"
                    >
                      <MessageCircle size={18} />
                      <span>Send via WhatsApp</span>
                      <ExternalLink size={14} className="opacity-70" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenEmail}
                    className="w-full bg-on-background hover:bg-tertiary text-background hover:text-on-tertiary font-body text-[14px] font-semibold tracking-[0.05em] px-6 py-4 rounded-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                  >
                    <Mail size={18} />
                    <span>Send via Email</span>
                    <ExternalLink size={14} className="opacity-70" />
                  </button>
                </div>

                {/* Status Notice when External App Opened */}
                {hasOpenedExternal && (
                  <div className="p-4 bg-surface-container border border-outline-variant/30 rounded-sm text-center space-y-1">
                    <p className="font-body text-[14px] font-medium text-tertiary">
                      Messaging application opened!
                    </p>
                    <p className="font-body text-[13px] text-on-surface-variant">
                      Please ensure you hit "Send" in WhatsApp or Email so our studio receives your message. We usually respond within a few hours.
                    </p>
                  </div>
                )}

                {/* Compiled Message Preview Box with Copy Action */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-[12px] font-bold tracking-[0.1em] uppercase text-on-surface-variant">
                      Formatted Message Preview
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="inline-flex items-center gap-1.5 text-xs text-tertiary hover:underline font-semibold cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check size={14} /> Copied to Clipboard
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copy Full Text
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-surface-container-lowest border border-outline-variant/20 p-5 rounded-sm font-mono text-[13px] text-on-surface-variant/90 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {generateInquiryMessage()}
                  </div>
                </div>

                {/* Back / Reset Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-outline-variant/15">
                  <button
                    type="button"
                    onClick={() => setIsPrepared(false)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={16} /> Modify Inquiry Details
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPrepared(false);
                      setHasOpenedExternal(false);
                      setFormData({
                        name: '', mobile: '', whatsapp: '', email: '',
                        eventType: '', eventDate: '', location: '', services: '',
                        editingType: '', numPhotos: '', deliveryDate: '', reference: '',
                        course: '', experience: '', batch: '', modePreference: '',
                        message: '', budget: '',
                      });
                    }}
                    className="text-xs text-on-surface-variant hover:text-tertiary transition-colors cursor-pointer"
                  >
                    Start New Inquiry
                  </button>
                </div>
              </div>
            ) : (
              /* Editable Form */
              <div>
                <div className="flex flex-wrap gap-2 mb-10">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setFormType(tab.id);
                        setErrors({});
                      }}
                      className={`font-body text-[12px] font-bold tracking-[0.1em] uppercase px-5 py-2.5 transition-all duration-300 rounded-sm cursor-pointer ${
                        formType === tab.id
                          ? 'bg-on-background text-background'
                          : 'text-on-surface-variant hover:bg-surface-variant border border-outline-variant/20'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {errors.general && (
                  <div className="mb-8 p-4 bg-error/15 border border-error/30 rounded-sm flex items-start gap-3 text-error text-xs">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{errors.general}</span>
                  </div>
                )}

                <form onSubmit={handlePrepareInquiry} className="space-y-8" noValidate>
                  {/* Anti-spam Honeypot field (hidden from humans, filled by bots) */}
                  <input
                    type="text"
                    name="website_source_hp"
                    value={honeypot}
                    onChange={e => setHoneypot(e.target.value)}
                    style={{ display: 'none', position: 'absolute', left: '-9999px' }}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />
                  {/* Base Client Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                    <div>
                      <label htmlFor="contact-name" className={labelClass}>Full Name *</label>
                      <input
                        id="contact-name"
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className={inputClass(Boolean(errors.name))}
                      />
                      {errors.name && <p className="text-error text-xs mt-1.5">{errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="contact-email" className={labelClass}>Email Address *</label>
                      <input
                        id="contact-email"
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className={inputClass(Boolean(errors.email))}
                      />
                      {errors.email && <p className="text-error text-xs mt-1.5">{errors.email}</p>}
                    </div>

                    <div>
                      <label htmlFor="contact-mobile" className={labelClass}>Mobile Phone *</label>
                      <input
                        id="contact-mobile"
                        type="tel"
                        name="mobile"
                        required
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="+91 / +44 (required)"
                        className={inputClass(Boolean(errors.mobile))}
                      />
                      {errors.mobile && <p className="text-error text-xs mt-1.5">{errors.mobile}</p>}
                    </div>

                    <div>
                      <label htmlFor="contact-whatsapp" className={labelClass}>WhatsApp Number</label>
                      <input
                        id="contact-whatsapp"
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        placeholder="Optional (if different from mobile)"
                        className={inputClass()}
                      />
                    </div>
                  </div>

                  {/* Photography & Videography Fields */}
                  {formType === 'photography' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                      <div>
                        <label htmlFor="contact-eventType" className={labelClass}>Event Type *</label>
                        <select
                          id="contact-eventType"
                          name="eventType"
                          required
                          value={formData.eventType}
                          onChange={handleChange}
                          className={`${inputClass(Boolean(errors.eventType))} appearance-none cursor-pointer`}
                        >
                          <option value="" className="bg-surface-container text-on-surface">Select event type</option>
                          {['Wedding', 'Engagement', 'Pre-Wedding', 'Baby Shower', 'Maternity', 'Birthday', 'Family', 'Couple', 'Portrait', 'Special Event'].map(e => (
                            <option key={e} value={e} className="bg-surface-container text-on-surface">{e}</option>
                          ))}
                        </select>
                        {errors.eventType && <p className="text-error text-xs mt-1.5">{errors.eventType}</p>}
                      </div>

                      <div>
                        <label htmlFor="contact-eventDate" className={labelClass}>Target Event Date</label>
                        <input
                          id="contact-eventDate"
                          type="date"
                          name="eventDate"
                          min={new Date().toISOString().split('T')[0]}
                          value={formData.eventDate}
                          onChange={handleChange}
                          className={inputClass(Boolean(errors.eventDate))}
                        />
                        {errors.eventDate && <p className="text-error text-xs mt-1.5">{errors.eventDate}</p>}
                      </div>

                      <div>
                        <label htmlFor="contact-location" className={labelClass}>Event Location / Venue</label>
                        <input
                          id="contact-location"
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="City, State, or Venue"
                          className={inputClass()}
                        />
                      </div>

                      <div>
                        <label htmlFor="contact-budget" className={labelClass}>Budget Range</label>
                        <input
                          id="contact-budget"
                          type="text"
                          name="budget"
                          value={formData.budget}
                          onChange={handleChange}
                          placeholder="e.g. ₹1,00,000 / £1,500 (Optional)"
                          className={inputClass()}
                        />
                      </div>
                    </div>
                  )}

                  {/* Post-Production & Editing Fields */}
                  {formType === 'editing' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                      <div>
                        <label htmlFor="contact-editingType" className={labelClass}>Editing Service *</label>
                        <select
                          id="contact-editingType"
                          name="editingType"
                          required
                          value={formData.editingType}
                          onChange={handleChange}
                          className={`${inputClass(Boolean(errors.editingType))} appearance-none cursor-pointer`}
                        >
                          <option value="" className="bg-surface-container text-on-surface">Select editing type</option>
                          {['Photo Editing', 'Skin Retouching', 'Color Correction', 'Album Design', 'Video Highlights Editing', 'Instagram Reel Editing'].map(e => (
                            <option key={e} value={e} className="bg-surface-container text-on-surface">{e}</option>
                          ))}
                        </select>
                        {errors.editingType && <p className="text-error text-xs mt-1.5">{errors.editingType}</p>}
                      </div>

                      <div>
                        <label htmlFor="contact-numPhotos" className={labelClass}>Estimated Photo / Video Count</label>
                        <input
                          id="contact-numPhotos"
                          type="text"
                          name="numPhotos"
                          value={formData.numPhotos}
                          onChange={handleChange}
                          placeholder="e.g. 150 photos / 5 reels"
                          className={inputClass()}
                        />
                      </div>
                    </div>
                  )}

                  {/* Training Fields */}
                  {formType === 'training' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                      <div>
                        <label htmlFor="contact-course" className={labelClass}>Course / Masterclass *</label>
                        <select
                          id="contact-course"
                          name="course"
                          required
                          value={formData.course}
                          onChange={handleChange}
                          className={`${inputClass(Boolean(errors.course))} appearance-none cursor-pointer`}
                        >
                          <option value="" className="bg-surface-container text-on-surface">Select course</option>
                          {['Photography Masterclass', 'Videography & Filmmaking', 'Photo Editing & Retouching', 'Video Editing & Post-Production'].map(c => (
                            <option key={c} value={c} className="bg-surface-container text-on-surface">{c}</option>
                          ))}
                        </select>
                        {errors.course && <p className="text-error text-xs mt-1.5">{errors.course}</p>}
                      </div>

                      <div>
                        <label htmlFor="contact-experience" className={labelClass}>Experience Level</label>
                        <select
                          id="contact-experience"
                          name="experience"
                          value={formData.experience}
                          onChange={handleChange}
                          className={`${inputClass()} appearance-none cursor-pointer`}
                        >
                          <option value="" className="bg-surface-container text-on-surface">Select level</option>
                          {['Complete Beginner', 'Some Experience', 'Intermediate', 'Advanced'].map(l => (
                            <option key={l} value={l} className="bg-surface-container text-on-surface">{l}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Client Message */}
                  <div>
                    <label htmlFor="contact-message" className={labelClass}>Inquiry Details / Message</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Share any special vision, schedule details, or requirements..."
                      className={inputClass()}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] px-6 py-4 btn-cinematic hover:bg-tertiary hover:text-on-tertiary rounded-sm flex justify-center items-center gap-3 transition-colors cursor-pointer"
                  >
                    <span>Proceed to Send Inquiry</span>
                    <ArrowRight size={18} />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Contact Info Sidebar */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-surface-container-low p-8 md:p-10 border border-outline-variant/10 rounded-sm">
              <h3 className="font-display text-[24px] text-on-surface mb-8 leading-tight">Studio Information</h3>
              <ul className="space-y-6">
                <li>
                  <a
                    href={`mailto:${businessEmail}`}
                    className="flex items-center gap-4 text-on-surface-variant hover:text-tertiary transition-colors"
                  >
                    <span className="material-symbols-outlined text-tertiary">mail</span>
                    <span className="font-body text-[16px] break-all">{businessEmail}</span>
                  </a>
                </li>
                {isWhatsAppConfigured && (
                  <li>
                    <a
                      href={`https://wa.me/${businessWhatsAppClean}?text=Hi`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 text-on-surface-variant hover:text-tertiary transition-colors"
                    >
                      <span className="material-symbols-outlined text-tertiary">chat</span>
                      <span className="font-body text-[16px]">Chat on WhatsApp</span>
                    </a>
                  </li>
                )}
                <li>
                  <a
                    href="https://www.instagram.com/apoorvpatel_photography/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 text-on-surface-variant hover:text-tertiary transition-colors"
                  >
                    <span className="material-symbols-outlined text-tertiary">photo_camera</span>
                    <span className="font-body text-[16px]">@apoorvpatel_photography</span>
                  </a>
                </li>
                <li className="flex items-center gap-4 text-on-surface-variant">
                  <span className="material-symbols-outlined text-tertiary">location_on</span>
                  <span className="font-body text-[16px]">India | United Kingdom</span>
                </li>
              </ul>
            </div>

            <div className="bg-surface-container p-8 md:p-10 border border-tertiary/20 rounded-sm">
              <h3 className="font-display text-[20px] text-on-surface mb-3 leading-tight">Quick WhatsApp Chat</h3>
              <p className="font-body text-[14px] text-on-surface-variant mb-6 leading-relaxed">
                Prefer an immediate conversation? Reach out directly via WhatsApp for fast scheduling and questions.
              </p>
              <a
                href={businessWhatsAppClean
                  ? `https://wa.me/${businessWhatsAppClean}?text=${encodeURIComponent("Hi, I'm interested in discussing photography services.")}`
                  : `https://wa.me/?text=${encodeURIComponent("Hi, I'm interested in discussing photography services.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] px-6 py-3.5 rounded-sm btn-cinematic hover:bg-tertiary hover:text-on-tertiary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] align-middle mr-2">chat</span>
                Start WhatsApp Chat
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
