const SUPABASE_STORAGE_BASE = import.meta.env.VITE_SUPABASE_STORAGE_BASE;

export function mediaUrl(path) {
  return `${SUPABASE_STORAGE_BASE}/${path}`;
}