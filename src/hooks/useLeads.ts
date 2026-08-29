import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { LeadStatus } from '../lib/database.types';

interface Lead {
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
  created_at: string;
  updated_at: string;
}

interface LeadNote {
  id: string;
  lead_id: string;
  content: string;
  created_at: string;
}

export function useSubmitInquiry() {
  const [submitting, setSubmitting] = useState(false);

  const submit = async (data: Partial<Lead>) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('leads').insert([data] as any);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Inquiry submission error:', err);
      return false;
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
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,mobile.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) console.error('Leads fetch error:', error);
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateStatus = async (id: string, status: LeadStatus) => {
    const { error } = await supabase.from('leads').update({ status } as any).eq('id', id);
    if (error) throw error;
    await fetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
    await fetch();
  };

  return { leads, loading, updateStatus, remove, refetch: fetch };
}

export function useLeadNotes(leadId: string) {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('lead_notes')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) console.error('Lead notes fetch error:', error);
    setNotes((data as LeadNote[]) ?? []);
    setLoading(false);
  }, [leadId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addNote = async (content: string) => {
    const { error } = await supabase
      .from('lead_notes')
      .insert([{ lead_id: leadId, content }] as any);
    if (error) throw error;
    await fetch();
  };

  return { notes, loading, addNote };
}

export function useLeadStats() {
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    confirmed: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('status');

      if (error) {
        console.error('Lead stats error:', error);
        setLoading(false);
        return;
      }

      const rows = (data as any[]) ?? [];
      setStats({
        total: rows.length,
        new: rows.filter(r => r.status === 'new').length,
        contacted: rows.filter(r => r.status === 'contacted').length,
        confirmed: rows.filter(r => r.status === 'confirmed').length,
        completed: rows.filter(r => r.status === 'completed').length,
      });
      setLoading(false);
    })();
  }, []);

  return { stats, loading };
}
