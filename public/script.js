import { ListingPage } from "./pages/listing.js";
import { HomePage } from "./pages/home.js";
import { HistoryPage } from "./pages/history.js";
import { WeaponPage } from "./pages/weapon.js";
import { VestPage } from "./pages/vest.js";
import { AmmoPage } from "./pages/ammo.js";
import { AttachmentPage } from "./pages/attachment.js";
import { BundlingPage } from "./pages/bundling.js";
import { CartPage } from "./pages/cart.js";
import { GlobalCart } from "./pages/globalCart.js";

let _supabase;
let _currentUserData;

/**
 * 1. FITUR FORCE CHANGE PASSWORD (Frontpage Aesthetic)
 */
window.forceChangePassword = async () => {
  const { value: newPass } = await Swal.fire({
    title:
      '<span style="color: #faa61a; font-weight: bold; letter-spacing: 1px;">VERIFIKASI KEAMANAN</span>',
    background: "#2f3136",
    html: `
      <div style="text-align: center; margin-bottom: 20px;">
        <i class="fas fa-user-lock" style="font-size: 3.5rem; color: #faa61a; margin-bottom: 15px; display: block;"></i>
        <p style="color: #b9bbbe; font-size: 0.95rem; line-height: 1.5;">Password Anda masih default.<br>Wajib diganti sebelum mengakses portal.</p>
      </div>
      <input type="password" id="p-portal-force" class="swal2-input" placeholder="Buat Password Baru" 
        style="background:#202225; color:white; border: 1px solid #4f545c; border-radius: 8px; width: 85%; margin: 0 auto; display: block;">
    `,
    allowOutsideClick: false,
    allowEscapeKey: false,
    confirmButtonText: "SIMPAN & MASUK",
    confirmButtonColor: "#faa61a",
    padding: "2em",
    customClass: {
      confirmButton: "portal-confirm-btn",
    },
    preConfirm: () => {
      const v = document.getElementById("p-portal-force").value;
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
      .eq("id", _currentUserData.id);

    if (!error) {
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
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
 * 2. FITUR CHANGE PASSWORD BIASA (Frontpage Aesthetic)
 */
window.changePassword = async () => {
  const { value: formValues } = await Swal.fire({
    title:
      '<span style="color: #fff; font-size: 1.4rem;">Pengaturan Password</span>',
    background: "#2f3136",
    html: `
      <div style="margin-top: 20px; text-align: left;">
        <div style="margin-bottom: 15px;">
            <label style="color: #8e9297; font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">Password Baru</label>
            <input type="password" id="p-1" class="swal2-input" placeholder="••••••••" 
                style="background:#202225; color:white; border: 1px solid #4f545c; width: 100%; margin: 5px 0; border-radius: 5px;">
        </div>
        <div>
            <label style="color: #8e9297; font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">Ulangi Password</label>
            <input type="password" id="p-2" class="swal2-input" placeholder="••••••••" 
                style="background:#202225; color:white; border: 1px solid #4f545c; width: 100%; margin: 5px 0; border-radius: 5px;">
        </div>
      </div>
    `,
    confirmButtonText: "UPDATE PASSWORD",
    confirmButtonColor: "#43b581",
    showCancelButton: true,
    cancelButtonText: "BATAL",
    cancelButtonColor: "#4f545c",
    padding: "2em",
    preConfirm: () => {
      const p1 = document.getElementById("p-1").value;
      const p2 = document.getElementById("p-2").value;
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
      .eq("id", _currentUserData.id);

    if (!error) {
      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Password telah diperbarui.",
        background: "#2f3136",
        color: "#fff",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  }
};

window.openCategory = (cat) => window.loadPage(cat);

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
      const items = GlobalCart.getItems();
      area.innerHTML = CartPage.render(items);
      CartPage.init(_supabase, _currentUserData);
    } else if (page === "weapon") {
      area.innerHTML = WeaponPage.render();
      WeaponPage.init(_supabase);
    } else if (page === "vest") {
      area.innerHTML = VestPage.render();
      VestPage.init(_supabase);
    } else if (page === "ammo") {
      area.innerHTML = AmmoPage.render();
      AmmoPage.init(_supabase);
    } else if (page === "attachment") {
      area.innerHTML = AttachmentPage.render();
      AttachmentPage.init(_supabase);
    } else if (page === "bundling") {
      area.innerHTML = BundlingPage.render();
      BundlingPage.init(_supabase);
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
    window._supabase = _supabase;

    const token = localStorage.getItem("sessionToken");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const { data: sessionData, error } = await _supabase
      .from("user_sessions")
      .select(
        `token, users_login!user_id (id, username, nama_lengkap, role_id, has_changed_password)`
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
    window._userData = _currentUserData;

    // 1. FORCE CHANGE LOGIC
    if (_currentUserData.has_changed_password === false) {
      return window.forceChangePassword();
    }

    // 2. PILIHAN MENU (Hanya muncul sekali setelah login)
    const isNewLogin = sessionStorage.getItem("justLoggedIn");
    if (_currentUserData.role_id !== 4 && isNewLogin === "true") {
      sessionStorage.removeItem("justLoggedIn");
      const { value: toAdmin } = await Swal.fire({
        title: '<span style="color: #fff;">PILIH TUJUAN</span>',
        text: "Anda memiliki akses manajemen. Ingin masuk ke mana?",
        background: "#2f3136",
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-user-shield"></i> ADMIN DASHBOARD',
        cancelButtonText: '<i class="fas fa-shopping-cart"></i> PORTAL BELANJA',
        confirmButtonColor: "#5865F2",
        cancelButtonColor: "#43b581",
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
      if (toAdmin) {
        window.location.href = "admin/index.html";
        return;
      }
    }

    const elDesktop = document.getElementById("userNameDisplay");
    const elMobile = document.getElementById("userNameDisplayMobile");
    if (elDesktop) elDesktop.innerText = _currentUserData.nama_lengkap;
    if (elMobile) elMobile.innerText = _currentUserData.nama_lengkap;

    // Admin Button Logic
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
