export const BundlePage = {
  render: () => `
    <div class="header-container">
        <h2>Bundle Management</h2>
    </div>
    <div style="background: #2f3136; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="margin-top:0">Buat / Edit Paket</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr 2fr auto; gap: 10px; align-items: end;">
            <div>
                <label style="font-size:0.8rem; color:#b9bbbe;">Nama Paket</label>
                <input type="text" id="pkgName" placeholder="Paket A" style="width:100%">
            </div>
            <div>
                <label style="font-size:0.8rem; color:#b9bbbe;">Harga ($)</label>
                <input type="number" id="pkgPrice" placeholder="21000" style="width:100%">
            </div>
            <div>
                <label style="font-size:0.8rem; color:#b9bbbe;">Deskripsi Isi (Tampilan Discord)</label>
                <input type="text" id="pkgDesc" placeholder="Vest Merah x5, Ammo 9mm x5" style="width:100%">
            </div>
            <button id="btnSavePkg" style="background:#5865F2; padding: 10px 20px;">Simpan</button>
        </div>
    </div>
    <div style="background: #2f3136; padding: 20px; border-radius: 8px;">
        <h4 style="margin-top:0">Isi Item (Untuk Potong Stok)</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 10px; align-items: end;">
            <select id="resPkg"></select>
            <select id="resItem"></select>
            <input type="number" id="resQty" placeholder="Qty">
            <button id="btnAddRes" style="background:#43b581; padding: 10px 20px;">Tambah</button>
        </div>
        <table style="width:100%; margin-top:20px; border-collapse: collapse; font-size:0.9rem;">
            <thead>
                <tr style="background:#202225; text-align:left;">
                    <th style="padding:10px;">Paket</th>
                    <th style="padding:10px;">Barang Katalog</th>
                    <th style="padding:10px;">Potong Qty</th>
                    <th style="padding:10px;">Aksi</th>
                </tr>
            </thead>
            <tbody id="resTableBody"></tbody>
        </table>
    </div>
  `,
  init: async (supabase) => {
    const loadData = async () => {
      const { data: pkgs } = await supabase.from("master_paket").select("*");
      const { data: items } = await supabase
        .from("katalog_barang")
        .select("nama_barang");
      const { data: recipes } = await supabase.from("bundle_items").select("*");

      document.getElementById("resPkg").innerHTML = (pkgs || [])
        .map((p) => `<option value="${p.nama_paket}">${p.nama_paket}</option>`)
        .join("");
      document.getElementById("resItem").innerHTML = (items || [])
        .map(
          (i) => `<option value="${i.nama_barang}">${i.nama_barang}</option>`
        )
        .join("");
      document.getElementById("resTableBody").innerHTML = (recipes || [])
        .map(
          (r) => `
        <tr style="border-bottom: 1px solid #36393f;">
            <td style="padding:10px;">${r.nama_paket}</td>
            <td style="padding:10px;">${r.nama_barang_stok}</td>
            <td style="padding:10px;">${r.jumlah_potong}</td>
            <td style="padding:10px;"><button onclick="deleteRes(${r.id})" style="background:#ed4245; padding:4px 8px;">Hapus</button></td>
        </tr>
      `
        )
        .join("");
    };

    document.getElementById("btnSavePkg").onclick = async () => {
      const nama_paket = document.getElementById("pkgName").value;
      const total_harga = parseInt(document.getElementById("pkgPrice").value);
      const deskripsi_isi = document.getElementById("pkgDesc").value;
      await supabase
        .from("master_paket")
        .upsert({ nama_paket, total_harga, deskripsi_isi });
      Swal.fire("Tersimpan!", "", "success");
      loadData();
    };

    document.getElementById("btnAddRes").onclick = async () => {
      const nama_paket = document.getElementById("resPkg").value;
      const nama_barang_stok = document.getElementById("resItem").value;
      const jumlah_potong = parseInt(document.getElementById("resQty").value);
      await supabase
        .from("bundle_items")
        .insert([{ nama_paket, nama_barang_stok, jumlah_potong }]);
      loadData();
    };

    window.deleteRes = async (id) => {
      await supabase.from("bundle_items").delete().eq("id", id);
      loadData();
    };

    loadData();
  },
};
