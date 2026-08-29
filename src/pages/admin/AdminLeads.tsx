import { useState } from 'react';
import { Search, Eye, X, MessageCircle, Mail, Phone } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  mobile: string;
  service: string;
  eventType: string;
  eventDate: string;
  location: string;
  status: string;
  source: string;
  createdAt: string;
  message: string;
  notes: string[];
}

const initialLeads: Lead[] = [
  { id: '1', name: 'Priya Sharma', email: 'priya@example.com', mobile: '+91 98765 43210', service: 'Wedding Photography', eventType: 'Wedding', eventDate: '2026-12-15', location: 'Ahmedabad', status: 'new', source: 'Website', createdAt: '2026-08-28', message: 'Looking for complete wedding photography coverage for a 3-day event.', notes: [] },
  { id: '2', name: 'James Wilson', email: 'james@example.com', mobile: '+44 7700 900123', service: 'Photo Editing', eventType: '', eventDate: '', location: 'London', status: 'contacted', source: 'Instagram', createdAt: '2026-08-27', message: 'Need 200 photos edited for a wedding album.', notes: ['Called on 28th, discussed requirements'] },
  { id: '3', name: 'Neha Patel', email: 'neha@example.com', mobile: '+91 87654 32109', service: 'Pre-Wedding Shoot', eventType: 'Pre-Wedding', eventDate: '2026-11-20', location: 'Udaipur', status: 'quotation_sent', source: 'WhatsApp', createdAt: '2026-08-26', message: 'Want a cinematic pre-wedding shoot at City Palace.', notes: ['Sent quotation for 2-day shoot'] },
  { id: '4', name: 'Ravi Kumar', email: 'ravi@example.com', mobile: '+91 76543 21098', service: 'Photography Training', eventType: '', eventDate: '', location: 'Mumbai', status: 'new', source: 'Website', createdAt: '2026-08-25', message: 'Interested in the photography masterclass, weekend batch.', notes: [] },
  { id: '5', name: 'Sarah Thompson', email: 'sarah@example.com', mobile: '+44 7700 900456', service: 'Wedding Videography', eventType: 'Wedding', eventDate: '2027-03-10', location: 'Manchester', status: 'confirmed', source: 'Referral', createdAt: '2026-08-24', message: 'Looking for cinematic wedding film with drone coverage.', notes: ['Confirmed booking', 'Advance received'] },
];

const statusOptions = ['new', 'contacted', 'requirement_confirmed', 'quotation_sent', 'follow_up', 'confirmed', 'completed', 'lost', 'cancelled'];
const statusColors: Record<string, string> = {
  new: 'bg-blue-400/10 text-blue-400',
  contacted: 'bg-yellow-400/10 text-yellow-400',
  requirement_confirmed: 'bg-indigo-400/10 text-indigo-400',
  quotation_sent: 'bg-purple-400/10 text-purple-400',
  follow_up: 'bg-orange-400/10 text-orange-400',
  confirmed: 'bg-green-400/10 text-green-400',
  completed: 'bg-brand-saffron/10 text-brand-saffron',
  lost: 'bg-red-400/10 text-red-400',
  cancelled: 'bg-gray-400/10 text-gray-400',
};

export default function AdminLeads() {
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState('');

  const filtered = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.service.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = (id: string, status: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, status } : null);
  };

  const addNote = (id: string) => {
    if (!newNote.trim()) return;
    setLeads(prev => prev.map(l => l.id === id ? { ...l, notes: [...l.notes, newNote] } : l));
    if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, notes: [...prev.notes, newNote] } : null);
    setNewNote('');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="font-heading text-2xl font-bold">Leads / Inquiries</h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-saffron/50 w-56"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-saffron/50"
          >
            <option value="all">All Status</option>
            {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-brand-charcoal rounded-xl border border-white/5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/40 text-left border-b border-white/5">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Service</th>
              <th className="px-5 py-3 font-medium">Source</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(lead => (
              <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-5 py-3 font-medium">{lead.name}</td>
                <td className="px-5 py-3 text-white/60">{lead.service}</td>
                <td className="px-5 py-3 text-white/60">{lead.source}</td>
                <td className="px-5 py-3 text-white/60">{lead.createdAt}</td>
                <td className="px-5 py-3">
                  <select
                    value={lead.status}
                    onChange={e => updateStatus(lead.id, e.target.value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 focus:outline-none cursor-pointer ${statusColors[lead.status] || ''}`}
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => setSelectedLead(lead)} className="text-brand-saffron hover:text-brand-gold">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/40">No leads found.</div>
        )}
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedLead(null)}>
          <div className="bg-brand-charcoal rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="font-heading text-xl font-semibold">Lead Details</h3>
              <button onClick={() => setSelectedLead(null)} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-white/40 block">Name</span>{selectedLead.name}</div>
                <div><span className="text-white/40 block">Service</span>{selectedLead.service}</div>
                <div><span className="text-white/40 block">Email</span>{selectedLead.email}</div>
                <div><span className="text-white/40 block">Mobile</span>{selectedLead.mobile}</div>
                {selectedLead.eventType && <div><span className="text-white/40 block">Event</span>{selectedLead.eventType}</div>}
                {selectedLead.eventDate && <div><span className="text-white/40 block">Date</span>{selectedLead.eventDate}</div>}
                <div><span className="text-white/40 block">Location</span>{selectedLead.location}</div>
                <div><span className="text-white/40 block">Source</span>{selectedLead.source}</div>
              </div>

              <div className="text-sm">
                <span className="text-white/40 block mb-1">Message</span>
                <p className="text-white/70 bg-white/5 rounded-lg p-3">{selectedLead.message}</p>
              </div>

              <div className="flex gap-2">
                <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-1 px-3 py-1.5 bg-white/5 rounded-lg text-xs hover:bg-white/10 transition-colors">
                  <Mail size={14} /> Email
                </a>
                <a href={`tel:${selectedLead.mobile}`} className="flex items-center gap-1 px-3 py-1.5 bg-white/5 rounded-lg text-xs hover:bg-white/10 transition-colors">
                  <Phone size={14} /> Call
                </a>
                <a href={`https://wa.me/${selectedLead.mobile.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-xs hover:bg-green-500/20 transition-colors">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              </div>

              <div>
                <span className="text-white/40 text-sm block mb-2">Notes</span>
                {selectedLead.notes.length > 0 ? (
                  <ul className="space-y-1 mb-3">
                    {selectedLead.notes.map((n, i) => <li key={i} className="text-sm text-white/60 bg-white/5 rounded-lg p-2">{n}</li>)}
                  </ul>
                ) : (
                  <p className="text-white/30 text-sm mb-3">No notes yet.</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-saffron/50"
                    onKeyDown={e => e.key === 'Enter' && addNote(selectedLead.id)}
                  />
                  <button onClick={() => addNote(selectedLead.id)} className="px-4 py-2 bg-brand-saffron text-black text-sm font-medium rounded-lg hover:bg-brand-gold transition-colors">
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
