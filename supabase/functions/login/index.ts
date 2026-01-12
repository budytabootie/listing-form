import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-custom-auth, x-session-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function hashPassword(password: string) {
  const msgUint8 = new TextEncoder().encode(password.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const { username, password } = await req.json();

    const { data: user, error: userError } = await supabaseAdmin
      .from("users_login")
      .select("*")
      .eq("username", username)
      .single();

    if (userError || !user) throw new Error("User tidak ditemukan");

    let isMatch = false;

    const isActuallyEncrypted = user.is_encrypted ||
      (user.password && user.password.length === 64);

    if (isActuallyEncrypted) {
      const hashedInput = await hashPassword(password);
      isMatch = user.password === hashedInput;
    } else {
      isMatch = user.password === password.trim();
    }

    if (!isMatch) throw new Error("Password salah");

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await supabaseAdmin.from("user_sessions").insert({
      user_id: user.id,
      token: token,
      expires_at: expiresAt.toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          nama: user.nama_lengkap,
          role_id: user.role_id,
          has_changed_password: user.has_changed_password,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
