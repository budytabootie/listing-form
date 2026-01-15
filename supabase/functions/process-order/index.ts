import { serve } from "std/http";
import { createClient } from "supabase";

// 1. Tambahkan CORS Headers agar bisa dipanggil dari Browser
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-custom-auth, x-session-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // 2. Handle Preflight Request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { items, token } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 3. Validasi Token
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("user_sessions")
      .select("user_id")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Sesi tidak valid" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Proses Transaksi
    for (const item of items) {
      const { error: rpcError } = await supabaseAdmin.rpc(
        "decrement_inventory",
        { i_name: item.nama, i_qty: item.qty },
      );

      // Jika RPC melempar RAISE EXCEPTION dari SQL, error-nya akan tertangkap di sini
      if (rpcError) throw new Error(rpcError.message);
    }

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
