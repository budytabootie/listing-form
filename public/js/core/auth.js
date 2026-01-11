// public/js/core/auth.js
import { API } from "./api.js";

export const Auth = {
  async checkSession() {
    try {
      // 1. Ambil config termasuk adminToken dari server
      const configRes = await fetch("/api/get-config");
      const config = await configRes.json();

      // 2. Inisialisasi Supabase dengan Custom Header untuk bypass RLS
      const supabaseInstance = supabase.createClient(
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

      // 3. Inisialisasi API Wrapper agar URL Edge Function tidak null
      API.init(supabaseInstance, config.supabaseUrl);

      // 4. Cek Session Token di LocalStorage
      const token = localStorage.getItem("sessionToken");
      if (!token) return this.redirectToLogin();

      // 5. Validasi session ke Database
      const { data, error } = await API.fetchSessionWithUser(token);

      if (error || !data?.users_login) {
        console.warn(
          "KETENDANG KARENA:",
          error ? "Error DB" : "Data Session Kosong"
        );
        return this.redirectToLogin();
      }

      // 6. Kembalikan data untuk digunakan di page (seperti users.js)
      return {
        supabase: supabaseInstance,
        user: data.users_login,
        token: token,
      };
    } catch (err) {
      console.error("Auth Error:", err);
      return this.redirectToLogin();
    }
  },

  async logout(token) {
    // Hapus session di database jika memungkinkan
    if (token) {
      try {
        if (typeof API.deleteSession === "function") {
          await API.deleteSession(token);
        }
      } catch (e) {
        console.error("Logout DB Error:", e);
      }
    }
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("nmc_session");
    window.location.href = "/login.html";
  },

  redirectToLogin() {
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("nmc_session");
    // Pastikan tidak looping redirect jika sudah di login.html
    if (window.location.pathname !== "/login.html") {
      window.location.href = "/login.html";
    }
    return null;
  },
};
