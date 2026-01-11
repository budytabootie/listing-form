// pages/weaponRelations.js
export const WeaponRelationsPage = {
  render: () => `
        <div class="page-header">
            <h2 style="color: white;"><i class="fas fa-link"></i> Manage Weapon Relations</h2>
            <p style="color: #b9bbbe;">Atur aksesori yang muncul saat user memilih senjata tertentu.</p>
        </div>

        <div class="admin-card" style="background: #2f3136; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <div style="display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px;">
                    <label style="color: #fff; display: block; margin-bottom: 8px;">Pilih Senjata Utama</label>
                    <select id="mainWeaponSelect" style="width: 100%; padding: 10px; border-radius: 5px; background: #202225; color: white; border: 1px solid #4f545c;"></select>
                </div>
                <div style="flex: 1; min-width: 200px;">
                    <label style="color: #fff; display: block; margin-bottom: 8px;">Pilih Aksesori/Ammo</label>
                    <select id="attachmentSelect" style="width: 100%; padding: 10px; border-radius: 5px; background: #202225; color: white; border: 1px solid #4f545c;"></select>
                </div>
                <button id="addRelationBtn" class="btn-modern" style="background: #43b581; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; transition: 0.3s;">
                    <i class="fas fa-plus"></i> Tambah Relasi
                </button>
            </div>
        </div>

        <div class="admin-card" style="background: #2f3136; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; color: white; text-align: left;">
                <thead style="background: #202225;">
                    <tr>
                        <th style="padding: 15px;">Senjata Utama</th>
                        <th style="padding: 15px;">Aksesori Terkait</th>
                        <th style="padding: 15px; width: 120px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="relationsTableBody">
                    <tr><td colspan="3" style="padding: 20px; text-align: center; color: #72767d;">Memuat data...</td></tr>
                </tbody>
            </table>
        </div>
    `,

  init: async (supabase) => {
    const weaponSelect = document.getElementById("mainWeaponSelect");
    const attachSelect = document.getElementById("attachmentSelect");
    const tableBody = document.getElementById("relationsTableBody");

    // Simpan data katalog secara lokal untuk keperluan Edit
    let weaponOptions = "";
    let attachmentOptions = "";

    // 1. Load Dropdowns
    const { data: catalog } = await supabase
      .from("katalog_barang")
      .select("nama_barang, jenis_barang");

    if (catalog) {
      const weapons = catalog.filter((i) => i.jenis_barang === "Weapon");
      const others = catalog.filter((i) => i.jenis_barang !== "Weapon");

      weaponOptions = weapons
        .map(
          (w) => `<option value="${w.nama_barang}">${w.nama_barang}</option>`
        )
        .join("");
      attachmentOptions = others
        .map(
          (o) => `<option value="${o.nama_barang}">${o.nama_barang}</option>`
        )
        .join("");

      weaponSelect.innerHTML = weaponOptions;
      attachSelect.innerHTML = attachmentOptions;
    }

    // 2. Fungsi Load Table
    const loadTable = async () => {
      const { data: relations } = await supabase
        .from("weapon_attachments")
        .select("*")
        .order("weapon_name", { ascending: true });

      if (!relations || relations.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#72767d;">Belum ada relasi ditemukan.</td></tr>`;
        return;
      }

      tableBody.innerHTML = relations
        .map(
          (rel) => `
                <tr style="border-bottom: 1px solid #40444b;">
                    <td style="padding: 15px;"><strong>${rel.weapon_name}</strong></td>
                    <td style="padding: 15px;">${rel.attachment_name}</td>
                    <td style="padding: 15px; text-align: center; display: flex; gap: 8px; justify-content: center;">
                        <button onclick="editRelation('${rel.id}', '${rel.weapon_name}', '${rel.attachment_name}')" 
                            style="background: #5865f2; border:none; color:white; padding:6px 10px; border-radius:4px; cursor:pointer;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteRelation('${rel.id}')" 
                            style="background: #ed4245; border:none; color:white; padding:6px 10px; border-radius:4px; cursor:pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `
        )
        .join("");
    };

    // 3. Tambah Relasi
    document.getElementById("addRelationBtn").onclick = async () => {
      const wName = weaponSelect.value;
      const aName = attachSelect.value;

      const { error } = await supabase
        .from("weapon_attachments")
        .insert([{ weapon_name: wName, attachment_name: aName }]);

      if (error) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Relasi ini mungkin sudah ada!",
          background: "#2f3136",
          color: "#fff",
        });
      } else {
        loadTable();
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          timer: 1000,
          showConfirmButton: false,
          background: "#2f3136",
          color: "#fff",
        });
      }
    };

    // 4. Edit Relasi (Global Window)
    window.editRelation = async (id, currentWeapon, currentAttach) => {
      const { value: formValues } = await Swal.fire({
        title: '<span style="color: white;">Edit Relasi</span>',
        background: "#2f3136",
        html: `
                    <div style="text-align: left; margin-bottom: 15px;">
                        <label style="color: #b9bbbe; font-size: 0.8rem;">Senjata Utama</label>
                        <select id="edit-weapon" class="swal2-input" style="width: 100%; margin: 5px 0; background: #202225; color: white; border: 1px solid #4f545c;">
                            ${weaponOptions}
                        </select>
                    </div>
                    <div style="text-align: left;">
                        <label style="color: #b9bbbe; font-size: 0.8rem;">Aksesori/Ammo</label>
                        <select id="edit-attach" class="swal2-input" style="width: 100%; margin: 5px 0; background: #202225; color: white; border: 1px solid #4f545c;">
                            ${attachmentOptions}
                        </select>
                    </div>
                `,
        didOpen: () => {
          document.getElementById("edit-weapon").value = currentWeapon;
          document.getElementById("edit-attach").value = currentAttach;
        },
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Update",
        confirmButtonColor: "#43b581",
        preConfirm: () => {
          return {
            weapon_name: document.getElementById("edit-weapon").value,
            attachment_name: document.getElementById("edit-attach").value,
          };
        },
      });

      if (formValues) {
        const { error } = await supabase
          .from("weapon_attachments")
          .update(formValues)
          .eq("id", id);

        if (error) {
          Swal.fire("Error", "Gagal mengupdate data", "error");
        } else {
          loadTable();
          Swal.fire({
            icon: "success",
            title: "Terupdate!",
            background: "#2f3136",
            color: "#fff",
            timer: 1000,
          });
        }
      }
    };

    // 5. Hapus Relasi (Global Window)
    window.deleteRelation = async (id) => {
      const result = await Swal.fire({
        title: "Hapus relasi?",
        text: "Data ini tidak dapat dikembalikan!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ed4245",
        cancelButtonColor: "#4f545c",
        confirmButtonText: "Ya, Hapus!",
        background: "#2f3136",
        color: "#fff",
      });

      if (result.isConfirmed) {
        const { error } = await supabase
          .from("weapon_attachments")
          .delete()
          .eq("id", id);
        if (!error) {
          loadTable();
        } else {
          Swal.fire("Error", "Gagal menghapus data", "error");
        }
      }
    };

    loadTable();
  },
};
