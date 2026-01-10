import { Auth } from "./js/core/auth.js";
import { filterMenuByRoleId } from "./js/core/navigation.js";

// Import Pages
import { AdminDashboard } from "./pages/dashboard.js";
import { MembersPage } from "./pages/members.js";
import { UsersPage } from "./pages/users.js";
import { StokPage } from "./pages/stok.js";
import { KatalogPage } from "./pages/katalog.js";
import { StokWeaponPage } from "./pages/stok_weapon.js";
import { HistoryPage } from "./pages/history.js";
import { BundlePage } from "./pages/bundle.js";
import { OrdersPage } from "./pages/orders.js";
import { AdminProfile } from "./pages/profile.js";
import { LogsPage } from "./pages/logs.js";
import { WeedPage } from "./pages/weeds.js";
import { RolesPage } from "./pages/roles.js";

let _supabase;
let _userData;

const pages = {
  dashboard: AdminDashboard,
  members: MembersPage,
  orders: OrdersPage,
  katalog: KatalogPage,
  users: UsersPage,
  stok: StokPage,
  stok_weapon: StokWeaponPage,
  history: HistoryPage,
  bundling: BundlePage,
  profile: AdminProfile,
  logs: LogsPage,
  weed: WeedPage,
  roles: RolesPage,
};

/**
 * 1. FITUR FORCE CHANGE PASSWORD (Aesthetic)
 */
window.forceChangePassword = async () => {
  const { value: newPass } = await Swal.fire({
    title:
      '<span style="color: #faa61a; font-weight: bold; letter-spacing: 1px;">KEAMANAN AKUN</span>',
    html: `
      <div style="text-align: center; margin-bottom: 20px;">
        <i class="fas fa-shield-alt" style="font-size: 3rem; color: #faa61a; margin-bottom: 15px; display: block;"></i>
        <p style="color: #b9bbbe; font-size: 0.95rem;">Password Anda masih menggunakan bawaan admin. Silakan buat password baru untuk melanjutkan.</p>
      </div>
      <input type="password" id="p-force" class="swal2-input" placeholder="Masukkan Password Baru" 
        style="background:#202225; color:white; border: 1px solid #4f545c; border-radius: 8px; width: 85%; margin: 0 auto; display: block;">
    `,
    allowOutsideClick: false,
    allowEscapeKey: false,
    confirmButtonText: "UPDATE PASSWORD",
    confirmButtonColor: "#faa61a",
    background: "#2f3136",
    padding: "2em",
    preConfirm: () => {
      const v = document.getElementById("p-force").value;
      if (!v || v.length < 6)
        return Swal.showValidationMessage("Minimal 6 karakter!");
      return v;
    },
  });

  if (newPass) {
    const hashed = CryptoJS.SHA256(newPass).toString();
    const { error } = await window._supabase
      .from("users_login")
      .update({
        password: hashed,
        is_encrypted: true,
        has_changed_password: true,
      })
      .eq("id", window._userData.id);

    if (!error) {
      await Swal.fire({
        icon: "success",
        title: "Berhasil!",
        background: "#2f3136",
        color: "#fff",
        timer: 1500,
        showConfirmButton: false,
      });
      location.reload();
    }
  }
};

/**
 * 2. FITUR CHANGE PASSWORD BIASA (Aesthetic)
 */
window.changePassword = async () => {
  const { value: formValues } = await Swal.fire({
    title:
      '<span style="color: #fff; font-size: 1.5rem;">Update Password</span>',
    background: "#2f3136",
    html: `
      <div style="margin-top: 20px;">
        <div style="text-align: left; margin-bottom: 15px;">
            <label style="color: #8e9297; font-size: 0.8rem; text-transform: uppercase; font-weight: bold;">Password Baru</label>
            <input type="password" id="swal-new-1" class="swal2-input" placeholder="••••••••" 
                style="background:#202225; color:white; border: 1px solid #4f545c; width: 100%; margin: 5px 0; border-radius: 5px;">
        </div>
        <div style="text-align: left;">
            <label style="color: #8e9297; font-size: 0.8rem; text-transform: uppercase; font-weight: bold;">Konfirmasi Password</label>
            <input type="password" id="swal-new-2" class="swal2-input" placeholder="••••••••" 
                style="background:#202225; color:white; border: 1px solid #4f545c; width: 100%; margin: 5px 0; border-radius: 5px;">
        </div>
      </div>
    `,
    confirmButtonText: "SIMPAN PERUBAHAN",
    confirmButtonColor: "#5865F2",
    showCancelButton: true,
    cancelButtonText: "BATAL",
    cancelButtonColor: "#4f545c",
    padding: "2em",
    preConfirm: () => {
      const p1 = document.getElementById("swal-new-1").value;
      const p2 = document.getElementById("swal-new-2").value;
      if (!p1 || p1.length < 6)
        return Swal.showValidationMessage("Minimal 6 karakter!");
      if (p1 !== p2) return Swal.showValidationMessage("Password tidak cocok!");
      return p1;
    },
  });

  if (formValues) {
    const hashed = CryptoJS.SHA256(formValues).toString();
    const { error } = await window._supabase
      .from("users_login")
      .update({ password: hashed })
      .eq("id", window._userData.id);

    if (!error) {
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        background: "#2f3136",
        color: "#fff",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  }
};

// Navigasi
window.loadPage = async (page) => {
  const area = document.getElementById("content-area");
  if (!area) return;

  if (!_supabase || !_userData) {
    const session = await Auth.checkSession();
    if (session) {
      _supabase = session.supabase;
      _userData = session.user;
      window._supabase = _supabase;
      window._userData = _userData;
    } else return;
  }

  document
    .querySelectorAll(".menu-item")
    .forEach((m) => m.classList.remove("active"));

  if (pages[page]) {
    area.innerHTML = pages[page].render();
    await pages[page].init(_supabase, _userData);
  }

  const targetMenu = document.querySelector(`[onclick="loadPage('${page}')"]`);
  if (targetMenu) targetMenu.classList.add("active");
};

// Inisialisasi
async function init() {
  const session = await Auth.checkSession();
  if (!session) return;

  _supabase = session.supabase;
  _userData = session.user;

  // EKSPOR KE WINDOW AGAR TOMBOL HTML TIDAK ERROR
  window._supabase = _supabase;
  window._userData = _userData;

  // LOGIKA FORCE CHANGE
  if (_userData.has_changed_password === false) {
    return window.forceChangePassword();
  }

  const nameDisplay = document.getElementById("userNameDisplay");
  const roleDisplay = document.getElementById("userRoleDisplay");

  if (nameDisplay) nameDisplay.innerText = _userData.nama_lengkap;
  if (roleDisplay)
    roleDisplay.innerText = _userData.roles?.role_name || "No Role";

  filterMenuByRoleId(_userData.roles?.permissions, _userData.role_id);

  if ([1, 2].includes(_userData.role_id)) {
    window.loadPage("dashboard");
  } else if (_userData.role_id === 5) {
    window.loadPage("weed");
  } else {
    window.loadPage("katalog");
  }

  setupGlobalEvents();
}

function setupGlobalEvents() {
  window.logout = () => Auth.logout();
  const toggleBtn = document.getElementById("toggleBtn");
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      document.getElementById("sidebar").classList.toggle("collapsed");
      document.getElementById("mainWrapper").classList.toggle("expanded");
    };
  }
}

document.addEventListener("DOMContentLoaded", init);
