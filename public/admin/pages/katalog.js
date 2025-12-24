export const KatalogPage = {
  render: () => `
        <h2>Katalog Master Barang</h2>
        <p style="color: #b9bbbe; margin-bottom: 20px;">Master data untuk menentukan item yang muncul di Warehouse dan Listing.</p>
        
        <div style="background: #2f3136; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4 id="formTitle">Tambah Barang Baru</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; gap: 10px; margin-top: 10px; align-items: end;">
                <div>
                    <label style="margin-top:0">Nama Barang</label>
                    <input type="text" id="katNama" placeholder="Micro SMG">
                </div>
                <div>
                    <label style="margin-top:0">Jenis Barang</label>
                    <select id="katJenis">
                        <option value="Vest">Vest</option>
                        <option value="Ammo">Ammo</option>
                        <option value="Weapon">Weapon (Serialized)</option>
                        <option value="Attachment">Attachment</option>
                        <option value="Attachment">Narkoba</option>
                    </select>
                </div>
                <div>
                    <label style="margin-top:0">Harga Satuan ($)</label>
                    <input type="number" id="katHarga" placeholder="0">
                </div>
                <div>
                    <label style="margin-top:0">Status</label>
                    <select id="katStatus">
                        <option value="Ready">Ready</option>
                        <option value="Not Ready">Not Ready</option>
                    </select>
                </div>
                <button id="btnSaveKatalog" style="width: auto; margin: 0; padding: 10px 20px;">Simpan</button>
            </div>
        </div>

        <div style="background: #2f3136; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #202225; text-align: left;">
                        <th style="padding: 15px;">Nama Barang</th>
                        <th style="padding: 15px;">Jenis</th>
                        <th style="padding: 15px;">Harga Satuan</th>
                        <th style="padding: 15px;">Status</th>
                        <th style="padding: 15px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="katalogTableBody"></tbody>
            </table>
        </div>
    `,
  init: async (supabase) => {
    const tableBody = document.getElementById("katalogTableBody");
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
      if (error) return console.error(error);

      tableBody.innerHTML = (data || [])
        .map(
          (item) => `
                <tr style="border-bottom: 1px solid #23272a;">
                    <td style="padding: 15px; font-weight:bold;">${
                      item.nama_barang
                    }</td>
                    <td style="padding: 15px;"><span style="color: #b9bbbe;">${
                      item.jenis_barang
                    }</span></td>
                    <td style="padding: 15px;">$${Number(
                      item.harga_satuan || 0
                    ).toLocaleString()}</td>
                    <td style="padding: 15px;">
                        <span style="color: ${
                          item.status === "Ready" ? "#43b581" : "#ed4245"
                        }">
                            ● ${item.status}
                        </span>
                    </td>
                    <td style="padding: 15px; text-align: center;">
                        <button class="btn-edit-kat" 
                            data-id="${item.id}" 
                            data-nama="${item.nama_barang}" 
                            data-jenis="${item.jenis_barang}"
                            data-harga="${item.harga_satuan}"
                            data-status="${item.status}"
                            style="background:#5865F2; padding:5px 10px; width:auto; margin-right:5px;">Edit</button>
                        <button class="btn-delete-kat" data-id="${
                          item.id
                        }" style="background:#ed4245; padding:5px 10px; width:auto;">Hapus</button>
                    </td>
                </tr>
            `
        )
        .join("");

      document.querySelectorAll(".btn-edit-kat").forEach((btn) => {
        btn.onclick = () => {
          inputNama.value = btn.dataset.nama;
          inputJenis.value = btn.dataset.jenis;
          inputHarga.value = btn.dataset.harga;
          inputStatus.value = btn.dataset.status;
          btnSave.innerText = "Update Barang";
          btnSave.dataset.mode = "edit";
          btnSave.dataset.id = btn.dataset.id;
          document.getElementById("formTitle").innerText = "Edit Barang";
          window.scrollTo({ top: 0, behavior: "smooth" });
        };
      });

      document.querySelectorAll(".btn-delete-kat").forEach((btn) => {
        btn.onclick = async () => {
          const { isConfirmed } = await Swal.fire({
            title: "Hapus dari Katalog?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ed4245",
            background: "#1e1e1e",
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

    btnSave.onclick = async () => {
      const nama = inputNama.value;
      const jenis = inputJenis.value;
      const harga = parseFloat(inputHarga.value) || 0;
      const status = inputStatus.value;

      if (!nama)
        return Swal.fire({ icon: "error", title: "Nama harus diisi!" });

      if (btnSave.dataset.mode === "edit") {
        await supabase
          .from("katalog_barang")
          .update({
            nama_barang: nama,
            jenis_barang: jenis,
            harga_satuan: harga,
            status: status,
          })
          .eq("id", btnSave.dataset.id);
        delete btnSave.dataset.mode;
        btnSave.innerText = "Simpan";
        document.getElementById("formTitle").innerText = "Tambah Barang Baru";
      } else {
        await supabase.from("katalog_barang").insert([
          {
            nama_barang: nama,
            jenis_barang: jenis,
            harga_satuan: harga,
            status: status,
          },
        ]);
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        timer: 1000,
        showConfirmButton: false,
      });
      inputNama.value = "";
      inputHarga.value = "";
      loadKatalog();
    };

    loadKatalog();
  },
};