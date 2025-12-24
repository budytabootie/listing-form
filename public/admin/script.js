import { MembersPage } from "./pages/members.js";
import { UsersPage } from "./pages/users.js";
import { StokPage } from "./pages/stok.js";
import { KatalogPage } from "./pages/katalog.js";
import { StokWeaponPage } from "./pages/stok_weapon.js";
import { HistoryPage } from "./pages/history.js";
import { BundlePage } from "./pages/bundle.js"; // 1. Tambah Import

console.log("BundlePage object:", BundlePage);

let _supabase;

window.loadPage = (page) => {
  const area = document.getElementById("content-area");
  if (!area || !_supabase) return;

  document
    .querySelectorAll(".menu-item")
    .forEach((m) => m.classList.remove("active"));

  if (page === "members") {
    area.innerHTML = MembersPage.render();
    MembersPage.init(_supabase);
  } else if (page === "katalog") {
    area.innerHTML = KatalogPage.render();
    KatalogPage.init(_supabase);
  } else if (page === "users") {
    area.innerHTML = UsersPage.render();
    UsersPage.init(_supabase);
  } else if (page === "stok") {
    area.innerHTML = StokPage.render();
    StokPage.init(_supabase);
  } else if (page === "stok_weapon") {
    area.innerHTML = StokWeaponPage.render();
    StokWeaponPage.init(_supabase);
  } else if (page === "history") {
    area.innerHTML = HistoryPage.render();
    HistoryPage.init(_supabase);
  } else if (page === "bundling") {
    // 2. Tambah Logika Navigasi
    area.innerHTML = BundlePage.render();
    BundlePage.init(_supabase);
  }

  const targetMenu = document.querySelector(`[onclick="loadPage('${page}')"]`);
  if (targetMenu) targetMenu.classList.add("active");
};

async function init() {
  const userData = JSON.parse(sessionStorage.getItem("userData"));
  if (!userData || userData.role !== "admin") {
    window.location.href = "../login.html";
    return;
  }

  const res = await fetch("/api/get-config");
  const config = await res.json();
  _supabase = supabase.createClient(config.supabaseUrl, config.supabaseKey);

  // Setup Toggle Sidebar
  const toggleBtn = document.getElementById("toggleBtn");
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      document.getElementById("sidebar").classList.toggle("collapsed");
      document.getElementById("mainWrapper").classList.toggle("expanded");
    };
  }

  // Load halaman pertama kali
  window.loadPage("members");
}

window.logout = () => {
  sessionStorage.clear();
  window.location.href = "../login.html";
};

init();
