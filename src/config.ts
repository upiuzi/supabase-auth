if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  alert("VITE_SUPABASE_ANON_KEY is required");
  throw new Error("VITE_SUPABASE_ANON_KEY is required");
}
if (!import.meta.env.VITE_SUPABASE_URL) {
  alert("VITE_SUPABASE_URL is required");
  throw new Error("VITE_SUPABASE_URL is required");
}

// console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
// console.log(import.meta.env.VITE_SUPABASE_URL);
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Pastikan API_BASE_URL diambil dari env dan fallback ke https://wagt.satcoconut.com jika belum ada
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://wagt.satcoconut.com";
