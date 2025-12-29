/** @param {any} supabase */
export const StokWeaponPage = {
  state: {
    searchQuery: "",
    statusFilter: "all",
    currentPage: 1,
    itemsPerPage: 10,
    sortField: "weapon_name",
    sortAsc: true,
    allData: [],
    listMembers: [],
    isProcessing: false,
  },

  render: () => `
        <div class="header-container">
            <h2>Weapon Warehouse (Serialized)</h2>
            <p style="color: #b9bbbe; margin-top: -10px; font-size: 0.9rem;">Manajemen nomor seri senjata, pemegang, dan kondisi unit.</p>
        </div>

        <div id="weaponSummary" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; margin-bottom: 25px;"></div>

        <div style="background: #2f3136; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border-top: 4px solid #5865F2;">
            <h4 style="margin-top:0; color:#fff;">Registrasi Senjata Baru</h4>
            <div style="display: grid; grid-template-columns: 1.5fr 1.5fr auto; gap: 15px; align-items: end; margin-top:15px;">
                <div>
                    <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">PILIH SENJATA (KATALOG)</label>
                    <select id="weapNameSelect" style="background:#202225; border:1px solid #4f545c; height:42px; color:white; width:100%; border-radius:5px; padding:0 10px;"></select>
                </div>
                <div>
                    <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">SERIAL NUMBER</label>
                    <input type="text" id="weapSN" placeholder="Contoh: SN-9901" style="background:#202225; border:1px solid #4f545c; height:42px; color:white; width:100%; border-radius:5px; padding:0 10px;">
                </div>
                <button id="btnSaveWeapon" style="background:#5865F2; padding: 0 30px; font-weight:bold; height:42px; border-radius:5px; border:none; color:white; cursor:pointer;">REGISTRASI</button>
            </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; gap: 15px;">
             <input type="text" id="weapSearch" placeholder="Cari Senjata, SN, atau Nama Pemegang..." style="flex: 2; padding: 12px; background:#202225; color:white; border-radius:8px; border:1px solid #4f545c; font-size:0.9rem;">
             <select id="weapFilterStatus" style="flex: 1; background:#202225; border:1px solid #4f545c; border-radius:8px; color:white; padding:10px;">
                <option value="all">Semua Kondisi</option>
                <option value="available">Tersedia di Gudang</option>
                <option value="in_use">Sedang Dipakai Member</option>
                <option value="broken">Bermasalah / Hilang / Disita</option>
             </select>
        </div>

        <div style="background: #2f3136; border-radius: 12px; overflow: hidden; border: 1px solid #40444b;">
            <table style="width: 100%; border-collapse: collapse; font-size:0.9rem;">
                <thead>
                    <tr style="background: #202225; text-align: left; color:#b9bbbe;">
                        <th style="padding: 18px; cursor: pointer;" class="sort-weap" data-field="weapon_name">NAMA ITEM <i class="fas fa-sort"></i></th>
                        <th style="padding: 18px; cursor: pointer;" class="sort-weap" data-field="serial_number">SN <i class="fas fa-sort"></i></th>
                        <th style="padding: 18px;">STATUS</th> 
                        <th style="padding: 18px; cursor: pointer;" class="sort-weap" data-field="hold_by">PEMEGANG <i class="fas fa-sort"></i></th> 
                        <th style="padding: 18px; text-align: center;">AKSI</th>
                    </tr>
                </thead>
                <tbody id="weaponTableBody"></tbody>
            </table>
        </div>
        <div id="weaponPagination" style="display: flex; justify-content: center; gap: 5px; margin-top: 25px; align-items: center;"></div>
    `,

  init: async (supabase) => {
    const st = StokWeaponPage.state;
    const tableBody = document.getElementById("weaponTableBody");
    const paginContainer = document.getElementById("weaponPagination");

    const loadInitialData = async () => {
      const { data: kat } = await supabase
        .from("katalog_barang")
        .select("nama_barang")
        .eq("jenis_barang", "Weapon")
        .order("nama_barang");
      const select = document.getElementById("weapNameSelect");
      if (select)
        select.innerHTML =
          kat
            ?.map(
              (w) =>
                `<option value="${w.nama_barang}">${w.nama_barang}</option>`
            )
            .join("") || "";
      const { data: mem } = await supabase
        .from("members")
        .select("nama")
        .order("nama");
      st.listMembers = mem || [];
    };

    const loadWeapons = async () => {
      const { data, error } = await supabase
        .from("inventory_weapons")
        .select("*");
      if (error) return;
      st.allData = data || [];
      refreshUI();
    };

    const refreshUI = () => {
      let filtered = st.allData.filter((item) => {
        const query = st.searchQuery.toLowerCase();

        // LOGIKA SEARCH BARU: Cek Senjata, SN, dan Holder
        const matchesSearch =
          item.weapon_name.toLowerCase().includes(query) ||
          item.serial_number.toLowerCase().includes(query) ||
          (item.hold_by && item.hold_by.toLowerCase().includes(query));

        const rawStatus = (item.status || "available").toLowerCase();
        const problemStatus = ["broken", "lost", "seized"].includes(rawStatus);
        let matchesFilter = true;

        if (st.statusFilter === "available") {
          matchesFilter = !problemStatus && !item.hold_by;
        } else if (st.statusFilter === "in_use") {
          matchesFilter = !!item.hold_by && !problemStatus;
        } else if (st.statusFilter === "broken") {
          matchesFilter = problemStatus;
        }
        return matchesSearch && matchesFilter;
      });

      // Sorting
      filtered.sort((a, b) => {
        let valA = (a[st.sortField] || "").toString().toLowerCase();
        let valB = (b[st.sortField] || "").toString().toLowerCase();
        return st.sortAsc ? (valA < valB ? -1 : 1) : valA > valB ? -1 : 1;
      });

      const totalPages = Math.ceil(filtered.length / st.itemsPerPage) || 1;
      const paginated = filtered.slice(
        (st.currentPage - 1) * st.itemsPerPage,
        st.currentPage * st.itemsPerPage
      );

      renderSummary(st.allData);
      renderTable(paginated);
      renderPagination(totalPages);
    };

    const renderSummary = (data) => {
      const summary = {};
      data.forEach((w) => {
        if (
          !w.hold_by &&
          (w.status || "available").toLowerCase() === "available"
        ) {
          summary[w.weapon_name] = (summary[w.weapon_name] || 0) + 1;
        }
      });
      const container = document.getElementById("weaponSummary");
      container.innerHTML = Object.entries(summary)
        .map(
          ([n, q]) => `
                <div style="background:#23272a; padding:12px; border-radius:10px; border-left:4px solid #5865F2; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.75rem; font-weight:bold; color:white;">${n}</span>
                    <span style="background:#5865F2; color:white; padding:2px 8px; border-radius:20px; font-size:0.7rem;">${q}</span>
                </div>
            `
        )
        .join("");
    };

    const renderTable = (items) => {
      tableBody.innerHTML = items
        .map((w) => {
          const rawStatus = (w.status || "available").toLowerCase();
          const isProblem = ["broken", "lost", "seized"].includes(rawStatus);
          const hasOwner = !!w.hold_by;

          let label = "AVAILABLE",
            color = "#43b581";
          if (isProblem) {
            label = rawStatus.toUpperCase();
            color = "#ed4245";
          } else if (hasOwner) {
            label = "IN USE";
            color = "#faa61a";
          }

          return `
                <tr style="border-bottom: 1px solid #36393f; transition: background 0.2s;" onmouseover="this.style.background='#32353b'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 15px; font-weight:bold; color:#fff;">${
                      w.weapon_name
                    }</td>
                    <td style="padding: 15px; color:#faa61a;"><code>${
                      w.serial_number
                    }</code></td>
                    <td style="padding: 15px;">
                        <span style="color:${color}; font-weight:bold; font-size:0.8rem; background:${color}22; padding:4px 8px; border-radius:4px; border:1px solid ${color}44;">${label}</span>
                    </td>
                    <td style="padding: 15px;">${
                      w.hold_by || '<span style="opacity:0.3;">Gudang</span>'
                    }</td>
                    <td style="padding: 15px; text-align: center;">
                        <button class="btn-edit-weap" data-id="${
                          w.id
                        }" style="background:#faa61a; border:none; color:white; padding:6px 12px; border-radius:4px; cursor:pointer;"><i class="fas fa-edit"></i></button>
                        <button class="btn-del-weap" data-id="${
                          w.id
                        }" style="background:#ed4245; border:none; color:white; padding:6px 12px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
        })
        .join("");
    };

    const renderPagination = (totalPages) => {
      if (totalPages <= 1) {
        paginContainer.innerHTML = "";
        return;
      }
      const curr = st.currentPage;

      const btnBase = `border:none; color:#dcddde; padding:8px 14px; margin:0 3px; border-radius:8px; cursor:pointer; font-size:0.85rem; font-weight:600; background:#4f545c; transition:all 0.2s ease; display:flex; align-items:center; justify-content:center;`;

      let html = `<div style="display:flex; align-items:center; background:#23272a; padding:6px; border-radius:12px; box-shadow:inset 0 2px 4px rgba(0,0,0,0.2);">`;

      // Prev
      html += `<button class="pg-weap" data-page="${curr - 1}" ${
        curr === 1 ? "disabled" : ""
      } style="${btnBase} ${
        curr === 1 ? "opacity:0.3; cursor:not-allowed;" : ""
      }"><i class="fas fa-chevron-left"></i></button>`;

      // Numbers
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= curr - 1 && i <= curr + 1)) {
          const isActive = i === curr;
          html += `<button class="pg-weap" data-page="${i}" style="${btnBase} ${
            isActive
              ? "background:#5865F2; color:white; box-shadow:0 4px 10px rgba(88,101,242,0.4);"
              : ""
          }">${i}</button>`;
        } else if (i === curr - 2 || i === curr + 2) {
          html += `<span style="color:#4f545c; padding:0 5px;">...</span>`;
        }
      }

      // Next
      html += `<button class="pg-weap" data-page="${curr + 1}" ${
        curr === totalPages ? "disabled" : ""
      } style="${btnBase} ${
        curr === totalPages ? "opacity:0.3; cursor:not-allowed;" : ""
      }"><i class="fas fa-chevron-right"></i></button>`;

      paginContainer.innerHTML = html + `</div>`;

      // Hover Effect
      paginContainer
        .querySelectorAll(".pg-weap:not([disabled])")
        .forEach((btn) => {
          btn.onmouseover = () => {
            if (!btn.style.background.includes("88,101,242"))
              btn.style.background = "#6d7178";
          };
          btn.onmouseout = () => {
            if (!btn.style.background.includes("88,101,242"))
              btn.style.background = "#4f545c";
          };
        });
    };

    paginContainer.onclick = (e) => {
      const btn = e.target.closest(".pg-weap");
      if (btn && !btn.hasAttribute("disabled")) {
        st.currentPage = parseInt(btn.dataset.page);
        refreshUI();
      }
    };

    tableBody.onclick = async (e) => {
      const editBtn = e.target.closest(".btn-edit-weap");
      const delBtn = e.target.closest(".btn-del-weap");
      if (editBtn) {
        const item = st.allData.find((i) => i.id == editBtn.dataset.id);
        const { value: res } = await Swal.fire({
          title: "Update Unit",
          background: "#2f3136",
          color: "#fff",
          html: `
            <div style="text-align:left; font-size:0.7rem; color:#b9bbbe; margin-bottom:5px; margin-left:10%;">PEMEGANG</div>
            <select id="sw-h" class="swal2-input" style="background:#202225; color:white; width:80%; margin-top:0;">
                <option value="">-- GUDANG --</option>
                ${st.listMembers
                  .map(
                    (m) =>
                      `<option value="${m.nama}" ${
                        item.hold_by === m.nama ? "selected" : ""
                      }>${m.nama}</option>`
                  )
                  .join("")}
            </select>
            <div style="text-align:left; font-size:0.7rem; color:#b9bbbe; margin-bottom:5px; margin-left:10%; margin-top:15px;">KONDISI</div>
            <select id="sw-s" class="swal2-input" style="background:#202225; color:white; width:80%; margin-top:0;">
                <option value="available" ${
                  item.status === "available" ? "selected" : ""
                }>Normal</option>
                <option value="broken" ${
                  item.status === "broken" ? "selected" : ""
                }>Rusak</option>
                <option value="lost" ${
                  item.status === "lost" ? "selected" : ""
                }>Hilang</option>
                <option value="seized" ${
                  item.status === "seized" ? "selected" : ""
                }>Disita</option>
            </select>`,
          preConfirm: () => ({
            hold_by: document.getElementById("sw-h").value || null,
            status: document.getElementById("sw-s").value,
          }),
        });
        if (res) {
          await supabase
            .from("inventory_weapons")
            .update(res)
            .eq("id", item.id);
          loadWeapons();
        }
      }
      if (
        delBtn &&
        (
          await Swal.fire({
            title: "Hapus Unit?",
            text: "Data SN akan dihapus permanen.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ed4245",
            background: "#2f3136",
            color: "#fff",
          })
        ).isConfirmed
      ) {
        await supabase
          .from("inventory_weapons")
          .delete()
          .eq("id", delBtn.dataset.id);
        loadWeapons();
      }
    };

    document.getElementById("btnSaveWeapon").onclick = async () => {
      const n = document.getElementById("weapNameSelect").value,
        s = document.getElementById("weapSN").value.trim().toUpperCase();
      if (!s || st.allData.some((w) => w.serial_number === s))
        return Swal.fire("Error", "SN Kosong atau Duplikat", "error");
      await supabase
        .from("inventory_weapons")
        .insert([{ weapon_name: n, serial_number: s, status: "available" }]);
      document.getElementById("weapSN").value = "";
      loadWeapons();
    };

    document.getElementById("weapSearch").oninput = (e) => {
      st.searchQuery = e.target.value;
      st.currentPage = 1;
      refreshUI();
    };
    document.getElementById("weapFilterStatus").onchange = (e) => {
      st.statusFilter = e.target.value;
      st.currentPage = 1;
      refreshUI();
    };
    document.querySelectorAll(".sort-weap").forEach(
      (th) =>
        (th.onclick = () => {
          st.sortField = th.dataset.field;
          st.sortAsc = !st.sortAsc;
          refreshUI();
        })
    );

    await loadInitialData();
    loadWeapons();
  },
};
