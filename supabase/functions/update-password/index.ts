import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS", // Menambahkan izin metode
};

serve(async (req) => {
  // Tangani request OPTIONS dari browser
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, newPassword, token } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1. Validasi Sesi: Pastikan token milik userId yang dikirim
    const { data: session, error: sessionErr } = await supabaseAdmin
      .from("user_sessions")
      .select("user_id")
      .eq("token", token)
      .eq("user_id", userId)
      .single();

    if (sessionErr || !session) {
      throw new Error("Sesi tidak valid atau akses ditolak!");
    }

    // 2. Update Password (dan matikan flag force change)
    const { error: updateErr } = await supabaseAdmin
      .from("users_login")
      .update({
        password: newPassword,
        has_changed_password: true,
        is_encrypted: true, // Menandakan password sudah dalam format SHA256
      })
      .eq("id", userId);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "An error occurred";
    return new Response(
      JSON.stringify({ success: false, message: message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
