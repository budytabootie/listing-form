// public/admin/js/core/navigation.js

export const Navigation = {
  pages: {},
  _supabase: null,
  _userData: null,

  init(pages, supabase, userData) {
    this.pages = pages;
    this._supabase = supabase;
    this._userData = userData;
  },

  async renderSidebar() {
    const sidebarContainer = document.querySelector(".sidebar-menu");
    if (!sidebarContainer || !this._supabase) return;

    const { data: menus, error } = await this._supabase
      .from("master_menus")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !menus) return;

    const permissions = this._userData.roles?.permissions || {};
    const isOwner = this._userData.role_id === 1;

    let html = "";
    menus.forEach((m) => {
      if (isOwner || permissions[m.menu_slug]) {
        html += `
                    <a href="#" class="menu-item" data-page="${m.menu_slug}" onclick="loadPage('${m.menu_slug}')">
                        <i class="${m.icon_class}"></i> <span>${m.menu_label}</span>
                    </a>
                `;
      }
    });

    // Menu Statis
    html += `
            <div style="border-top: 1px solid #40444b; margin: 5px 0;"></div>
            <a href="#" class="menu-item" data-page="profile" onclick="loadPage('profile')">
                <i class="fas fa-user-circle" style="color: #b9bbbe;"></i> <span>My Profile</span>
            </a>
            <div class="menu-item logout-item" onclick="window.logout()" style="cursor:pointer;">
                <i class="fas fa-sign-out-alt"></i> <span>Logout</span>
            </div>
        `;

    sidebarContainer.innerHTML = html;
  },

  async loadPage(page) {
    const area = document.getElementById("content-area");
    if (!area) return;

    const userPerms = this._userData.roles?.permissions || {};
    const isOwner = this._userData.role_id === 1;

    // Bypass Security Check
    if (page !== "profile" && !isOwner && !userPerms[page]) {
      Swal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Anda tidak memiliki otoritas.",
        background: "#2f3136",
        color: "#fff",
      });
      return;
    }

    // UI Update: Active Class
    document
      .querySelectorAll(".menu-item")
      .forEach((m) => m.classList.remove("active"));
    const targetMenu = document.querySelector(
      `.menu-item[data-page="${page}"]`
    );
    if (targetMenu) targetMenu.classList.add("active");

    // Render Page
    if (this.pages[page]) {
      try {
        area.innerHTML = this.pages[page].render();
        await this.pages[page].init(this._supabase, this._userData);
      } catch (err) {
        console.error(`Error loading page ${page}:`, err);
        area.innerHTML = `<div style="color:white; padding:20px;">Error: ${err.message}</div>`;
      }
    }
  },
};
