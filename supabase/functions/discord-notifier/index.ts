// Gunakan standar import terbaru dari Supabase
/// <reference lib="deno.window" />
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!BOT_TOKEN) throw new Error("BOT_TOKEN tidak ditemukan!");

    const { discord_id, message } = await req.json();
    if (!discord_id) throw new Error("discord_id wajib diisi!");

    // 2. Buat DM Channel ke User
    const channelRes = await fetch(
      `https://discord.com/api/v10/users/@me/channels`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bot ${BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipient_id: discord_id }),
      },
    );

    const channelData = await channelRes.json();
    if (!channelRes.ok) {
      throw new Error(
        `Discord API (Channel): ${channelData.message || "Cek privasi DM"}`,
      );
    }

    // 3. Kirim Pesan ke Channel ID yang didapat
    const messageRes = await fetch(
      `https://discord.com/api/v10/channels/${channelData.id}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bot ${BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: message }),
      },
    );

    if (!messageRes.ok) {
      const msgData = await messageRes.json();
      throw new Error(`Discord API (Message): ${msgData.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Unknown Notifier Error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
