import { useState } from 'react';
import { Search, Eye, X, Mail, Phone, Calendar, RefreshCw, Trash2 } from 'lucide-react';
import { useLeadsAdmin, type Lead, type LeadKind } from '../../hooks/useLeads';
import { friendlyError } from '../../lib/adminErrors';
import type { LeadStatus } from '../../lib/database.types';

const statusOptions: LeadStatus[] = [
  'new',
  'contacted',
  'requirement_confirmed',
  'quotation_sent',
  'follow_up',
  'confirmed',
  'completed',
  'lost',
  'cancelled',
];

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30',
  contacted: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  requirement_confirmed: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30',
  quotation_sent: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30',
  follow_up: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30',
  confirmed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
  completed: 'bg-tertiary/15 text-tertiary border border-tertiary/30',
  lost: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30',
  cancelled: 'bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border border-neutral-500/30',
};

export default function AdminLeads() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState('');
  const [kind, setKind] = useState<'all' | LeadKind>('all');
  const [actionError, setActionError] = useState<string | null>(null);

  const { leads, loading, error: loadError, updateStatus, addNote, remove, refetch } = useLeadsAdmin(
    statusFilter === 'all' ? undefined : (statusFilter as LeadStatus),
    search,
    kind === 'all' ? undefined : kind
  );

  const run = async (context: string, action: () => Promise<void>) => {
    setActionError(null);
    try {
      await action();
      return true;
    } catch (err) {
      setActionError(friendlyError(err, context, 'That change could not be saved. Please try again.'));
      return false;
    }
  };

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    if (await run('Update enquiry status', () => updateStatus(id, status)) && selectedLead?.id === id) {
      setSelectedLead(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleAddNote = async (id: string) => {
    if (!newNote.trim()) return;
    if (await run('Add enquiry note', () => addNote(id, newNote))) {
      if (selectedLead?.id === id) {
        setSelectedLead(prev => prev ? { ...prev, notes: [...prev.notes, newNote.trim()] } : null);
      }
      setNewNote('');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this enquiry?')) {
      if (await run('Delete enquiry', () => remove(id)) && selectedLead?.id === id) setSelectedLead(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">Enquiries</h2>
          <p className="text-on-surface-variant text-sm mt-1">Client bookings and student training enquiries from your website</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg pl-9 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40 w-full sm:w-64 transition-colors"
            />
          </div>

          <select
            value={kind}
            onChange={e => setKind(e.target.value as 'all' | LeadKind)}
            aria-label="Enquiry type"
            className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-tertiary cursor-pointer"
          >
            <option value="all" className="bg-surface-container">All enquiries</option>
            <option value="client" className="bg-surface-container">Client bookings</option>
            <option value="student" className="bg-surface-container">Student / training</option>
          </select>

          <select
            aria-label="Status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3.5 py-2 text-sm text-on-surface focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40 cursor-pointer transition-colors"
          >
            <option value="all" className="bg-surface-container text-on-surface">All Statuses ({leads.length})</option>
            {statusOptions.map(s => (
              <option key={s} value={s} className="bg-surface-container text-on-surface">
                {s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>

          <button
            onClick={() => refetch()}
            disabled={loading}
            className="p-2 bg-surface-container border border-outline-variant/40 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
            title="Refresh Inquiries"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {(loadError || actionError) && (
        <div role="alert" className="bg-error/10 border border-error/30 text-error rounded-xl p-4 text-sm">{actionError || loadError}</div>
      )}

      <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden shadow-xs">
        {loading && leads.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant text-sm">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-tertiary" />
            <span>Loading inquiries...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mx-auto mb-3">
              <Mail size={22} />
            </div>
            <p className="text-on-surface font-medium text-sm">No Inquiries Found</p>
            <p className="text-on-surface-variant text-xs mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'Try clearing your filters or search terms.'
                : 'When potential clients reach out via the website, their details will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-lowest/50 text-on-surface-variant text-left border-b border-outline-variant/30">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">Service / Event</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-surface-container/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-on-surface">{lead.name}</div>
                      <div className="text-on-surface-variant text-xs">{lead.mobile || lead.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-on-surface">{lead.service_type || lead.event_type || 'General'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold border ${lead.source === 'training' ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'}`}>
                        {lead.source === 'training' ? 'Student' : 'Client'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-on-surface-variant text-xs">
                      {lead.event_date || new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        aria-label={`Status for ${lead.name}`}
                        value={lead.status}
                        onChange={e => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider cursor-pointer focus:outline-none transition-colors ${statusColors[lead.status] || ''}`}
                      >
                        {statusOptions.map(s => (
                          <option key={s} value={s} className="bg-surface-container text-on-surface font-normal normal-case">
                            {s.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="p-1.5 text-on-surface-variant hover:text-tertiary transition-colors"
                          title="View Details"
                          aria-label={`View enquiry from ${lead.name}`}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-1.5 text-on-surface-variant hover:text-error transition-colors"
                          title="Delete Enquiry"
                          aria-label={`Delete enquiry from ${lead.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Inquiry Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-container-low rounded-2xl max-w-lg w-full p-6 border border-outline-variant/30 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-on-surface">{selectedLead.name}</h3>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mt-1 ${statusColors[selectedLead.status] || ''}`}>
                  {selectedLead.status.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20">
              <div>
                <span className="text-on-surface-variant block uppercase tracking-wider text-[10px]">Email</span>
                <a href={`mailto:${selectedLead.email}`} className="text-tertiary font-medium flex items-center gap-1 mt-0.5 break-all">
                  <Mail size={12} className="shrink-0" /> {selectedLead.email}
                </a>
              </div>
              <div>
                <span className="text-on-surface-variant block uppercase tracking-wider text-[10px]">Phone / Mobile</span>
                <a href={`tel:${selectedLead.mobile}`} className="text-on-surface font-medium flex items-center gap-1 mt-0.5">
                  <Phone size={12} className="shrink-0" /> {selectedLead.mobile || 'Not provided'}
                </a>
              </div>
              {selectedLead.location && (
                <div>
                  <span className="text-on-surface-variant block uppercase tracking-wider text-[10px]">Location</span>
                  <span className="text-on-surface font-medium mt-0.5 block">{selectedLead.location}</span>
                </div>
              )}
              {selectedLead.event_date && (
                <div>
                  <span className="text-on-surface-variant block uppercase tracking-wider text-[10px]">Event Date</span>
                  <span className="text-on-surface font-medium mt-0.5 flex items-center gap-1">
                    <Calendar size={12} /> {selectedLead.event_date}
                  </span>
                </div>
              )}
              {selectedLead.budget && (
                <div>
                  <span className="text-on-surface-variant block uppercase tracking-wider text-[10px]">Budget</span>
                  <span className="text-on-surface font-medium mt-0.5 block">{selectedLead.budget}</span>
                </div>
              )}
            </div>

            <div>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                Client Message
              </span>
              <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                {selectedLead.message || 'No message provided.'}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="space-y-3 pt-2 border-t border-outline-variant/30">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
                Internal Studio Notes
              </span>
              <div className="space-y-2">
                {selectedLead.notes && selectedLead.notes.length > 0 ? (
                  selectedLead.notes.map((note, i) => (
                    <div key={i} className="p-2.5 bg-surface-container rounded-lg text-xs text-on-surface border border-outline-variant/20">
                      {note}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-on-surface-variant italic">No internal notes added yet.</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add note..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddNote(selectedLead.id); }}
                  className="flex-1 bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-tertiary"
                />
                <button
                  type="button"
                  onClick={() => handleAddNote(selectedLead.id)}
                  className="px-3 py-2 bg-tertiary text-on-tertiary text-xs font-semibold rounded-lg hover:bg-tertiary-fixed transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
