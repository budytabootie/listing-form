// public/js/core/auth-guard.js
import { API } from "./api.js";

export async function runAuthGuard(basePath = "") {
  console.log("Auth Guard Started...");

  try {
    if (!window.supabase) {
      throw new Error("Library Supabase belum dimuat di HTML!");
    }

    // 1. Ambil Token
    const token = localStorage.getItem("sessionToken");

    if (!token) {
      console.warn("No token found, redirecting...");
      window.location.href = `${basePath}login.html`;
      return;
    }

    // 2. Ambil Config
    const configPath = `${basePath}api/get-config.js`;
    const configResp = await fetch(configPath);
    if (!configResp.ok)
      throw new Error(`Gagal fetch config: ${configResp.statusText}`);
    const configData = await configResp.json();

    // 3. Inisialisasi Supabase dengan Header Custom (x-custom-token)
    // 3. Inisialisasi Supabase
    const supabase = window.supabase.createClient(
      configData.supabaseUrl,
      configData.supabaseKey,
      {
        global: {
          headers: {
            // Kita gunakan nama header custom agar tidak memicu check JWT
            "x-session-token": token,
          },
        },
      }
    );

    // 4. PENTING: Inisialisasi API SEBELUM pemanggilan fetch
    API.init(supabase, configData.supabaseUrl);

    // 5. Verifikasi ke Database
    console.log("Verifying session with DB...");
    const sessionResult = await API.fetchSessionWithUser(token);

    if (!sessionResult) return;
    const { data, error } = sessionResult;

    if (error) {
      // Abaikan jika request dibatalkan saat pindah halaman
      if (error.message && error.message.includes("aborted")) return;

      console.error("DATABASE ERROR DETAIL:", error);
      alert("KETENDANG KARENA: Error DB");
      localStorage.clear();
      window.location.href = `${basePath}login.html`;
      return;
    }

    if (!data || !data.users_login) {
      console.warn("Session invalid atau user tidak ditemukan.");
      localStorage.clear();
      window.location.href = `${basePath}login.html`;
      return;
    }

    // 6. Simpan ke Global Window
    const userData = data.users_login;
    window._supabase = supabase;
    window._userData = userData;

    // Proteksi Admin (DIPERBAIKI)
    const isAdminPage = window.location.pathname.includes("/admin/");

    // Daftar Role yang BOLEH masuk ke folder /admin/
    // 1: Super Admin, 2: Treasurer, 3: Staff, 5: BNN
    const allowedAdminRoles = [1, 2, 3, 5];

    if (isAdminPage && !allowedAdminRoles.includes(userData.role_id)) {
      alert("Akses Ditolak: Anda tidak memiliki otoritas admin!");
      window.location.href = `${basePath}index.html`;
      return;
    }

    document.body.classList.add("access-granted");
    console.log("Access Granted for:", userData.username);

    if (window.syncUserUI) window.syncUserUI(userData.nama_lengkap);
  } catch (err) {
    console.error("CRITICAL GUARD ERROR:", err.message);
    alert("System Error: " + err.message);
  }
}
