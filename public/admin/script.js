import { MembersPage } from "./pages/members.js";
import { UsersPage } from "./pages/users.js";
import { StokPage } from "./pages/stok.js";
import { KatalogPage } from "./pages/katalog.js";
import { StokWeaponPage } from './pages/stok_weapon.js';

let _supabase;
async function init() {
  const userData = JSON.parse(sessionStorage.getItem("userData"));
  if (!userData || userData.role !== "admin")
    window.location.href = "../login.html";

  const res = await fetch("/api/get-config");
  const config = await res.json();
  _supabase = supabase.createClient(config.supabaseUrl, config.supabaseKey);

  window.loadPage = (page) => {
    const area = document.getElementById("content-area");

    document
      .querySelectorAll(".menu-item")
      .forEach((m) => m.classList.remove("active"));

    if (page === "members") {
      area.innerHTML = MembersPage.render();
      MembersPage.init(_supabase);
      document
        .querySelector("[onclick=\"loadPage('members')\"]")
        .classList.add("active");
    }
    // TAMBAHKAN LOGIKA INI
    else if (page === "katalog") {
      area.innerHTML = KatalogPage.render();
      KatalogPage.init(_supabase);
      document
        .querySelector("[onclick=\"loadPage('katalog')\"]")
        .classList.add("active");
    } else if (page === "users") {
      area.innerHTML = UsersPage.render();
      UsersPage.init(_supabase);
      document
        .querySelector("[onclick=\"loadPage('users')\"]")
        .classList.add("active");
    } else if (page === "stok") {
      area.innerHTML = StokPage.render();
      StokPage.init(_supabase);
      document
        .querySelector("[onclick=\"loadPage('stok')\"]")
        .classList.add("active");
    } else if (page === "stok_weapon") {
      area.innerHTML = StokWeaponPage.render();
      StokWeaponPage.init(_supabase);
      document
        .querySelector("[onclick=\"loadPage('stok_weapon')\"]")
        .classList.add("active");
    }
  };

  document.getElementById("toggleBtn").onclick = () => {
    document.getElementById("sidebar").classList.toggle("collapsed");
    document.getElementById("mainWrapper").classList.toggle("expanded");
  };

  loadPage("members"); // Default load
}
window.logout = () => {
  sessionStorage.clear();
  window.location.href = "../login.html";
};
init();
