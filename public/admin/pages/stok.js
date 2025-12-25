/** @param {any} supabase */
export const StokPage = {
  state: {
    searchQuery: "",
    currentPage: 1,
    itemsPerPage: 10,
    sortField: "item_name",
    sortAsc: true,
  },

  render: () => `
    <div class="header-container">
        <h2>Warehouse Inventory</h2>
    </div>

    <div id="invStats" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px;"></div>

    <div style="background: #2f3136; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); border-top: 4px solid #43b581;">
        <h4 id="formTitle" style="margin-top:0; color:#fff;">Update / Tambah Barang</h4>
        <div style="display: grid; grid-template-columns: 2fr 1.5fr auto; gap: 15px; align-items: end;">
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">PILIH BARANG (KATALOG)</label>
                <select id="itemNameSelection" style="background:#202225; border:1px solid #4f545c; height:42px; width:100%; color:white; padding:0 10px; border-radius:5px;"></select>
            </div>
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; font-weight:bold;">JUMLAH STOK</label>
                <input type="number" id="itemQty" placeholder="0" style="background:#202225; border:1px solid #4f545c; height:42px; width:100%; color:white; padding:0 10px; border-radius:5px;">
            </div>
            <button id="btnSaveStok" style="background:#43b581; padding: 0 30px; font-weight:bold; height:42px; color:white; border:none; border-radius:5px; cursor:pointer;">SIMPAN</button>
        </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; gap: 15px;">
         <div style="position:relative; flex: 1;">
            <i class="fas fa-search" style="position:absolute; left:15px; top:12px; color:#4f545c;"></i>
            <input type="text" id="invSearch" placeholder="Cari nama barang..." 
                style="width: 100%; padding: 10px 10px 10px 40px; background:#202225; color:white; border-radius:8px; border:1px solid #4f545c;">
         </div>
         <select id="invFilterStock" style="width: 200px; background:#202225; border:1px solid #4f545c; border-radius:8px; color:white; padding:10px;">
            <option value="all">Semua Stok</option>
            <option value="low">Stok Menipis (<=5)</option>
            <option value="healthy">Stok Aman (>5)</option>
         </select>
    </div>

    <div style="background: #2f3136; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
        <table style="width: 100%; border-collapse: collapse; font-size:0.9rem;">
            <thead>
                <tr style="background: #202225; text-align: left; color:#b9bbbe;">
                    <th style="padding: 18px; cursor:pointer;" id="sortItemName">NAMA ITEM <i class="fas fa-sort"></i></th>
                    <th style="padding: 18px; cursor:pointer;" id="sortItemQty">JUMLAH <i class="fas fa-sort"></i></th>
                    <th style="padding: 18px;">STATUS</th>
                    <th style="padding: 18px; text-align: center;">AKSI</th>
                </tr>
            </thead>
            <tbody id="stokTableBody"></tbody>
        </table>
    </div>

    <div id="stokPagination" style="display: flex; justify-content: center; gap: 5px; margin-top: 25px; align-items: center;"></div>
  `,

  init: async (supabase) => {
    const st = StokPage.state;
    const selectDropdown = document.getElementById("itemNameSelection");
    const tableBody = document.getElementById("stokTableBody");
    const btnSave = document.getElementById("btnSaveStok");
    const inputQty = document.getElementById("itemQty");

    const loadKatalogDropdown = async () => {
      const { data } = await supabase
        .from("katalog_barang")
        .select("nama_barang")
        .neq("jenis_barang", "Weapon")
        .order("nama_barang");
      if (selectDropdown) {
        selectDropdown.innerHTML =
          `<option value="" disabled selected>Pilih Barang...</option>` +
          (data || [])
            .map(
              (k) =>
                `<option value="${k.nama_barang}">${k.nama_barang}</option>`
            )
            .join("");
      }
    };

    const loadStok = async () => {
      const { data, error } = await supabase.from("inventory").select("*");
      if (error) return;

      let filtered = data.filter((i) => {
        const matchesSearch = i.item_name
          .toLowerCase()
          .includes(st.searchQuery.toLowerCase());
        const filterVal = document.getElementById("invFilterStock").value;
        const matchesFilter =
          filterVal === "all"
            ? true
            : filterVal === "low"
            ? i.stock <= 5
            : i.stock > 5;
        return matchesSearch && matchesFilter;
      });

      filtered.sort((a, b) => {
        let valA = a[st.sortField];
        let valB = b[st.sortField];
        if (typeof valA === "string") {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
        if (valA < valB) return st.sortAsc ? -1 : 1;
        if (valA > valB) return st.sortAsc ? 1 : -1;
        return 0;
      });

      const totalPages = Math.ceil(filtered.length / st.itemsPerPage) || 1;
      const paginated = filtered.slice(
        (st.currentPage - 1) * st.itemsPerPage,
        st.currentPage * st.itemsPerPage
      );

      renderStats(data);
      renderTable(paginated);
      renderPagination(totalPages);
    };

    const renderStats = (data) => {
      const low = data.filter((i) => i.stock <= 5).length;
      document.getElementById("invStats").innerHTML = `
            <div style="background:#23272a; padding:15px; border-radius:10px; border-bottom:3px solid #5865F2;">
                <div style="font-size:0.7rem; color:#b9bbbe; text-transform:uppercase;">Total Jenis Barang</div>
                <div style="font-size:1.5rem; font-weight:bold; color:white;">${
                  data.length
                }</div>
            </div>
            <div style="background:#23272a; padding:15px; border-radius:10px; border-bottom:3px solid ${
              low > 0 ? "#ed4245" : "#43b581"
            };">
                <div style="font-size:0.7rem; color:#b9bbbe; text-transform:uppercase;">Stok Kritis (<=5)</div>
                <div style="font-size:1.5rem; font-weight:bold; color:${
                  low > 0 ? "#ed4245" : "#fff"
                };">${low}</div>
            </div>`;
    };

    const renderTable = (items) => {
      tableBody.innerHTML = items
        .map(
          (item) => `
        <tr style="border-bottom: 1px solid #36393f; transition:0.2s;" onmouseover="this.style.background='#36393f'" onmouseout="this.style.background='transparent'">
            <td style="padding: 15px; font-weight:bold; color:#fff;">${
              item.item_name
            }</td>
            <td style="padding: 15px; font-weight:bold; font-size:1.1rem; color:${
              item.stock <= 5 ? "#ed4245" : "#43b581"
            };">${
            item.stock
          } <span style="font-size:0.8rem; color:#4f545c;">unit</span></td>
            <td style="padding: 15px;"><span style="background:${
              item.stock <= 5 ? "rgba(237,66,69,0.1)" : "rgba(67,181,129,0.1)"
            }; color:${
            item.stock <= 5 ? "#ed4245" : "#43b581"
          }; padding:4px 10px; border-radius:4px; font-size:0.7rem; font-weight:bold; border:1px solid currentColor;">${
            item.stock <= 5 ? "LOW" : "STABLE"
          }</span></td>
            <td style="padding: 15px; text-align: center;">
                <button class="btn-edit-stok" data-id="${item.id}" data-name="${
            item.item_name
          }" data-stock="${
            item.stock
          }" style="background:#5865F2; padding:6px 12px; margin-right:5px; border:none; border-radius:4px; color:white; cursor:pointer;"><i class="fas fa-edit"></i></button>
                <button class="btn-delete-stok" data-id="${
                  item.id
                }" style="background:#ed4245; padding:6px 12px; border:none; border-radius:4px; color:white; cursor:pointer;"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`
        )
        .join("");

      tableBody.querySelectorAll(".btn-delete-stok").forEach((btn) => {
        btn.onclick = async () => {
          const { isConfirmed } = await Swal.fire({
            title: "Hapus Barang?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ed4245",
            background: "#2f3136",
            color: "#fff",
          });
          if (isConfirmed) {
            await supabase.from("inventory").delete().eq("id", btn.dataset.id);
            loadStok();
          }
        };
      });

      tableBody.querySelectorAll(".btn-edit-stok").forEach((btn) => {
        btn.onclick = () => {
          selectDropdown.value = btn.dataset.name;
          inputQty.value = btn.dataset.stock;
          btnSave.innerText = "UPDATE";
          btnSave.style.background = "#faa61a";
          btnSave.dataset.mode = "edit";
          btnSave.dataset.id = btn.dataset.id;
          window.scrollTo({ top: 0, behavior: "smooth" });
        };
      });
    };

    const renderPagination = (totalPages) => {
      const container = document.getElementById("stokPagination");
      if (totalPages <= 1) {
        container.innerHTML = "";
        return;
      }
      const curr = st.currentPage;
      const baseBtn = `border:none; color:white; padding:8px 12px; margin:0 2px; border-radius:6px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; min-width:35px; justify-content:center;`;
      let start = Math.max(1, curr - 1);
      let end = Math.min(totalPages, start + 2);
      if (end - start < 2) start = Math.max(1, end - 2);
      let html = `<div style="display:flex; background:#23272a; padding:5px; border-radius:8px;">`;
      html += `<button class="pg-nav" data-page="1" ${
        curr === 1
          ? 'disabled style="opacity:0.2;' + baseBtn + '"'
          : 'style="' + baseBtn + 'background:#202225;"'
      }><i class="fas fa-angles-left"></i></button>`;
      for (let i = start; i <= end; i++) {
        html += `<button class="pg-nav" data-page="${i}" style="${baseBtn} background:${
          i === curr ? "#43b581" : "#4f545c"
        };">${i}</button>`;
      }
      html += `<button class="pg-nav" data-page="${totalPages}" ${
        curr === totalPages
          ? 'disabled style="opacity:0.2;' + baseBtn + '"'
          : 'style="' + baseBtn + 'background:#202225;"'
      }><i class="fas fa-angles-right"></i></button></div>`;
      container.innerHTML = html;
      container.querySelectorAll(".pg-nav").forEach(
        (btn) =>
          (btn.onclick = () => {
            st.currentPage = parseInt(btn.dataset.page);
            loadStok();
          })
      );
    };

    btnSave.onclick = async () => {
      const name = selectDropdown.value;
      const stock = parseInt(inputQty.value);
      if (!name || isNaN(stock))
        return Swal.fire("Error", "Lengkapi data!", "error");

      const { isConfirmed } = await Swal.fire({
        title: "Konfirmasi Simpan",
        html: `Apakah data <b>${name}</b> sejumlah <b>${stock} unit</b> sudah benar?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Simpan",
        background: "#2f3136",
        color: "#fff",
      });

      if (!isConfirmed) return;

      if (btnSave.dataset.mode === "edit") {
        await supabase
          .from("inventory")
          .update({ item_name: name, stock })
          .eq("id", btnSave.dataset.id);
        delete btnSave.dataset.mode;
        btnSave.innerText = "SIMPAN";
        btnSave.style.background = "#43b581";
      } else {
        const { data: existing } = await supabase
          .from("inventory")
          .select("*")
          .eq("item_name", name)
          .single();
        if (existing)
          await supabase
            .from("inventory")
            .update({ stock: existing.stock + stock })
            .eq("id", existing.id);
        else
          await supabase.from("inventory").insert([{ item_name: name, stock }]);
      }
      inputQty.value = "";
      loadStok();
      Swal.fire({
        icon: "success",
        title: "Tersimpan!",
        timer: 1000,
        showConfirmButton: false,
      });
    };

    document.getElementById("invSearch").oninput = (e) => {
      st.searchQuery = e.target.value;
      st.currentPage = 1;
      loadStok();
    };
    document.getElementById("invFilterStock").onchange = () => {
      st.currentPage = 1;
      loadStok();
    };
    document.getElementById("sortItemName").onclick = () => {
      st.sortField = "item_name";
      st.sortAsc = !st.sortAsc;
      loadStok();
    };
    document.getElementById("sortItemQty").onclick = () => {
      st.sortField = "stock";
      st.sortAsc = !st.sortAsc;
      loadStok();
    };

    await loadKatalogDropdown();
    loadStok();
  },
};
