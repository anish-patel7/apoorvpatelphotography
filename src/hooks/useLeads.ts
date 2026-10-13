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
    whatsapp?: string;
    eventType?: string;
    eventDate?: string;
    location?: string;
    budget?: string;
    message: string;
    honeypot?: string;
  }): Promise<{ success: boolean; id?: string; error?: string }> => {
    setSubmitting(true);
    try {
      // 1. Check honeypot immediately
      if (data.honeypot && data.honeypot.trim().length > 0) {
        return { success: false, error: 'Spam submission detected.' };
      }

      // 2. Validate essential fields
      const cleanName = data.name.trim();
      const cleanEmail = data.email.trim().toLowerCase();
      const cleanPhone = (data.phone || '').trim();
      const cleanWhatsapp = (data.whatsapp || '').trim();
      const cleanMsg = data.message.trim();

      if (cleanName.length < 2) {
        return { success: false, error: 'Full name must be at least 2 characters.' };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return { success: false, error: 'Please enter a valid email address.' };
      }
      if (cleanPhone.replace(/\D/g, '').length < 7) {
        return { success: false, error: 'Please enter a valid contact phone number (min 7 digits).' };
      }
      if (cleanMsg.length < 5) {
        return { success: false, error: 'Inquiry details / message must be at least 5 characters.' };
      }

      // 3. Single authoritative submission pathway: Vercel backend (/api/submit-inquiry)
      const response = await fetch('/api/submit-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          whatsapp: cleanWhatsapp || cleanPhone,
          eventType: data.eventType || 'General',
          eventDate: data.eventDate || null,
          location: data.location || null,
          budget: data.budget || null,
          message: cleanMsg,
          website_source_hp: data.honeypot || '',
        }),
      });

      const resData = await response.json().catch(() => ({}));

      if (response.ok && resData.success) {
        return { success: true, id: resData.id };
      }

      // If /api endpoint is 404 (local Vite dev server), invoke RPC directly
      if (response.status === 404 && isSupabaseConfigured) {
        const { data: rpcResult, error: rpcError } = await (supabase.rpc as any)('submit_customer_inquiry', {
          p_customer_name: cleanName,
          p_email: cleanEmail,
          p_phone: cleanPhone,
          p_whatsapp: cleanWhatsapp || cleanPhone,
          p_event_type: data.eventType || 'General',
          p_event_date: data.eventDate || null,
          p_event_location: data.location || null,
          p_budget: data.budget || null,
          p_message: cleanMsg,
          p_source: 'website',
        });

        if (!rpcError && rpcResult?.success) {
          return { success: true, id: rpcResult.id };
        }
        if (rpcResult?.error) {
          return { success: false, error: rpcResult.error };
        }
      }

      return {
        success: false,
        error: resData.error || `Submission service error (${response.status}). Please reach out via WhatsApp.`,
      };
    } catch (err: any) {
      console.error('Inquiry submission network error:', err);
      return {
        success: false,
        error: 'Unable to reach the inquiry submission service. Please check your connection or reach out via WhatsApp.',
      };
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
