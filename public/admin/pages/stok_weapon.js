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
         <input type="text" id="weapSearch" placeholder="Cari Nama Senjata atau SN..." style="flex: 2; padding: 10px; background:#202225; color:white; border-radius:8px; border:1px solid #4f545c;">
         <select id="weapFilterStatus" style="flex: 1; background:#202225; border:1px solid #4f545c; border-radius:8px; color:white; padding:10px;">
            <option value="all">Semua Kondisi</option>
            <option value="available">Tersedia di Gudang</option>
            <option value="in_use">Sedang Dipakai Member</option>
            <option value="broken">Bermasalah</option>
         </select>
    </div>

    <div style="background: #2f3136; border-radius: 12px; overflow: hidden; border: 1px solid #40444b;">
        <table style="width: 100%; border-collapse: collapse; font-size:0.9rem;">
            <thead>
                <tr style="background: #202225; text-align: left; color:#b9bbbe;">
                    <th style="padding: 18px; cursor: pointer;" id="sortWeapon">NAMA ITEM <i class="fas fa-sort"></i></th>
                    <th style="padding: 18px; cursor: pointer;" id="sortSN">SN <i class="fas fa-sort"></i></th>
                    <th style="padding: 18px;">STATUS</th> 
                    <th style="padding: 18px; cursor: pointer;" id="sortHold">PEMEGANG <i class="fas fa-sort"></i></th> 
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
    let listMembers = [];

    const loadDataInitial = async () => {
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
      listMembers = mem || [];
    };

    const loadWeapons = async () => {
      const { data, error } = await supabase
        .from("inventory_weapons")
        .select("*");
      if (error) return;

      let filtered = data.filter((item) => {
        const query = st.searchQuery.toLowerCase();
        const matchesSearch =
          item.weapon_name.toLowerCase().includes(query) ||
          item.serial_number.toLowerCase().includes(query) ||
          (item.hold_by && item.hold_by.toLowerCase().includes(query));
        const currentStatus = item.status || "available";
        let matchesFilter = true;
        if (st.statusFilter === "available")
          matchesFilter = currentStatus === "available" && !item.hold_by;
        else if (st.statusFilter === "in_use") matchesFilter = !!item.hold_by;
        else if (st.statusFilter === "broken")
          matchesFilter = ["broken", "lost", "seized"].includes(currentStatus);
        return matchesSearch && matchesFilter;
      });

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

      renderSummary(data);
      renderTable(paginated);
      renderPagination(totalPages);
    };

    const renderSummary = (allData) => {
      const summary = {};
      allData.forEach((w) => {
        if (!w.hold_by && w.status === "available")
          summary[w.weapon_name] = (summary[w.weapon_name] || 0) + 1;
      });
      const container = document.getElementById("weaponSummary");
      container.innerHTML = Object.entries(summary)
        .map(
          ([n, q]) => `
        <div style="background:#23272a; padding:12px; border-radius:10px; border-left:4px solid #5865F2; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.75rem; font-weight:bold; color:white;">${n}</span>
          <span style="background:#5865F2; color:white; padding:2px 8px; border-radius:20px; font-size:0.7rem;">${q}</span>
        </div>`
        )
        .join("");
    };

    const renderTable = (items) => {
      const tableBody = document.getElementById("weaponTableBody");
      tableBody.innerHTML = items
        .map(
          (w) => `
        <tr style="border-bottom: 1px solid #36393f;">
            <td style="padding: 15px; font-weight:bold; color:#fff;">${
              w.weapon_name
            }</td>
            <td style="padding: 15px; color:#faa61a;"><code>${
              w.serial_number
            }</code></td>
            <td style="padding: 15px;">${
              w.hold_by ? "IN USE" : (w.status || "GUDANG").toUpperCase()
            }</td>
            <td style="padding: 15px;">${
              w.hold_by || '<span style="opacity:0.3;">Gudang</span>'
            }</td>
            <td style="padding: 15px; text-align: center;">
                <button class="btn-edit-weap" data-id="${w.id}" data-hold="${
            w.hold_by || ""
          }" style="background:#faa61a; padding:6px 12px; border-radius:4px; border:none; color:white; cursor:pointer;"><i class="fas fa-edit"></i></button>
                <button class="btn-del-weap" data-id="${
                  w.id
                }" style="background:#ed4245; padding:6px 12px; border-radius:4px; border:none; color:white; cursor:pointer;"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`
        )
        .join("");

      tableBody.querySelectorAll(".btn-edit-weap").forEach((btn) => {
        btn.onclick = async () => {
          const { value: formValues } = await Swal.fire({
            title: "Update Weapon",
            background: "#2f3136",
            color: "#fff",
            html: `<select id="swal-hold" class="swal2-input" style="background:#202225; color:white;"><option value="">-- GUDANG --</option>${listMembers
              .map(
                (m) =>
                  `<option value="${m.nama}" ${
                    btn.dataset.hold === m.nama ? "selected" : ""
                  }>${m.nama}</option>`
              )
              .join("")}</select>`,
            preConfirm: () => ({
              hold_by: document.getElementById("swal-hold").value || null,
              status: document.getElementById("swal-hold").value
                ? "in_use"
                : "available",
            }),
          });
          if (formValues) {
            const { isConfirmed } = await Swal.fire({
              title: "Konfirmasi Update?",
              icon: "question",
              showCancelButton: true,
              background: "#2f3136",
              color: "#fff",
            });
            if (isConfirmed) {
              await supabase
                .from("inventory_weapons")
                .update(formValues)
                .eq("id", btn.dataset.id);
              loadWeapons();
            }
          }
        };
      });

      tableBody.querySelectorAll(".btn-del-weap").forEach((btn) => {
        btn.onclick = async () => {
          const { isConfirmed } = await Swal.fire({
            title: "Hapus Unit?",
            icon: "warning",
            showCancelButton: true,
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

    const renderPagination = (totalPages) => {
      const container = document.getElementById("weaponPagination");
      if (totalPages <= 1) {
        container.innerHTML = "";
        return;
      }
      const curr = st.currentPage;
      const baseBtn = `border:none; color:white; padding:8px 12px; margin:0 2px; border-radius:6px; cursor:pointer; font-size:0.8rem;`;
      container.innerHTML = `<div style="display:flex; background:#23272a; padding:5px; border-radius:8px;">
        <button class="pg-nav" data-page="1" style="${baseBtn} background:#202225;"><i class="fas fa-angles-left"></i></button>
        <button class="pg-nav" data-page="${totalPages}" style="${baseBtn} background:#202225;"><i class="fas fa-angles-right"></i></button>
      </div>`;
      container.querySelectorAll(".pg-nav").forEach(
        (btn) =>
          (btn.onclick = () => {
            st.currentPage = parseInt(btn.dataset.page);
            loadWeapons();
          })
      );
    };

    document.getElementById("btnSaveWeapon").onclick = async () => {
      const name = document.getElementById("weapNameSelect").value;
      const sn = document.getElementById("weapSN").value.trim().toUpperCase();
      if (!sn) return Swal.fire("Error", "SN wajib diisi!", "error");

      const { isConfirmed } = await Swal.fire({
        title: "Registrasi SN Baru?",
        html: `Unit: <b>${name}</b><br>SN: <b>${sn}</b>`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, Daftar",
        background: "#2f3136",
        color: "#fff",
      });

      if (isConfirmed) {
        await supabase
          .from("inventory_weapons")
          .insert([
            { weapon_name: name, serial_number: sn, status: "available" },
          ]);
        document.getElementById("weapSN").value = "";
        loadWeapons();
        Swal.fire({
          icon: "success",
          title: "Terdaftar!",
          timer: 1000,
          showConfirmButton: false,
        });
      }
    };

    document.getElementById("weapSearch").oninput = (e) => {
      st.searchQuery = e.target.value;
      st.currentPage = 1;
      loadWeapons();
    };
    document.getElementById("weapFilterStatus").onchange = (e) => {
      st.statusFilter = e.target.value;
      st.currentPage = 1;
      loadWeapons();
    };

    await loadDataInitial();
    loadWeapons();
  },
};
