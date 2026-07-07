import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// RLS policies for health_events — run in Supabase SQL editor:
//
// ALTER TABLE health_events ENABLE ROW LEVEL SECURITY;
//
// CREATE POLICY "Users can insert health events for their dogs"
//   ON health_events FOR INSERT
//   WITH CHECK (
//     dog_id IN (SELECT dog_id FROM dogs WHERE owner_id = auth.uid())
//     OR dog_id IN (SELECT dog_id FROM family_members WHERE member_user_id = auth.uid())
//   );
//
// CREATE POLICY "Users can view health events for their dogs"
//   ON health_events FOR SELECT
//   USING (
//     dog_id IN (SELECT dog_id FROM dogs WHERE owner_id = auth.uid())
//     OR dog_id IN (SELECT dog_id FROM family_members WHERE member_user_id = auth.uid())
//   );
//
// CREATE POLICY "Users can update health events for their dogs"
//   ON health_events FOR UPDATE
//   USING (
//     dog_id IN (SELECT dog_id FROM dogs WHERE owner_id = auth.uid())
//     OR dog_id IN (SELECT dog_id FROM family_members WHERE member_user_id = auth.uid())
//   );

// Alert acknowledgement + vet update columns — run in Supabase SQL editor:
//
// ALTER TABLE alerts ADD COLUMN IF NOT EXISTS alert_status text NOT NULL DEFAULT 'active';
// ALTER TABLE alerts ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;
// ALTER TABLE alerts ADD COLUMN IF NOT EXISTS vet_update_logged_at timestamptz;
//
// CREATE TABLE IF NOT EXISTS vet_updates (
//   update_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   alert_id uuid NOT NULL REFERENCES alerts(alert_id),
//   dog_id uuid NOT NULL REFERENCES dogs(dog_id),
//   vet_visit_date date,
//   vet_feedback text,
//   treatment_given text,
//   notes text,
//   created_at timestamptz NOT NULL DEFAULT now()
// );
//
// ALTER TABLE vet_updates ENABLE ROW LEVEL SECURITY;
//
// CREATE POLICY "Users can insert vet updates for their dogs"
//   ON vet_updates FOR INSERT
//   WITH CHECK (
//     dog_id IN (SELECT dog_id FROM dogs WHERE owner_id = auth.uid())
//     OR dog_id IN (SELECT dog_id FROM family_members WHERE member_user_id = auth.uid())
//   );
//
// CREATE POLICY "Users can view vet updates for their dogs"
//   ON vet_updates FOR SELECT
//   USING (
//     dog_id IN (SELECT dog_id FROM dogs WHERE owner_id = auth.uid())
//     OR dog_id IN (SELECT dog_id FROM family_members WHERE member_user_id = auth.uid())
//   );

// vet_reports table + RLS policies — run in Supabase SQL editor:
//
// CREATE TABLE vet_reports (
//   report_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   dog_id uuid NOT NULL REFERENCES dogs(dog_id),
//   period_start date NOT NULL,
//   period_end date NOT NULL,
//   overall_status text NOT NULL,
//   summary_data jsonb NOT NULL,
//   generated_at timestamptz NOT NULL DEFAULT now()
// );
//
// ALTER TABLE vet_reports ENABLE ROW LEVEL SECURITY;
//
// CREATE POLICY "Users can insert vet reports for their dogs"
//   ON vet_reports FOR INSERT
//   WITH CHECK (
//     dog_id IN (SELECT dog_id FROM dogs WHERE owner_id = auth.uid())
//     OR dog_id IN (SELECT dog_id FROM family_members WHERE member_user_id = auth.uid())
//   );
//
// CREATE POLICY "Users can view vet reports for their dogs"
//   ON vet_reports FOR SELECT
//   USING (
//     dog_id IN (SELECT dog_id FROM dogs WHERE owner_id = auth.uid())
//     OR dog_id IN (SELECT dog_id FROM family_members WHERE member_user_id = auth.uid())
//   );
