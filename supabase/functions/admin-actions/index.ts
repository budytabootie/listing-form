import { serve } from "std/http";
import { createClient } from "supabase";

interface SessionResponse {
  user_id: string;
  users_login: {
    role_id: number;
    username: string; // Tambahkan baris ini
  } | {
    role_id: number;
    username: string; // Tambahkan baris ini juga
  }[];
} // Menangani kemungkinan object tunggal atau array

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

    // Gunakan 'as any' pada sessionData untuk melewati pengecekan array relasi
    const { data: sessionData, error: authError } = await supabase
      .from("user_sessions")
      .select(`
        user_id,
        users_login!user_id (
          role_id
          username
        )
      `)
      .eq("token", token)
      .single() as { data: SessionResponse | null; error: Error | null };

    if (authError || !sessionData) throw new Error("Invalid Session");

    const { action, payload } = await req.json();
    // Ambil role_id dengan aman baik jika dia array maupun object
    // Ambil role & username dari session
    const loginData = sessionData.users_login;
    const userRole = Array.isArray(loginData)
      ? loginData[0]?.role_id
      : loginData?.role_id;
    const sessionUsername = Array.isArray(loginData)
      ? loginData[0]?.username
      : loginData?.username;

    // 2. Proteksi Role: Hanya admin (1/2) yang bisa akses selain ganti password sendiri
    if (
      action !== "self_change_password" && (userRole !== 1 && userRole !== 2)
    ) {
      throw new Error("Anda tidak memiliki izin (Unauthorized)");
    }

    // 3. Tambahan Proteksi Keamanan: Jika ganti password sendiri, pastikan ID-nya cocok
    if (
      action === "self_change_password" &&
      payload.user_id !== sessionData.user_id
    ) {
      throw new Error(
        "Akses ditolak: Anda tidak bisa mengubah password user lain",
      );
    }

    let dbError;
    const plain_p = (payload.password || "").toString().trim();

    if (
      ["create_user", "reset_password", "self_change_password"].includes(action)
    ) {
      if (!plain_p) throw new Error("Password tidak boleh kosong");
      const hashed_p = await hashPassword(plain_p);

      console.log(
        `Action: ${action}, User: ${payload.username}, DiscordID: ${payload.discord_id}`,
      );

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
          has_changed_password: true, // Flag berubah jadi true
        }).eq("id", payload.user_id);
        dbError = error;
      }
    } else if (action === "update_role") {
      const { error } = await supabase.from("users_login").update({
        role_id: payload.role_id,
      }).eq("id", payload.user_id);
      await supabase.from("user_sessions").delete().eq(
        "user_id",
        payload.user_id,
      );
      dbError = error;
    } else if (action === "delete_user") {
      const { error } = await supabase.from("users_login").delete().eq(
        "id",
        payload.user_id,
      );
      dbError = error;
    }

    if (dbError) throw dbError;

    // LOGIKA DISCORD (Dengan Await agar DM tidak gagal)
    if (
      (action === "create_user" || action === "reset_password") &&
      payload.discord_id
    ) {
      const origin = req.headers.get("referer")
        ? new URL(req.headers.get("referer")!).origin
        : "https://nakamamc.vercel.app";
      const portalUrl = payload.app_url || origin;
      const messageContent = action === "create_user"
        ? `🆕 **AKUN PORTAL BARU**\n\n👤 Username: \`${payload.username}\`\n🔑 Password: \`${plain_p}\`\n🌐 Link: ${portalUrl}\n\n⚠️ *Segera login dan ganti password Anda.*`
        : `🔄 **RESET PASSWORD PORTAL**\n\n👤 Username: \`${payload.username}\`\n🔑 Password Baru: \`${plain_p}\`\n🌐 Link: ${portalUrl}\n\n⚠️ *Segera login dan ganti kembali password Anda.*`;

      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/discord-notifier`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              discord_id: payload.discord_id,
              message: messageContent,
            }),
          },
        );
        await res.text();
      } catch (e) {
        console.error("Discord Notification Failed:", e);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Internal Server Error";
    console.error("Critical Error in admin-actions:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
