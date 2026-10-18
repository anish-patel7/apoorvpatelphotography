import { useState } from 'react';
import { supabase, getStorageUrl, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { FriendlyError } from '../lib/adminErrors';
import { shrinkImageToFit } from '../utils/shrinkImage';

export interface UploadOptions {
  /** Reject files larger than this (bytes) before uploading. */
  maxBytes?: number;
  /** Reject files whose MIME type is not listed. */
  allowedTypes?: string[];
  /** Folder prefix inside the bucket, e.g. "2026/10". */
  folder?: string;
  /** Receives upload progress from 0 to 1. */
  onProgress?: (fraction: number) => void;
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

/**
 * Uploads straight to the Supabase Storage REST endpoint with XMLHttpRequest so the
 * admin sees real progress (supabase-js does not expose upload progress).
 */
async function uploadWithProgress(bucket: string, filePath: string, file: File, onProgress?: (fraction: number) => void) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? supabaseAnonKey;
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${supabaseUrl}/storage/v1/object/${bucket}/${encodedPath}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', supabaseAnonKey);
    xhr.setRequestHeader('x-upsert', 'false');
    // File names are unique, so the CDN may cache them for a year.
    xhr.setRequestHeader('cache-control', 'max-age=31536000');
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = e => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
        return;
      }
      let body: any = null;
      try { body = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
      reject(Object.assign(new Error(body?.message || body?.error || `Upload failed (HTTP ${xhr.status})`), { status: xhr.status, body }));
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

export function useStorage(bucket: string) {
  const [uploading, setUploading] = useState(false);

  /** Validates and uploads a file; throws a FriendlyError (plain-English message) on failure. */
  const uploadFile = async (original: File, options: UploadOptions = {}): Promise<UploadResult> => {
    if (!isSupabaseConfigured) {
      throw new FriendlyError('Uploading is not available in this preview.');
    }
    if (options.allowedTypes && !options.allowedTypes.includes(original.type)) {
      throw new FriendlyError(`"${original.name}" is not a supported file type.`);
    }
    // Large photos are resized/recompressed in the browser instead of being rejected.
    let file = original;
    if (options.maxBytes && file.size > options.maxBytes && file.type.startsWith('image/')) {
      file = await shrinkImageToFit(file, options.maxBytes).catch(() => original);
    }
    if (options.maxBytes && file.size > options.maxBytes) {
      const limitMb = Math.round(options.maxBytes / (1024 * 1024));
      throw new FriendlyError(`"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The maximum is ${limitMb} MB.`);
    }

    setUploading(true);
    try {
      const filePath = buildFilePath(file, options.folder);
      await uploadWithProgress(bucket, filePath, file, options.onProgress);
      return { publicUrl: getStorageUrl(bucket, filePath), path: filePath };
    } catch (err: any) {
      const message = err?.message || '';
      if (/bucket not found/i.test(message)) {
        throw new FriendlyError('This type of upload needs a one-time setup by your website developer.', err);
      }
      if (/row-level security|unauthori[sz]ed|permission|jwt/i.test(message) || err?.status === 401 || err?.status === 403) {
        throw new FriendlyError('You don\'t have permission to upload. Please sign out and sign in again.', err);
      }
      if (/maximum allowed size|too large|payload/i.test(message) || err?.status === 413) {
        throw new FriendlyError(`"${file.name}" is too large to upload.`, err);
      }
      if (/mime|not supported/i.test(message) || err?.status === 415) {
        throw new FriendlyError(`"${file.name}" is not a supported file type.`, err);
      }
      throw new FriendlyError(`"${file.name}" could not be uploaded. Please check your connection and try again.`, err);
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
