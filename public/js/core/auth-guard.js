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
    const configPath = `${basePath}api/get-config`;
    let configData;

    try {
      const configResp = await fetch(configPath, {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });

      if (!configResp.ok)
        throw new Error(`Server Config Error: ${configResp.status}`);
      configData = await configResp.json();
    } catch (fetchErr) {
      console.error("Gagal mengambil config:", fetchErr);
      // Jika gagal, coba reload sekali lagi setelah 1 detik
      setTimeout(() => window.location.reload(), 1000);
      return;
    }

    // 3. Inisialisasi Supabase dengan Header Custom (x-custom-token)
    // Pastikan window.supabase sudah benar-benar siap
    if (typeof window.supabase === "undefined") {
      console.error("Supabase library not ready");
      return;
    }

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
    if (!token || token === "null") {
      window.location.href = `${basePath}login.html`;
      return;
    }

    const sessionResult = await API.fetchSessionWithUser(token).catch((err) => {
      return { data: null, error: err };
    });

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
