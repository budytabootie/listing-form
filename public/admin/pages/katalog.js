/** @param {any} supabase */
export const KatalogPage = {
  state: {
    searchQuery: "",
    currentPage: 1,
    itemsPerPage: 8,
  },

  render: () => `
    <div class="header-container">
        <h2>Katalog Master Barang</h2>
    </div>

    <div id="katStats" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px;"></div>
    
    <div style="background: #2f3136; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border-top: 4px solid #5865F2;">
        <h4 id="formTitle" style="margin-top:0; color:#fff;">Tambah Barang Baru</h4>
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
            <button id="btnSaveKatalog" style="background:#5865F2; padding: 10px 25px; font-weight:bold; height:40px; border:none; color:white; border-radius:4px; cursor:pointer;">SIMPAN</button>
        </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
         <h4 style="margin:0; color:#b9bbbe;">Daftar Katalog</h4>
         <input type="text" id="katSearch" placeholder="Cari nama barang..." style="width: 280px; padding: 10px 15px; background:#202225; color:white; border-radius:20px; border:1px solid #4f545c;">
    </div>

    <div style="background: #2f3136; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
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

  init: async (supabase) => {
    const st = KatalogPage.state;
    const btnSave = document.getElementById("btnSaveKatalog");
    const inputNama = document.getElementById("katNama");
    const inputJenis = document.getElementById("katJenis");
    const inputHarga = document.getElementById("katHarga");
    const inputStatus = document.getElementById("katStatus");

    const loadKatalog = async () => {
      const { data, error } = await supabase
        .from("katalog_barang")
        .select("*")
        .order("nama_barang");
      if (error) return;

      renderStats(data);
      const filtered = data.filter((i) =>
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
      const count = (type) =>
        data.filter((i) => i.jenis_barang === type).length;
      const types = ["Weapon", "Vest", "Ammo", "Narkoba"];
      const colors = ["#5865f2", "#43b581", "#faa61a", "#eb459e"];

      statsEl.innerHTML = types
        .map(
          (t, idx) => `
            <div style="background:#2f3136; padding:15px; border-radius:10px; border-bottom:3px solid ${
              colors[idx]
            }">
                <div style="font-size:0.7rem; color:#b9bbbe; text-transform:uppercase;">${t}</div>
                <div style="font-size:1.5rem; font-weight:bold; color:#fff;">${count(
                  t
                )} <span style="font-size:0.8rem; color:#4f545c;">Items</span></div>
            </div>`
        )
        .join("");
    };

    const renderTable = (data) => {
      const tbody = document.getElementById("katalogTableBody");
      tbody.innerHTML = data
        .map(
          (item) => `
        <tr style="border-bottom: 1px solid #36393f; transition: 0.2s;" onmouseover="this.style.background='#36393f'" onmouseout="this.style.background='transparent'">
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
                <button class="btn-edit-kat" data-id="${item.id}" data-nama="${
            item.nama_barang
          }" data-jenis="${item.jenis_barang}" data-harga="${
            item.harga_satuan
          }" data-status="${item.status}" 
                    style="background:#faa61a; padding:6px 12px; font-size:0.75rem; margin-right:5px; border:none; border-radius:4px; color:white; cursor:pointer;"><i class="fas fa-edit"></i></button>
                <button class="btn-delete-kat" data-id="${
                  item.id
                }" style="background:#ed4245; padding:6px 12px; font-size:0.75rem; border:none; border-radius:4px; color:white; cursor:pointer;"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`
        )
        .join("");

      tbody.querySelectorAll(".btn-edit-kat").forEach((btn) => {
        btn.onclick = () => {
          inputNama.value = btn.dataset.nama;
          inputJenis.value = btn.dataset.jenis;
          inputHarga.value = btn.dataset.harga;
          inputStatus.value = btn.dataset.status;
          btnSave.innerText = "UPDATE BARANG";
          btnSave.style.background = "#faa61a";
          btnSave.dataset.mode = "edit";
          btnSave.dataset.id = btn.dataset.id;
          document.getElementById("formTitle").innerText =
            "Edit Barang: " + btn.dataset.nama;
          window.scrollTo({ top: 0, behavior: "smooth" });
        };
      });

      tbody.querySelectorAll(".btn-delete-kat").forEach((btn) => {
        btn.onclick = async () => {
          const { isConfirmed } = await Swal.fire({
            title: "Hapus Barang?",
            text: "Barang ini akan hilang dari Warehouse & Listing.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ed4245",
            cancelButtonColor: "#4f545c",
            background: "#2f3136",
            color: "#fff",
          });
          if (isConfirmed) {
            await supabase
              .from("katalog_barang")
              .delete()
              .eq("id", btn.dataset.id);
            loadKatalog();
          }
        };
      });
    };

    const renderPagination = (totalPages) => {
      const container = document.getElementById("katPagination");
      if (!container || totalPages <= 1) {
        if (container) container.innerHTML = "";
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
        const active = i === curr;
        html += `<button class="pg-nav" data-page="${i}" style="${baseBtn} background:${
          active ? "#5865F2" : "#4f545c"
        };">${i}</button>`;
      }
      html += `<button class="pg-nav" data-page="${totalPages}" ${
        curr === totalPages
          ? 'disabled style="opacity:0.2;' + baseBtn + '"'
          : 'style="' + baseBtn + 'background:#202225;"'
      }><i class="fas fa-angles-right"></i></button></div>`;
      container.innerHTML = html;
      container.querySelectorAll(".pg-nav").forEach((btn) => {
        btn.onclick = () => {
          st.currentPage = parseInt(btn.dataset.page);
          loadKatalog();
        };
      });
    };

    btnSave.onclick = async () => {
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
        text: isEdit
          ? "Pastikan data perubahan sudah benar."
          : "Tambahkan barang ini ke katalog?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: isEdit ? "#faa61a" : "#5865F2",
        cancelButtonColor: "#4f545c",
        background: "#2f3136",
        color: "#fff",
      });

      if (isConfirmed) {
        if (isEdit) {
          await supabase
            .from("katalog_barang")
            .update(payload)
            .eq("id", btnSave.dataset.id);
          delete btnSave.dataset.mode;
          btnSave.innerText = "SIMPAN";
          btnSave.style.background = "#5865F2";
          document.getElementById("formTitle").innerText = "Tambah Barang Baru";
        } else {
          await supabase.from("katalog_barang").insert([payload]);
        }

        Swal.fire({
          title: "Berhasil",
          text: isEdit ? "Data barang diupdate" : "Barang disimpan",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        inputNama.value = "";
        inputHarga.value = "";
        loadKatalog();
      }
    };

    document.getElementById("katSearch").oninput = (e) => {
      st.searchQuery = e.target.value;
      st.currentPage = 1;
      loadKatalog();
    };

    loadKatalog();
  },
};
