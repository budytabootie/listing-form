import { MembersPage } from "./pages/members.js";
import { UsersPage } from "./pages/users.js";
import { StokPage } from "./pages/stok.js";
import { KatalogPage } from "./pages/katalog.js";
import { StokWeaponPage } from "./pages/stok_weapon.js";
import { HistoryPage } from "./pages/history.js";
import { BundlePage } from "./pages/bundle.js";
import { OrdersPage } from "./pages/orders.js";

let _supabase;

window.loadPage = (page) => {
  const area = document.getElementById("content-area");
  if (!area || !_supabase) return;

  document
    .querySelectorAll(".menu-item")
    .forEach((m) => m.classList.remove("active"));

  const pages = {
    members: MembersPage,
    orders: OrdersPage,
    katalog: KatalogPage,
    users: UsersPage,
    stok: StokPage,
    stok_weapon: StokWeaponPage,
    history: HistoryPage,
    bundling: BundlePage,
  };

  if (pages[page]) {
    area.innerHTML = pages[page].render();
    pages[page].init(_supabase);
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
      .select("*, users_login(*)")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !sessionData || !sessionData.users_login) {
      localStorage.removeItem("sessionToken");
      window.location.href = "../login.html";
      return;
    }

    const userData = sessionData.users_login;
    if (userData.role !== "admin") {
      window.location.href = "../login.html";
      return;
    }

    // Tampilkan Nama Admin (Jika ada elemennya di navbar admin)
    const nameDisplay = document.getElementById("userNameDisplay");
    if (nameDisplay) nameDisplay.innerText = userData.nama_lengkap;

    // Fungsi Ganti Password (Admin juga bisa ganti sendiri)
    window.changePassword = async () => {
      const { value: newPass } = await Swal.fire({
        title: "Ganti Password Admin",
        input: "text",
        inputLabel: "Password baru ini akan langsung dienkripsi",
        showCancelButton: true,
        background: "#2f3136",
        color: "#fff",
      });
      if (newPass) {
        const { error } = await _supabase.rpc("update_user_password_secure", {
          u_id: userData.id,
          new_pass: newPass,
        });
        if (error) Swal.fire("Gagal", error.message, "error");
        else Swal.fire("Sukses", "Password diupdate!", "success");
      }
    };

    const toggleBtn = document.getElementById("toggleBtn");
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        document.getElementById("sidebar").classList.toggle("collapsed");
        document.getElementById("mainWrapper").classList.toggle("expanded");
      };
    }

    window.loadPage("orders");
  } catch (err) {
    console.error("Initialization failed:", err);
    window.location.href = "../login.html";
  }
}

window.logout = async () => {
  const token = localStorage.getItem("sessionToken");
  if (token && _supabase) {
    await _supabase.from("user_sessions").delete().eq("token", token);
  }
  localStorage.removeItem("sessionToken");
  window.location.href = "../login.html";
};

init();
