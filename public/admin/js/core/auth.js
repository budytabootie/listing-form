// public/admin/js/core/auth.js

export const Auth = {
  _supabase: null,
  _userData: null,

  async checkSession() {
    // 1. Ambil Config Supabase
    const configRes = await fetch("/api/get-config");
    const config = await configRes.json();
    this._supabase = supabase.createClient(
      config.supabaseUrl,
      config.supabaseKey
    );

    // 2. Cek Token
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
      .single();

    if (error || !data?.users_login) {
      localStorage.removeItem("sessionToken");
      window.location.href = "../login.html";
      return null;
    }

    if (data.users_login.has_changed_password === false) {
      window.location.href = "../change-password.html";
      return null;
    }

    this._userData = data.users_login;
    return { supabase: this._supabase, user: this._userData };
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
