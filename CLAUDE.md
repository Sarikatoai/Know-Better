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
- MVP Phase 1 scope: happy path only — voice input, Whisper transcription, Claude response, Supabase save
- No alert logic yet — that is MVP Phase 2

## Current Build Status

MVP Phase 1 — COMPLETE

Everything working end to end on real phone:
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

## What is being built next

MVP Phase 2 — Level 1 alert logic
- Input classification — four buckets via Claude
- Baseline calculation — nightly recalculation
- Single signal flag detection
- Level 1 alert response generation

## Database Tables

- `users` — user_id, first_name, email
- `dogs` — dog_id, owner_id, dog_name, breed, sex, date_of_birth, pre_existing_health_conditions, current_mood_at_onboarding
- `family_members` — member_id, owner_id, member_user_id, dog_id, role, can_log, can_view, can_manage
- `check_ins` — check_in_id, dog_id, family_member_id, check_in_type, audio_file_url, whisper_raw_text, check_in_text, transcription_status, contributed_to_baseline
- `responses` — response_id, check_in_id, dog_id, response_text, response_type, response_status, was_alert
