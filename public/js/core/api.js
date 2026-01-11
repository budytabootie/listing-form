// public/js/core/api.js

export const API = {
  _supabase: null,
  _functionUrl: null,

  init(supabaseInstance, supabaseUrl) {
    this._supabase = supabaseInstance;
    if (supabaseUrl) {
      this._functionUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1`;
    }
  },

  async deleteSession(token) {
    if (!token) return;
    return await this._supabase
      .from("user_sessions")
      .delete()
      .eq("token", token);
  },

  async getItemsByCategory(jenis) {
    return await this._supabase
      .from("katalog_barang")
      .select("*")
      .eq("jenis_barang", jenis);
  },

  async getInventory() {
    return await this._supabase.from("inventory").select("item_name, stock");
  },

  async login(username, password) {
    try {
      const response = await fetch(`${this._functionUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this._supabase.supabaseKey, // Menggunakan Anon Key dari inisialisasi
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.token) {
        localStorage.setItem("sessionToken", result.token);
        localStorage.setItem("nmc_session", JSON.stringify(result.user));
        return result;
      } else {
        return {
          success: false,
          message: result.message || "Username atau Password salah!",
        };
      }
    } catch (err) {
      return { success: false, message: "Gagal terhubung ke server." };
    }
  },

  async updatePassword(userId, oldHashed, newHashed) {
    try {
      const sessionRaw = localStorage.getItem("nmc_session");
      const session = sessionRaw ? JSON.parse(sessionRaw) : {};
      const token = localStorage.getItem("sessionToken");

      const response = await fetch(`${this._functionUrl}/admin-actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": token,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "self_change_password",
          payload: {
            user_id: userId,
            nama_lengkap: session.nama_lengkap || "User",
            username: session.username || "Unknown",
            old_password: oldHashed,
            password: newHashed,
            admin_name: session.nama_lengkap || "System",
          },
        }),
      });

      const result = await response.json();
      return { success: response.ok, message: result.error || result.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async submitOrder(orderData) {
    try {
      const response = await fetch(`${this._functionUrl}/process-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orderData,
          token: localStorage.getItem("sessionToken"),
        }),
      });
      return await response.json();
    } catch (err) {
      return { success: false, message: "Gagal mengirim pesanan." };
    }
  },

  async fetchSessionWithUser(token) {
    if (!token) return { data: null, error: "No token" };

    // PERBAIKAN: Gunakan penamaan relasi eksplisit user_id
    return await this._supabase
      .from("user_sessions")
      .select(
        `
        token, 
        expires_at,
        users_login:user_id (
          id, 
          username, 
          nama_lengkap, 
          role_id, 
          has_changed_password
        )
      `
      )
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
  },
};
