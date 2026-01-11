/** @param {any} supabase */
export const RolesPage = {
  render: () => `
        <style>
            /* --- UI CARD & GRID --- */
            .role-card {
                background: #2f3136; border-radius: 12px; padding: 25px; 
                border: 1px solid #40444b; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex; flex-direction: column; justify-content: space-between;
            }
            .role-card:hover {
                transform: translateY(-5px);
                border-color: #5865f2;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }

            .perm-label {
                color:#dcddde; font-size:0.75rem; background:#202225; 
                padding:10px; border-radius:6px; display:flex; align-items:center; 
                gap:10px; cursor:pointer; border: 1px solid transparent; transition: 0.2s;
            }
            .perm-label:hover:not(.disabled) { background: #36393f; border-color: #4f545c; }
            .perm-label input[type="checkbox"] { accent-color: #5865f2; width: 16px; height: 16px; }

            /* --- UI MODAL AESTHETIC (SWEETALERT) --- */
            .custom-swal-container {
                backdrop-filter: blur(4px);
            }
            .custom-swal-popup {
                border-radius: 20px !important;
                background: #2f3136 !important;
                border: 1px solid #4f545c !important;
                padding: 2.5rem !important;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important;
            }
            .modal-form-group {
                margin-bottom: 20px;
                text-align: left;
            }
            .modal-label {
                display: block;
                color: #5865f2;
                font-size: 0.7rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 8px;
                margin-left: 4px;
            }
            .modal-input {
                width: 100% !important;
                background: #202225 !important;
                border: 2px solid #202225 !important;
                border-radius: 10px !important;
                color: #fff !important;
                padding: 12px 15px !important;
                font-size: 0.95rem !important;
                transition: all 0.3s ease !important;
                box-sizing: border-box !important;
                margin: 0 !important;
            }
            .modal-input:focus {
                border-color: #5865f2 !important;
                background: #23272a !important;
                outline: none !important;
                box-shadow: 0 0 10px rgba(88, 101, 242, 0.2) !important;
            }
            .modal-textarea {
                min-height: 120px !important;
                resize: none !important;
            }
            .swal2-actions { margin-top: 30px !important; }
            .swal2-confirm { border-radius: 10px !important; padding: 12px 35px !important; font-weight: bold !important; }
            .swal2-cancel { border-radius: 10px !important; background: transparent !important; color: #b9bbbe !important; }
            .swal2-cancel:hover { text-decoration: underline !important; }
        </style>

        <div class="header-container" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <div>
                <h2 style="color: white; margin: 0; font-weight: 800; letter-spacing: 0.5px;">
                    <i class="fas fa-user-shield" style="color: #5865f2;"></i> Role Management
                </h2>
                <p style="color: #b9bbbe; margin-top: 5px; font-size: 0.9rem;">Atur hirarki dan hak akses sistem dengan presisi.</p>
            </div>
            <button id="btnAddRole" style="background: #43b581; color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 8px; transition: 0.3s; box-shadow: 0 4px 15px rgba(67, 181, 129, 0.3);">
                <i class="fas fa-plus"></i> NEW ROLE
            </button>
        </div>

        <div id="rolesGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 25px;">
            <div style="color:white; padding:20px;"><i class="fas fa-circle-notch fa-spin"></i> Loading roles...</div>
        </div>
    `,

  init: async (supabase) => {
    // 1. Ambil daftar menu secara dinamis dari database
    const { data: masterMenus, error: menuErr } = await supabase
      .from("master_menus")
      .select("*")
      .order("sort_order", { ascending: true });

    if (menuErr) return console.error("Gagal memuat menu master");

    const loadRoles = async () => {
      const { data: roles, error } = await supabase
        .from("roles")
        .select("*")
        .order("id", { ascending: true });
      if (!error) renderRoles(roles);
    };

    const renderRoles = (roles) => {
      const grid = document.getElementById("rolesGrid");
      grid.innerHTML = roles
        .map(
          (role) => `
                <div class="role-card">
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <h3 style="color:#fff; margin: 0; font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; gap: 10px;">
                                ${role.role_name}
                                ${
                                  role.id !== 1
                                    ? `<i class="fas fa-edit" onclick="window.editRoleInfo(${
                                        role.id
                                      }, '${role.role_name}', '${
                                        role.description || ""
                                      }')" style="font-size: 0.9rem; color: #5865f2; cursor: pointer; opacity: 0.5;"></i>`
                                    : ""
                                }
                            </h3>
                            <span style="font-size: 0.65rem; background: #202225; color: #72767d; padding: 4px 12px; border-radius: 20px;">ID: ${
                              role.id
                            }</span>
                        </div>
                        <p style="color: #b9bbbe; font-size: 0.85rem; margin-top: 10px; background: rgba(32, 34, 37, 0.5); padding: 12px; border-radius: 8px;">
                            ${
                              role.description ||
                              '<span style="font-style:italic; opacity:0.3;">No description provided.</span>'
                            }
                        </p>
                    </div>

                    <div style="border-top: 1px solid #40444b; padding-top: 20px;">
                        <label style="color: #72767d; font-size: 0.7rem; font-weight: 800; display: block; margin-bottom: 15px; text-transform: uppercase;">Permissions</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            ${masterMenus
                              .map(
                                (m) => `
                                <label class="perm-label ${
                                  role.id === 1 ? "disabled" : ""
                                }">
                                    <input type="checkbox" class="p-check" 
                                        data-role="${role.id}" 
                                        data-key="${m.menu_slug}" 
                                        ${
                                          role.permissions &&
                                          role.permissions[m.menu_slug]
                                            ? "checked"
                                            : ""
                                        } 
                                        ${role.id === 1 ? "disabled" : ""}> 
                                    ${m.menu_label.toUpperCase()}
                                </label>
                            `
                              )
                              .join("")}
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 25px;">
                        ${
                          role.id !== 1
                            ? `
                            <button onclick="window.saveRoleChanges(${role.id})" style="flex: 2; background:#5865f2; color:white; font-weight:bold; border:none; padding:12px; border-radius:8px; cursor:pointer;">SAVE</button>
                            <button onclick="window.deleteRole(${role.id}, '${role.role_name}')" style="flex: 1; background:#ed4245; color:white; border:none; border-radius:8px; cursor:pointer;"><i class="fas fa-trash"></i></button>
                        `
                            : `<div style="width: 100%; text-align: center; padding: 12px; color: #72767d; border: 1px dashed #4f545c;">SYSTEM PROTECTED</div>`
                        }
                    </div>
                </div>
            `
        )
        .join("");
    };

    window.saveRoleChanges = async (roleId) => {
      const checks = document.querySelectorAll(
        `.p-check[data-role="${roleId}"]`
      );
      const perms = { profile: true }; // Profile selalu true
      checks.forEach((c) => (perms[c.dataset.key] = c.checked));

      const { error } = await supabase
        .from("roles")
        .update({ permissions: perms })
        .eq("id", roleId);
      if (!error)
        Swal.fire({
          icon: "success",
          title: "Saved!",
          background: "#2f3136",
          color: "#fff",
          timer: 1000,
          showConfirmButton: false,
        });
    };

    // Tombol Add Role menggunakan list menu dari database
    document.getElementById("btnAddRole").onclick = async () => {
      const { value: formValues } = await openRoleModal("Initialize New Role");
      if (formValues) {
        const defaultPerms = { profile: true };
        masterMenus.forEach((m) => (defaultPerms[m.menu_slug] = false));
        await supabase
          .from("roles")
          .insert([{ ...formValues, permissions: defaultPerms }]);
        loadRoles();
      }
    };

    loadRoles();
  },
};
