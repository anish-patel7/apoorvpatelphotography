import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { LeadStatus } from '../lib/database.types';

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  whatsapp: string;
  email: string;
  service_type: string;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  budget: string | null;
  message: string;
  status: LeadStatus;
  source: string;
  notes: string[];
  created_at: string;
  updated_at: string;
}

function mapInquiryRow(row: any): Lead {
  return {
    id: row.id,
    name: row.customer_name || row.name || 'Anonymous',
    mobile: row.phone || row.mobile || '',
    whatsapp: row.phone || row.whatsapp || '',
    email: row.email || '',
    service_type: row.event_type || row.service_type || 'Photography',
    event_type: row.event_type || null,
    event_date: row.event_date || null,
    location: row.event_location || row.location || null,
    budget: row.budget || null,
    message: row.message || '',
    status: (row.inquiry_status || row.status || 'new') as LeadStatus,
    source: row.source || 'website',
    notes: Array.isArray(row.notes) ? row.notes : [],
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

export function useSubmitInquiry() {
  const [submitting, setSubmitting] = useState(false);

  const submit = async (data: {
    name: string;
    email: string;
    phone?: string;
    eventType?: string;
    eventDate?: string;
    location?: string;
    budget?: string;
    message: string;
  }): Promise<{ success: boolean; id?: string; error?: string }> => {
    setSubmitting(true);
    try {
      if (!isSupabaseConfigured) {
        // Safe offline mode simulation
        return { success: true, id: `offline-${Date.now()}` };
      }

      const payload = {
        customer_name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: (data.phone || '').trim(),
        event_type: data.eventType || 'Wedding',
        event_date: data.eventDate || null,
        event_location: (data.location || '').trim() || null,
        budget: data.budget || null,
        message: data.message.trim(),
        inquiry_status: 'new',
        source: 'website',
      };

      const { data: inserted, error } = await (supabase
        .from('inquiries')
        .insert([payload as any])
        .select('id')
        .single());

      if (error) {
        // Try fallback to leads if table alias exists
        const { data: fallbackInserted, error: fallbackError } = await (supabase
          .from('leads')
          .insert([{
            name: payload.customer_name,
            email: payload.email,
            mobile: payload.phone,
            whatsapp: payload.phone,
            service_type: payload.event_type,
            event_type: payload.event_type,
            event_date: payload.event_date,
            location: payload.event_location,
            budget: payload.budget,
            message: payload.message,
            status: 'new',
            source: 'website',
          } as any])
          .select('id')
          .single());

        if (fallbackError) {
          throw new Error(error.message || fallbackError.message);
        }
        return { success: true, id: fallbackInserted?.id };
      }

      return { success: true, id: inserted?.id };
    } catch (err: any) {
      console.error('Inquiry submission error:', err);
      return { success: false, error: err?.message || 'Failed to submit inquiry' };
    } finally {
      setSubmitting(false);
    }
  };

  return { submit, submitting };
}

export function useLeadsAdmin(statusFilter?: LeadStatus, search?: string) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setLeads([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('inquiry_status', statusFilter);
      }

      if (search && search.trim()) {
        const q = search.trim();
        query = query.or(`customer_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (error) {
        // Fallback to leads table if inquiries isn't present
        const { data: leadsData, error: leadsErr } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (leadsErr) {
          console.error('Inquiries & Leads fetch error:', leadsErr.message);
          setLeads([]);
        } else {
          setLeads((leadsData || []).map(mapInquiryRow));
        }
      } else {
        setLeads((data || []).map(mapInquiryRow));
      }
    } catch (err) {
      console.error('Error fetching admin inquiries:', err);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateStatus = async (id: string, status: LeadStatus) => {
    if (!isSupabaseConfigured) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      return;
    }

    const { error } = await (supabase.from('inquiries').update as any)({ inquiry_status: status }).eq('id', id);
    if (error) {
      // Fallback update to leads table
      await (supabase.from('leads').update as any)({ status }).eq('id', id);
    }
    await fetch();
  };

  const addNote = async (id: string, noteText: string) => {
    if (!noteText.trim()) return;
    const target = leads.find(l => l.id === id);
    const existingNotes = target?.notes || [];
    const updatedNotes = [...existingNotes, noteText.trim()];

    if (!isSupabaseConfigured) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, notes: updatedNotes } : l));
      return;
    }

    const { error } = await (supabase.from('inquiries').update as any)({ notes: updatedNotes }).eq('id', id);
    if (error) {
      await (supabase.from('leads').update as any)({ notes: updatedNotes }).eq('id', id);
    }
    await fetch();
  };

  const remove = async (id: string) => {
    if (!isSupabaseConfigured) {
      setLeads(prev => prev.filter(l => l.id !== id));
      return;
    }

    const { error } = await supabase.from('inquiries').delete().eq('id', id);
    if (error) {
      await supabase.from('leads').delete().eq('id', id);
    }
    await fetch();
  };

  return { leads, loading, updateStatus, addNote, remove, refetch: fetch };
}
