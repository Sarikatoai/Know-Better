@AGENTS.md

# Know Better — Project Context

**Project:** Know Better — voice-native mobile app for dog behavioral pattern tracking
**Stack:** React Native + Expo SDK 54, Supabase, Claude API, Whisper API, Langfuse
**Main file:** App.js — all screens in one file for MVP

## Rules

- Only modify App.js and lib/supabase.js unless explicitly instructed otherwise
- Never install new packages without asking first
- Never write tests or use Playwright
- Make minimum changes needed — do not refactor working code

## Current Build Status

MVP Phase 1 — COMPLETE
MVP Phase 2 — COMPLETE

MVP Phase 1 complete:
- All 10 onboarding screens
- Supabase Auth magic link
- Onboarding data saves to users, dogs, family_members tables
- Returning user goes straight to check-in
- Voice recording via MediaRecorder (web) and expo-av (mobile)
- Whisper API transcription working
- Claude API response generating (model: claude-sonnet-4-5)
- Audio saved to Supabase storage bucket: checkins
- Check-in saved to check_ins table
- Response saved to responses table

MVP Phase 2 complete:
- Input classification — normal, concerning, health_event, irrelevant
- Classification saved to check_ins.input_classification
- contributed_to_baseline set correctly per classification
- Baseline calculation — 7 day rolling window
- Baseline metrics: normal_rate, concerning_rate, consecutive_concerning_days
- Baseline saved to baselines table after every check-in
- baseline_active requires minimum 3 check-ins
- Deviation detection — consecutive concerning days rule
- Level 1: 2 consecutive concerning days
- Level 2: 3 consecutive concerning days
- Level 3: 5 consecutive concerning days
- Alert saved to alerts table with trigger reason and baseline snapshot
- Dynamic alert response prompts with dog name, check-in text, consecutive days
- RLS policies added for baselines and alerts tables

## Phase 3 Architecture — Pattern Engine

**Key change:** Pattern engine operates on daily summaries, not individual check-ins.

- Multiple check-ins per day are allowed
- Baseline, consecutive day rule, and combination rule all aggregate check-ins by day before evaluation
- A day is "concerning" if any contributing check-in that day is classified as concerning
- Max one alert per day per dog

## Server-Side Jobs (Supabase Infrastructure)

These are deployed in Supabase and not visible in the app code. Verify via Supabase dashboard → Edge Functions / SQL editor (`SELECT * FROM cron.job`).

- **Edge Function:** `super-api` — handles server-side operations called by cron jobs
- **pg_cron job:** `delete-old-audio-files` — runs daily at 2 AM UTC, calls `super-api` to delete audio files older than 30 days from the `checkins` storage bucket

## Database Tables

- `users` — user_id, first_name, email
- `dogs` — dog_id, owner_id, dog_name, breed, sex, date_of_birth, pre_existing_health_conditions, current_mood_at_onboarding
- `family_members` — member_id, owner_id, member_user_id, dog_id, role, can_log, can_view, can_manage
- `check_ins` — check_in_id, dog_id, family_member_id, check_in_type, audio_file_url, whisper_raw_text, check_in_text, transcription_status, input_classification, contributed_to_baseline
- `responses` — response_id, check_in_id, dog_id, response_text, response_type, response_status, was_alert
- `baselines` — dog_id, baseline_data (JSONB)
- `alerts` — dog_id, check_in_id, alert_level, alert_trigger_reason, baseline_snapshot
