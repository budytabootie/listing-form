import { ListingPage } from "./pages/listing.js";
import { HistoryPage } from "./pages/history.js";

let _supabase;
let _currentUserData;

// Fungsi Navigasi Halaman User
window.loadPage = (page) => {
  const area = document.getElementById("content-area");
  if (!area) return;

  // Reset class active di navbar (Desktop & Mobile)
  document
    .querySelectorAll(".portal-nav-link")
    .forEach((el) => el.classList.remove("active"));

  if (page === "listing") {
    area.innerHTML = ListingPage.render();
    ListingPage.init(_supabase);
    const nav = document.getElementById("nav-listing");
    if (nav) nav.classList.add("active");
  } else if (page === "history") {
    area.innerHTML = HistoryPage.render();
    HistoryPage.init(_supabase, _currentUserData);
    const nav = document.getElementById("nav-history");
    if (nav) nav.classList.add("active");
  } else if (page === "home") {
    area.innerHTML = `
            <div style="text-align: center; margin-top: 50px;">
                <h2 style="color: #5865F2;">Welcome back!</h2>
                <p style="color: #b9bbbe;">Gunakan menu di atas untuk mulai bekerja.</p>
            </div>`;
    const nav = document.getElementById("nav-home");
    if (nav) nav.classList.add("active");
  } else if (page === "setoran") {
    area.innerHTML = `
            <div style="text-align: center; margin-top: 50px;">
                <h2 style="color: #faa61a;">Fitur Setoran</h2>
                <p style="color: #b9bbbe;">Fitur ini sedang dalam pengembangan.</p>
            </div>`;
    const nav = document.getElementById("nav-setoran");
    if (nav) nav.classList.add("active");
  }
};

async function init() {
  try {
    const res = await fetch("/api/get-config");
    const config = await res.json();
    _supabase = supabase.createClient(config.supabaseUrl, config.supabaseKey);

    const token = localStorage.getItem("sessionToken");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const { data: sessionData, error } = await _supabase
      .from("user_sessions")
      .select("*, users_login(*)")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !sessionData || !sessionData.users_login) {
      localStorage.removeItem("sessionToken");
      window.location.href = "login.html";
      return;
    }

    const userData = sessionData.users_login;
    _currentUserData = userData;

    // SINKRONISASI UI NAMA (Desktop & Mobile)
    if (window.syncUserUI) {
      window.syncUserUI(userData.nama_lengkap);
    } else {
      const desktopName = document.getElementById("userNameDisplay");
      const mobileName = document.getElementById("userNameDisplayMobile");
      if (desktopName) desktopName.innerText = userData.nama_lengkap;
      if (mobileName) mobileName.innerText = userData.nama_lengkap;
    }

    // --- FITUR TOMBOL KE ADMIN (UNTUK ROLE 1, 2, 3) ---
    if (userData.role_id !== 4) {
      document.querySelectorAll(".portal-nav-actions").forEach((container) => {
        if (!container.querySelector(".btn-go-admin")) {
          const btnAdmin = document.createElement("button");
          btnAdmin.className = "portal-logout-btn btn-go-admin";
          btnAdmin.style.background = "#5865F2";
          btnAdmin.style.marginRight = "10px";
          btnAdmin.innerHTML = `<i class="fas fa-user-shield"></i> KE ADMIN`;
          btnAdmin.onclick = () => (window.location.href = "admin/index.html");
          container.prepend(btnAdmin);
        }
      });
    }

    // Setup Logout
    window.logout = async () => {
      if (token && _supabase) {
        await _supabase.from("user_sessions").delete().eq("token", token);
      }
      localStorage.removeItem("sessionToken");
      window.location.href = "login.html";
    };

    // Setup Ganti Password
    window.changePassword = async () => {
      const { value: newPass } = await Swal.fire({
        title: "Ganti Password",
        input: "password",
        inputLabel: "Masukkan Password Baru",
        showCancelButton: true,
        background: "#2f3136",
        color: "#fff",
        confirmButtonColor: "#5865F2",
      });

      if (newPass && newPass.length >= 6) {
        const { error } = await _supabase.rpc("update_user_password_secure", {
          u_id: userData.id,
          new_pass: newPass,
        });
        if (error) Swal.fire("Gagal", error.message, "error");
        else Swal.fire("Sukses", "Password berhasil diupdate!", "success");
      } else if (newPass) {
        Swal.fire("Peringatan", "Password minimal 6 karakter", "warning");
      }
    };

    // Load halaman default (Home)
    window.loadPage("home");
  } catch (err) {
    console.error("Gagal inisialisasi:", err);
    window.location.href = "login.html";
  }
}

init();
