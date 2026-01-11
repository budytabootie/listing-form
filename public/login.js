// login.js
import { API } from "./js/core/api.js";

let _supabase;
const loginForm = document.getElementById("loginForm");

async function initSupabase() {
  try {
    const response = await fetch("/api/get-config");
    const config = await response.json();

    // Inisialisasi Supabase SDK
    _supabase = supabase.createClient(config.supabaseUrl, config.supabaseKey);

    // KRUSIAL: Pastikan init ini selesai agar _functionUrl tidak null
    API.init(_supabase, config.supabaseUrl);

    const token = localStorage.getItem("sessionToken");
    if (token) {
      const { data, error } = await API.fetchSessionWithUser(token);

      if (data && data.users_login && !error) {
        redirectUser(
          data.users_login.role_id,
          data.users_login.has_changed_password
        );
      } else {
        localStorage.removeItem("sessionToken");
      }
    }
  } catch (err) {
    console.error("Gagal koneksi server:", err);
  }
}

function redirectUser(roleId, hasChangedPassword) {
  // Asumsi: roleId 1 adalah Admin
  if (roleId === 1) {
    Swal.fire({
      title: "Login Berhasil!",
      text: "Pilih halaman tujuan Anda:",
      icon: "success",
      showCancelButton: true,
      confirmButtonText: "Dashboard Admin",
      cancelButtonText: "Halaman Utama",
      confirmButtonColor: "#faa61a",
      cancelButtonColor: "#5865f2",
      background: "#2f3136",
      color: "#fff",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "/admin/index.html";
      } else {
        window.location.href = "/";
      }
    });
  } else {
    window.location.href = "/";
  }
}

loginForm.onsubmit = async (e) => {
  e.preventDefault();

  // Proteksi: Jika API.init belum selesai (config masih loading)
  if (!API._functionUrl) {
    Swal.fire({
      text: "Sistem sedang menyiapkan koneksi, silakan coba sesaat lagi.",
      icon: "info",
      timer: 2000,
      showConfirmButton: false,
    });
    return;
  }

  const usernameInput = document.getElementById("username").value.trim();
  const passwordInput = document.getElementById("password").value;
  const btn = document.getElementById("loginBtn");

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memverifikasi...';

  try {
    const result = await API.login(usernameInput, passwordInput);

    if (!result.success) {
      throw new Error(result.message || "Username atau password salah.");
    }

    const user = result.user;

    // Simpan token yang dikembalikan dari Edge Function
    localStorage.setItem("sessionToken", result.token);

    localStorage.setItem(
      "nmc_session",
      JSON.stringify({
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama,
        role_id: user.role_id,
      })
    );

    sessionStorage.setItem("justLoggedIn", "true");

    redirectUser(user.role_id, user.has_changed_password);
  } catch (err) {
    Swal.fire({
      title: "Gagal Login",
      text: err.message,
      icon: "error",
      background: "#1e1e1e",
      color: "#fff",
    });
    btn.disabled = false;
    btn.innerText = "Masuk";
  }
};

// Jalankan inisialisasi
initSupabase();
