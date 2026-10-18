import { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
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

type InquiryType = 'photography' | 'multimedia' | 'design' | 'editing' | 'training' | 'general';

interface FormErrors {
  name?: string;
  email?: string;
  mobile?: string;
  eventDate?: string;
  eventType?: string;
  editingType?: string;
  services?: string;
  course?: string;
  message?: string;
  general?: string;
}

export default function Contact() {
  const [searchParams] = useSearchParams();
  const { submit: submitToDb, submitting: dbSubmitting } = useSubmitInquiry();

  const [formType, setFormType] = useState<InquiryType>('photography');
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const formLoadTime = useRef<number>(0);

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

  useEffect(() => {
    formLoadTime.current = Date.now();
    const serviceParam = searchParams.get('service');
    if (serviceParam) {
      const lower = serviceParam.toLowerCase();
      if (lower.includes('multimedia')) {
        setFormType('multimedia');
        setFormData(prev => ({ ...prev, services: serviceParam }));
      } else if (lower.includes('graphic') || lower.includes('design')) {
        setFormType('design');
        setFormData(prev => ({ ...prev, services: serviceParam }));
      } else if (lower.includes('editing') || lower.includes('post-production')) {
        setFormType('editing');
      } else if (lower.includes('training') || lower.includes('course')) {
        setFormType('training');
      } else {
        setFormType('photography');
        setFormData(prev => ({ ...prev, eventType: serviceParam }));
      }
    }
  }, [searchParams]);

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

    const phoneDigits = formData.mobile.replace(/\D/g, '');
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Please provide your contact phone or mobile number.';
    } else if (phoneDigits.length < 7 || phoneDigits.length > 20) {
      newErrors.mobile = 'Please enter a valid phone number with 7-20 digits.';
    }

    if (formType === 'photography') {
      if (!formData.eventType) {
        newErrors.eventType = 'Please select an event type for your photography inquiry.';
      }
      if (formData.eventDate) {
        const selectedDate = new Date(formData.eventDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isNaN(selectedDate.getTime())) {
          newErrors.eventDate = 'Please select a valid event date.';
        } else if (selectedDate < today) {
          newErrors.eventDate = 'Event date cannot be in the past.';
        }
      }
    }

    if (formType === 'editing' && !formData.editingType) {
      newErrors.editingType = 'Please select a post-production / editing service type.';
    }

    if (formType === 'multimedia' && !formData.services) {
      newErrors.services = 'Please select a multimedia solution type.';
    }

    if (formType === 'design' && !formData.services) {
      newErrors.services = 'Please select a graphic design solution type.';
    }

    if (formType === 'training' && !formData.course) {
      newErrors.course = 'Please choose a course or workshop.';
    }

    if (!formData.message.trim() || formData.message.trim().length < 5) {
      newErrors.message = 'Please provide inquiry details / requirements (minimum 5 characters).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getCategoryTitle = () => {
    switch (formType) {
      case 'photography': return 'Photography / Videography Inquiry';
      case 'multimedia': return 'Multimedia Design Inquiry';
      case 'design': return 'Graphic Design Inquiry';
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
    } else if (formType === 'multimedia') {
      if (formData.services) lines.push(`• *Multimedia Service:* ${formData.services}`);
      if (formData.deliveryDate) lines.push(`• *Target Delivery:* ${formData.deliveryDate}`);
      if (formData.budget.trim()) lines.push(`• *Budget Range:* ${formData.budget.trim()}`);
    } else if (formType === 'design') {
      if (formData.services) lines.push(`• *Graphic Design Service:* ${formData.services}`);
      if (formData.deliveryDate) lines.push(`• *Target Delivery:* ${formData.deliveryDate}`);
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
    lines.push(`Submitted via apoorvpatelphotography.com`);

    return lines.join('\n');
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();

    // Anti-spam honeypot detection
    if (honeypot.trim().length > 0) {
      console.warn('Spam submission suppressed by honeypot.');
      return;
    }

    // Minimum interaction timing check (anti-bot)
    if (Date.now() - formLoadTime.current < 800) {
      setSubmitError('Form interaction was too rapid. Please review your details and submit again.');
      return;
    }

    if (!validate()) {
      setErrors(prev => ({
        ...prev,
        general: 'Please correct the highlighted fields before submitting.',
      }));
      return;
    }

    setSubmitError(null);

    const eventTypeSubmission = formType === 'photography'
      ? (formData.eventType || 'Photography / Videography')
      : (formType === 'multimedia' || formType === 'design'
        ? (formData.services || getCategoryTitle())
        : getCategoryTitle());

    const result = await submitToDb({
      name: formData.name,
      email: formData.email,
      phone: formData.mobile,
      whatsapp: formData.whatsapp || formData.mobile,
      eventType: eventTypeSubmission,
      eventDate: formData.eventDate || formData.deliveryDate || undefined,
      location: formData.location || undefined,
      budget: formData.budget || undefined,
      message: generateInquiryMessage(),
      honeypot,
    });

    if (result.success) {
      setIsSuccess(true);
      setSubmittedId(result.id || `APP-${Date.now().toString().slice(-6)}`);
      // Reset form data only on confirmed success
      setFormData({
        name: '', mobile: '', whatsapp: '', email: '',
        eventType: '', eventDate: '', location: '', services: '',
        editingType: '', numPhotos: '', deliveryDate: '', reference: '',
        course: '', experience: '', batch: '', modePreference: '',
        message: '', budget: '',
      });
      setErrors({});
    } else {
      // Submission failed: keep all inputs intact
      setSubmitError(result.error || 'Sorry, your enquiry could not be sent. Please try again or contact us directly via WhatsApp.');
    }
  };

  const handleResetForm = () => {
    setIsSuccess(false);
    setSubmittedId(null);
    setSubmitError(null);
    setErrors({});
    formLoadTime.current = Date.now();
  };

  const inputClass = (hasError?: boolean) =>
    `w-full bg-transparent border-0 border-b ${
      hasError ? 'border-error focus:border-error' : 'border-outline-variant/50 focus:border-tertiary'
    } text-on-surface py-3 px-0 focus:ring-0 transition-colors duration-300 font-body text-[16px] placeholder:text-on-surface-variant/50`;

  const labelClass = 'block font-body text-[12px] font-bold tracking-[0.15em] uppercase text-on-surface-variant mb-2';

  const tabs = [
    { id: 'photography' as const, label: 'Photography / Videography' },
    { id: 'multimedia' as const, label: 'Multimedia Design' },
    { id: 'design' as const, label: 'Graphic Design' },
    { id: 'editing' as const, label: 'Editing' },
    { id: 'training' as const, label: 'Training' },
    { id: 'general' as const, label: 'General' },
  ];

  return (
    <main className="pt-[104px]">
      <SEO
        title="Contact Studio | UK Photography & Creative Design — Inquiries & Bookings"
        description="Connect with Apoorv Patel Photography for luxury weddings, cinematic videography, multimedia design, graphic design, and training across the United Kingdom."
        canonicalPath="/contact"
        image="/images/logo.png"
        schema={contactBreadcrumbs}
      />
      <header className="px-5 md:px-16 py-[100px] md:py-[120px] max-w-[1440px] mx-auto text-center">
        <h1 className="font-display text-[40px] md:text-[72px] text-on-background mb-6 leading-[1.1] tracking-[-0.02em] font-semibold">
          Get in Touch
        </h1>
        <p className="font-body text-[18px] text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          Ready to capture your special moments? Send us your enquiry below and we'll be in touch.
        </p>
      </header>

      <section className="px-5 md:px-16 pb-[120px] max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Inquiry Form or Success Card */}
          <div className="lg:col-span-7 bg-surface-container-lowest p-8 md:p-12 border border-outline-variant/10 rounded-sm">
            {isSuccess ? (
              /* Success Confirmation View */
              <div className="py-10 px-4 sm:px-8 text-center space-y-6 animate-fade-in">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={36} />
                </div>

                <div className="space-y-3">
                  <h2 className="font-display text-[26px] sm:text-[34px] text-on-background font-semibold leading-tight">
                    Thank you for contacting Apoorv Patel Photography!
                  </h2>
                  <p className="font-body text-[16px] text-on-surface-variant max-w-lg mx-auto leading-relaxed">
                    Your inquiry has been received successfully. Our team will review your requirements and contact you soon.
                  </p>
                  {submittedId && (
                    <p className="font-mono text-xs text-on-surface-variant/80 pt-2">
                      Inquiry Reference ID: <span className="text-tertiary font-bold">{submittedId}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t border-outline-variant/15">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-6 py-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface font-body text-[14px] font-semibold rounded-sm transition-colors cursor-pointer"
                  >
                    Submit Another Inquiry
                  </button>
                  <Link
                    to="/"
                    className="px-6 py-3 bg-on-background text-background hover:bg-tertiary hover:text-on-tertiary font-body text-[14px] font-semibold rounded-sm transition-colors cursor-pointer"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            ) : (
              /* Direct Inquiry Form */
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

                {/* Error Alerts */}
                {submitError && (
                  <div className="mb-6 p-4 bg-error/15 border border-error/30 rounded-sm flex items-start justify-between gap-3 text-error text-xs">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubmitError(null)}
                      className="text-xs underline font-semibold hover:opacity-80 shrink-0 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {errors.general && (
                  <div className="mb-6 p-4 bg-error/15 border border-error/30 rounded-sm flex items-start gap-3 text-error text-xs">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{errors.general}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitInquiry} className="space-y-8" noValidate>
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
                          {['Wedding Photography', 'Pre-Wedding Photography', 'Engagement Photography', 'Videography / Films', 'Baby Shower', 'Birthday Celebration', 'Family Photography', 'Couple & Portrait', 'Special Event'].map(e => (
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
                          placeholder="e.g. £1,500 / £3,000 (Optional)"
                          className={inputClass()}
                        />
                      </div>
                    </div>
                  )}

                  {/* Multimedia Design Fields */}
                  {formType === 'multimedia' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                      <div>
                        <label htmlFor="contact-multimedia" className={labelClass}>Multimedia Service *</label>
                        <select
                          id="contact-multimedia"
                          name="services"
                          required
                          value={formData.services}
                          onChange={handleChange}
                          className={`${inputClass(Boolean(errors.services))} appearance-none cursor-pointer`}
                        >
                          <option value="" className="bg-surface-container text-on-surface">Select multimedia solution</option>
                          {[
                            'Multimedia Design (Complete Solution)',
                            'Video Editing & Post-Production',
                            'Motion Graphics & Title Animation',
                            'Digital Content Creation',
                            'Visual Storytelling & Brand Promos',
                            'Social Media Creatives & Reels',
                            'Custom Multimedia Production',
                          ].map(e => (
                            <option key={e} value={e} className="bg-surface-container text-on-surface">{e}</option>
                          ))}
                        </select>
                        {errors.services && <p className="text-error text-xs mt-1.5">{errors.services}</p>}
                      </div>

                      <div>
                        <label htmlFor="contact-deliveryDate-multi" className={labelClass}>Target Delivery Date</label>
                        <input
                          id="contact-deliveryDate-multi"
                          type="date"
                          name="deliveryDate"
                          min={new Date().toISOString().split('T')[0]}
                          value={formData.deliveryDate}
                          onChange={handleChange}
                          className={inputClass()}
                        />
                      </div>

                      <div>
                        <label htmlFor="contact-budget-multi" className={labelClass}>Estimated Budget</label>
                        <input
                          id="contact-budget-multi"
                          type="text"
                          name="budget"
                          value={formData.budget}
                          onChange={handleChange}
                          placeholder="e.g. £500 / £1,500 (Optional)"
                          className={inputClass()}
                        />
                      </div>
                    </div>
                  )}

                  {/* Graphic Design Fields */}
                  {formType === 'design' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                      <div>
                        <label htmlFor="contact-graphic" className={labelClass}>Design Service *</label>
                        <select
                          id="contact-graphic"
                          name="services"
                          required
                          value={formData.services}
                          onChange={handleChange}
                          className={`${inputClass(Boolean(errors.services))} appearance-none cursor-pointer`}
                        >
                          <option value="" className="bg-surface-container text-on-surface">Select design service</option>
                          {[
                            'Graphic Design (Complete Solution)',
                            'Brand Identity & Logo Design',
                            'Promotional Materials & Posters',
                            'Social Media Creatives & Banners',
                            'Digital Visual Communication',
                            'Print & Event Collateral',
                            'Custom Creative Design',
                          ].map(e => (
                            <option key={e} value={e} className="bg-surface-container text-on-surface">{e}</option>
                          ))}
                        </select>
                        {errors.services && <p className="text-error text-xs mt-1.5">{errors.services}</p>}
                      </div>

                      <div>
                        <label htmlFor="contact-deliveryDate-design" className={labelClass}>Target Delivery Date</label>
                        <input
                          id="contact-deliveryDate-design"
                          type="date"
                          name="deliveryDate"
                          min={new Date().toISOString().split('T')[0]}
                          value={formData.deliveryDate}
                          onChange={handleChange}
                          className={inputClass()}
                        />
                      </div>

                      <div>
                        <label htmlFor="contact-budget-design" className={labelClass}>Estimated Budget</label>
                        <input
                          id="contact-budget-design"
                          type="text"
                          name="budget"
                          value={formData.budget}
                          onChange={handleChange}
                          placeholder="e.g. £300 / £1,000 (Optional)"
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
                    <label htmlFor="contact-message" className={labelClass}>Inquiry Details / Message *</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={4}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Share your event schedule, special vision, or specific requirements..."
                      className={inputClass(Boolean(errors.message))}
                    />
                    {errors.message && <p className="text-error text-xs mt-1.5">{errors.message}</p>}
                  </div>

                  {/* Direct One-Click Submission Button */}
                  <button
                    type="submit"
                    disabled={dbSubmitting}
                    className="w-full bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] px-6 py-4 btn-cinematic hover:bg-tertiary hover:text-on-tertiary rounded-sm flex justify-center items-center gap-3 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                  >
                    {dbSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Submitting Inquiry...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Inquiry</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Contact Info Sidebar (WhatsApp, Email & Studio Details Preserved) */}
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
                      href={`https://wa.me/${businessWhatsAppClean}?text=${encodeURIComponent("Hi Apoorv Patel Photography, I would like to inquire about your services.")}`}
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
                  <span className="font-body text-[16px]">United Kingdom</span>
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
