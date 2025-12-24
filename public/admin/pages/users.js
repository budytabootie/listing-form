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
                <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">PASSWORD</label>
                <input type="password" id="addPassword" placeholder="******" style="background:#202225; border:1px solid #4f545c; height:40px;">
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

    const loadUsers = async () => {
      const { data, error } = await supabase
        .from("users_login")
        .select("*")
        .order("nama_lengkap");
      if (error) return;

      // 1. Filtering
      const filtered = data.filter(
        (u) =>
          u.nama_lengkap.toLowerCase().includes(st.searchQuery.toLowerCase()) ||
          u.username.toLowerCase().includes(st.searchQuery.toLowerCase())
      );

      // 2. Pagination Logic
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
        <tr style="border-bottom: 1px solid #36393f; transition: 0.2s;" onmouseover="this.style.background='#36393f'" onmouseout="this.style.background='transparent'">
            <td style="padding: 15px; font-weight:bold; color:#fff;">${
              user.nama_lengkap
            }</td>
            <td style="padding: 15px;"><code style="color:#faa61a; background:rgba(250,166,26,0.1); padding:3px 6px; border-radius:4px;">@${
              user.username
            }</code></td>
            <td style="padding: 15px;">
                <span style="background:${
                  user.role === "admin"
                    ? "rgba(237,66,69,0.1)"
                    : "rgba(88,101,242,0.1)"
                }; 
                             color:${
                               user.role === "admin" ? "#ed4245" : "#5865F2"
                             }; 
                             padding:4px 12px; border-radius:20px; font-size:0.7rem; font-weight:bold; border:1px solid currentColor; text-transform:uppercase;">
                    <i class="fas ${
                      user.role === "admin" ? "fa-crown" : "fa-user"
                    } " style="margin-right:5px;"></i>${user.role}
                </span>
            </td>
            <td style="padding: 15px; text-align: center;">
                <button class="btn-delete-user" data-id="${
                  user.id
                }" data-name="${user.nama_lengkap}"
                    style="background:#ed4245; padding:8px 15px; width:auto;"><i class="fas fa-trash-alt"></i> Hapus</button>
            </td>
        </tr>`
        )
        .join("");

      // Bind Hapus
      tableBody.querySelectorAll(".btn-delete-user").forEach((btn) => {
        btn.onclick = async () => {
          const { isConfirmed } = await Swal.fire({
            title: "Hapus Akun?",
            text: `Akun "${btn.dataset.name}" akan dihapus permanen!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ed4245",
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
      if (totalPages <= 1) {
        container.innerHTML = "";
        return;
      }

      const curr = st.currentPage;
      const baseBtn = `border:none; color:white; padding:8px 12px; margin:0 2px; border-radius:6px; cursor:pointer; font-size:0.85rem; transition:0.2s; display:flex; align-items:center; min-width:35px; justify-content:center;`;

      let start = Math.max(1, curr - 1);
      let end = Math.min(totalPages, start + 2);
      if (end - start < 2) start = Math.max(1, end - 2);

      let html = `<div style="display:flex; background:#23272a; padding:5px; border-radius:8px; border:1px solid #36393f;">`;

      // First & Prev
      html += `<button class="pg-nav" data-page="1" ${
        curr === 1
          ? 'disabled style="opacity:0.3;' + baseBtn + '"'
          : 'style="' + baseBtn + 'background:#202225;"'
      }><i class="fas fa-angles-left"></i></button>`;

      // Numbers
      for (let i = start; i <= end; i++) {
        const active = i === curr;
        html += `<button class="pg-nav" data-page="${i}" style="${baseBtn} background:${
          active ? "#faa61a" : "#4f545c"
        }; color:${active ? "black" : "white"}; ${
          active ? "font-weight:bold;" : ""
        }">${i}</button>`;
      }

      // Next & Last
      html += `<button class="pg-nav" data-page="${totalPages}" ${
        curr === totalPages
          ? 'disabled style="opacity:0.3;' + baseBtn + '"'
          : 'style="' + baseBtn + 'background:#202225;"'
      }><i class="fas fa-angles-right"></i></button></div>`;
      html += `<span style="color: #b9bbbe; font-size: 0.75rem; margin-left: 15px;">Page <b>${curr}</b> of ${totalPages}</span>`;

      container.innerHTML = html;
      container.querySelectorAll(".pg-nav").forEach((btn) => {
        btn.onclick = () => {
          st.currentPage = parseInt(btn.dataset.page);
          loadUsers();
        };
      });
    };

    // Event Search
    document.getElementById("userSearch").oninput = (e) => {
      st.searchQuery = e.target.value;
      st.currentPage = 1;
      loadUsers();
    };

    // Event Submit
    document.getElementById("btnCreateUser").onclick = async () => {
      const nama_lengkap = document.getElementById("addFullName").value;
      const username = document.getElementById("addUsername").value;
      const password = document.getElementById("addPassword").value;
      const role = document.getElementById("addRole").value;

      if (!nama_lengkap || !username || !password)
        return Swal.fire("Error", "Lengkapi semua field!", "error");

      const { error } = await supabase
        .from("users_login")
        .insert([{ nama_lengkap, username, password, role }]);
      if (error) {
        Swal.fire("Gagal", error.message, "error");
      } else {
        Swal.fire({
          icon: "success",
          title: "User Dibuat",
          timer: 1000,
          showConfirmButton: false,
        });
        ["addFullName", "addUsername", "addPassword"].forEach(
          (id) => (document.getElementById(id).value = "")
        );
        loadUsers();
      }
    };

    loadUsers();
  },
};
