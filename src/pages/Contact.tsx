import { useState } from 'react';

type InquiryType = 'photography' | 'editing' | 'training' | 'general';

export default function Contact() {
  const [formType, setFormType] = useState<InquiryType>('photography');
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '', mobile: '', whatsapp: '', email: '',
    eventType: '', eventDate: '', location: '', services: '',
    editingType: '', numPhotos: '', deliveryDate: '', reference: '',
    course: '', experience: '', batch: '', modePreference: '',
    message: '', budget: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const inputClass = 'w-full bg-transparent border-0 border-b border-outline-variant/50 focus:border-tertiary text-on-surface py-3 px-0 focus:ring-0 transition-colors duration-300 font-body text-[16px] placeholder:text-on-surface-variant/50';
  const labelClass = 'block font-body text-[12px] font-bold tracking-[0.15em] uppercase text-on-surface-variant mb-2';

  const tabs = [
    { id: 'photography' as const, label: 'Photography / Videography' },
    { id: 'editing' as const, label: 'Editing' },
    { id: 'training' as const, label: 'Training' },
    { id: 'general' as const, label: 'General' },
  ];

  return (
    <main className="pt-[104px]">
      <header className="px-5 md:px-16 py-[120px] max-w-[1440px] mx-auto text-center">
        <h1 className="font-display text-[40px] md:text-[72px] text-on-background mb-6 leading-[1.1] tracking-[-0.02em] font-semibold">
          Get in Touch
        </h1>
        <p className="font-body text-[18px] text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          Ready to capture your special moments? Fill out the form below or reach out via WhatsApp or Instagram.
        </p>
      </header>

      <section className="px-5 md:px-16 pb-[120px] max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-7 bg-surface-container-lowest p-8 md:p-12 border border-outline-variant/10 rounded-sm">
            <div className="flex flex-wrap gap-2 mb-10">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setFormType(tab.id); setSubmitted(false); }}
                  className={`font-body text-[12px] font-bold tracking-[0.1em] uppercase px-5 py-2.5 transition-all duration-300 rounded-sm ${
                    formType === tab.id
                      ? 'bg-on-background text-background'
                      : 'text-on-surface-variant hover:bg-surface-variant border border-outline-variant/20'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {submitted ? (
              <div className="py-20 text-center">
                <span className="material-symbols-outlined text-[64px] text-tertiary mb-4 block">check_circle</span>
                <h3 className="font-display text-[32px] text-on-background mb-2 leading-tight">Thank You!</h3>
                <p className="font-body text-[16px] text-on-surface-variant">Your inquiry has been submitted. We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Your full name" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Email *</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="your@email.com" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Mobile *</label>
                    <input type="tel" name="mobile" required value={formData.mobile} onChange={handleChange} placeholder="+91 / +44" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>WhatsApp</label>
                    <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="WhatsApp number" className={inputClass} />
                  </div>
                </div>

                {formType === 'photography' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                    <div>
                      <label className={labelClass}>Event Type *</label>
                      <select name="eventType" required value={formData.eventType} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer`}>
                        <option value="">Select event type</option>
                        {['Wedding', 'Engagement', 'Pre-Wedding', 'Baby Shower', 'Maternity', 'Birthday', 'Family', 'Couple', 'Portrait', 'Special Event'].map(e => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Event Date</label>
                      <input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Location</label>
                      <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Event location" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Budget Range</label>
                      <input type="text" name="budget" value={formData.budget} onChange={handleChange} placeholder="Optional" className={inputClass} />
                    </div>
                  </div>
                )}

                {formType === 'editing' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                    <div>
                      <label className={labelClass}>Editing Type *</label>
                      <select name="editingType" required value={formData.editingType} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer`}>
                        <option value="">Select type</option>
                        {['Photo Editing', 'Retouching', 'Color Correction', 'Album Design', 'Video Editing', 'Reel Editing'].map(e => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Number of Photos/Videos</label>
                      <input type="text" name="numPhotos" value={formData.numPhotos} onChange={handleChange} placeholder="e.g., 50 photos" className={inputClass} />
                    </div>
                  </div>
                )}

                {formType === 'training' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                    <div>
                      <label className={labelClass}>Course *</label>
                      <select name="course" required value={formData.course} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer`}>
                        <option value="">Select course</option>
                        {['Photography Masterclass', 'Videography & Filmmaking', 'Photo Editing & Retouching', 'Video Editing & Post-Production'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Experience Level</label>
                      <select name="experience" value={formData.experience} onChange={handleChange} className={`${inputClass} appearance-none cursor-pointer`}>
                        <option value="">Select level</option>
                        {['Complete Beginner', 'Some Experience', 'Intermediate', 'Advanced'].map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className={labelClass}>Message</label>
                  <textarea name="message" rows={4} value={formData.message} onChange={handleChange} placeholder="Tell us more about your requirements..." className={inputClass} />
                </div>

                <button
                  type="submit"
                  className="w-full bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] px-6 py-4 btn-cinematic hover:bg-tertiary hover:text-on-tertiary rounded-sm flex justify-center items-center gap-3"
                >
                  Submit Inquiry <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </form>
            )}
          </div>

          {/* Contact Info Sidebar */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-surface-container-low p-8 md:p-10 border border-outline-variant/10 rounded-sm">
              <h3 className="font-display text-[24px] text-on-surface mb-8 leading-tight">Contact Information</h3>
              <ul className="space-y-6">
                <li>
                  <a href="mailto:contact@apoorvpatelphotography.com" className="flex items-center gap-4 text-on-surface-variant hover:text-tertiary transition-colors">
                    <span className="material-symbols-outlined text-tertiary">mail</span>
                    <span className="font-body text-[16px]">contact@apoorvpatelphotography.com</span>
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/?text=Hi" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-on-surface-variant hover:text-tertiary transition-colors">
                    <span className="material-symbols-outlined text-tertiary">chat</span>
                    <span className="font-body text-[16px]">Chat on WhatsApp</span>
                  </a>
                </li>
                <li>
                  <a href="https://www.instagram.com/apoorvpatel_photography/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-on-surface-variant hover:text-tertiary transition-colors">
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
              <h3 className="font-display text-[20px] text-on-surface mb-3 leading-tight">Quick Contact</h3>
              <p className="font-body text-[14px] text-on-surface-variant mb-6 leading-relaxed">
                Prefer a quick chat? Reach out via WhatsApp for fastest response.
              </p>
              <a
                href="https://wa.me/?text=Hi%2C%20I%27m%20interested%20in%20your%20photography%20services."
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] px-6 py-3 rounded-sm btn-cinematic hover:bg-tertiary hover:text-on-tertiary"
              >
                <span className="material-symbols-outlined text-[18px] align-middle mr-2">chat</span>
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
