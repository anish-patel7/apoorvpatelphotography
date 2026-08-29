import { useState } from 'react';
import { Mail, Phone, MapPin, MessageCircle, Send, CheckCircle } from 'lucide-react';
import InstagramIcon from '../components/icons/InstagramIcon';

type InquiryType = 'photography' | 'videography' | 'editing' | 'training' | 'general';

export default function Contact() {
  const [formType, setFormType] = useState<InquiryType>('photography');
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '', mobile: '', whatsapp: '', email: '',
    eventType: '', eventDate: '', location: '', duration: '',
    guestCount: '', services: '', albumReq: '', editingReq: '',
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

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-saffron/50 focus:ring-1 focus:ring-brand-saffron/30 transition-colors';
  const labelClass = 'block text-sm font-medium text-white/70 mb-1.5';

  return (
    <>
      <section className="pt-32 pb-20 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-brand-saffron text-sm font-semibold tracking-widest uppercase mb-3">Get in Touch</p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Contact Us</h1>
            <p className="text-white/50 max-w-2xl mx-auto">
              Ready to capture your special moments? Fill out the form below or reach out via WhatsApp or Instagram.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-8">
                {([
                  { id: 'photography', label: 'Photography / Videography' },
                  { id: 'editing', label: 'Editing' },
                  { id: 'training', label: 'Training' },
                  { id: 'general', label: 'General' },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setFormType(tab.id); setSubmitted(false); }}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      formType === tab.id ? 'bg-brand-saffron text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {submitted ? (
                <div className="bg-brand-green/10 border border-brand-green/30 rounded-2xl p-12 text-center">
                  <CheckCircle size={64} className="text-brand-green mx-auto mb-4" />
                  <h3 className="font-heading text-2xl font-bold mb-2">Thank You!</h3>
                  <p className="text-white/60">Your inquiry has been submitted successfully. We'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Full Name *</label>
                      <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Your full name" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Email *</label>
                      <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="your@email.com" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Mobile Number *</label>
                      <input type="tel" name="mobile" required value={formData.mobile} onChange={handleChange} placeholder="+91 / +44" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>WhatsApp Number</label>
                      <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="WhatsApp number" className={inputClass} />
                    </div>
                  </div>

                  {formType === 'photography' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Event Type *</label>
                        <select name="eventType" required value={formData.eventType} onChange={handleChange} className={inputClass}>
                          <option value="">Select event type</option>
                          {['Wedding', 'Engagement', 'Pre-Wedding', 'Baby Shower', 'Maternity', 'Birthday', 'Family', 'Couple', 'Portrait', 'Special Event', 'Other'].map(e => (
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
                        <label className={labelClass}>Services Required</label>
                        <select name="services" value={formData.services} onChange={handleChange} className={inputClass}>
                          <option value="">Select service</option>
                          {['Photography Only', 'Videography Only', 'Photography + Videography', 'Photography + Editing', 'Full Package'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Budget Range</label>
                        <input type="text" name="budget" value={formData.budget} onChange={handleChange} placeholder="Optional" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Guest Count</label>
                        <input type="text" name="guestCount" value={formData.guestCount} onChange={handleChange} placeholder="Approximate" className={inputClass} />
                      </div>
                    </div>
                  )}

                  {formType === 'editing' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Editing Type *</label>
                        <select name="editingType" required value={formData.editingType} onChange={handleChange} className={inputClass}>
                          <option value="">Select type</option>
                          {['Photo Editing', 'Retouching', 'Color Correction', 'Album Design', 'Video Editing', 'Reel Editing', 'Creative Editing'].map(e => (
                            <option key={e} value={e}>{e}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Number of Photos/Videos</label>
                        <input type="text" name="numPhotos" value={formData.numPhotos} onChange={handleChange} placeholder="e.g., 50 photos" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Expected Delivery Date</label>
                        <input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Reference / Sample</label>
                        <input type="text" name="reference" value={formData.reference} onChange={handleChange} placeholder="Link or description" className={inputClass} />
                      </div>
                    </div>
                  )}

                  {formType === 'training' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Course *</label>
                        <select name="course" required value={formData.course} onChange={handleChange} className={inputClass}>
                          <option value="">Select course</option>
                          {['Photography Masterclass', 'Videography & Filmmaking', 'Photo Editing & Retouching', 'Video Editing & Post-Production'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Experience Level</label>
                        <select name="experience" value={formData.experience} onChange={handleChange} className={inputClass}>
                          <option value="">Select level</option>
                          {['Complete Beginner', 'Some Experience', 'Intermediate', 'Advanced'].map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Preferred Mode</label>
                        <select name="modePreference" value={formData.modePreference} onChange={handleChange} className={inputClass}>
                          <option value="">Select mode</option>
                          <option value="online">Online</option>
                          <option value="offline">Offline</option>
                          <option value="either">Either</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Preferred Batch</label>
                        <input type="text" name="batch" value={formData.batch} onChange={handleChange} placeholder="e.g., Weekday, Weekend" className={inputClass} />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Message / Special Requirements</label>
                    <textarea name="message" rows={4} value={formData.message} onChange={handleChange} placeholder="Tell us more about your requirements..." className={inputClass} />
                  </div>

                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-brand-saffron text-black font-semibold rounded-full hover:bg-brand-gold transition-colors flex items-center gap-2"
                  >
                    <Send size={18} /> Submit Inquiry
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-8">
              <div className="bg-brand-charcoal rounded-2xl p-8 border border-white/5">
                <h3 className="font-heading text-xl font-semibold mb-6">Contact Information</h3>
                <ul className="space-y-4">
                  <li>
                    <a href="mailto:contact@apoorvpatelphotography.com" className="flex items-start gap-3 text-white/60 hover:text-brand-saffron transition-colors">
                      <Mail size={20} className="text-brand-saffron mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white">Email</p>
                        <p className="text-sm">contact@apoorvpatelphotography.com</p>
                      </div>
                    </a>
                  </li>
                  <li>
                    <a href="tel:+91XXXXXXXXXX" className="flex items-start gap-3 text-white/60 hover:text-brand-saffron transition-colors">
                      <Phone size={20} className="text-brand-saffron mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white">Phone</p>
                        <p className="text-sm">Contact Number</p>
                      </div>
                    </a>
                  </li>
                  <li>
                    <a href="https://wa.me/?text=Hi" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-white/60 hover:text-green-400 transition-colors">
                      <MessageCircle size={20} className="text-green-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white">WhatsApp</p>
                        <p className="text-sm">Chat with us directly</p>
                      </div>
                    </a>
                  </li>
                  <li>
                    <a href="https://www.instagram.com/apoorvpatel_photography/" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-white/60 hover:text-brand-saffron transition-colors">
                      <InstagramIcon size={20} className="text-brand-saffron mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white">Instagram</p>
                        <p className="text-sm">@apoorvpatel_photography</p>
                      </div>
                    </a>
                  </li>
                  <li className="flex items-start gap-3 text-white/60">
                    <MapPin size={20} className="text-brand-saffron mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">Location</p>
                      <p className="text-sm">India | United Kingdom</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-brand-saffron/20 to-brand-green/10 rounded-2xl p-8 border border-brand-saffron/20">
                <h3 className="font-heading text-lg font-semibold mb-3">Quick Contact</h3>
                <p className="text-white/60 text-sm mb-6">
                  Prefer a quick chat? Reach out via WhatsApp for fastest response.
                </p>
                <a
                  href="https://wa.me/?text=Hi%2C%20I%27m%20interested%20in%20your%20photography%20services."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center px-6 py-3 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors"
                >
                  <MessageCircle size={18} className="inline -mt-0.5 mr-2" />
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
