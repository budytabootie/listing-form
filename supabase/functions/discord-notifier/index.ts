import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS (Penting agar web bisa panggil fungsi ini)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { discord_id, message } = await req.json()

    // 1. Buat DM Channel
    const channelRes = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipient_id: discord_id }),
    })
    
    const channel = await channelRes.json()

    if (!channel.id) {
      throw new Error('Gagal membuat DM Channel. Pastikan ID Discord benar dan Bot satu server dengan user.')
    }

    // 2. Kirim Pesan
    const messageRes = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: message }),
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})