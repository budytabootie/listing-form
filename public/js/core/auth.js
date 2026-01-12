import { API } from "./api.js";

export const Auth = {
  async checkSession() {
    try {
      // 1. Ambil config dari server
      const configRes = await fetch("/api/get-config");
      const config = await configRes.json();

      // 2. Inisialisasi Supabase
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

      // 3. Inisialisasi API Wrapper
      API.init(supabaseInstance, config.supabaseUrl);

      // 4. Cek Session Token
      const token = localStorage.getItem("sessionToken");
      if (!token) return this.redirectToLogin();

      // 5. Validasi session ke Database
      const { data, error } = await API.fetchSessionWithUser(token);

      if (error || !data?.users_login) {
        console.warn("Session Invalid atau Expired");
        return this.redirectToLogin();
      }

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
    if (token) {
      try {
        await API.deleteSession(token);
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
    if (window.location.pathname !== "/login.html") {
      window.location.href = "/login.html";
    }
    return null;
  },
};
