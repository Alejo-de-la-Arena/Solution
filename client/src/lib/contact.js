/** Contacto público: usar variables VITE_* en client/.env */

const digits = (s) => String(s || '').replace(/\D/g, '');

export const WHATSAPP_NUMBER = digits(import.meta.env.VITE_WHATSAPP_NUMBER) || '5491144150019';

export const CONTACT_EMAIL =
  (import.meta.env.VITE_CONTACT_EMAIL || 'solution.perfumes@gmail.com').trim() || 'solution.perfumes@gmail.com';
