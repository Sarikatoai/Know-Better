const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio_base64, mime_type, language = 'en' } = await req.json();

    const audioBytes = Uint8Array.from(atob(audio_base64), (c) => c.charCodeAt(0));
    const audioBlob = new Blob([audioBytes], { type: mime_type });
    const ext = mime_type.includes('ogg') ? 'ogg' : mime_type.includes('mp4') ? 'mp4' : mime_type.includes('m4a') ? 'm4a' : 'webm';

    const formData = new FormData();
    formData.append('file', audioBlob, `recording.${ext}`);
    formData.append('model', 'whisper-1');
    formData.append('language', language);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY') ?? ''}` },
      body: formData,
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
