import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-custom-auth", // Tambahkan x-custom-auth di sini
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Fungsi helper untuk hash SHA256 di sisi server
async function hashPassword(password: string) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const token = req.headers.get("x-session-token") ||
      req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) throw new Error("No session token provided");

    const { data: sessionData, error: authError } = await supabase
      .from("user_sessions")
      .select(`user_id, users_login:user_id (role_id)`)
      .eq("token", token)
      .single();

    if (authError || !sessionData) throw new Error("Invalid Session");

    const { action, payload } = await req.json();
    const userRole = sessionData.users_login?.role_id;

    // Proteksi Admin (Role 1 & 2)
    if (
      action !== "self_change_password" && (userRole !== 1 && userRole !== 2)
    ) {
      throw new Error("Unauthorized: Anda bukan Admin!");
    }

    let dbError;
    const plain_p = (payload.password || "").toString();
    const origin = req.headers.get("referer")
      ? new URL(req.headers.get("referer")).origin
      : "https://portal.anda";
    const portalUrl = payload.app_url || origin;

    if (
      action === "create_user" || action === "reset_password" ||
      action === "self_change_password"
    ) {
      // HASHING DILAKUKAN DI SINI SEBELUM MASUK DB
      console.log("DEBUG - Password masuk ke Edge:", plain_p);

      const hashed_p = await hashPassword(plain_p.trim());

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
          has_changed_password: false,
        }).eq("id", payload.user_id);
        dbError = error;
      } else if (action === "self_change_password") {
        const { error } = await supabase.from("users_login").update({
          password: hashed_p,
          has_changed_password: true,
          is_encrypted: true,
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

    // --- NOTIFIKASI DISCORD (PAKAI PASSWORD POLOS) ---
    if (
      (action === "create_user" || action === "reset_password") &&
      payload.discord_id
    ) {
      try {
        const messageContent = action === "create_user"
          ? `🆕 **AKUN PORTAL BARU**\n\n👤 Username: \`${payload.username}\`\n🔑 Password: \`${plain_p}\`\n🌐 Link: ${portalUrl}\n\n⚠️ *Wajib ganti password saat login pertama!*`
          : `🔄 **RESET PASSWORD PORTAL**\n\n👤 Username: \`${payload.username}\`\n🔑 Password Baru: \`${plain_p}\`\n🌐 Link: ${portalUrl}\n\n⚠️ *Segera login dan ganti kembali password Anda.*`;

        const baseUrl = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "");
        await fetch(`${baseUrl}/functions/v1/discord-notifier`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
            }`,
          },
          body: JSON.stringify({
            discord_id: payload.discord_id,
            message: messageContent,
          }),
        });
      } catch (e) {
        console.error("Discord Notif Error:", e.message);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
