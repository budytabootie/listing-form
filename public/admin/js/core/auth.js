// public/admin/js/core/auth.js

export const Auth = {
  _supabase: null,
  _userData: null,

  async checkSession() {
    // 1. Ambil Config Supabase (Sertakan adminToken)
    const configRes = await fetch("/api/get-config");
    const config = await configRes.json();

    // Inisialisasi Supabase dengan header x-custom-auth
    this._supabase = supabase.createClient(
      config.supabaseUrl,
      config.supabaseKey,
      {
        global: {
          headers: {
            "x-custom-auth": config.adminToken,
          },
        },
      }
    );

    // 2. Cek Token di LocalStorage
    const token = localStorage.getItem("sessionToken");
    if (!token) {
      window.location.href = "../login.html";
      return null;
    }

    // 3. Validasi ke Database
    const { data, error } = await this._supabase
      .from("user_sessions")
      .select(
        `
                *,
                users_login (
                    *,
                    roles (*)
                )
            `
      )
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    // Jika error atau data tidak ditemukan, tendang ke login
    if (error || !data?.users_login) {
      console.error("Session Invalid:", error);
      localStorage.removeItem("sessionToken");
      window.location.href = "../login.html";
      return null;
    }

    // --- PERBAIKAN DI SINI ---
    // Kita tidak redirect ke file .html lagi.
    // Kita hanya mengembalikan data user, dan biarkan dashboard memunculkan Modal.
    this._userData = data.users_login;

    return {
      supabase: this._supabase,
      user: this._userData,
      token: token,
    };
  },

  async logout() {
    const token = localStorage.getItem("sessionToken");
    if (token && this._supabase) {
      await this._supabase.from("user_sessions").delete().eq("token", token);
    }
    localStorage.removeItem("sessionToken");
    window.location.href = "../login.html";
  },
};
