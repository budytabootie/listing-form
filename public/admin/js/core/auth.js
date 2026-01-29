// public/admin/js/core/auth.js
export const Auth = {
  _supabase: null,
  _userData: null,

  async checkSession() {
    const configRes = await fetch("/api/get-config");
    const config = await configRes.json();
    const token = localStorage.getItem("sessionToken");

    this._supabase = supabase.createClient(
      config.supabaseUrl,
      config.supabaseKey,
      {
        global: {
          headers: {
            "x-session-token": token,
          },
        },
      },
    );

    if (!token) {
      window.location.href = "../login.html";
      return null;
    }

    const { data, error } = await this._supabase
      .from("user_sessions")
      .select(`*, users_login (*, roles (*))`)
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    // Perbaikan Logika: Jika tidak ada data atau expired, tendang ke login
    if (error || !data || !data.users_login) {
      console.error("Session Invalid or Expired");
      localStorage.removeItem("sessionToken");
      window.location.href = "../login.html";
      return null;
    }

    // Cek perubahan Role (opsional)
    const cachedUser = JSON.parse(
      localStorage.getItem("nmc_user_data") || "{}",
    );
    if (cachedUser.role_id && data.users_login.role_id !== cachedUser.role_id) {
      localStorage.removeItem("sessionToken");
      window.location.href = "../login.html?reason=role_changed";
      return null;
    }

    localStorage.setItem("nmc_user_data", JSON.stringify(data.users_login));
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
    localStorage.removeItem("nmc_user_data");
    window.location.href = "../login.html";
  },
};
