import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const token = req.headers.get("x-session-token") ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) throw new Error("No session token provided");

    const { data: sessionData, error: authError } = await supabase
      .from("user_sessions")
      .select(`
        user_id,
        users_login!user_id (
          role_id
        )
      `)
      .eq("token", token)
      .single();

    if (authError || !sessionData) throw new Error("Invalid Session");

    const { action, payload } = await req.json();
    const userRole = sessionData.users_login?.role_id;

    if (
      action !== "self_change_password" && (userRole !== 1 && userRole !== 2)
    ) {
      throw new Error("Unauthorized");
    }

    let dbError;
    const plain_p = (payload.password || "").toString().trim();

    if (
      action === "create_user" || action === "reset_password" ||
      action === "self_change_password"
    ) {
      if (!plain_p) throw new Error("Password tidak boleh kosong");
      const hashed_p = await hashPassword(plain_p);

      if (action === "create_user") {
        const { error } = await supabase.from("users_login").insert([{
          nama_lengkap: payload.nama_lengkap,
          username: payload.username,
          password: hashed_p,
          role_id: payload.role_id,
          is_encrypted: true,
          has_changed_password: false,
        }]);
        dbError = error;
      } else if (action === "reset_password") {
        const { error } = await supabase.from("users_login").update({
          password: hashed_p,
          is_encrypted: true,
          has_changed_password: false,
        }).eq("id", payload.user_id);
        dbError = error;
      } else if (action === "self_change_password") {
        const { error } = await supabase.from("users_login").update({
          password: hashed_p,
          is_encrypted: true,
          has_changed_password: true,
        }).eq("id", payload.user_id);
        dbError = error;
      }
    } else if (action === "delete_user") {
      const { error } = await supabase.from("users_login").delete().eq(
        "id",
        payload.user_id,
      );
      dbError = error;
    }

    if (dbError) throw dbError;

    // --- LOGIKA DISCORD ---
    if (
      (action === "create_user" || action === "reset_password") &&
      payload.discord_id
    ) {
      const origin = req.headers.get("referer")
        ? new URL(req.headers.get("referer")!).origin
        : "http://localhost:3000";
      const portalUrl = payload.app_url || origin;

      const messageContent = action === "create_user"
        ? `🆕 **AKUN PORTAL BARU**\n\n👤 Username: \`${payload.username}\`\n🔑 Password: \`${plain_p}\`\n🌐 Link: ${portalUrl}\n\n⚠️ *Segera login dan ganti password Anda.*`
        : `🔄 **RESET PASSWORD PORTAL**\n\n👤 Username: \`${payload.username}\`\n🔑 Password Baru: \`${plain_p}\`\n🌐 Link: ${portalUrl}\n\n⚠️ *Segera login dan ganti kembali password Anda.*`;

      console.log(
        `Mengirim notifikasi ke function discord-notifier untuk user: ${payload.username}`,
      );

      // Memanggil function notifier secara internal
      fetch(`${supabaseUrl}/functions/v1/discord-notifier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          discord_id: payload.discord_id,
          message: messageContent,
        }),
      })
        .then(async (res) => {
          const resText = await res.text();
          console.log(`Discord Notifier Response (${res.status}): ${resText}`);
        })
        .catch((e) => console.error("Discord Fetch Error:", e));
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Critical Error in admin-actions:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
