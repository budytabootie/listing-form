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
    if (data && data.users_login) {
      console.error("Session Invalid:", error);
      // Ambil data user dari session yang tersimpan di memori browser (jika ada)
      const cachedUser = JSON.parse(
        localStorage.getItem("nmc_user_data") || "{}"
      );
      if (
        cachedUser.role_id &&
        data.users_login.role_id !== cachedUser.role_id
      ) {
        console.warn("Role changed detected! Re-logging...");
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("nmc_user_data");
        window.location.href = "../login.html?reason=role_changed";
        return null;
      }
      localStorage.setItem("nmc_user_data", JSON.stringify(data.users_login));
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
