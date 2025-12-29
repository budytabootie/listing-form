import { MembersPage } from "./pages/members.js";
import { UsersPage } from "./pages/users.js";
import { StokPage } from "./pages/stok.js";
import { KatalogPage } from "./pages/katalog.js";
import { StokWeaponPage } from "./pages/stok_weapon.js";
import { HistoryPage } from "./pages/history.js";
import { BundlePage } from "./pages/bundle.js";
import { OrdersPage } from "./pages/orders.js";
import { AdminDashboard } from "./pages/dashboard.js";
import { AdminProfile } from "./pages/profile.js";
import { LogsPage } from "./pages/logs.js";

let _supabase;
let _userData;

// --- Fungsi Audit Log Global ---
window.createAuditLog = async (action, tableName, description) => {
  if (!_supabase || !_userData) return;
  try {
    await _supabase.from("audit_logs").insert([
      {
        user_id: _userData.id,
        username: _userData.nama_lengkap || _userData.username,
        action: action,
        table_name: tableName,
        description: description,
      },
    ]);
  } catch (err) {
    console.error("Audit Log Error:", err);
  }
};

window.loadPage = async (page) => {
  const area = document.getElementById("content-area");

  if (!_supabase || !_userData) {
    console.warn("Koneksi belum siap, mencoba ulang...");
    setTimeout(() => window.loadPage(page), 200);
    return;
  }

  if (!area) return;

  document
    .querySelectorAll(".menu-item")
    .forEach((m) => m.classList.remove("active"));

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
  };

  if (pages[page]) {
    try {
      area.innerHTML = pages[page].render();
      await pages[page].init(_supabase, _userData);
    } catch (err) {
      console.error(`Gagal memuat halaman ${page}:`, err);
    }
  }

  const targetMenu = document.querySelector(`[onclick="loadPage('${page}')"]`);
  if (targetMenu) targetMenu.classList.add("active");
};

async function init() {
  try {
    const configRes = await fetch("/api/get-config");
    const config = await configRes.json();

    _supabase = supabase.createClient(config.supabaseUrl, config.supabaseKey);

    const token = localStorage.getItem("sessionToken");
    if (!token) {
      window.location.href = "../login.html";
      return;
    }

    const { data: sessionData, error } = await _supabase
      .from("user_sessions")
      .select(
        `
          *,
          users_login (
            *,
            roles (role_name)
          )
        `
      )
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !sessionData || !sessionData.users_login) {
      localStorage.removeItem("sessionToken");
      window.location.href = "../login.html";
      return;
    }

    _userData = sessionData.users_login;

    // --- PROTEKSI KERAS: JIKA ROLE_ID = 4 (MEMBER) TENDANG KE PORTAL ---
    if (_userData.role_id === 4) {
      window.location.href = "../index.html";
      return;
    }

    const nameDisplay = document.getElementById("userNameDisplay");
    if (nameDisplay) nameDisplay.innerText = _userData.nama_lengkap;

    const roleDisplay = document.getElementById("userRoleDisplay");
    if (roleDisplay)
      roleDisplay.innerText = _userData.roles?.role_name || "Unknown";

    filterMenuByRoleId(_userData.role_id);
    setupGlobalEvents();

    // Landing page default: Super Admin (1) & Treasurer (2) ke Dashboard, sisanya Katalog
    if (_userData.role_id === 1 || _userData.role_id === 2) {
      window.loadPage("dashboard");
    } else {
      window.loadPage("katalog");
    }
  } catch (err) {
    console.error("Initialization failed:", err);
  }
}

function filterMenuByRoleId(roleId) {
  const menuLogs = document.querySelector("[onclick=\"loadPage('logs')\"]");
  const menuUsers = document.querySelector("[onclick=\"loadPage('users')\"]");
  const menuDashboard = document.querySelector(
    "[onclick=\"loadPage('dashboard')\"]"
  );
  const menuOrders = document.querySelector("[onclick=\"loadPage('orders')\"]");

  // Reset semua menu tampil dulu
  document
    .querySelectorAll(".menu-item")
    .forEach((el) => (el.style.display = "flex"));

  switch (roleId) {
    case 3: // Role: Staff
      if (menuDashboard) menuDashboard.style.display = "none";
      if (menuUsers) menuUsers.style.display = "none";
      if (menuOrders) menuOrders.style.display = "none";
      if (menuLogs) menuLogs.style.display = "none";
      break;

    case 2: // Role: Treasurer
      if (menuUsers) menuUsers.style.display = "none";
      if (menuLogs) menuLogs.style.display = "none";
      break;

    case 1: // Role: Super Admin
      // Super Admin melihat semuanya, tidak perlu ada yang di-hidden
      break;

    default: // Jika role tidak dikenal atau Member (4)
      document
        .querySelectorAll(".menu-item")
        .forEach((el) => (el.style.display = "none"));
      break;
  }
}

function setupGlobalEvents() {
  window.changePassword = async () => {
    const { value: newPass } = await Swal.fire({
      title: "Ganti Password Akun",
      input: "password",
      inputLabel: "Password baru",
      showCancelButton: true,
      background: "#2f3136",
      color: "#fff",
    });

    if (newPass) {
      const { error } = await _supabase.rpc("update_user_password_secure", {
        u_id: _userData.id,
        new_pass: newPass,
      });

      if (error) {
        Swal.fire("Gagal", error.message, "error");
      } else {
        Swal.fire("Sukses", "Password berhasil diubah!", "success");
        window.createAuditLog(
          "UPDATE",
          "users_login",
          "Mengubah password akun sendiri"
        );
      }
    }
  };

  const toggleBtn = document.getElementById("toggleBtn");
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      document.getElementById("sidebar").classList.toggle("collapsed");
      document.getElementById("mainWrapper").classList.toggle("expanded");
    };
  }
}

window.logout = async () => {
  const token = localStorage.getItem("sessionToken");
  if (token && _supabase) {
    try {
      await window.createAuditLog(
        "LOGOUT",
        "sessions",
        "User logout dari sistem"
      );
      await _supabase.from("user_sessions").delete().eq("token", token);
    } catch (e) {
      console.error(e);
    }
  }
  localStorage.removeItem("sessionToken");
  window.location.href = "../login.html";
};

init();
