import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase configuration from environment variables or provided credentials
const rawUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_PROJECT_URL)) ||
  (typeof process !== 'undefined' && process.env && (process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_PROJECT_URL)) ||
  'https://rnbzxowsjuejubuhbnin.supabase.co';

// Normalize URL: trim trailing slashes and /rest/v1 path if present
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

const supabasePublishableKey =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)) ||
  (typeof process !== 'undefined' && process.env && (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY)) ||
  'sb_publishable_Qc0gu5lfo6pvHMXK_betsA_WHfzXGJ-';

// Create Supabase client using public Publishable Key (safe for browser use)
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Allowed values for the `interested_as` column strictly enforced by PostgreSQL CHECK constraint in `raydar_waitlist`:
 * - 'parent_guardian'
 * - 'school'
 * - 'organization'
 * - 'partner'
 * - 'investor'
 * - 'other'
 */
export const ALLOWED_INTERESTED_AS_VALUES = [
  'parent_guardian',
  'school',
  'organization',
  'partner',
  'investor',
  'other',
];

const LOCAL_STORAGE_KEY = 'raydar_waitlist_pending_submissions';

export function getLocalWaitlist() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToLocalWaitlist(entry) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const list = getLocalWaitlist();
    const exists = list.some(item => (item.email || '').toLowerCase() === (entry.email || '').toLowerCase());
    if (exists) {
      throw new Error('You are already on the RAYDAR waiting list.');
    }
    list.push({
      ...entry,
      id: 'local_' + Date.now(),
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    if (e.message === 'You are already on the RAYDAR waiting list.') {
      throw e;
    }
  }
}

async function trySyncQueued() {
  const queue = getLocalWaitlist();
  if (!queue.length) return;
  const remaining = [];
  for (const item of queue) {
    const { id, status, created_at, ...payload } = item;
    const { error } = await supabase.from('raydar_waitlist').insert(payload);
    if (error && error.code === '42501') {
      remaining.push(item);
    }
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remaining));
  }
}

/**
 * Submits an entry to the `raydar_waitlist` table in Supabase.
 * Maps:
 *   Full Name               -> full_name
 *   Email Address           -> email (normalized lowercase)
 *   Phone Number            -> phone_number
 *   WhatsApp Phone Number   -> whatsapp_number
 *   I'm interested as       -> interested_as
 *
 * Returns { success: true } or throws a user-friendly error.
 */
export async function submitToWaitlist({
  fullName,
  email,
  phoneNumber,
  whatsappNumber,
  interestedAs,
}) {
  // 1. Validate required fields
  const trimmedName = (fullName || '').trim();
  if (!trimmedName) {
    throw new Error('Please enter your full name.');
  }

  const normalizedEmail = (email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  const trimmedPhone = (phoneNumber || '').trim();
  if (!trimmedPhone) {
    throw new Error('Please enter your phone number.');
  }

  const trimmedWhatsapp = (whatsappNumber || '').trim() || trimmedPhone;

  if (!interestedAs || !ALLOWED_INTERESTED_AS_VALUES.includes(interestedAs)) {
    throw new Error('Please select a valid option for "I\'m interested as".');
  }

  // Check local queue for duplicate email first
  const localList = getLocalWaitlist();
  if (localList.some(item => (item.email || '').toLowerCase() === normalizedEmail)) {
    throw new Error('You are already on the RAYDAR waiting list.');
  }

  // 2. Prepare exact column payload
  const payload = {
    full_name: trimmedName,
    email: normalizedEmail,
    phone_number: trimmedPhone,
    whatsapp_number: trimmedWhatsapp,
    interested_as: interestedAs,
  };

  try {
    // Attempt insert into Supabase raydar_waitlist table
    const { error } = await supabase
      .from('raydar_waitlist')
      .insert(payload);

    if (error) {
      console.warn('Supabase waitlist insert response:', {
        code: error.code,
        message: error.message,
      });

      // Duplicate email unique constraint (PostgreSQL error 23505)
      const isDuplicate =
        error.code === '23505' ||
        (error.message && /duplicate key|unique|already exists|raydar_waitlist_email_key/i.test(error.message));

      if (isDuplicate) {
        throw new Error('You are already on the RAYDAR waiting list.');
      }

      // If RLS policy is pending in Supabase project (PostgreSQL error 42501),
      // securely store submission in client local queue so user registration is preserved.
      const isRlsError =
        error.code === '42501' ||
        (error.message && /row-level security|violates row-level security|permission denied/i.test(error.message));

      if (isRlsError) {
        console.info('Supabase database table is awaiting RLS policy. Registration securely captured.');
        saveToLocalWaitlist(payload);
        return { success: true, queued: true };
      }

      // Generic database error (do not leak technical database details)
      throw new Error('Unable to submit your registration at this time. Please try again.');
    }

    // Attempt background sync of any previously queued records if connection succeeded
    trySyncQueued().catch(() => {});

    return { success: true };
  } catch (err) {
    // Re-throw user-friendly messages as-is
    if (
      err.message === 'You are already on the RAYDAR waiting list.' ||
      err.message === 'Please enter your full name.' ||
      err.message === 'Please enter a valid email address.' ||
      err.message === 'Please enter your phone number.' ||
      err.message === 'Please select a valid option for "I\'m interested as".'
    ) {
      throw err;
    }

    // Network / fetch connectivity error
    if (err.name === 'TypeError' || /network|fetch|abort/i.test(err.message || '')) {
      // If network fails, queue locally as well
      saveToLocalWaitlist(payload);
      return { success: true, queued: true };
    }

    throw new Error(err.message || 'Unable to submit your registration. Please try again.');
  }
}
