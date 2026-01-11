// public/js/core/navigation.js
import { API } from "./api.js";

export const Navigation = {
  pages: {},
  _supabase: null,
  _userData: null,

  init(pages, supabase, userData) {
    this.pages = pages;
    this._supabase = supabase;
    this._userData = userData;
  },

  loadPage(page) {
    const area = document.getElementById("content-area");
    if (!area) return;

    // Reset Active Class
    document
      .querySelectorAll(".portal-nav-link")
      .forEach((el) => el.classList.remove("active"));

    try {
      // Logika khusus untuk Cart (karena butuh data dari GlobalCart)
      if (page === "cart") {
        const { GlobalCart } = this.pages; // Pastikan GlobalCart ada di objek pages
        const items = GlobalCart.getItems();
        area.innerHTML = this.pages.cart.render(items);
        this.pages.cart.init(this._supabase, this._userData);
      }
      // Logika khusus untuk Home (karena butuh data user)
      else if (page === "home") {
        area.innerHTML = this.pages.home.render(this._userData);
        this.pages.home.init();
      }
      // Logika Standar untuk halaman lainnya
      else if (this.pages[page]) {
        area.innerHTML = this.pages[page].render();
        this.pages[page].init(this._supabase, this._userData);
      }
      // Fallback untuk fitur yang belum ada
      else if (page === "setoran") {
        area.innerHTML = `<div style="text-align: center; margin-top: 50px;"><h2 style="color: #faa61a;">Fitur Setoran</h2><p style="color: #b9bbbe;">Dalam pengembangan.</p></div>`;
      }

      // Set Active Link
      const nav = document.getElementById(`nav-${page}`);
      if (nav) nav.classList.add("active");
    } catch (err) {
      console.error(`Gagal memuat halaman ${page}:`, err);
    }
  },

  async renderSidebar(userData) {
    const sidebarContainer = document.querySelector(".sidebar-menu");
    if (!sidebarContainer) return;

    // Gunakan API Wrapper
    const { data: menus, error } = await API.fetchActiveMenus();

    if (error || !menus) return;

    const permissions = userData.roles?.permissions || {};
    const isOwner = userData.role_id === 1;

    let html = "";
    menus.forEach((m) => {
      if (isOwner || permissions[m.menu_slug]) {
        html += `
                    <a href="#" class="menu-item" data-page="${m.menu_slug}" onclick="loadPage('${m.menu_slug}')">
                        <i class="${m.icon_class}"></i> <span>${m.menu_label}</span>
                    </a>`;
      }
    });

    // ... append menu statis & innerHTML ...
    sidebarContainer.innerHTML = html + this.renderStaticMenus();
  },

  renderStaticMenus() {
    return `
            <div style="border-top: 1px solid #40444b; margin: 5px 0;"></div>
            <a href="#" class="menu-item" data-page="profile" onclick="loadPage('profile')">
                <i class="fas fa-user-circle"></i> <span>My Profile</span>
            </a>
            <div class="menu-item logout-item" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> <span>Logout</span>
            </div>`;
  },
};
