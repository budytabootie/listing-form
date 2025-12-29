/** @param {any} supabase */
export const KatalogPage = {
  state: {
    searchQuery: "",
    currentPage: 1,
    itemsPerPage: 8,
    isSaving: false, // Lock state saat proses database
    allData: [], // Cache data lokal untuk pencarian cepat
  },

  render: () => `
        <div class="header-container">
            <h2>Katalog Master Barang</h2>
            <p style="color: #b9bbbe; margin-top: -10px; font-size: 0.9rem;">Kelola daftar harga dan status ketersediaan barang organisasi.</p>
        </div>

        <div id="katStats" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px;"></div>
        
        <div style="background: #2f3136; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border-top: 4px solid #5865F2;">
            <h4 id="formTitle" style="margin-top:0; color:#fff; display:flex; align-items:center; gap:10px;">
                <i class="fas fa-box-open" style="color:#5865F2;"></i> Tambah Barang Baru
            </h4>
            <div style="display: grid; grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr auto; gap: 15px; align-items: end;">
                <div>
                    <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">NAMA BARANG</label>
                    <input type="text" id="katNama" placeholder="Micro SMG" style="background:#202225; border:1px solid #4f545c; color:white; width:100%; padding:8px; border-radius:4px;">
                </div>
                <div>
                    <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">JENIS</label>
                    <select id="katJenis" style="background:#202225; border:1px solid #4f545c; color:white; width:100%; padding:8px; border-radius:4px;">
                        <option value="Vest">Vest</option>
                        <option value="Ammo">Ammo</option>
                        <option value="Weapon">Weapon (Serialized)</option>
                        <option value="Attachment">Attachment</option>
                        <option value="Narkoba">Narkoba</option>
                    </select>
                </div>
                <div>
                    <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">HARGA ($)</label>
                    <input type="number" id="katHarga" placeholder="0" style="background:#202225; border:1px solid #4f545c; color:white; width:100%; padding:8px; border-radius:4px;">
                </div>
                <div>
                    <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">STATUS</label>
                    <select id="katStatus" style="background:#202225; border:1px solid #4f545c; color:white; width:100%; padding:8px; border-radius:4px;">
                        <option value="Ready">Ready</option>
                        <option value="Not Ready">Not Ready</option>
                    </select>
                </div>
                <button id="btnSaveKatalog" style="background:#5865F2; padding: 0 25px; font-weight:bold; height:40px; border:none; color:white; border-radius:4px; cursor:pointer;">SIMPAN</button>
            </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
             <h4 style="margin:0; color:#b9bbbe;">Daftar Katalog</h4>
             <div style="position:relative;">
                <i class="fas fa-search" style="position:absolute; left:12px; top:11px; color:#4f545c;"></i>
                <input type="text" id="katSearch" placeholder="Cari nama barang..." style="width: 280px; padding: 8px 15px 8px 35px; background:#202225; color:white; border-radius:20px; border:1px solid #4f545c;">
             </div>
        </div>

        <div style="background: #2f3136; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #40444b;">
            <table style="width: 100%; border-collapse: collapse; font-size:0.9rem;">
                <thead>
                    <tr style="background: #202225; text-align: left; color:#b9bbbe;">
                        <th style="padding: 18px;">NAMA BARANG</th>
                        <th style="padding: 18px;">JENIS</th>
                        <th style="padding: 18px;">HARGA SATUAN</th>
                        <th style="padding: 18px;">STATUS</th>
                        <th style="padding: 18px; text-align: center;">AKSI</th>
                    </tr>
                </thead>
                <tbody id="katalogTableBody"></tbody>
            </table>
        </div>

        <div id="katPagination" style="display: flex; justify-content: center; gap: 5px; margin-top: 25px; align-items: center;"></div>
    `,

  init: async (supabase, userData) => {
    const st = KatalogPage.state;
    const btnSave = document.getElementById("btnSaveKatalog");
    const inputNama = document.getElementById("katNama");
    const inputJenis = document.getElementById("katJenis");
    const inputHarga = document.getElementById("katHarga");
    const inputStatus = document.getElementById("katStatus");
    const tableBody = document.getElementById("katalogTableBody");
    const paginationContainer = document.getElementById("katPagination");

    const loadKatalog = async () => {
      const { data, error } = await supabase
        .from("katalog_barang")
        .select("*")
        .order("nama_barang");
      if (error) return;

      st.allData = data || [];
      refreshUI();
    };

    const refreshUI = () => {
      renderStats(st.allData);
      const filtered = st.allData.filter((i) =>
        i.nama_barang.toLowerCase().includes(st.searchQuery.toLowerCase())
      );

      const totalPages = Math.ceil(filtered.length / st.itemsPerPage) || 1;
      const paginated = filtered.slice(
        (st.currentPage - 1) * st.itemsPerPage,
        st.currentPage * st.itemsPerPage
      );

      renderTable(paginated);
      renderPagination(totalPages);
    };

    const renderStats = (data) => {
      const statsEl = document.getElementById("katStats");
      const types = ["Weapon", "Vest", "Ammo", "Narkoba"];
      const colors = ["#5865f2", "#43b581", "#faa61a", "#eb459e"];

      statsEl.innerHTML = types
        .map((t, idx) => {
          const count = data.filter((i) => i.jenis_barang === t).length;
          return `
                <div style="background:#2f3136; padding:15px; border-radius:10px; border-bottom:3px solid ${colors[idx]}">
                    <div style="font-size:0.7rem; color:#b9bbbe; text-transform:uppercase;">${t}</div>
                    <div style="font-size:1.5rem; font-weight:bold; color:#fff;">${count} <span style="font-size:0.8rem; color:#4f545c;">Items</span></div>
                </div>`;
        })
        .join("");
    };

    const renderTable = (data) => {
      tableBody.innerHTML = data
        .map(
          (item) => `
                <tr style="border-bottom: 1px solid #36393f;">
                    <td style="padding: 15px; font-weight:bold; color:#fff;">${
                      item.nama_barang
                    }</td>
                    <td style="padding: 15px;"><span style="background:#202225; padding:4px 10px; border-radius:4px; font-size:0.75rem; color:#b9bbbe;">${
                      item.jenis_barang
                    }</span></td>
                    <td style="padding: 15px; color:#43b581; font-weight:bold;">$${Number(
                      item.harga_satuan || 0
                    ).toLocaleString()}</td>
                    <td style="padding: 15px;">
                        <span style="color: ${
                          item.status === "Ready" ? "#43b581" : "#ed4245"
                        }; display:flex; align-items:center; gap:6px; font-weight:bold; font-size:0.8rem;">
                            <span style="width:8px; height:8px; border-radius:50%; background:currentColor;"></span> ${
                              item.status
                            }
                        </span>
                    </td>
                    <td style="padding: 15px; text-align: center;">
                        <button class="btn-edit-kat" data-id="${
                          item.id
                        }" style="background:#faa61a; padding:6px 12px; border:none; border-radius:4px; color:white; cursor:pointer; margin-right:5px;"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete-kat" data-id="${
                          item.id
                        }" data-nama="${
            item.nama_barang
          }" style="background:#ed4245; padding:6px 12px; border:none; border-radius:4px; color:white; cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`
        )
        .join("");
    };

    // --- EVENT DELEGATION FOR TABLE ACTIONS ---
    tableBody.onclick = async (e) => {
      const editBtn = e.target.closest(".btn-edit-kat");
      const deleteBtn = e.target.closest(".btn-delete-kat");

      if (editBtn) {
        const item = st.allData.find((i) => i.id == editBtn.dataset.id);
        if (item) {
          inputNama.value = item.nama_barang;
          inputJenis.value = item.jenis_barang;
          inputHarga.value = item.harga_satuan;
          inputStatus.value = item.status;
          btnSave.innerText = "UPDATE BARANG";
          btnSave.style.background = "#faa61a";
          btnSave.dataset.mode = "edit";
          btnSave.dataset.id = item.id;
          document.getElementById(
            "formTitle"
          ).innerHTML = `<i class="fas fa-edit" style="color:#faa61a;"></i> Edit Barang: ${item.nama_barang}`;
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }

      if (deleteBtn) {
        const { id, nama } = deleteBtn.dataset;
        const { isConfirmed } = await Swal.fire({
          title: "Hapus Barang?",
          text: `"${nama}" akan hilang dari katalog master.`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#ed4245",
          cancelButtonColor: "#4f545c",
          background: "#2f3136",
          color: "#fff",
        });
        if (isConfirmed) {
          const { error } = await supabase
            .from("katalog_barang")
            .delete()
            .eq("id", id);
          if (!error) {
            window.createAuditLog(
              "DELETE",
              "katalog_barang",
              `Menghapus item dari katalog: ${nama}`
            );
            loadKatalog();
          }
        }
      }
    };

    const renderPagination = (totalPages) => {
      if (totalPages <= 1) {
        paginationContainer.innerHTML = "";
        return;
      }
      const curr = st.currentPage;
      const baseBtn = `border:none; color:white; padding:8px 12px; margin:0 2px; border-radius:6px; cursor:pointer; font-size:0.8rem; transition:0.2s; display:flex; align-items:center; min-width:35px; justify-content:center;`;

      let start = Math.max(1, curr - 1);
      let end = Math.min(totalPages, start + 2);
      if (end - start < 2) start = Math.max(1, end - 2);

      let html = `<div style="display:flex; background:#23272a; padding:5px; border-radius:8px; border:1px solid #36393f;">`;
      html += `<button class="pg-nav" data-page="1" ${
        curr === 1
          ? 'disabled style="opacity:0.2;' + baseBtn + '"'
          : 'style="' + baseBtn + 'background:#202225;"'
      }><i class="fas fa-angles-left"></i></button>`;

      for (let i = start; i <= end; i++) {
        html += `<button class="pg-nav" data-page="${i}" style="${baseBtn} background:${
          i === curr ? "#5865F2" : "#4f545c"
        };">${i}</button>`;
      }

      html += `<button class="pg-nav" data-page="${totalPages}" ${
        curr === totalPages
          ? 'disabled style="opacity:0.2;' + baseBtn + '"'
          : 'style="' + baseBtn + 'background:#202225;"'
      }><i class="fas fa-angles-right"></i></button></div>`;

      paginationContainer.innerHTML = html;
    };

    // --- PAGINATION EVENT DELEGATION ---
    paginationContainer.onclick = (e) => {
      const btn = e.target.closest(".pg-nav");
      if (btn && !btn.disabled) {
        st.currentPage = parseInt(btn.dataset.page);
        refreshUI();
      }
    };

    // --- SAVE / UPDATE LOGIC ---
    btnSave.onclick = async () => {
      if (st.isSaving) return;

      const payload = {
        nama_barang: inputNama.value.trim(),
        jenis_barang: inputJenis.value,
        harga_satuan: parseFloat(inputHarga.value) || 0,
        status: inputStatus.value,
      };

      if (!payload.nama_barang)
        return Swal.fire("Error", "Nama barang wajib diisi!", "error");

      const isEdit = btnSave.dataset.mode === "edit";
      const { isConfirmed } = await Swal.fire({
        title: isEdit ? "Update Barang?" : "Simpan Barang?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: isEdit ? "#faa61a" : "#5865F2",
        cancelButtonColor: "#4f545c",
        background: "#2f3136",
        color: "#fff",
      });

      if (isConfirmed) {
        try {
          st.isSaving = true;
          btnSave.disabled = true;

          if (isEdit) {
            await supabase
              .from("katalog_barang")
              .update(payload)
              .eq("id", btnSave.dataset.id);
            window.createAuditLog(
              "UPDATE",
              "katalog_barang",
              `Update katalog: ${
                payload.nama_barang
              } ($${payload.harga_satuan.toLocaleString()})`
            );

            // Reset UI State
            btnSave.innerText = "SIMPAN";
            btnSave.style.background = "#5865F2";
            delete btnSave.dataset.mode;
            document.getElementById(
              "formTitle"
            ).innerHTML = `<i class="fas fa-box-open" style="color:#5865F2;"></i> Tambah Barang Baru`;
          } else {
            await supabase.from("katalog_barang").insert([payload]);
            window.createAuditLog(
              "CREATE",
              "katalog_barang",
              `Menambah item katalog: ${payload.nama_barang} (${payload.jenis_barang})`
            );
          }

          Swal.fire({
            title: "Berhasil",
            icon: "success",
            timer: 1000,
            showConfirmButton: false,
          });
          inputNama.value = "";
          inputHarga.value = "";
          loadKatalog();
        } catch (e) {
          Swal.fire("Error", e.message, "error");
        } finally {
          st.isSaving = false;
          btnSave.disabled = false;
        }
      }
    };

    document.getElementById("katSearch").oninput = (e) => {
      st.searchQuery = e.target.value;
      st.currentPage = 1;
      refreshUI();
    };

    loadKatalog();
  },
};
