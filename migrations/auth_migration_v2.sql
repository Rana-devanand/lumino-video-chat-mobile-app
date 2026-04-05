-- Migration: Update Profiles for Email OTP Auth
-- This script updates the profiles table to support email-based authentication and updates the sync function.

-- 1. Add email column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 2. Update sync_user_profile function
-- This function now accepts email and ensures all 3 fields are stored.
CREATE OR REPLACE FUNCTION sync_user_profile(
    user_id TEXT, 
    user_phone TEXT, 
    user_email TEXT, 
    user_name TEXT DEFAULT NULL,
    referrer_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    final_name TEXT;
BEGIN
    final_name := COALESCE(user_name, 'User ' || right(user_phone, 4));

    -- Upsert into profiles
    -- We use ON CONFLICT (id) to allow users to update their info
    INSERT INTO public.profiles (id, phone_number, email, full_name, created_at)
    VALUES (user_id, user_phone, user_email, final_name, NOW())
    ON CONFLICT (id) DO UPDATE 
    SET phone_number = EXCLUDED.phone_number,
        email = EXCLUDED.email,
        full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);

    -- Upsert into user_presence
    INSERT INTO public.user_presence (id, is_online, last_seen)
    VALUES (user_id, true, NOW())
    ON CONFLICT (id) DO UPDATE 
    SET is_online = true,
        last_seen = NOW();

    -- Handle Referral / Auto-Sync (Keep existing logic)
    IF referrer_id IS NOT NULL AND referrer_id != user_id THEN
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = referrer_id) THEN
            -- Create mutual contacts
            INSERT INTO public.contacts (user_id, contact_id) VALUES (user_id, referrer_id) ON CONFLICT DO NOTHING;
            INSERT INTO public.contacts (user_id, contact_id) VALUES (referrer_id, user_id) ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN json_build_object(
        'status', 'success',
        'id', user_id,
        'full_name', final_name,
        'email', user_email,
        'referred_by', referrer_id
    );
END;
$$;
