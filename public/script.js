// public/script.js
import { Auth } from "./js/core/auth.js";
import { Navigation } from "./js/core/navigation.js";
import { PortalUI } from "./js/core/ui.js";
import { GlobalCart } from "./pages/globalCart.js";

// Import Pages
import { HomePage } from "./pages/home.js";
import { ListingPage } from "./pages/listing.js";
import { HistoryPage } from "./pages/history.js";
import { WeaponPage } from "./pages/weapon.js";
import { VestPage } from "./pages/vest.js";
import { AmmoPage } from "./pages/ammo.js";
import { AttachmentPage } from "./pages/attachment.js";
import { BundlingPage } from "./pages/bundling.js";
import { CartPage } from "./pages/cart.js";

const pages = {
  home: HomePage,
  listing: ListingPage,
  history: HistoryPage,
  weapon: WeaponPage,
  vest: VestPage,
  ammo: AmmoPage,
  attachment: AttachmentPage,
  bundling: BundlingPage,
  cart: CartPage,
  GlobalCart: GlobalCart,
};

async function init() {
  // 1. Jalankan Auth
  const session = await Auth.checkSession();
  if (!session) return;

  const { supabase, user, token } = session;

  // 2. Registrasi Helper ke Window
  window._supabase = supabase;
  window._userData = user;
  window.loadPage = (page) => Navigation.loadPage(page);
  window.openCategory = (cat) => Navigation.loadPage(cat);
  window.logout = () => Auth.logout(token);

  // 3. Inisialisasi Modul UI & Navigasi
  Navigation.init(pages, supabase, user);

  // PERBAIKAN DI SINI: Hanya kirim 'user', jangan sertakan 'supabase'
  // agar tidak tertukar di parameter fungsi ui.js
  PortalUI.setupPasswordFeatures(user);
  PortalUI.setupAdminButton(user);

  // 4. Force Change Password Logic
  if (user.has_changed_password === false) {
    return PortalUI.forceChangePassword(user);
  }

  // 5. Update Nama Display ke UI
  if (window.syncUserUI) {
    window.syncUserUI(user.nama_lengkap, user.rank || "MEMBER");
  }

  // 6. Masuk ke Halaman Default
  Navigation.loadPage("home");
}

document.addEventListener("DOMContentLoaded", init);
