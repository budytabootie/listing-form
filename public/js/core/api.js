export const API = {
  _supabase: null,
  _functionUrl: null,

  init(supabaseInstance, supabaseUrl) {
    this._supabase = supabaseInstance;
    if (supabaseUrl) {
      this._functionUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1`;
    }
  },

  // --- Fungsi Database Langsung ---
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

  // --- Fungsi Edge Functions ---
  // --- Fungsi Edge Functions ---
  async login(username, password) {
    try {
      const response = await fetch(`${this._functionUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this._supabase.supabaseKey,
          // TAMBAHKAN INI: Agar Gateway mengizinkan request masuk
          Authorization: `Bearer ${this._supabase.supabaseKey}`,
        },
        body: JSON.stringify({
          username,
          password: (password || "").toString().trim(),
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        localStorage.setItem("sessionToken", result.token);
        localStorage.setItem("nmc_session", JSON.stringify(result.user));
        return result;
      }
      return { success: false, message: result.message || "Login Gagal" };
    } catch (err) {
      return { success: false, message: "Gagal terhubung ke server." };
    }
  },

  async updatePassword(userId, oldPasswordPlain = "", newPasswordPlain = "") {
    try {
      const token = localStorage.getItem("sessionToken");

      if (!token)
        throw new Error("Sesi telah berakhir, silakan login kembali.");
      if (!newPasswordPlain)
        throw new Error("Password baru tidak boleh kosong");

      if (!finalPassword) throw new Error("Password tidak boleh kosong");

      const response = await fetch(`${this._functionUrl}/admin-actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this._supabase.supabaseKey,
          Authorization: `Bearer ${this._supabase.supabaseKey}`, // Untuk gateway Supabase
          "x-session-token": token, // Untuk divalidasi oleh Deno (admin-actions)
        },
        body: JSON.stringify({
          action: "self_change_password",
          payload: {
            user_id: userId,
            password: newPasswordPlain.toString().trim(),
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Gagal memperbarui password");
      }
      return { success: true };
    } catch (err) {
      console.error("DETEKSI ERROR:", err.message);
      return { success: false, message: err.message };
    }
  },

  async submitOrder(orderData) {
    try {
      const response = await fetch(`${this._functionUrl}/process-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this._supabase.supabaseKey,
          // Tambahkan Authorization agar lolos Gateway
          Authorization: `Bearer ${this._supabase.supabaseKey}`,
        },
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
    // Gunakan query standar tanpa .setHeader
    // BARU
    return await this._supabase
      .from("user_sessions")
      .select(
        `token, expires_at, users_login:user_id (
      id, 
      username, 
      nama_lengkap, 
      role_id, 
      has_changed_password,
      roles:role_id (role_name)
    )`
      )
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
  },
};
