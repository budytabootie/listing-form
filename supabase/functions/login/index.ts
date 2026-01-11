import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    {
      global: {
        headers: {
          // Mengambil dari secret yang baru saja kita set
          "x-custom-auth": Deno.env.get("ADMIN_SECRET_TOKEN") ?? "",
        },
      },
    },
  );

  let inputUsername = "";

  try {
    const { username, password } = await req.json();
    inputUsername = username;

    // 1. Ambil data user
    const { data: user, error: userError } = await supabaseAdmin
      .from("users_login")
      .select(
        "id, username, password, nama_lengkap, role_id, is_encrypted, has_changed_password",
      )
      .eq("username", username)
      .single();

    if (userError || !user) throw new Error("User tidak ditemukan");

    // 2. Verifikasi Password
    let isMatch = false;
    if (user.is_encrypted) {
      const msgUint8 = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedInput = hashArray.map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      isMatch = user.password === hashedInput;
    } else {
      isMatch = user.password === password;
    }

    if (!isMatch) throw new Error("Password salah");

    // 3. Buat Session Token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error: sessionError } = await supabaseAdmin
      .from("user_sessions")
      .insert({
        user_id: user.id,
        token: token,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) throw sessionError;

    // 4. CATAT LOG: LOGIN BERHASIL
    await supabaseAdmin.from("audit_logs").insert([{
      username: user.nama_lengkap,
      action: "LOGIN",
      table_name: "users_login",
      description: `User @${user.username} berhasil masuk ke sistem.`,
    }]);

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
    // 5. CATAT LOG: LOGIN GAGAL (Penting untuk keamanan)
    if (inputUsername) {
      await supabaseAdmin.from("audit_logs").insert([{
        username: inputUsername,
        action: "LOGIN_FAILED",
        table_name: "users_login",
        description: `Percobaan login gagal: ${error.message}`,
      }]);
    }

    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
