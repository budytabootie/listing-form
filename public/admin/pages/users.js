// public/js/admin/users.js
export const UsersPage = {
  state: {
    searchQuery: "",
    currentPage: 1,
    itemsPerPage: 10,
    rolesList: [],
    membersList: [],
    config: null,
  },

  render: () => `
    <div class="header-container">
        <h2>User Management</h2>
        <p style="color: #b9bbbe; margin-top: -10px; font-size: 0.9rem;">Hubungkan data Member dengan kredensial akses Portal.</p>
    </div>

    <div style="background: #2f3136; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border-top: 4px solid #faa61a;">
        <h4 style="margin-top:0; color:#fff; display:flex; align-items:center; gap:10px;">
            <i class="fas fa-user-plus" style="color:#faa61a;"></i> Registrasi Akun Baru
        </h4>
        <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr auto; gap: 12px; align-items: end; margin-top:15px;">
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">PILIH MEMBER</label>
                <select id="addMemberSelect" style="background:#202225; border:1px solid #4f545c; height:40px; color:white; padding:0 10px; border-radius:4px; width:100%;">
                    <option value="">Memuat Member...</option>
                </select>
            </div>
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">USERNAME</label>
                <input type="text" id="addUsername" placeholder="username" style="background:#202225; border:1px solid #4f545c; height:40px; color:white; padding:0 10px; border-radius:4px; width:100%;">
            </div>
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">PASSWORD (AUTO)</label>
                <input type="text" id="addPassword" readonly style="background:#202225; border:1px solid #4f545c; height:40px; color:#faa61a; font-weight:bold; padding:0 10px; border-radius:4px; width:100%;">
            </div>
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">ROLE AKSES</label>
                <select id="addRole" style="background:#202225; border:1px solid #4f545c; height:40px; color:white; padding:0 10px; border-radius:4px; width:100%;">
                    <option value="">Memuat Role...</option>
                </select>
            </div>
            <button id="btnCreateUser" style="background:#faa61a; padding: 0 20px; font-weight:bold; height:40px; color:black; border:none; border-radius:4px; cursor:pointer;">BUAT AKUN</button>
        </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
         <div style="position:relative; width: 350px;">
            <i class="fas fa-search" style="position:absolute; left:15px; top:12px; color:#4f545c;"></i>
            <input type="text" id="userSearch" placeholder="Cari nama atau username..." 
                style="width: 100%; padding: 10px 10px 10px 40px; background:#202225; color:white; border-radius:8px; border:1px solid #4f545c;">
         </div>
    </div>

    <div style="background: #2f3136; border-radius: 12px; overflow-x: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        <table style="width: 100%; min-width: 800px; border-collapse: collapse; font-size:0.9rem;">
            <thead>
                <tr style="background: #202225; text-align: left; color:#b9bbbe;">
                    <th style="padding: 18px;">NAMA LENGKAP</th>
                    <th style="padding: 18px;">USERNAME</th>
                    <th style="padding: 18px;">KEAMANAN</th>
                    <th style="padding: 18px;">ROLE</th>
                    <th style="padding: 18px; text-align: center;">AKSI</th>
                </tr>
            </thead>
            <tbody id="userTableBody"></tbody>
        </table>
    </div>
    <div id="userPagination" style="display: flex; justify-content: center; gap: 5px; margin-top: 25px;"></div>
  `,

  init: async (supabase, userData) => {
    const st = UsersPage.state;

    const generatePass = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
      let res = "";
      for (let i = 0; i < 6; i++)
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      return res;
    };

    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/get-config");
        st.config = await res.json();
      } catch (e) {
        console.error("Gagal load config:", e);
      }
    };

    const callAdminAction = async (action, payload) => {
      try {
        if (!st.config) await fetchConfig();
        const baseUrl = st.config.supabaseUrl.replace(/\/$/, "");
        const token = localStorage.getItem("sessionToken");
        if (!token) throw new Error("Sesi habis, silakan login kembali.");

        const cleanPayload = {
          ...payload,
          admin_name: userData?.nama_lengkap || "Admin",
        };

        const response = await fetch(`${baseUrl}/functions/v1/admin-actions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-token": token,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action, payload: cleanPayload }),
        });

        const res = await response.json();
        if (!response.ok) throw new Error(res.error || "Gagal memproses aksi");
        return { success: true };
      } catch (e) {
        Swal.fire("Error", e.message, "error");
        return { success: false };
      }
    };

    const showEditModal = async (targetUser) => {
      await Swal.fire({
        title: "Edit User Access",
        background: "#2f3136",
        color: "#fff",
        html: `
          <div style="text-align:left;">
            <label style="font-size:0.8rem; color:#b9bbbe;">ROLE AKSES</label>
            <select id="editRole" class="swal2-input" style="background:#202225; color:white; border:1px solid #4f545c; width:100%; margin:10px 0;">
              ${st.rolesList
                .map(
                  (r) =>
                    `<option value="${r.id}" ${
                      r.id === targetUser.role_id ? "selected" : ""
                    }>${r.role_name}</option>`
                )
                .join("")}
            </select>
            <hr style="border:0; border-top:1px solid #4f545c; margin:20px 0;">
            <button id="btnResetPass" class="swal2-confirm swal2-styled" style="background:#faa61a; width:100%; margin:0; border-radius:4px; font-weight:bold;">RESET & DM PASSWORD BARU</button>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: "SIMPAN ROLE",
        showCancelButton: true,
        cancelButtonColor: "#4f545c",
        didOpen: () => {
          document.getElementById("btnResetPass").onclick = async () => {
            const newPass = generatePass();
            const member = st.membersList.find(
              (m) => m.nama === targetUser.nama_lengkap
            );

            Swal.showLoading();
            const res = await callAdminAction("reset_password", {
              user_id: targetUser.id,
              nama_lengkap: targetUser.nama_lengkap,
              username: targetUser.username,
              password: newPass,
              discord_id: member?.discord_id,
              app_url: window.location.origin,
              is_encrypted: true,
            });

            if (res.success) {
              if (window.createAuditLog) {
                await window.createAuditLog(
                  "UPDATE",
                  "users_login",
                  `Reset password user @${targetUser.username}`
                );
              }
              Swal.fire({
                icon: "success",
                title: "Berhasil",
                text: "Password direset & dikirim ke Discord.",
                background: "#2f3136",
                color: "#fff",
              });
              loadUsers();
            }
          };
        },
        preConfirm: async () => {
          const newRoleId = document.getElementById("editRole").value;

          // 1. Update Role di tabel users_login
          const { error } = await supabase
            .from("users_login")
            .update({ role_id: parseInt(newRoleId) })
            .eq("id", targetUser.id);

          if (!error) {
            // 2. Hapus semua session user tersebut agar dia "Logout Paksa"
            // Ini memastikan Rudy tidak bisa pakai token lamanya lagi.
            await supabase
              .from("user_sessions")
              .delete()
              .eq("user_id", targetUser.id);

            if (window.createAuditLog) {
              await window.createAuditLog(
                "UPDATE",
                "users_login",
                `Mengubah role @${targetUser.username} dan reset session.`
              );
            }
            loadUsers();
          }
        },
      });
    };

    const renderTable = (items) => {
      const tableBody = document.getElementById("userTableBody");
      if (!tableBody) return;
      tableBody.innerHTML = items
        .map(
          (user) => `
        <tr style="border-bottom: 1px solid #36393f;">
            <td style="padding: 15px; color:#fff;">${user.nama_lengkap}</td>
            <td style="padding: 15px;"><code style="color:#faa61a;">@${
              user.username
            }</code></td>
            <td style="padding: 15px;">
                ${
                  user.has_changed_password
                    ? '<span style="color:#43b581;"><i class="fas fa-check-circle"></i> Secure</span>'
                    : '<span style="color:#faa61a;"><i class="fas fa-key"></i> Default</span>'
                }
            </td>
            <td style="padding: 15px;">
                <span style="color:${getRoleColor(
                  user.role_id
                )}; font-size:0.7rem; font-weight:bold; background:rgba(0,0,0,0.2); padding:4px 8px; border-radius:4px;">
                ${user.roles?.role_name || "Unknown"}</span>
            </td>
            <td style="padding: 15px; text-align: center; display: flex; gap: 8px; justify-content: center;">
                <button class="btn-edit-user" data-id="${
                  user.id
                }" style="background:#5865F2; color:white; padding:5px 10px; border:none; border-radius:4px; cursor:pointer;"><i class="fas fa-edit"></i> EDIT</button>
                <button class="btn-delete-user" data-id="${
                  user.id
                }" style="background:#ed4245; padding:5px 10px; border:none; color:white; border-radius:4px; cursor:pointer;"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`
        )
        .join("");

      tableBody.querySelectorAll(".btn-edit-user").forEach((btn) => {
        btn.onclick = () => {
          const userObj = items.find((u) => u.id == btn.dataset.id);
          if (userObj) showEditModal(userObj);
        };
      });

      tableBody.querySelectorAll(".btn-delete-user").forEach((btn) => {
        btn.onclick = async () => {
          const userObj = items.find((u) => u.id == btn.dataset.id);
          const res = await Swal.fire({
            title: "Hapus Akses?",
            text: `Akun ${userObj.nama_lengkap} akan dihapus permanen.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ed4245",
            background: "#2f3136",
            color: "#fff",
          });

          if (res.isConfirmed) {
            Swal.showLoading();
            const result = await callAdminAction("delete_user", {
              user_id: userObj.id,
              nama_lengkap: userObj.nama_lengkap,
              username: userObj.username,
            });
            if (result.success) {
              if (window.createAuditLog) {
                await window.createAuditLog(
                  "DELETE",
                  "users_login",
                  `Menghapus akses user @${userObj.username}`
                );
              }
              Swal.fire("Dihapus", "Akses user telah dicabut.", "success");
              loadUsers();
            }
          }
        };
      });
    };

    const loadUsers = async () => {
      const { data, error } = await supabase
        .from("users_login")
        .select(`*, roles(role_name)`)
        .order("nama_lengkap");
      if (error) return;
      const filtered = data.filter(
        (u) =>
          u.nama_lengkap.toLowerCase().includes(st.searchQuery.toLowerCase()) ||
          u.username.toLowerCase().includes(st.searchQuery.toLowerCase())
      );
      const totalPages = Math.ceil(filtered.length / st.itemsPerPage) || 1;
      const paginated = filtered.slice(
        (st.currentPage - 1) * st.itemsPerPage,
        st.currentPage * st.itemsPerPage
      );
      renderTable(paginated);
      renderPagination(totalPages);
    };

    const getRoleColor = (id) =>
      ({ 1: "#ed4245", 2: "#faa61a", 3: "#5865F2", 5: "#43b581" }[id] ||
      "#b9bbbe");

    const renderPagination = (totalPages) => {
      const container = document.getElementById("userPagination");
      if (!container || totalPages <= 1)
        return container ? (container.innerHTML = "") : null;
      container.innerHTML =
        `<div style="display:flex; background:#23272a; padding:5px; border-radius:8px;">` +
        Array.from(
          { length: totalPages },
          (_, i) =>
            `<button class="pg-nav" data-page="${
              i + 1
            }" style="border:none; color:white; padding:5px 10px; margin:2px; border-radius:4px; cursor:pointer; background:${
              i + 1 === st.currentPage ? "#faa61a" : "#4f545c"
            }">${i + 1}</button>`
        ).join("") +
        `</div>`;
      container.querySelectorAll(".pg-nav").forEach(
        (btn) =>
          (btn.onclick = () => {
            st.currentPage = parseInt(btn.dataset.page);
            loadUsers();
          })
      );
    };

    const loadInitialData = async () => {
      await fetchConfig();
      const { data: roles } = await supabase
        .from("roles")
        .select("*")
        .order("id");
      st.rolesList = roles || [];
      const { data: members } = await supabase
        .from("members")
        .select("nama, discord_id")
        .order("nama");
      st.membersList = members || [];

      document.getElementById("addRole").innerHTML = st.rolesList
        .map((r) => `<option value="${r.id}">${r.role_name}</option>`)
        .join("");
      document.getElementById("addMemberSelect").innerHTML =
        `<option value="">-- Pilih Member --</option>` +
        st.membersList
          .map((m) => `<option value="${m.nama}">${m.nama}</option>`)
          .join("");
    };

    document.getElementById("userSearch").oninput = (e) => {
      st.searchQuery = e.target.value;
      st.currentPage = 1;
      loadUsers();
    };

    document.getElementById("btnCreateUser").onclick = async () => {
      const nama_lengkap = document.getElementById("addMemberSelect").value;
      const username = document.getElementById("addUsername").value;
      const passwordPlain = document.getElementById("addPassword").value;
      const role_id = document.getElementById("addRole").value;

      if (!nama_lengkap || !username || !role_id)
        return Swal.fire("Error", "Isi semua data!", "error");

      Swal.showLoading();
      const member = st.membersList.find((m) => m.nama === nama_lengkap);

      const res = await callAdminAction("create_user", {
        nama_lengkap,
        username,
        role_id: parseInt(role_id),
        password: passwordPlain,
        discord_id: member?.discord_id,
        app_url: window.location.origin,
      });

      if (res.success) {
        if (window.createAuditLog) {
          await window.createAuditLog(
            "CREATE",
            "users_login",
            `Membuat akun @${username} untuk member ${nama_lengkap}`
          );
        }
        Swal.fire({
          title: "Berhasil",
          icon: "success",
          background: "#2f3136",
          color: "#fff",
        });
        document.getElementById("addUsername").value = "";
        document.getElementById("addPassword").value = generatePass();
        loadUsers();
      }
    };

    document.getElementById("addPassword").value = generatePass();
    await loadInitialData();
    await loadUsers();
  },
};
