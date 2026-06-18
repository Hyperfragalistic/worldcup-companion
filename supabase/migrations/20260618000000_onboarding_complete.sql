-- Phase 4: track whether a user has completed the onboarding modal
-- false = new user (welcome + onboarding modals will show)
-- true  = user has finished setup (modals never show again)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false;
