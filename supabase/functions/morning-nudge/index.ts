import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date();
    let nudgedCount = 0;

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, push_token, timezone_offset_minutes, last_morning_nudge_at')
      .eq('notifications_enabled', true)
      .not('push_token', 'is', null);

    if (usersError) throw usersError;
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ ok: true, nudged: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    for (const user of users) {
      if (user.timezone_offset_minutes === null) continue;
      const offsetMinutes = user.timezone_offset_minutes;

      // Shift now into user's local time
      const localNow = new Date(now.getTime() + offsetMinutes * 60 * 1000);
      const localHour = localNow.getUTCHours();
      const localDay = localNow.getUTCDay(); // 0=Sun 1=Mon 3=Wed 5=Fri

      // Only fire at 11am Mon/Wed/Fri in user's local timezone
      if (localHour !== 11) continue;
      if (![1, 3, 5].includes(localDay)) continue;

      // Skip if already nudged today in user's local time
      if (user.last_morning_nudge_at) {
        const lastLocal = new Date(
          new Date(user.last_morning_nudge_at).getTime() + offsetMinutes * 60 * 1000
        );
        if (lastLocal.toISOString().split('T')[0] === localNow.toISOString().split('T')[0]) continue;
      }

      // Get user's dogs
      const { data: dogs } = await supabase
        .from('dogs')
        .select('dog_id, dog_name')
        .eq('owner_id', user.user_id);

      if (!dogs || dogs.length === 0) continue;

      // Skip if already checked in today (any dog, user's local day)
      const localDayStart = new Date(localNow);
      localDayStart.setUTCHours(0, 0, 0, 0);
      const localDayEnd = new Date(localNow);
      localDayEnd.setUTCHours(23, 59, 59, 999);

      const { count: todayCount } = await supabase
        .from('check_ins')
        .select('check_in_id', { count: 'exact', head: true })
        .in('dog_id', dogs.map((d: any) => d.dog_id))
        .gte('created_at', localDayStart.toISOString())
        .lte('created_at', localDayEnd.toISOString());

      if ((todayCount ?? 0) > 0) continue;

      const body = dogs.length === 1
        ? `Good morning! How's ${dogs[0].dog_name} doing today?`
        : `Good morning! How are your dogs doing today?`;

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.push_token,
          sound: 'default',
          title: 'Know Better',
          body,
          data: { type: 'morning_nudge' },
        }),
      });

      await supabase
        .from('users')
        .update({ last_morning_nudge_at: now.toISOString() })
        .eq('user_id', user.user_id);

      nudgedCount++;
    }

    return new Response(JSON.stringify({ ok: true, nudged: nudgedCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
