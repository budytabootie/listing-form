export const StokPage = {
  render: () => `
        <h2>Warehouse Inventory</h2>
        <p style="color: #b9bbbe; margin-bottom: 20px;">Kelola persediaan barang.</p>
        
        <div style="background: #2f3136; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4>Update / Tambah Barang</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 10px; margin-top: 10px; align-items: end;">
                <div>
                    <label style="margin-top:0">Pilih Barang (Katalog)</label>
                    <select id="itemNameSelection"></select>
                </div>
                <div>
                    <label style="margin-top:0">Jumlah Stok</label>
                    <input type="number" id="itemQty" placeholder="0">
                </div>
                <button id="btnSaveStok" style="width: auto; margin: 0; padding: 10px 20px;">Simpan</button>
            </div>
        </div>

        <div style="background: #2f3136; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #202225; text-align: left;">
                        <th style="padding: 15px;">Nama Barang</th>
                        <th style="padding: 15px;">Tersedia</th>
                        <th style="padding: 15px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="stokTableBody">
                    <tr><td colspan="4" style="text-align:center; padding:20px; color:#b9bbbe;">Memuat data...</td></tr>
                </tbody>
            </table>
        </div>
    `,
  init: async (supabase) => {
    const selectDropdown = document.getElementById("itemNameSelection");
    const tableBody = document.getElementById("stokTableBody");

    // 1. Load Katalog ke Dropdown
    const loadKatalogDropdown = async () => {
      const { data: katalog } = await supabase
        .from("katalog_barang")
        .select("nama_barang")
        .neq("jenis_barang", "Weapon") // Ini kuncinya: Not Equal to Weapon
        .order("nama_barang");

      if (selectDropdown) {
        selectDropdown.innerHTML = (katalog || [])
          .map(
            (k) => `<option value="${k.nama_barang}">${k.nama_barang}</option>`
          )
          .join("");
      }
    };

    const loadStok = async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("item_name");
      if (error) return console.error(error);
      if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#b9bbbe;">Belum ada data barang.</td></tr>`;
        return;
      }

      tableBody.innerHTML = data
        .map(
          (item) => `
                <tr style="border-bottom: 1px solid #23272a;">
                    <td style="padding: 15px; font-weight:bold;">${
                      item.item_name
                    }</td>
                    <td style="padding: 15px;"><span style="color: ${
                      item.stock <= 5 ? "#ed4245" : "#43b581"
                    }">${item.stock} unit</span></td>
                    <td style="padding: 15px; text-align: center;">
                        <button class="btn-edit-stok" data-id="${
                          item.id
                        }" data-name="${item.item_name}" data-stock="${
            item.stock
          }" style="background:#5865F2; padding:5px 10px; width:auto; margin-right:5px;">Edit</button>
                        <button class="btn-delete-stok" data-id="${
                          item.id
                        }" style="background:#ed4245; padding:5px 10px; width:auto;">Hapus</button>
                    </td>
                </tr>
            `
        )
        .join("");

      document.querySelectorAll(".btn-delete-stok").forEach((btn) => {
        btn.onclick = async () => {
          const { isConfirmed } = await Swal.fire({
            title: "Hapus Barang?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ed4245",
            background: "#1e1e1e",
            color: "#fff",
          });
          if (isConfirmed) {
            await supabase.from("inventory").delete().eq("id", btn.dataset.id);
            loadStok();
          }
        };
      });

      document.querySelectorAll(".btn-edit-stok").forEach((btn) => {
        btn.onclick = () => {
          selectDropdown.value = btn.dataset.name;
          document.getElementById("itemQty").value = btn.dataset.stock;
          const saveBtn = document.getElementById("btnSaveStok");
          saveBtn.innerText = "Update Stok";
          saveBtn.dataset.mode = "edit";
          saveBtn.dataset.id = btn.dataset.id;
          window.scrollTo({ top: 0, behavior: "smooth" });
        };
      });
    };

    document.getElementById("btnSaveStok").onclick = async () => {
      const name = selectDropdown.value; // Ambil dari dropdown
      const stock = parseInt(document.getElementById("itemQty").value);
      const btn = document.getElementById("btnSaveStok");

      if (!name || isNaN(stock))
        return Swal.fire({ icon: "error", title: "Isi data dengan benar!" });

      if (btn.dataset.mode === "edit") {
        await supabase
          .from("inventory")
          .update({ item_name: name, stock })
          .eq("id", btn.dataset.id);
        delete btn.dataset.mode;
        btn.innerText = "Simpan";
      } else {
        await supabase
          .from("inventory")
          .insert([{ item_name: name, stock }]);
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        timer: 1000,
        showConfirmButton: false,
      });
      document.getElementById("itemQty").value = "";
      loadStok();
    };

    await loadKatalogDropdown();
    loadStok();
  },
};
