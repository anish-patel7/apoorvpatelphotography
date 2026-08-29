import { Award, Clock, Heart, Shield, Sparkles, Users } from 'lucide-react';

const reasons = [
  {
    icon: Sparkles,
    title: 'Creative Vision',
    description: 'Unique artistic approach that transforms ordinary moments into extraordinary memories.',
  },
  {
    icon: Award,
    title: 'Professional Quality',
    description: 'Industry-standard equipment and techniques ensuring the highest quality output.',
  },
  {
    icon: Heart,
    title: 'Passion Driven',
    description: 'Every project is handled with genuine passion and attention to detail.',
  },
  {
    icon: Clock,
    title: 'Timely Delivery',
    description: 'We respect your time and deliver projects within agreed timelines.',
  },
  {
    icon: Users,
    title: 'Client Focused',
    description: 'Your vision is our priority. We collaborate closely to bring your ideas to life.',
  },
  {
    icon: Shield,
    title: 'IND | UK Presence',
    description: 'Serving clients across India and the United Kingdom with local expertise.',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-20 sm:py-28 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-brand-saffron text-sm font-semibold tracking-widest uppercase mb-3">Why Us</p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Why Choose Us</h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            We bring creativity, professionalism, and passion together to deliver an exceptional experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map(reason => (
            <div key={reason.title} className="group text-center p-8 rounded-2xl border border-white/5 hover:border-brand-saffron/30 hover:bg-white/[0.02] transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-brand-saffron/10 flex items-center justify-center group-hover:bg-brand-saffron/20 transition-colors">
                <reason.icon size={28} className="text-brand-saffron" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">{reason.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
