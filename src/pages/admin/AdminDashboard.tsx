import { Users, FolderOpen, Camera, GraduationCap, MessageSquareQuote, TrendingUp, Calendar, Film } from 'lucide-react';

const stats = [
  { label: 'Total Leads', value: '47', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { label: 'New Leads', value: '12', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
  { label: 'Upcoming Events', value: '5', icon: Calendar, color: 'text-brand-saffron', bg: 'bg-brand-saffron/10' },
  { label: 'Portfolio Projects', value: '8', icon: FolderOpen, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { label: 'Services', value: '15', icon: Camera, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { label: 'Featured Reels', value: '6', icon: Film, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { label: 'Training Inquiries', value: '8', icon: GraduationCap, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { label: 'Testimonials', value: '6', icon: MessageSquareQuote, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
];

const recentLeads = [
  { id: '1', name: 'Priya Sharma', service: 'Wedding Photography', date: '2026-08-28', status: 'new' },
  { id: '2', name: 'James Wilson', service: 'Photo Editing', date: '2026-08-27', status: 'contacted' },
  { id: '3', name: 'Neha Patel', service: 'Pre-Wedding Shoot', date: '2026-08-26', status: 'quotation_sent' },
  { id: '4', name: 'Ravi Kumar', service: 'Photography Training', date: '2026-08-25', status: 'new' },
  { id: '5', name: 'Sarah Thompson', service: 'Wedding Videography', date: '2026-08-24', status: 'confirmed' },
];

const statusColors: Record<string, string> = {
  new: 'bg-blue-400/10 text-blue-400',
  contacted: 'bg-yellow-400/10 text-yellow-400',
  quotation_sent: 'bg-purple-400/10 text-purple-400',
  confirmed: 'bg-green-400/10 text-green-400',
  completed: 'bg-brand-saffron/10 text-brand-saffron',
};

export default function AdminDashboard() {
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-brand-charcoal rounded-xl p-5 border border-white/5">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-white/50 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-brand-charcoal rounded-xl border border-white/5">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="font-heading text-lg font-semibold">Recent Leads</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-left border-b border-white/5">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Service</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.map(lead => (
                <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-medium">{lead.name}</td>
                  <td className="px-6 py-4 text-white/60">{lead.service}</td>
                  <td className="px-6 py-4 text-white/60">{lead.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[lead.status] || ''}`}>
                      {lead.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
