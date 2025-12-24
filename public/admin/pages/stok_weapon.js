/** @param {any} supabase */
export const StokWeaponPage = {
  state: {
    searchQuery: "",
    statusFilter: "all",
    currentPage: 1,
    itemsPerPage: 10,
    sortField: "weapon_name",
    sortAsc: true,
  },

  render: () => `
    <div class="header-container">
        <h2>Weapon Warehouse (Serialized)</h2>
    </div>

    <div id="weaponSummary" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; margin-bottom: 25px;"></div>

    <div style="background: #2f3136; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border-top: 4px solid #5865F2;">
        <h4 style="margin-top:0; color:#fff; display:flex; align-items:center; gap:10px;">
            <i class="fas fa-plus-circle" style="color:#5865F2;"></i> Registrasi Senjata Baru
        </h4>
        <div style="display: grid; grid-template-columns: 1.5fr 1.5fr auto; gap: 15px; align-items: end;">
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold; text-transform:uppercase;">Pilih Senjata</label>
                <select id="weapNameSelect" style="background:#202225; border:1px solid #4f545c; height:40px;"></select>
            </div>
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold; text-transform:uppercase;">Serial Number</label>
                <input type="text" id="weapSN" placeholder="SN-XXXX" style="background:#202225; border:1px solid #4f545c; height:40px;">
            </div>
            <button id="btnSaveWeapon" style="background:#5865F2; padding: 0 25px; font-weight:bold; height:40px;">TAMBAH KE GUDANG</button>
        </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; gap: 15px;">
         <div style="display: flex; gap: 10px; flex: 1;">
            <div style="position:relative; flex: 2;">
                <i class="fas fa-search" style="position:absolute; left:15px; top:12px; color:#4f545c;"></i>
                <input type="text" id="weapSearch" placeholder="Cari Nama atau SN..." 
                    style="width: 100%; padding: 10px 10px 10px 40px; background:#202225; color:white; border-radius:8px; border:1px solid #4f545c;">
            </div>
            <select id="weapFilterStatus" style="flex: 1; background:#202225; border:1px solid #4f545c; border-radius:8px;">
                <option value="all">Semua Status</option>
                <option value="available">Available (Di Gudang)</option>
                <option value="in_use">In Use (Dipakai)</option>
            </select>
         </div>
    </div>

    <div style="background: #2f3136; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid #40444b;">
        <table style="width: 100%; border-collapse: collapse; font-size:0.9rem;">
            <thead>
                <tr style="background: #202225; text-align: left; color:#b9bbbe;">
                    <th style="padding: 18px; cursor: pointer;" id="sortWeapon">NAMA SENJATA <i class="fas fa-sort fa-xs"></i></th>
                    <th style="padding: 18px; cursor: pointer;" id="sortSN">SERIAL NUMBER <i class="fas fa-sort fa-xs"></i></th>
                    <th style="padding: 18px;">STATUS</th> 
                    <th style="padding: 18px; cursor: pointer;" id="sortHold">PENANGGUNG JAWAB <i class="fas fa-sort fa-xs"></i></th> 
                    <th style="padding: 18px; text-align: center;">AKSI</th>
                </tr>
            </thead>
            <tbody id="weaponTableBody"></tbody>
        </table>
    </div>

    <div id="paginationContainer" style="display: flex; justify-content: center; gap: 5px; margin-top: 25px; align-items: center;"></div>
  `,

  init: async (supabase) => {
    const state = StokWeaponPage.state;

    const loadKatalog = async () => {
      const { data } = await supabase
        .from("katalog_barang")
        .select("nama_barang")
        .eq("jenis_barang", "Weapon");
      const select = document.getElementById("weapNameSelect");
      if (select && data) {
        select.innerHTML = data
          .map(
            (w) => `<option value="${w.nama_barang}">${w.nama_barang}</option>`
          )
          .join("");
      }
    };

    const loadWeapons = async () => {
      const { data } = await supabase.from("inventory_weapons").select("*");
      if (!data) return;

      let filteredData = data.filter((item) => {
        const matchesSearch =
          item.weapon_name
            .toLowerCase()
            .includes(state.searchQuery.toLowerCase()) ||
          item.serial_number
            .toLowerCase()
            .includes(state.searchQuery.toLowerCase());
        const matchesStatus =
          state.statusFilter === "all"
            ? true
            : state.statusFilter === "available"
            ? !item.hold_by
            : !!item.hold_by;
        return matchesSearch && matchesStatus;
      });

      filteredData.sort((a, b) => {
        let valA = (a[state.sortField] || "").toString().toLowerCase();
        let valB = (b[state.sortField] || "").toString().toLowerCase();
        if (valA < valB) return state.sortAsc ? -1 : 1;
        if (valA > valB) return state.sortAsc ? 1 : -1;
        return 0;
      });

      const totalPages =
        Math.ceil(filteredData.length / state.itemsPerPage) || 1;
      const paginatedData = filteredData.slice(
        (state.currentPage - 1) * state.itemsPerPage,
        state.currentPage * state.itemsPerPage
      );

      renderSummary(data);
      renderTable(paginatedData);
      renderPagination(totalPages);
    };

    const renderSummary = (allData) => {
      const summary = {};
      allData.forEach((w) => {
        if (!w.hold_by)
          summary[w.weapon_name] = (summary[w.weapon_name] || 0) + 1;
      });

      const container = document.getElementById("weaponSummary");
      const entries = Object.entries(summary);

      if (entries.length === 0) {
        container.innerHTML = `<div style="color:#72767d; font-style:italic; font-size:0.8rem;">Tidak ada stok tersedia di gudang...</div>`;
        return;
      }

      container.innerHTML = entries
        .map(
          ([n, q]) => `
          <div style="background:#23272a; padding:12px 15px; border-radius:10px; border-left:4px solid #5865F2; display:flex; justify-content:space-between; align-items:center; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
              <span style="font-size:0.8rem; font-weight:bold; color:#fff;">${n}</span>
              <span style="background:#5865F2; color:white; padding:2px 8px; border-radius:20px; font-size:0.75rem;">${q}</span>
          </div>
      `
        )
        .join("");
    };

    const renderTable = (items) => {
      const tableBody = document.getElementById("weaponTableBody");
      tableBody.innerHTML = items
        .map(
          (w) => `
        <tr style="border-bottom: 1px solid #36393f; transition: 0.2s;" onmouseover="this.style.background='#36393f'" onmouseout="this.style.background='transparent'">
            <td style="padding: 15px; font-weight:bold; color:#fff;">${
              w.weapon_name
            }</td>
            <td style="padding: 15px;"><code style="background:#202225; padding:3px 6px; border-radius:4px; color:#faa61a;">${
              w.serial_number
            }</code></td>
            <td style="padding: 15px;">
                <span style="color: ${
                  w.hold_by ? "#faa61a" : "#43b581"
                }; font-weight:bold; font-size:0.7rem; text-transform:uppercase; border:1px solid currentColor; padding:2px 8px; border-radius:20px; background:rgba(0,0,0,0.2);">
                    ${w.hold_by ? "In Use" : "Available"}
                </span>
            </td>
            <td style="padding: 15px; color: ${
              w.hold_by ? "#fff" : "#4f545c"
            };">
                ${
                  w.hold_by
                    ? `<i class="fas fa-user-shield" style="margin-right:8px; color:#5865F2;"></i>${w.hold_by}`
                    : `<span style="font-style:italic; font-size:0.8rem;">Gudang</span>`
                }
            </td>
            <td style="padding: 15px; text-align: center;">
                <button class="btn-edit-hold" data-id="${w.id}" data-current="${
            w.hold_by || ""
          }" style="background:#faa61a; padding:6px 12px; margin-right:5px;"><i class="fas fa-user-edit"></i></button>
                <button class="btn-del-weapon" data-id="${
                  w.id
                }" style="background:#ed4245; padding:6px 12px;"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`
        )
        .join("");
      attachTableListeners();
    };

    const renderPagination = (totalPages) => {
      const container = document.getElementById("paginationContainer");
      if (totalPages <= 1) {
        container.innerHTML = "";
        return;
      }

      const curr = state.currentPage;
      const baseBtn = `border:none; color:white; padding:8px 12px; margin:0 2px; border-radius:6px; cursor:pointer; font-size:0.8rem; transition:0.2s; display:flex; align-items:center; min-width:35px; justify-content:center;`;

      // Sliding Window
      let start = Math.max(1, curr - 1);
      let end = Math.min(totalPages, start + 2);
      if (end - start < 2) start = Math.max(1, end - 2);

      let html = `<div style="display:flex; background:#23272a; padding:5px; border-radius:8px; border:1px solid #36393f;">`;

      // First & Prev
      html += `
        <button class="pg-nav" data-page="1" ${
          curr === 1
            ? 'disabled style="opacity:0.2;' + baseBtn + '"'
            : 'style="' + baseBtn + 'background:#202225;"'
        }><i class="fas fa-angles-left"></i></button>
        <button class="pg-nav" data-page="${curr - 1}" ${
        curr === 1
          ? 'disabled style="opacity:0.2;' + baseBtn + '"'
          : 'style="' + baseBtn + 'background:#202225;"'
      }><i class="fas fa-chevron-left"></i></button>
      `;

      for (let i = start; i <= end; i++) {
        const active = i === curr;
        html += `<button class="pg-nav" data-page="${i}" style="${baseBtn} background:${
          active ? "#5865F2" : "#4f545c"
        }; ${
          active
            ? "box-shadow:0 4px 12px rgba(88,101,242,0.4); border:1px solid white;"
            : ""
        }">${i}</button>`;
      }

      html += `
        <button class="pg-nav" data-page="${curr + 1}" ${
        curr === totalPages
          ? 'disabled style="opacity:0.2;' + baseBtn + '"'
          : 'style="' + baseBtn + 'background:#202225;"'
      }><i class="fas fa-chevron-right"></i></button>
        <button class="pg-nav" data-page="${totalPages}" ${
        curr === totalPages
          ? 'disabled style="opacity:0.2;' + baseBtn + '"'
          : 'style="' + baseBtn + 'background:#202225;"'
      }><i class="fas fa-angles-right"></i></button>
      </div>`;

      container.innerHTML = html;
      container.querySelectorAll(".pg-nav").forEach((btn) => {
        btn.onclick = () => {
          state.currentPage = parseInt(btn.dataset.page);
          loadWeapons();
        };
      });
    };

    const attachTableListeners = () => {
      document.querySelectorAll(".btn-edit-hold").forEach((btn) => {
        btn.onclick = async () => {
          const { value: newHold } = await Swal.fire({
            title: "Update Pemegang Senjata",
            input: "text",
            inputPlaceholder: "Nama Member / Gudang",
            inputValue: btn.dataset.current,
            showCancelButton: true,
            background: "#2f3136",
            color: "#fff",
            confirmButtonColor: "#faa61a",
          });
          if (newHold !== undefined) {
            await supabase
              .from("inventory_weapons")
              .update({ hold_by: newHold.trim() || null })
              .eq("id", btn.dataset.id);
            loadWeapons();
          }
        };
      });

      document.querySelectorAll(".btn-del-weapon").forEach((btn) => {
        btn.onclick = async () => {
          const { isConfirmed } = await Swal.fire({
            title: "Hapus Weapon?",
            text: "Data SN akan hilang selamanya.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ed4245",
            background: "#2f3136",
            color: "#fff",
          });
          if (isConfirmed) {
            await supabase
              .from("inventory_weapons")
              .delete()
              .eq("id", btn.dataset.id);
            loadWeapons();
          }
        };
      });
    };

    // Toolbar Listeners
    document.getElementById("weapSearch").oninput = (e) => {
      state.searchQuery = e.target.value;
      state.currentPage = 1;
      loadWeapons();
    };
    document.getElementById("weapFilterStatus").onchange = (e) => {
      state.statusFilter = e.target.value;
      state.currentPage = 1;
      loadWeapons();
    };

    // Sort Listeners
    const setSort = (field) => {
      if (state.sortField === field) state.sortAsc = !state.sortAsc;
      else {
        state.sortField = field;
        state.sortAsc = true;
      }
      loadWeapons();
    };
    document.getElementById("sortWeapon").onclick = () =>
      setSort("weapon_name");
    document.getElementById("sortSN").onclick = () => setSort("serial_number");
    document.getElementById("sortHold").onclick = () => setSort("hold_by");

    document.getElementById("btnSaveWeapon").onclick = async () => {
      const name = document.getElementById("weapNameSelect").value;
      const sn = document.getElementById("weapSN").value;
      if (!sn) return Swal.fire("Error", "Serial Number wajib diisi!", "error");

      await supabase
        .from("inventory_weapons")
        .insert([{ weapon_name: name, serial_number: sn }]);
      document.getElementById("weapSN").value = "";
      Swal.fire({
        icon: "success",
        title: "Weapon Registered",
        timer: 1000,
        showConfirmButton: false,
      });
      loadWeapons();
    };

    await loadKatalog();
    await loadWeapons();
  },
};
