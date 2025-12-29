/** @param {any} supabase */
export const BundlePage = {
  state: {
    paket: { searchQuery: "", currentPage: 1, itemsPerPage: 5 },
    resep: { searchQuery: "", currentPage: 1, itemsPerPage: 5 },
    searchTimeout: null,
  },

  render: () => `
    <div class="header-container">
        <h2>Bundle Management</h2>
    </div>
    <div style="background: #2f3136; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
        <h4 style="margin-top:0; color:#fff; display:flex; align-items:center; gap:10px;">
            <i class="fas fa-box-open" style="color:#5865F2;"></i> Buat / Edit Paket Master
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr 2fr auto; gap: 15px; align-items: end; margin-bottom:30px;">
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; text-transform:uppercase; font-weight:bold;">Nama Paket</label>
                <input type="text" id="pkgName" placeholder="Contoh: Paket Hemat A" style="background:#202225; border:1px solid #4f545c; color:white; width:100%; padding:8px; border-radius:4px;">
            </div>
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; text-transform:uppercase; font-weight:bold;">Harga ($)</label>
                <input type="number" id="pkgPrice" placeholder="21000" style="background:#202225; border:1px solid #4f545c; color:white; width:100%; padding:8px; border-radius:4px;">
            </div>
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; text-transform:uppercase; font-weight:bold;">Deskripsi Isi</label>
                <input type="text" id="pkgDesc" placeholder="Vest, Ammo, dll..." style="background:#202225; border:1px solid #4f545c; color:white; width:100%; padding:8px; border-radius:4px;">
            </div>
            <button id="btnSavePkg" style="background:#5865F2; padding: 10px 25px; font-weight:bold; height:40px; border:none; color:white; border-radius:4px; cursor:pointer;">SIMPAN</button>
        </div>
        <div style="height: 1px; background: linear-gradient(90deg, #5865F2, transparent); margin-bottom: 20px;"></div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
             <h4 style="margin:0">Daftar Paket</h4>
             <input type="text" id="pkgSearch" placeholder="Cari paket..." style="width: 250px; padding: 8px 15px; background:#202225; color:white; border-radius:20px; border:1px solid #4f545c;">
        </div>
        <div style="background:#202225; border-radius:8px; overflow:hidden;">
            <table style="width:100%; border-collapse: collapse; font-size:0.85rem;">
                <thead>
                    <tr style="background:#2f3136; text-align:left; color:#b9bbbe;">
                        <th style="padding:15px;">NAMA PAKET</th>
                        <th style="padding:15px;">HARGA</th>
                        <th style="padding:15px;">DESKRIPSI</th>
                        <th style="padding:15px;">STATUS</th>
                        <th style="padding:15px; text-align:center;">AKSI</th>
                    </tr>
                </thead>
                <tbody id="pkgListTableBody"></tbody>
            </table>
        </div>
        <div id="pkgPagination" style="display: flex; justify-content: center; gap: 5px; margin-top: 20px; align-items: center;"></div>
    </div>
    <div style="background: #2f3136; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
        <h4 style="margin-top:0; color:#fff; display:flex; align-items:center; gap:10px;">
            <i class="fas fa-scroll" style="color:#43b581;"></i> Isi Item (Resep Potong Stok)
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 15px; align-items: end; margin-bottom:30px;">
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; text-transform:uppercase; font-weight:bold;">Pilih Paket</label>
                <select id="resPkg" style="background:#202225; border:1px solid #4f545c; color:white; padding:8px; border-radius:4px; width:100%;"></select>
            </div>
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; text-transform:uppercase; font-weight:bold;">Pilih Barang</label>
                <select id="resItem" style="background:#202225; border:1px solid #4f545c; color:white; padding:8px; border-radius:4px; width:100%;"></select>
            </div>
            <div>
                <label style="font-size:0.75rem; color:#b9bbbe; text-transform:uppercase; font-weight:bold;">Qty</label>
                <input type="number" id="resQty" value="1" style="background:#202225; border:1px solid #4f545c; color:white; padding:8px; border-radius:4px; width:100%;">
            </div>
            <button id="btnAddRes" style="background:#43b581; padding: 10px 25px; font-weight:bold; height:40px; border:none; color:white; border-radius:4px; cursor:pointer;">TAMBAH</button>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
             <h4 style="margin:0">Daftar Resep</h4>
             <input type="text" id="resSearch" placeholder="Cari paket/item..." style="width: 250px; padding: 8px 15px; background:#202225; color:white; border-radius:20px; border:1px solid #4f545c;">
        </div>
        <div style="background:#202225; border-radius:8px; overflow:hidden;">
            <table style="width:100%; border-collapse: collapse; font-size:0.85rem;">
                <thead>
                    <tr style="background:#2f3136; text-align:left; color:#b9bbbe;">
                        <th style="padding:15px;">NAMA PAKET</th>
                        <th style="padding:15px;">ITEM STOK</th>
                        <th style="padding:15px;">QTY POTONG</th>
                        <th style="padding:15px; text-align:center;">AKSI</th>
                    </tr>
                </thead>
                <tbody id="resTableBody"></tbody>
            </table>
        </div>
        <div id="resPagination" style="display: flex; justify-content: center; gap: 5px; margin-top: 20px; align-items: center;"></div>
    </div>
  `,

  init: async (supabase, userData) => {
    // PROTEKSI: Jika userData null, jangan jalankan kode di bawahnya
    if (!userData) return;

    const st = BundlePage.state;
    const els = {
      pkgBody: document.getElementById("pkgListTableBody"),
      resBody: document.getElementById("resTableBody"),
      resPkg: document.getElementById("resPkg"),
      resItem: document.getElementById("resItem"),
      pkgSearch: document.getElementById("pkgSearch"),
      resSearch: document.getElementById("resSearch"),
    };

    const renderAestheticPagination = (id, totalPages, stateObj) => {
      const container = document.getElementById(id);
      if (!container || totalPages <= 1) {
        if (container) container.innerHTML = "";
        return;
      }
      const currentPage = stateObj.currentPage;
      const baseStyle = `border:none; color:white; padding:8px 12px; margin:0 2px; border-radius:6px; cursor:pointer; font-size:0.8rem; transition:all 0.2s; display:flex; align-items:center; justify-content:center; min-width:35px;`;
      const navStyle = `background: #202225; color: #b9bbbe;`;
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages, start + 2);
      if (end - start < 2) start = Math.max(1, end - 2);
      let html = `<div style="display:flex; background:#23272a; padding:5px; border-radius:8px; border:1px solid #36393f;">`;
      html += `<button class="pg-btn" data-page="1" ${
        currentPage === 1
          ? 'disabled style="' + baseStyle + navStyle + 'opacity:0.2"'
          : 'style="' + baseStyle + navStyle + '"'
      }><i class="fas fa-angles-left"></i></button>
               <button class="pg-btn" data-page="${currentPage - 1}" ${
        currentPage === 1
          ? 'disabled style="' + baseStyle + navStyle + 'opacity:0.2"'
          : 'style="' + baseStyle + navStyle + '"'
      }><i class="fas fa-chevron-left"></i></button>`;
      for (let i = start; i <= end; i++) {
        const isActive = i === currentPage;
        html += `<button class="pg-btn" data-page="${i}" style="${baseStyle} background:${
          isActive ? "#5865F2" : "#4f545c"
        }; ${
          isActive
            ? "box-shadow: 0 4px 12px rgba(88,101,242,0.4); border:1px solid white;"
            : ""
        }"> ${i} </button>`;
      }
      html += `<button class="pg-btn" data-page="${currentPage + 1}" ${
        currentPage === totalPages
          ? 'disabled style="' + baseStyle + navStyle + 'opacity:0.2"'
          : 'style="' + baseStyle + navStyle + '"'
      }><i class="fas fa-chevron-right"></i></button>
               <button class="pg-btn" data-page="${totalPages}" ${
        currentPage === totalPages
          ? 'disabled style="' + baseStyle + navStyle + 'opacity:0.2"'
          : 'style="' + baseStyle + navStyle + '"'
      }><i class="fas fa-angles-right"></i></button></div>`;
      container.innerHTML = html;
      container.querySelectorAll(".pg-btn").forEach((btn) => {
        btn.onclick = () => {
          if (btn.disabled) return;
          stateObj.currentPage = parseInt(btn.dataset.page);
          loadDataOnly();
        };
      });
    };

    const refreshDropdowns = async () => {
      const { data: pkgs } = await supabase
        .from("master_paket")
        .select("nama_paket")
        .eq("is_active", true)
        .order("nama_paket");
      const { data: items } = await supabase
        .from("katalog_barang")
        .select("nama_barang")
        .order("nama_barang");
      if (els.resPkg)
        els.resPkg.innerHTML = (pkgs || [])
          .map(
            (p) => `<option value="${p.nama_paket}">${p.nama_paket}</option>`
          )
          .join("");
      if (els.resItem)
        els.resItem.innerHTML = (items || [])
          .map(
            (i) => `<option value="${i.nama_barang}">${i.nama_barang}</option>`
          )
          .join("");
    };

    const loadDataOnly = async () => {
      const { data: pkgs } = await supabase
        .from("master_paket")
        .select("*")
        .order("nama_paket");
      const { data: recipes } = await supabase.from("bundle_items").select("*");

      const fPkgs = (pkgs || []).filter((p) =>
        p.nama_paket.toLowerCase().includes(st.paket.searchQuery.toLowerCase())
      );
      const pkgPages = Math.ceil(fPkgs.length / st.paket.itemsPerPage) || 1;

      els.pkgBody.innerHTML = fPkgs
        .slice(
          (st.paket.currentPage - 1) * st.paket.itemsPerPage,
          st.paket.currentPage * st.paket.itemsPerPage
        )
        .map(
          (p) => `
        <tr style="border-bottom: 1px solid #36393f;">
            <td style="padding:15px; font-weight:bold; color:#fff;">${
              p.nama_paket
            }</td>
            <td style="padding:15px; color:#43b581; font-weight:bold;">$${Number(
              p.total_harga || 0
            ).toLocaleString()}</td>
            <td style="padding:15px; color:#b9bbbe;">${
              p.deskripsi_isi || "-"
            }</td>
            <td style="padding:15px;"><span style="background:${
              p.is_active ? "#43b58122" : "#ed424522"
            }; color:${
            p.is_active ? "#43b581" : "#ed4245"
          }; padding:4px 8px; border-radius:4px; font-size:0.7rem; font-weight:bold;">${
            p.is_active ? "AKTIF" : "ARSIP"
          }</span></td>
            <td style="padding:15px; text-align:center;">
                <button class="toggle-pkg-btn" data-name="${
                  p.nama_paket
                }" data-status="${p.is_active}" style="background:${
            p.is_active ? "#faa61a" : "#43b581"
          }; padding:6px 12px; border-radius:4px; border:none; color:white; cursor:pointer;">
                    ${p.is_active ? "Arsipkan" : "Aktifkan"}
                </button>
            </td>
        </tr>`
        )
        .join("");

      renderAestheticPagination("pkgPagination", pkgPages, st.paket);

      const fRes = (recipes || []).filter(
        (r) =>
          r.nama_paket
            .toLowerCase()
            .includes(st.resep.searchQuery.toLowerCase()) ||
          r.nama_barang_stok
            .toLowerCase()
            .includes(st.resep.searchQuery.toLowerCase())
      );
      const resPages = Math.ceil(fRes.length / st.resep.itemsPerPage) || 1;

      els.resBody.innerHTML = fRes
        .slice(
          (st.resep.currentPage - 1) * st.resep.itemsPerPage,
          st.resep.currentPage * st.resep.itemsPerPage
        )
        .map(
          (r) => `
        <tr style="border-bottom: 1px solid #36393f;">
            <td style="padding:15px; color:#fff;">${r.nama_paket}</td>
            <td style="padding:15px; color:#b9bbbe;">${r.nama_barang_stok}</td>
            <td style="padding:15px; font-weight:bold; color:white;">${r.jumlah_potong}</td>
            <td style="padding:15px; text-align:center;">
                <button class="del-res-btn" data-id="${r.id}" data-pkg="${r.nama_paket}" data-item="${r.nama_barang_stok}" style="background:#ed4245; padding:6px 12px; border:none; border-radius:4px; color:white; cursor:pointer;"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`
        )
        .join("");

      renderAestheticPagination("resPagination", resPages, st.resep);
      attachTableEvents();
    };

    const attachTableEvents = () => {
      document.querySelectorAll(".toggle-pkg-btn").forEach((btn) => {
        btn.onclick = async () => {
          const newStatus = btn.dataset.status !== "true";
          const { error } = await supabase
            .from("master_paket")
            .update({ is_active: newStatus })
            .eq("nama_paket", btn.dataset.name);
          if (!error) {
            window.createAuditLog(
              "UPDATE",
              "master_paket",
              `${newStatus ? "Mengaktifkan" : "Mengarsipkan"} paket ${
                btn.dataset.name
              }`
            );
            loadDataOnly();
            refreshDropdowns();
          }
        };
      });
      document.querySelectorAll(".del-res-btn").forEach((btn) => {
        btn.onclick = async () => {
          const { isConfirmed } = await Swal.fire({
            title: "Hapus?",
            text: "Hapus item ini dari resep?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ed4245",
            background: "#2f3136",
            color: "#fff",
          });
          if (isConfirmed) {
            const { error } = await supabase
              .from("bundle_items")
              .delete()
              .eq("id", btn.dataset.id);
            if (!error) {
              window.createAuditLog(
                "DELETE",
                "bundle_items",
                `Menghapus ${btn.dataset.item} dari resep paket ${btn.dataset.pkg}`
              );
              loadDataOnly();
            }
          }
        };
      });
    };

    els.pkgSearch.oninput = (e) => {
      clearTimeout(st.searchTimeout);
      st.searchTimeout = setTimeout(() => {
        st.paket.searchQuery = e.target.value;
        st.paket.currentPage = 1;
        loadDataOnly();
      }, 300);
    };
    els.resSearch.oninput = (e) => {
      clearTimeout(st.searchTimeout);
      st.searchTimeout = setTimeout(() => {
        st.resep.searchQuery = e.target.value;
        st.resep.currentPage = 1;
        loadDataOnly();
      }, 300);
    };

    document.getElementById("btnSavePkg").onclick = async () => {
      const name = document.getElementById("pkgName").value.trim();
      const price = parseInt(document.getElementById("pkgPrice").value);
      if (!name || !price)
        return Swal.fire("Error", "Lengkapi Nama & Harga", "error");

      const { error } = await supabase.from("master_paket").upsert({
        nama_paket: name,
        total_harga: price,
        deskripsi_isi: document.getElementById("pkgDesc").value,
        is_active: true,
      });
      if (!error) {
        window.createAuditLog(
          "CREATE",
          "master_paket",
          `Upsert paket: ${name} seharga $${price}`
        );
        Swal.fire({
          title: "Berhasil",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });
        loadDataOnly();
        refreshDropdowns();
      }
    };

    document.getElementById("btnAddRes").onclick = async () => {
      const qty = parseInt(document.getElementById("resQty").value);
      const pkg = els.resPkg.value;
      const item = els.resItem.value;
      if (!qty || qty <= 0)
        return Swal.fire("Error", "Qty tidak valid", "warning");

      const { error } = await supabase
        .from("bundle_items")
        .insert([
          { nama_paket: pkg, nama_barang_stok: item, jumlah_potong: qty },
        ]);
      if (!error) {
        window.createAuditLog(
          "CREATE",
          "bundle_items",
          `Menambah resep: ${pkg} butuh ${qty}x ${item}`
        );
        loadDataOnly();
      }
    };

    await refreshDropdowns();
    await loadDataOnly();
  },
};
