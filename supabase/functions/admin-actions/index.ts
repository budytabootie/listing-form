import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-custom-auth, x-session-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function hashPassword(password: string) {
  // Memastikan password bersih dari spasi sebelum di-hash
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

    // Kecuali ganti password sendiri, harus admin (1 atau 2)
    if (
      action !== "self_change_password" && (userRole !== 1 && userRole !== 2)
    ) {
      throw new Error("Unauthorized");
    }

    let dbError;
    // PENTING: Trim password di sini
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

    // Notifikasi Discord untuk Admin Action
    if (
      (action === "create_user" || action === "reset_password") &&
      payload.discord_id
    ) {
      // Ambil origin dari referer atau gunakan payload app_url
      const origin = req.headers.get("referer")
        ? new URL(req.headers.get("referer")!).origin
        : "http://localhost:3000"; // Fallback jika tidak ada referer
      const portalUrl = payload.app_url || origin;
      const messageContent = action === "create_user"
        ? `🆕 **AKUN PORTAL BARU**\n\n👤 Username: \`${payload.username}\`\n🔑 Password: \`${plain_p}\`\n🌐 Link: ${portalUrl}\n\n⚠️ *Segera login dan ganti password Anda.*`
        : `🔄 **RESET PASSWORD PORTAL**\n\n👤 Username: \`${payload.username}\`\n🔑 Password Baru: \`${plain_p}\`\n🌐 Link: ${portalUrl}\n\n⚠️ *Segera login dan ganti kembali password Anda.*`;

      await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/discord-notifier`,
        {
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
        },
      ).catch((e) => console.error(e));
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
