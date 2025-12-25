/** @param {any} supabase */
export const UsersPage = {
  state: {
    searchQuery: "",
    currentPage: 1,
    itemsPerPage: 10,
  },

  render: () => `
    <div class="header-container">
        <h2>User Management</h2>
        <p style="color: #b9bbbe; margin-top: -10px; font-size: 0.9rem;">Kelola kredensial dan hak akses aplikasi Portal Nakama.</p>
    </div>

    <div style="background: #2f3136; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border-top: 4px solid #faa61a;">
        <h4 style="margin-top:0; color:#fff; display:flex; align-items:center; gap:10px;">
            <i class="fas fa-user-shield" style="color:#faa61a;"></i> Registrasi Akun Baru
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; gap: 12px; align-items: end; margin-top:15px;">
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">NAMA LENGKAP</label>
                <input type="text" id="addFullName" placeholder="Budi Santoso" style="background:#202225; border:1px solid #4f545c; height:40px;">
            </div>
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">USERNAME</label>
                <input type="text" id="addUsername" placeholder="budi_nakama" style="background:#202225; border:1px solid #4f545c; height:40px;">
            </div>
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">PASSWORD (AUTO)</label>
                <input type="text" id="addPassword" readonly style="background:#202225; border:1px solid #4f545c; height:40px; color:#faa61a; font-weight:bold; cursor:default;">
            </div>
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">ROLE</label>
                <select id="addRole" style="background:#202225; border:1px solid #4f545c; height:40px;">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <button id="btnCreateUser" style="background:#faa61a; padding: 0 20px; font-weight:bold; height:40px; color:black;">BUAT AKUN</button>
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
                    <th style="padding: 18px;">NAMA PENGGUNA</th>
                    <th style="padding: 18px;">USERNAME</th>
                    <th style="padding: 18px;">PASSWORD</th>
                    <th style="padding: 18px;">AKSES ROLE</th>
                    <th style="padding: 18px; text-align: center;">AKSI</th>
                </tr>
            </thead>
            <tbody id="userTableBody"></tbody>
        </table>
    </div>

    <div id="userPagination" style="display: flex; justify-content: center; gap: 5px; margin-top: 25px; align-items: center;"></div>
  `,

  init: async (supabase) => {
    const st = UsersPage.state;

    const generatePass = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
      let res = "";
      for (let i = 0; i < 6; i++)
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      document.getElementById("addPassword").value = res;
    };

    const loadUsers = async () => {
      const { data, error } = await supabase
        .from("users_login")
        .select("*")
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
            <td style="padding: 15px; font-weight:bold; color:#fff;">${
              user.nama_lengkap
            }</td>
            <td style="padding: 15px;"><code style="color:#faa61a;">@${
              user.username
            }</code></td>
            <td style="padding: 15px;">
                ${
                  user.is_encrypted
                    ? '<span style="color:#4f545c; font-size:0.8rem; font-style:italic;"><i class="fas fa-lock"></i> Encrypted</span>'
                    : `<span style="color:#fff; background:#4f545c; padding:2px 8px; border-radius:4px; font-family:monospace;">${user.password}</span>`
                }
            </td>
            <td style="padding: 15px;">
                <span style="color:${
                  user.role === "admin" ? "#ed4245" : "#5865F2"
                }; font-size:0.7rem; font-weight:bold; text-transform:uppercase;">
                    ${user.role}
                </span>
            </td>
            <td style="padding: 15px; text-align: center;">
                <button class="btn-delete-user" data-id="${
                  user.id
                }" data-name="${
            user.nama_lengkap
          }" style="background:#ed4245; padding:5px 10px; width:auto;"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>`
        )
        .join("");

      tableBody.querySelectorAll(".btn-delete-user").forEach((btn) => {
        btn.onclick = async () => {
          const { isConfirmed } = await Swal.fire({
            title: "Hapus?",
            text: btn.dataset.name,
            icon: "warning",
            showCancelButton: true,
            background: "#2f3136",
            color: "#fff",
          });
          if (isConfirmed) {
            await supabase
              .from("users_login")
              .delete()
              .eq("id", btn.dataset.id);
            loadUsers();
          }
        };
      });
    };

    const renderPagination = (totalPages) => {
      const container = document.getElementById("userPagination");
      if (totalPages <= 1) return (container.innerHTML = "");

      let html = `<div style="display:flex; background:#23272a; padding:5px; border-radius:8px;">`;
      for (let i = 1; i <= totalPages; i++) {
        const active = i === st.currentPage;
        html += `<button class="pg-nav" data-page="${i}" style="border:none; color:white; padding:5px 10px; margin:2px; border-radius:4px; background:${
          active ? "#faa61a" : "#4f545c"
        }">${i}</button>`;
      }
      html += `</div>`;
      container.innerHTML = html;
      container.querySelectorAll(".pg-nav").forEach((btn) => {
        btn.onclick = () => {
          st.currentPage = parseInt(btn.dataset.page);
          loadUsers();
        };
      });
    };

    document.getElementById("userSearch").oninput = (e) => {
      st.searchQuery = e.target.value;
      st.currentPage = 1;
      loadUsers();
    };

    document.getElementById("btnCreateUser").onclick = async () => {
      const nama_lengkap = document.getElementById("addFullName").value;
      const username = document.getElementById("addUsername").value;
      const password = document.getElementById("addPassword").value;
      const role = document.getElementById("addRole").value;

      if (!nama_lengkap || !username)
        return Swal.fire("Error", "Nama & Username wajib diisi!", "error");

      const { error } = await supabase
        .from("users_login")
        .insert([
          { nama_lengkap, username, password, role, is_encrypted: false },
        ]);
      if (error) {
        Swal.fire("Gagal", error.message, "error");
      } else {
        Swal.fire("Berhasil", `User Created. Pass: ${password}`, "success");
        ["addFullName", "addUsername"].forEach(
          (id) => (document.getElementById(id).value = "")
        );
        generatePass();
        loadUsers();
      }
    };

    generatePass();
    loadUsers();
  },
};
