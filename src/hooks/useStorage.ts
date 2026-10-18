import { useState } from 'react';
import { supabase, getStorageUrl, isSupabaseConfigured } from '../lib/supabase';

export interface UploadOptions {
  /** Reject files larger than this (bytes) before uploading. */
  maxBytes?: number;
  /** Reject files whose MIME type is not listed. */
  allowedTypes?: string[];
  /** Folder prefix inside the bucket, e.g. "2026/10". */
  folder?: string;
}

export interface UploadResult {
  publicUrl: string;
  path: string;
}

/** Returns the object path inside `bucket` for a public URL of that bucket, or null. */
export function getStoragePathFromPublicUrl(bucket: string, url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
}

function buildFilePath(file: File, folder?: string): string {
  const rawExt = file.name.includes('.') ? file.name.split('.').pop() || '' : '';
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return folder ? `${folder}/${id}.${ext}` : `${id}.${ext}`;
}

export function useStorage(bucket: string) {
  const [uploading, setUploading] = useState(false);

  /** Validates and uploads a file; throws an Error with a user-readable message on failure. */
  const uploadFile = async (file: File, options: UploadOptions = {}): Promise<UploadResult> => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured, so files cannot be uploaded.');
    }
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type "${file.type || 'unknown'}". Allowed: ${options.allowedTypes.join(', ')}.`);
    }
    if (options.maxBytes && file.size > options.maxBytes) {
      const limitMb = Math.round(options.maxBytes / (1024 * 1024));
      throw new Error(`File is ${(file.size / (1024 * 1024)).toFixed(1)} MB; the limit is ${limitMb} MB.`);
    }

    setUploading(true);
    try {
      const filePath = buildFilePath(file, options.folder);
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type || undefined,
          // File names are unique, so they can be cached aggressively by the CDN.
          cacheControl: '31536000',
        });

      if (error) {
        const message = error.message || 'Upload failed.';
        if (/bucket not found/i.test(message)) {
          throw new Error(`Storage bucket "${bucket}" does not exist. Run the latest Supabase migration.`);
        }
        if (/row-level security|unauthorized|permission/i.test(message)) {
          throw new Error('You do not have permission to upload. Sign in with an active admin account.');
        }
        if (/exceeded the maximum allowed size|too large|payload/i.test(message)) {
          throw new Error('File exceeds the storage size limit for this bucket.');
        }
        throw new Error(message);
      }
      return { publicUrl: getStorageUrl(bucket, filePath), path: filePath };
    } finally {
      setUploading(false);
    }
  };

  /** Legacy helper: returns the public URL or null (errors are logged). */
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

  /** Deletes the object behind a public URL if (and only if) it lives in this bucket. */
  const removeByPublicUrl = async (url: string | null | undefined) => {
    const path = getStoragePathFromPublicUrl(bucket, url);
    if (path) await remove(path);
  };

  return { upload, uploadFile, remove, removeByPublicUrl, uploading };
}
