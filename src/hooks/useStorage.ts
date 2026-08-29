import { useState } from 'react';
import { supabase, getStorageUrl } from '../lib/supabase';

export function useStorage(bucket: string) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File, path?: string): Promise<string | null> => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = path ?? `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (error) throw error;
      return getStorageUrl(bucket, filePath);
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const remove = async (filePath: string) => {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) console.error('Delete error:', error);
  };

  return { upload, remove, uploading };
}
