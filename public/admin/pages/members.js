/** @param {any} supabase */
export const MembersPage = {
  state: {
    searchQuery: "",
    rankFilter: "all",
    currentPage: 1,
    itemsPerPage: 10,
    sortField: "nama",
    sortAsc: true,
  },

  render: () => `
    <div class="header-container">
        <h2>Member Management</h2>
        <p style="color: #b9bbbe; margin-top: -10px; font-size: 0.9rem;">Kelola daftar anggota organisasi dan rank mereka.</p>
    </div>

    <div style="background: #2f3136; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border-top: 4px solid #5865F2;">
        <h4 style="margin-top:0; color:#fff; display:flex; align-items:center; gap:10px;">
            <i class="fas fa-user-plus" style="color:#5865F2;"></i> Tambah Member Baru
        </h4>
        <div style="display: grid; grid-template-columns: 1.5fr 1fr 1.5fr auto; gap: 15px; align-items: end; margin-top:15px;">
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">NAMA MEMBER</label>
                <input type="text" id="newMemberName" placeholder="Contoh: Udin" style="background:#202225; border:1px solid #4f545c; height:42px;">
            </div>
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">RANK</label>
                <select id="newMemberRank" style="background:#202225; border:1px solid #4f545c; height:42px;">
                    <option value="Prospect">Prospect</option>
                    <option value="Tail Gunner">Tail Gunner</option>
                    <option value="Life Member">Life Member</option>
                    <option value="High Rank">High Rank</option>
                </select>
            </div>
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">DISCORD USER ID</label>
                <input type="text" id="newMemberDiscord" placeholder="Contoh: 2841234..." style="background:#202225; border:1px solid #4f545c; height:42px;">
            </div>
            <button id="btnAddMember" style="background:#5865F2; padding: 0 25px; font-weight:bold; height:42px;">TAMBAH</button>
        </div>
        <small style="color: #faa61a; margin-top: 10px; display: flex; align-items:center; gap:5px;">
            <i class="fas fa-info-circle"></i> Developer Mode ON > Klik Kanan Profil Discord > Copy User ID
        </small>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; gap: 15px;">
         <div style="position:relative; flex: 2;">
            <i class="fas fa-search" style="position:absolute; left:15px; top:12px; color:#4f545c;"></i>
            <input type="text" id="memberSearch" placeholder="Cari nama atau Discord ID..." 
                style="width: 100%; padding: 10px 10px 10px 40px; background:#202225; color:white; border-radius:8px; border:1px solid #4f545c;">
         </div>
         <select id="memberFilterRank" style="flex: 1; background:#202225; border:1px solid #4f545c; border-radius:8px;">
            <option value="all">Semua Rank</option>
            <option value="High Rank">High Rank</option>
            <option value="Life Member">Life Member</option>
            <option value="Tail Gunner">Tail Gunner</option>
            <option value="Prospect">Prospect</option>
         </select>
    </div>

    <div style="background: #2f3136; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid #40444b;">
        <table style="width: 100%; border-collapse: collapse; font-size:0.9rem;">
            <thead>
                <tr style="background: #202225; text-align: left; color:#b9bbbe;">
                    <th style="padding: 18px; cursor:pointer;" id="sortMemName">MEMBER <i class="fas fa-sort fa-xs"></i></th>
                    <th style="padding: 18px; cursor:pointer;" id="sortMemRank">RANK <i class="fas fa-sort fa-xs"></i></th>
                    <th style="padding: 18px;">DISCORD ID</th>
                    <th style="padding: 18px; text-align: center;">AKSI</th>
                </tr>
            </thead>
            <tbody id="memberTableBody"></tbody>
        </table>
    </div>

    <div id="memberPagination" style="display: flex; justify-content: center; gap: 5px; margin-top: 25px; align-items: center;"></div>
  `,

  init: async (supabase) => {
    const st = MembersPage.state;

    const loadMembers = async () => {
      const { data } = await supabase.from("members").select("*");
      if (!data) return;

      // 1. Filter
      let filtered = data.filter((m) => {
        const matchesSearch =
          m.nama.toLowerCase().includes(st.searchQuery.toLowerCase()) ||
          (m.discord_id && m.discord_id.includes(st.searchQuery));
        const matchesRank =
          st.rankFilter === "all" ? true : m.rank === st.rankFilter;
        return matchesSearch && matchesRank;
      });

      // 2. Sort
      filtered.sort((a, b) => {
        let valA = (a[st.sortField] || "").toString().toLowerCase();
        let valB = (b[st.sortField] || "").toString().toLowerCase();
        if (valA < valB) return st.sortAsc ? -1 : 1;
        if (valA > valB) return st.sortAsc ? 1 : -1;
        return 0;
      });

      // 3. Paginate
      const totalPages = Math.ceil(filtered.length / st.itemsPerPage) || 1;
      const paginated = filtered.slice(
        (st.currentPage - 1) * st.itemsPerPage,
        st.currentPage * st.itemsPerPage
      );

      renderTable(paginated);
      renderPagination(totalPages);
    };

    const renderTable = (items) => {
      const tableBody = document.getElementById("memberTableBody");

      // Helper untuk warna rank
      const getRankColor = (rank) => {
        switch (rank) {
          case "High Rank":
            return "#ed4245"; // Merah
          case "Life Member":
            return "#faa61a"; // Gold
          case "Tail Gunner":
            return "#5865F2"; // Biru
          default:
            return "#b9bbbe"; // Grey
        }
      };

      tableBody.innerHTML = items
        .map(
          (m) => `
        <tr style="border-bottom: 1px solid #36393f; transition: 0.2s;" onmouseover="this.style.background='#36393f'" onmouseout="this.style.background='transparent'">
            <td style="padding: 15px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:35px; height:35px; background:#4f545c; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; color:white; font-size:0.8rem; border:2px solid ${getRankColor(
                      m.rank
                    )}">
                        ${m.nama.charAt(0).toUpperCase()}
                    </div>
                    <span style="font-weight:bold; color:#fff;">${m.nama}</span>
                </div>
            </td>
            <td style="padding: 15px;">
                <span style="color:${getRankColor(
                  m.rank
                )}; font-weight:bold; font-size:0.75rem; text-transform:uppercase;">
                    <i class="fas fa-shield-halved" style="margin-right:5px; font-size:0.7rem;"></i>${
                      m.rank
                    }
                </span>
            </td>
            <td style="padding: 15px;">
                <code style="background:#202225; padding:4px 8px; border-radius:4px; color:#5865F2; font-size:0.8rem;">
                    ${m.discord_id || "NOT_SET"}
                </code>
            </td>
            <td style="padding: 15px; text-align: center;">
                <button class="btn-edit" data-id="${m.id}" data-nama="${
            m.nama
          }" data-rank="${m.rank}" data-discord="${m.discord_id || ""}" 
                    style="background:#5865F2; padding:8px 12px; margin-right:5px;"><i class="fas fa-user-edit"></i></button>
                <button class="btn-delete" data-id="${m.id}" 
                    style="background:#ed4245; padding:8px 12px;"><i class="fas fa-user-minus"></i></button>
            </td>
        </tr>`
        )
        .join("");

      // Bind Listeners
      tableBody.querySelectorAll(".btn-edit").forEach((btn) => {
        btn.onclick = async () => {
          const { id, nama, rank, discord } = btn.dataset;
          const { value: formValues } = await Swal.fire({
            title: "Edit Member Profile",
            background: "#2f3136",
            color: "#fff",
            html: `
                    <div style="text-align:left; font-size:0.8rem; color:#b9bbbe; margin-bottom:5px;">NAMA</div>
                    <input id="swal-nama" class="swal2-input" style="margin-top:0" value="${nama}">
                    <div style="text-align:left; font-size:0.8rem; color:#b9bbbe; margin-bottom:5px; margin-top:15px;">RANK</div>
                    <select id="swal-rank" class="swal2-input" style="margin-top:0">
                        <option value="Prospect" ${
                          rank === "Prospect" ? "selected" : ""
                        }>Prospect</option>
                        <option value="Tail Gunner" ${
                          rank === "Tail Gunner" ? "selected" : ""
                        }>Tail Gunner</option>
                        <option value="Life Member" ${
                          rank === "Life Member" ? "selected" : ""
                        }>Life Member</option>
                        <option value="High Rank" ${
                          rank === "High Rank" ? "selected" : ""
                        }>High Rank</option>
                    </select>
                    <div style="text-align:left; font-size:0.8rem; color:#b9bbbe; margin-bottom:5px; margin-top:15px;">DISCORD ID</div>
                    <input id="swal-discord" class="swal2-input" style="margin-top:0" value="${discord}">
                `,
            showCancelButton: true,
            confirmButtonColor: "#5865F2",
            preConfirm: () => ({
              nama: document.getElementById("swal-nama").value,
              rank: document.getElementById("swal-rank").value,
              discord_id: document.getElementById("swal-discord").value,
            }),
          });
          if (formValues) {
            await supabase.from("members").update(formValues).eq("id", id);
            loadMembers();
          }
        };
      });

      tableBody.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.onclick = async () => {
          const { isConfirmed } = await Swal.fire({
            title: "Hapus Member?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ed4245",
            background: "#2f3136",
            color: "#fff",
          });
          if (isConfirmed) {
            await supabase.from("members").delete().eq("id", btn.dataset.id);
            loadMembers();
          }
        };
      });
    };

    const renderPagination = (totalPages) => {
      const container = document.getElementById("memberPagination"); // Sesuaikan ID container-nya
      if (totalPages <= 1) {
        container.innerHTML = "";
        return;
      }

      const currentPage = st.currentPage; // 'st' adalah state (MembersPage.state)

      // Helper Styling (Sama dengan Stok Weapon)
      const baseStyle = `border:none; color:white; padding:8px 12px; margin:0 2px; border-radius:6px; cursor:pointer; font-size:0.85rem; transition:all 0.2s ease; display:flex; align-items:center; justify-content:center; min-width:35px;`;
      const activeStyle = `background: #5865F2; box-shadow: 0 4px 15px rgba(88, 101, 242, 0.3); border: 1px solid white;`;
      const inactiveStyle = `background: #4f545c;`;
      const navStyle = `background: #202225; color: #b9bbbe;`;

      // Logic Sliding Window (Maksimal 3 angka terlihat)
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages, start + 2);
      if (end - start < 2) start = Math.max(1, end - 2);

      let html = `<div style="display: flex; background: #23272a; padding: 5px; border-radius: 8px; border: 1px solid #36393f;">`;

      // Tombol First & Prev
      html += `
        <button class="pg-nav" data-page="1" title="First Page" ${
          currentPage === 1
            ? 'disabled style="' +
              baseStyle +
              navStyle +
              ' opacity:0.3; cursor:not-allowed;"'
            : 'style="' + baseStyle + navStyle + '"'
        }>
            <i class="fas fa-angles-left"></i>
        </button>
        <button class="pg-nav" data-page="${
          currentPage - 1
        }" title="Previous" ${
        currentPage === 1
          ? 'disabled style="' +
            baseStyle +
            navStyle +
            ' opacity:0.3; cursor:not-allowed;"'
          : 'style="' + baseStyle + navStyle + '"'
      }>
            <i class="fas fa-chevron-left"></i>
        </button>
        <div style="width: 1px; background: #36393f; margin: 0 5px;"></div>
    `;

      // Tombol Angka (1, 2, 3...)
      for (let i = start; i <= end; i++) {
        const isActive = i === currentPage;
        html += `
            <button class="pg-nav" data-page="${i}" 
                style="${baseStyle} ${isActive ? activeStyle : inactiveStyle}"
                onmouseover="this.style.filter='brightness(1.2)'" 
                onmouseout="this.style.filter='brightness(1)'">
                ${i}
            </button>
        `;
      }

      // Tombol Next & Last
      html += `
        <div style="width: 1px; background: #36393f; margin: 0 5px;"></div>
        <button class="pg-nav" data-page="${currentPage + 1}" title="Next" ${
        currentPage === totalPages
          ? 'disabled style="' +
            baseStyle +
            navStyle +
            ' opacity:0.3; cursor:not-allowed;"'
          : 'style="' + baseStyle + navStyle + '"'
      }>
            <i class="fas fa-chevron-right"></i>
        </button>
        <button class="pg-nav" data-page="${totalPages}" title="Last Page" ${
        currentPage === totalPages
          ? 'disabled style="' +
            baseStyle +
            navStyle +
            ' opacity:0.3; cursor:not-allowed;"'
          : 'style="' + baseStyle + navStyle + '"'
      }>
            <i class="fas fa-angles-right"></i>
        </button>
    </div>`;

      // Info Halaman di Samping
      html += `<span style="color: #b9bbbe; font-size: 0.75rem; margin-left: 15px;">Page <b>${currentPage}</b> of ${totalPages}</span>`;

      container.innerHTML = html;

      // Re-bind click event
      container.querySelectorAll(".pg-nav").forEach((btn) => {
        btn.onclick = () => {
          const target = parseInt(btn.dataset.page);
          if (
            target &&
            target !== currentPage &&
            target >= 1 &&
            target <= totalPages
          ) {
            st.currentPage = target;
            loadMembers(); // Ganti jadi loadStok() jika di halaman stok
          }
        };
      });
    };

    // Form Event
    document.getElementById("btnAddMember").onclick = async () => {
      const nama = document.getElementById("newMemberName").value;
      const rank = document.getElementById("newMemberRank").value;
      const discord_id = document.getElementById("newMemberDiscord").value;
      if (!nama) return Swal.fire("Error", "Nama wajib diisi!", "error");

      const { error } = await supabase
        .from("members")
        .insert([{ nama, rank, discord_id }]);
      if (!error) {
        document.getElementById("newMemberName").value = "";
        document.getElementById("newMemberDiscord").value = "";
        loadMembers();
      }
    };

    // Toolbar Events
    document.getElementById("memberSearch").oninput = (e) => {
      st.searchQuery = e.target.value;
      st.currentPage = 1;
      loadMembers();
    };
    document.getElementById("memberFilterRank").onchange = (e) => {
      st.rankFilter = e.target.value;
      st.currentPage = 1;
      loadMembers();
    };
    document.getElementById("sortMemName").onclick = () => {
      st.sortField = "nama";
      st.sortAsc = !st.sortAsc;
      loadMembers();
    };
    document.getElementById("sortMemRank").onclick = () => {
      st.sortField = "rank";
      st.sortAsc = !st.sortAsc;
      loadMembers();
    };

    loadMembers();
  },
};
