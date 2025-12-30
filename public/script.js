import { ListingPage } from "./pages/listing.js";
import { HomePage } from "./pages/home.js";
import { HistoryPage } from "./pages/history.js";
import { WeaponPage } from "./pages/weapon.js";
import { VestPage } from "./pages/vest.js"; // TAMBAHAN
import { CartPage } from "./pages/cart.js";
import { GlobalCart } from "./pages/globalCart.js";

let _supabase;
let _currentUserData;

// Alias agar tombol onclick di HTML tetap jalan
window.openCategory = (cat) => window.loadPage(cat);

// Memastikan fungsi loadPage tersedia secara global
window.loadPage = (page) => {
  const area = document.getElementById("content-area");
  if (!area) return;

  document
    .querySelectorAll(".portal-nav-link")
    .forEach((el) => el.classList.remove("active"));

  try {
    if (page === "home") {
      area.innerHTML = HomePage.render(_currentUserData);
      HomePage.init();
      const nav = document.getElementById("nav-home");
      if (nav) nav.classList.add("active");
    } else if (page === "cart") {
      // Mengambil data murni dari GlobalCart module
      const items = GlobalCart.getItems();
      area.innerHTML = CartPage.render(items);
      CartPage.init(_supabase, _currentUserData);
    } else if (page === "weapon") {
      area.innerHTML = WeaponPage.render();
      WeaponPage.init(_supabase);
    } else if (page === "vest") {
      // TAMBAHAN
      area.innerHTML = VestPage.render();
      VestPage.init(_supabase);
    } else if (
      ["ammo", "attachment", "narkoba", "drugs", "bundling"].includes(page)
    ) {
      area.innerHTML = `
        <div style="text-align:center; padding:50px;">
            <h2 style="color:#faa61a;">Kategori ${page.toUpperCase()}</h2>
            <p style="color:#b9bbbe;">Sedang dalam sinkronisasi database...</p>
            <button onclick="loadPage('home')" style="background:#5865F2; color:#fff; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; margin-top:20px;">Kembali</button>
        </div>`;
    } else if (page === "listing") {
      area.innerHTML = ListingPage.render();
      ListingPage.init(_supabase);
      const nav = document.getElementById("nav-listing");
      if (nav) nav.classList.add("active");
    } else if (page === "history") {
      area.innerHTML = HistoryPage.render();
      HistoryPage.init(_supabase, _currentUserData);
      const nav = document.getElementById("nav-history");
      if (nav) nav.classList.add("active");
    } else if (page === "setoran") {
      area.innerHTML = `<div style="text-align: center; margin-top: 50px;"><h2 style="color: #faa61a;">Fitur Setoran</h2><p style="color: #b9bbbe;">Dalam pengembangan.</p></div>`;
      const nav = document.getElementById("nav-setoran");
      if (nav) nav.classList.add("active");
    }
  } catch (err) {
    console.error("Gagal memuat halaman:", err);
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
      .select(
        `token, users_login!user_id (id, username, nama_lengkap, role_id)`
      )
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error || !sessionData || !sessionData.users_login) {
      localStorage.removeItem("sessionToken");
      window.location.href = "login.html";
      return;
    }

    _currentUserData = sessionData.users_login;

    const elDesktop = document.getElementById("userNameDisplay");
    const elMobile = document.getElementById("userNameDisplayMobile");
    if (elDesktop) elDesktop.innerText = _currentUserData.nama_lengkap;
    if (elMobile) elMobile.innerText = _currentUserData.nama_lengkap;

    if (_currentUserData.role_id !== 4) {
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

    window.logout = async () => {
      if (token && _supabase)
        await _supabase.from("user_sessions").delete().eq("token", token);
      localStorage.removeItem("sessionToken");
      window.location.href = "login.html";
    };

    window.loadPage("home");
  } catch (err) {
    console.error("Gagal inisialisasi:", err);
  }
}

init();
