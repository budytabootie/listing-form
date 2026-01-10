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

    <div style="background: #2f3136; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        <table style="width: 100%; border-collapse: collapse; font-size:0.9rem;">
            <thead>
                <tr style="background: #202225; text-align: left; color:#b9bbbe;">
                    <th style="padding: 18px;">NAMA LENGKAP</th>
                    <th style="padding: 18px;">USERNAME</th>
                    <th style="padding: 18px;">STATUS PASSWORD</th>
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
    if (!supabase) {
      console.error("Supabase instance not found!");
      return;
    }

    const st = UsersPage.state;

    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/get-config");
        st.config = await res.json();
      } catch (e) {
        console.error("Gagal mengambil config:", e);
      }
    };

    const generatePass = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
      let res = "";
      for (let i = 0; i < 6; i++)
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      return res;
    };

    const sendDiscordNotification = async (
      discordId,
      nama,
      username,
      password,
      type = "create"
    ) => {
      if (!discordId || !st.config) return;
      const title =
        type === "create" ? "🆕 AKUN AKSES BARU" : "🔐 PASSWORD DIRESET";
      const message = `**${title}**\n\nHalo **${nama}**, berikut adalah detail akses Portal Anda:\n\n👤 Username: \`${username}\` \n🔑 Password: \`${password}\`\n\n_Harap simpan data ini dengan aman!_`;
      try {
        await fetch(`${st.config.supabaseUrl}/functions/v1/discord-notifier`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${st.config.supabaseKey}`,
          },
          body: JSON.stringify({ discord_id: discordId, message: message }),
        });
      } catch (err) {
        console.error("Discord Notify Error:", err);
      }
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

    const renderTable = (items) => {
      const tableBody = document.getElementById("userTableBody");
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
                  user.is_encrypted
                    ? '<span style="color:#43b581; font-size:0.8rem;"><i class="fas fa-shield-alt"></i> Encrypted</span>'
                    : `<span style="color:#fff; background:#4f545c; padding:2px 8px; border-radius:4px;">${user.password}</span>`
                }
            </td>
            <td style="padding: 15px;">
                <span style="color:${getRoleColor(
                  user.role_id
                )}; font-size:0.7rem; font-weight:bold; background:rgba(0,0,0,0.2); padding:4px 8px; border-radius:4px;">${
            user.roles?.role_name || "Unknown"
          }</span>
            </td>
            <td style="padding: 15px; text-align: center; display: flex; gap: 8px; justify-content: center;">
                <button class="btn-edit-user" data-user='${JSON.stringify(
                  user
                )}' style="background:#faa61a; padding:5px 10px; border:none; border-radius:4px; cursor:pointer;"><i class="fas fa-edit"></i></button>
                <button class="btn-delete-user" data-id="${
                  user.id
                }" data-name="${
            user.nama_lengkap
          }" style="background:#ed4245; padding:5px 10px; border:none; color:white; border-radius:4px; cursor:pointer;"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`
        )
        .join("");

      tableBody
        .querySelectorAll(".btn-edit-user")
        .forEach(
          (btn) =>
            (btn.onclick = () => showEditModal(JSON.parse(btn.dataset.user)))
        );
      tableBody.querySelectorAll(".btn-delete-user").forEach(
        (btn) =>
          (btn.onclick = async () => {
            const result = await Swal.fire({
              title: "Hapus Akses?",
              text: `Akun untuk ${btn.dataset.name} akan dihapus selamanya.`,
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#ed4245",
              background: "#2f3136",
              color: "#fff",
            });
            if (result.isConfirmed) {
              await supabase
                .from("users_login")
                .delete()
                .eq("id", btn.dataset.id);
              loadUsers();
            }
          })
      );
    };

    const showEditModal = async (user) => {
      const { value: formValues } = await Swal.fire({
        title: `<div style="display:flex; flex-direction:column; align-items:center; gap:5px;"><div style="background:rgba(250,166,26,0.1); padding:12px; border-radius:12px; margin-bottom:5px;"><i class="fas fa-shield-alt" style="color:#faa61a; font-size:1.2rem;"></i></div><span style="color:white; font-size:1.1rem; font-weight:bold;">Update User Access</span></div>`,
        background: "#2f3136",
        padding: "1.5em",
        html: `
            <div style="text-align:left; font-family: 'Inter', sans-serif;">
              <div style="margin-bottom:18px;">
                <label style="font-size:0.65rem; color:#8e9297; font-weight:800; text-transform:uppercase; display:block; margin-bottom:8px;">Account Owner</label>
                <div style="width:100%; background:#202225; color:#72767d; border-radius:8px; padding:12px; font-weight:600; display:flex; align-items:center; border: 1px solid #202225;"><i class="fas fa-user-lock" style="font-size:0.9rem; margin-right:12px; opacity:0.5;"></i> ${
                  user.nama_lengkap
                }</div>
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:18px;">
                <div>
                    <label style="font-size:0.65rem; color:#8e9297; font-weight:800; text-transform:uppercase; display:block; margin-bottom:8px;">Username</label>
                    <input id="swal-username" value="${
                      user.username
                    }" style="width:100%; background:#202225; color:white; border:1px solid #202225; border-radius:8px; padding:10px 12px; font-size:0.9rem; outline:none;">
                </div>
                <div>
                    <label style="font-size:0.65rem; color:#8e9297; font-weight:800; text-transform:uppercase; display:block; margin-bottom:8px;">Access Level</label>
                    <select id="swal-role" style="width:100%; background:#202225; color:white; border:1px solid #202225; border-radius:8px; padding:10px 12px; font-size:0.9rem;">
                      ${st.rolesList
                        .map(
                          (r) =>
                            `<option value="${r.id}" ${
                              r.id === user.role_id ? "selected" : ""
                            }>${r.role_name}</option>`
                        )
                        .join("")}
                    </select>
                </div>
              </div>
              <div style="margin-top:25px; padding-top:20px; border-top: 1px solid #4f545c;">
                <label style="font-size:0.65rem; color:#faa61a; font-weight:800; text-transform:uppercase; display:block; margin-bottom:8px;">Security Reset</label>
                <div style="position:relative; display:flex; align-items:center;">
                    <input id="swal-new-pass" placeholder="Leave blank to keep current" readonly style="width:100%; background:#202225; color:#faa61a; border:1px solid #4f545c; border-radius:8px; padding:12px 45px 12px 12px; font-family:monospace; font-weight:bold; font-size:1rem;">
                    <button type="button" id="btn-gen-edit" style="position:absolute; right:10px; background:#36393f; border:none; color:#b9bbbe; width:30px; height:30px; border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:center;"><i class="fas fa-sync-alt"></i></button>
                </div>
              </div>
            </div>`,
        showCancelButton: true,
        confirmButtonText: "Save Changes",
        confirmButtonColor: "#faa61a",
        cancelButtonColor: "transparent",
        didOpen: () => {
          document.getElementById("btn-gen-edit").onclick = () => {
            document.getElementById("swal-new-pass").value = generatePass();
            document.getElementById("btn-gen-edit").style.color = "#faa61a";
          };
        },
        preConfirm: () => ({
          username: document.getElementById("swal-username").value,
          role_id: document.getElementById("swal-role").value,
          new_password: document.getElementById("swal-new-pass").value,
        }),
      });

      if (formValues) {
        const updateData = {
          username: formValues.username,
          role_id: parseInt(formValues.role_id),
        };
        if (formValues.new_password) {
          updateData.password = CryptoJS.SHA256(
            formValues.new_password
          ).toString();
          updateData.is_encrypted = true;
        }
        const { error } = await supabase
          .from("users_login")
          .update(updateData)
          .eq("id", user.id);
        if (!error) {
          if (formValues.new_password) {
            const member = st.membersList.find(
              (m) => m.nama === user.nama_lengkap
            );
            if (member)
              sendDiscordNotification(
                member.discord_id,
                user.nama_lengkap,
                formValues.username,
                formValues.new_password,
                "reset"
              );
          }
          Swal.fire({
            title: "Updated!",
            icon: "success",
            background: "#2f3136",
            color: "#fff",
            timer: 1500,
            showConfirmButton: false,
          });
          loadUsers();
        }
      }
    };

    const getRoleColor = (id) =>
      ({ 1: "#ed4245", 2: "#faa61a", 3: "#5865F2", 5: "#43b581" }[id] ||
      "#b9bbbe");

    const renderPagination = (totalPages) => {
      const container = document.getElementById("userPagination");
      if (totalPages <= 1) return (container.innerHTML = "");
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
      const { error } = await supabase
        .from("users_login")
        .insert([
          {
            nama_lengkap,
            username,
            password: CryptoJS.SHA256(passwordPlain).toString(),
            role_id: parseInt(role_id),
            is_encrypted: true,
            role: "admin",
          },
        ]);
      if (error) {
        Swal.fire("Gagal", "Username sudah ada!", "error");
      } else {
        const member = st.membersList.find((m) => m.nama === nama_lengkap);
        if (member)
          sendDiscordNotification(
            member.discord_id,
            nama_lengkap,
            username,
            passwordPlain,
            "create"
          );
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
