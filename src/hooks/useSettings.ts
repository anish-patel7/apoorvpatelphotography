import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useSiteSettings<T = Record<string, unknown>>(key: string) {
  const [value, setValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(`Settings fetch error (${key}):`, error);
        setValue(((data as any)?.value as T) ?? null);
        setLoading(false);
      });
  }, [key]);

  const update = useCallback(async (newValue: T) => {
    const { error } = await supabase
      .from('site_settings')
      .upsert([{ key, value: newValue as Record<string, unknown> }] as any);
    if (error) throw error;
    setValue(newValue);
  }, [key]);

  return { value, loading, update };
}
