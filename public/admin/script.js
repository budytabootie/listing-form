// public/admin/script.js
import { Auth } from "./js/core/auth.js";
import { Navigation } from "./js/core/navigation.js";
import { UI } from "./js/core/ui.js";
import { API } from "../js/core/api.js"; // Import API pusat

// Import Pages (Sudah benar pakai ./)
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
import { WeaponRelationsPage } from "./pages/weaponRelations.js";
import { MasterMenusPage } from "./pages/masterMenus.js";

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
  weapon_relations: WeaponRelationsPage,
  master_menus: MasterMenusPage,
};

async function init() {
  const session = await Auth.checkSession();
  if (!session) return;

  const { supabase, user } = session;

  // --- TAMBAHKAN INI AGAR UI.js TIDAK ERROR ---
  const configRes = await fetch("/api/get-config");
  const config = await configRes.json();
  API.init(supabase, config.supabaseUrl);
  // --------------------------------------------

  // --- DAFTARKAN HELPER GLOBAL DI SINI ---
  window.createAuditLog = async (action, tableName, description) => {
    try {
      const { error } = await supabase.from("audit_logs").insert([
        {
          user_id: user.id, // ID dari user yang sedang login
          username: user.username,
          action: action,
          table_name: tableName,
          description: description,
        },
      ]);

      if (error) {
        console.error("Gagal menyimpan audit log:", error.message);
      }
    } catch (err) {
      console.error("Audit Log System Error:", err);
    }
  };
  // ----------------------------------------

  if (!sessionStorage.getItem("login_logged")) {
    window.createAuditLog(
      "LOGIN",
      "users_login",
      `Admin ${user.nama_lengkap} masuk ke dashboard`
    );
    sessionStorage.setItem("login_logged", "true");
  }

  // 1. Sinkronkan Global Helper
  window.loadPage = (page) => Navigation.loadPage(page);

  // 2. Inisialisasi Modul
  Navigation.init(pages, supabase, user);
  UI.setupPasswordFeatures(supabase, user);
  UI.setupGlobalEvents(() => Auth.logout());

  // 3. Force Change Password (Agar tidak redirect ke file .html)
  if (user.has_changed_password === false) {
    return UI.forceChangePassword(user);
  }

  // 4. Render UI Sidebar & Display Name
  const nameDisplay = document.getElementById("userNameDisplay");
  const roleDisplay = document.getElementById("userRoleDisplay");
  if (nameDisplay) nameDisplay.innerText = user.nama_lengkap;
  if (roleDisplay) roleDisplay.innerText = user.roles?.role_name || "No Role";

  await Navigation.renderSidebar();

  // 5. Default Routing
  // Kita tentukan halaman awal berdasarkan role
  let defaultPage = "dashboard"; // Default untuk Super Admin & Treasurer

  if (user.role_id === 5) {
    defaultPage = "weed"; // Khusus BNN
  } else if (user.role_id === 3) {
    defaultPage = "orders"; // Staff diarahkan ke Orders atau Katalog (sesuaikan keinginan)
  } else if (![1, 2].includes(user.role_id)) {
    // Jika ada role lain yang nyasar tapi punya akses admin
    defaultPage = "profile";
  }

  Navigation.loadPage(defaultPage);
}

document.addEventListener("DOMContentLoaded", init);
