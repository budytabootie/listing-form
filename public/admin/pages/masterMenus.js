// pages/masterMenus.js
export const MasterMenusPage = {
  render: () => `
        <div class="page-header">
            <h2 style="color: white;"><i class="fas fa-list"></i> Master Menus</h2>
            <p style="color: #b9bbbe;">Kelola navigasi sidebar secara dinamis.</p>
        </div>
        <div class="admin-card" style="background: #2f3136; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <button id="addMenuBtn" class="btn-modern" style="background: #5865f2; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                <i class="fas fa-plus"></i> Tambah Menu Baru
            </button>
        </div>
        <div class="admin-card" style="background: #2f3136; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; color: white; text-align: left;">
                <thead style="background: #202225;">
                    <tr>
                        <th style="padding: 15px;">Order</th>
                        <th style="padding: 15px;">Label</th>
                        <th style="padding: 15px;">Slug</th>
                        <th style="padding: 15px;">Icon</th>
                        <th style="padding: 15px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="menusTableBody"></tbody>
            </table>
        </div>
    `,

  init: async (supabase) => {
    const tableBody = document.getElementById("menusTableBody");

    const loadMenus = async () => {
      const { data: menus } = await supabase
        .from("master_menus")
        .select("*")
        .order("sort_order", { ascending: true });
      if (!menus) return;
      tableBody.innerHTML = menus
        .map(
          (m) => `
                <tr style="border-bottom: 1px solid #40444b;">
                    <td style="padding: 15px;">${m.sort_order}</td>
                    <td style="padding: 15px;"><strong>${m.menu_label}</strong></td>
                    <td style="padding: 15px;"><code>${m.menu_slug}</code></td>
                    <td style="padding: 15px;"><i class="${m.icon_class}"></i></td>
                    <td style="padding: 15px; text-align: center;">
                        <button onclick="editMenu('${m.id}')" style="background:none; border:none; color:#faa61a; cursor:pointer;"><i class="fas fa-edit"></i></button>
                    </td>
                </tr>
            `
        )
        .join("");
    };

    window.editMenu = async (id = null) => {
      let existing = {
        menu_label: "",
        menu_slug: "",
        icon_class: "fas fa-circle",
        sort_order: 0,
        is_active: true,
      };
      if (id) {
        const { data } = await supabase
          .from("master_menus")
          .select("*")
          .eq("id", id)
          .single();
        existing = data;
      }

      const { value: f } = await Swal.fire({
        title: id ? "Edit Menu" : "Tambah Menu",
        background: "#2f3136",
        color: "#fff",
        html: `
            <input id="m-label" class="swal2-input" placeholder="Menu Label" value="${
              existing.menu_label
            }">
            <input id="m-slug" class="swal2-input" placeholder="Slug" value="${
              existing.menu_slug
            }">
            <input id="m-icon" class="swal2-input" placeholder="Icon Class" value="${
              existing.icon_class
            }">
            <input id="m-order" type="number" class="swal2-input" placeholder="Order" value="${
              existing.sort_order
            }">
            <div style="margin-top:15px; text-align: left; padding-left: 20px;">
                <label style="color: #fff; cursor: pointer;">
                    <input type="checkbox" id="m-active" ${
                      existing.is_active ? "checked" : ""
                    }> Menu ini Aktif
                </label>
            </div>
        `,
        preConfirm: () => ({
          menu_label: document.getElementById("m-label").value,
          menu_slug: document.getElementById("m-slug").value,
          icon_class: document.getElementById("m-icon").value,
          sort_order: parseInt(document.getElementById("m-order").value),
          is_active: document.getElementById("m-active").checked, // Ambil nilai checkbox
        }),
      });

      if (f) {
        const { error } = id
          ? await supabase.from("master_menus").update(f).eq("id", id)
          : await supabase.from("master_menus").insert([f]);
        if (!error) {
          loadMenus();
          Swal.fire("Berhasil", "Status menu diperbarui", "success");
        }
      }
    };

    document.getElementById("addMenuBtn").onclick = () => window.editMenu();
    loadMenus();
  },
};
