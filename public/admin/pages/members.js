/** @param {any} supabase */
export const MembersPage = {
  render: () => `
        <h2>Member Management</h2>
        <div style="background: #2f3136; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4>Tambah Member Baru</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 10px; margin-top: 10px; align-items: end;">
                <div>
                    <label style="font-size:0.8rem; color:#b9bbbe;">Nama Member</label>
                    <input type="text" id="newMemberName" placeholder="Contoh: Udin">
                </div>
                <div>
                    <label style="font-size:0.8rem; color:#b9bbbe;">Rank</label>
                    <select id="newMemberRank">
                        <option value="Prospect">Prospect</option>
                        <option value="Tail Gunner">Tail Gunner</option>
                        <option value="Life Member">Life Member</option>
                        <option value="High Rank">High Rank</option>
                    </select>
                </div>
                <div>
                    <label style="font-size:0.8rem; color:#b9bbbe;">Discord User ID</label>
                    <input type="text" id="newMemberDiscord" placeholder="Contoh: 284123456789">
                </div>
                <button id="btnAddMember" style="width: auto; height: 38px;">Tambah</button>
            </div>
            <small style="color: #faa61a; margin-top: 10px; display: block;">* Ambil ID dengan Klik Kanan Profil Discord > Copy User ID (Developer Mode ON)</small>
        </div>
        <div style="background: #2f3136; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #202225; text-align: left;">
                        <th style="padding: 15px;">Nama Member</th>
                        <th style="padding: 15px;">Rank</th>
                        <th style="padding: 15px;">Discord ID</th>
                        <th style="padding: 15px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="memberTableBody"></tbody>
            </table>
        </div>
    `,
  init: async (supabase) => {
    const loadMembers = async () => {
      const { data } = await supabase.from("members").select("*").order("nama");
      const tableBody = document.getElementById("memberTableBody");
      if (tableBody && data) {
        tableBody.innerHTML = data
          .map(
            (m) => `
                <tr style="border-bottom: 1px solid #23272a;">
                    <td style="padding: 15px; font-weight:bold;">${m.nama}</td>
                    <td style="padding: 15px;">${m.rank}</td>
                    <td style="padding: 15px; font-family: monospace; color:#5865F2;">${
                      m.discord_id || "-"
                    }</td>
                    <td style="padding: 15px; text-align: center;">
                        <button class="btn-edit" data-id="${m.id}" data-nama="${
              m.nama
            }" data-rank="${m.rank}" data-discord="${
              m.discord_id || ""
            }" style="background:#5865F2; padding:5px 10px; width:auto; margin-right:5px;">Edit</button>
                        <button class="btn-delete" data-id="${
                          m.id
                        }" style="background:#ed4245; padding:5px 10px; width:auto;">Hapus</button>
                    </td>
                </tr>
            `
          )
          .join("");

        // EVENT EDIT
        document.querySelectorAll(".btn-edit").forEach((btn) => {
          btn.onclick = async () => {
            const { id, nama, rank, discord } = btn.dataset;

            const { value: formValues } = await Swal.fire({
              title: "Edit Member",
              background: "#2f3136",
              color: "#fff",
              html: `
                <input id="swal-nama" class="swal2-input" value="${nama}" placeholder="Nama">
                <select id="swal-rank" class="swal2-input">
                    <option value="Prospect" ${
                      rank === "Prospect" ? "selected" : ""
                    }>Prospect</option>
                    <option value="Tail Gunner" ${
                      rank === "Tail Gunner" ? "selected" : ""
                    }>Tail Gunner</option>
                    <option value="Life Member" ${
                      rank === "Life Member" ? "selected" : ""
                    }>Life Member</option>
                    <option value="High Rank" ${
                      rank === "High Rank" ? "selected" : ""
                    }>High Rank</option>
                </select>
                <input id="swal-discord" class="swal2-input" value="${discord}" placeholder="Discord ID">
              `,
              focusConfirm: false,
              showCancelButton: true,
              confirmButtonText: "Simpan Perubahan",
              preConfirm: () => {
                return {
                  nama: document.getElementById("swal-nama").value,
                  rank: document.getElementById("swal-rank").value,
                  discord_id: document.getElementById("swal-discord").value,
                };
              },
            });

            if (formValues) {
              const { error } = await supabase
                .from("members")
                .update(formValues)
                .eq("id", id);
              if (!error) {
                Swal.fire({
                  icon: "success",
                  title: "Berhasil diupdate",
                  timer: 1000,
                  showConfirmButton: false,
                });
                loadMembers();
              }
            }
          };
        });

        // EVENT DELETE
        document.querySelectorAll(".btn-delete").forEach((btn) => {
          btn.onclick = async () => {
            const id = btn.dataset.id;
            const { isConfirmed } = await Swal.fire({
              title: "Hapus Member?",
              icon: "warning",
              showCancelButton: true,
              background: "#2f3136",
              color: "#fff",
            });
            if (isConfirmed) {
              await supabase.from("members").delete().eq("id", id);
              loadMembers();
            }
          };
        });
      }
    };

    document.getElementById("btnAddMember").onclick = async () => {
      const nama = document.getElementById("newMemberName").value;
      const rank = document.getElementById("newMemberRank").value;
      const discord_id = document.getElementById("newMemberDiscord").value;

      if (!nama) return Swal.fire("Error", "Nama wajib diisi!", "error");

      const { error } = await supabase
        .from("members")
        .insert([{ nama, rank, discord_id }]);

      if (error) {
        Swal.fire("Error", "Gagal menambah member", "error");
      } else {
        document.getElementById("newMemberName").value = "";
        document.getElementById("newMemberDiscord").value = "";
        loadMembers();
      }
    };

    loadMembers();
  },
};
