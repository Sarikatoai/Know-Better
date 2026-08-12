import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (_req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: pending, error } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .lte('scheduled_for', new Date().toISOString())
      .is('sent_at', null);

    if (error) throw error;
    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let processedCount = 0;

    for (const n of pending) {
      // Always mark processed so we never retry on error
      const markSent = () =>
        supabase.from('scheduled_notifications')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', n.id);

      const { data: user } = await supabase
        .from('users')
        .select('push_token, notifications_enabled')
        .eq('user_id', n.user_id)
        .single();

      if (!user?.push_token || !user?.notifications_enabled) {
        await markSent();
        continue;
      }

      const { data: dog } = await supabase
        .from('dogs')
        .select('dog_name')
        .eq('dog_id', n.dog_id)
        .single();

      const dogName = dog?.dog_name ?? 'your dog';
      let body = '';
      let shouldSend = true;

      if (n.notification_type === 'escalation_reminder') {
        if (n.alert_id) {
          const { data: alert } = await supabase
            .from('alerts')
            .select('alert_status')
            .eq('alert_id', n.alert_id)
            .single();
          if (alert?.alert_status !== 'active') shouldSend = false;
        }
        body = `${dogName}'s alert is still pending. Any updates?`;

      } else if (n.notification_type === 'vet_followup') {
        if (n.alert_id) {
          const { data: alert } = await supabase
            .from('alerts')
            .select('alert_status')
            .eq('alert_id', n.alert_id)
            .single();
          if (alert?.alert_status === 'resolved') shouldSend = false;
        }
        body = `Did you get a chance to visit the vet for ${dogName}?`;
      }

      if (shouldSend) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.push_token,
            sound: 'default',
            title: 'Know Better',
            body,
            data: { type: n.notification_type, alert_id: n.alert_id },
          }),
        });
        processedCount++;
      }

      await markSent();
    }

    return new Response(JSON.stringify({ ok: true, processed: processedCount }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
