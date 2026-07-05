# Know Better

Know Better is a voice-native mobile app that helps dog owners track their dog's behavioral patterns over time — and get an early warning when something might be wrong.

---

## The Problem

Dog owners are good at noticing when their dog is "off." What they struggle with is *remembering* it, *tracking* it, and *knowing when it matters*. A dog that had a rough morning on Monday, skipped a walk on Wednesday, and seemed low-energy on Friday might be showing early signs of a health issue — or it might just be the heat. Without a record, it's nearly impossible to tell.

Vets face the same problem from the other side. When an owner comes in saying "he's just not been himself lately," there's no data to work with.

Know Better creates that data, passively, through daily voice check-ins.

---

## What It Does

You talk to the app for 30 seconds about how your dog is doing today. Know Better transcribes it, classifies it, tracks it over time, and tells you when a pattern is emerging that warrants attention.

### Core Features

**Voice Check-ins**
Record a short audio note about your dog. The app transcribes it using Whisper and sends it to Claude, which generates a thoughtful response and classifies the check-in as normal, concerning, a health event, or irrelevant.

**Behavioral Baseline**
After 3+ check-ins, the app calculates a rolling 7-day baseline for your dog: what percentage of days are normal, what percentage are concerning, and whether concerning days are clustering. This is recalculated after every check-in.

**Pattern Detection & Alerts**
The app watches for consecutive concerning days using a three-level alert system:
- Level 1 — 2 consecutive concerning days
- Level 2 — 3 consecutive concerning days
- Level 3 — 5 consecutive concerning days

When a threshold is hit, Claude generates a response that names the pattern, contextualizes it, and suggests whether a vet visit makes sense.

**Check-in History**
A timeline view of past check-ins with classification indicators, so owners can scroll back and see the shape of their dog's recent health.

**Multi-Dog Support**
The onboarding flow supports households with multiple dogs. Each dog gets its own profile, baseline, and alert history.

**Vet Report**
Generates a structured summary of a dog's recent check-ins, baseline data, and any active alerts — formatted to be useful in a vet conversation.

**Push Notifications**
Server-side push notifications delivered when a new alert is triggered, so owners don't have to open the app to know something needs attention.

**Family Member Access**
Other household members can be added during onboarding with configurable permissions — log only, view only, or full access.

---

## How It's Built

| Layer | Technology |
|---|---|
| Frontend | React Native + Expo SDK 54 |
| Backend / Auth / DB | Supabase (Postgres + Auth + Storage) |
| Transcription | OpenAI Whisper API |
| AI Responses | Anthropic Claude API (claude-sonnet-4-5) |
| Observability | Langfuse |

The app is structured as a single-file MVP (`App.js`) with all screens co-located. Audio files are stored in Supabase Storage. All check-in data, baselines, and alerts live in Postgres with row-level security.

### Database Schema

- `users` — user profile and first name
- `dogs` — breed, sex, DOB, pre-existing conditions, onboarding mood
- `family_members` — household access with role-based permissions
- `check_ins` — transcription, classification, and baseline contribution flag
- `responses` — Claude's generated response per check-in
- `baselines` — rolling 7-day behavioral baseline (JSONB) per dog
- `alerts` — alert level, trigger reason, and baseline snapshot at time of alert

---

## Status

**Phase 1 — Complete.** Onboarding, auth, voice recording, transcription, Claude responses, and Supabase storage.

**Phase 2 — Complete.** Input classification, baseline calculation, consecutive-day deviation detection, and dynamic alert responses.

**Phase 3 — Complete.** Pattern engine operating on daily summaries. Multiple check-ins per day aggregate before evaluation. Max one alert per day per dog.

**Phase 4 — Complete** (usability enhancement work ongoing). Full UI polish pass with a global design system, completed screens for check-in, vet report, check-in history, and burger menu. Rate limiting (10 check-ins per day per user), server-side push notifications, add-dog flow with photo support, and a set of bug fixes from early testing (breed dropdown, dog-specific vet report data, scroll behavior, dog photo upload).
