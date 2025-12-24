/** @param {any} supabase */
export const HistoryPage = {
  state: {
    searchQuery: "",
    currentPage: 1,
    itemsPerPage: 10, // History biasanya lebih enak dibaca dalam list agak panjang
  },

  render: () => `
        <div style="display:flex; justify-content:space-between; align-items:end; margin-bottom: 25px; gap: 20px;">
            <div>
                <h2 style="margin:0 0 10px 0;">Riwayat & Persetujuan Listing</h2>
                <input type="text" id="histSearch" placeholder="Cari member atau item..." 
                    style="width: 300px; padding: 10px 15px; background:#202225; color:white; border-radius:8px; border:1px solid #4f545c; font-size:0.9rem;">
            </div>
            <div id="statBox" style="background: linear-gradient(135deg, #2f3136 0%, #202225 100%); padding:15px 25px; border-radius:12px; border-right:4px solid #43b581; box-shadow: 0 4px 15px rgba(0,0,0,0.3); text-align:right;">
                <small style="color:#b9bbbe; text-transform:uppercase; letter-spacing:1px; font-weight:bold; font-size:0.7rem;">Total Omzet (Approved)</small>
                <div id="totalRevenue" style="color:#43b581; font-weight:bold; font-size:1.8rem; margin-top:5px;">$0</div>
            </div>
        </div>

        <div style="background: #2f3136; border-radius: 12px; overflow: hidden; border: 1px solid #40444b; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            <table style="width: 100%; border-collapse: collapse; font-size:0.9rem;">
                <thead>
                    <tr style="background: #202225; text-align: left;">
                        <th style="padding: 18px; font-size:0.75rem; color:#b9bbbe; text-transform:uppercase;">Waktu</th>
                        <th style="padding: 18px; font-size:0.75rem; color:#b9bbbe; text-transform:uppercase;">Member</th>
                        <th style="padding: 18px; font-size:0.75rem; color:#b9bbbe; text-transform:uppercase;">Item Detail</th>
                        <th style="padding: 18px; font-size:0.75rem; color:#b9bbbe; text-transform:uppercase;">Total</th>
                        <th style="padding: 18px; font-size:0.75rem; color:#b9bbbe; text-transform:uppercase;">Status</th>
                        <th style="padding: 18px; font-size:0.75rem; color:#b9bbbe; text-transform:uppercase; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="historyTableBody"></tbody>
            </table>
        </div>

        <div id="histPagination" style="display: flex; justify-content: center; gap: 5px; margin-top: 25px; align-items: center;"></div>
    `,

  init: async (supabase) => {
    const st = HistoryPage.state;

    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("history_listing")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) return console.error(error);

      // --- LOGIC: REVENUE CALCULATION ---
      const revenue = data
        .filter((h) => h.status === "Approved")
        .reduce(
          (sum, h) =>
            sum + (parseInt(h.total_harga.replace(/[^0-9]/g, "")) || 0),
          0
        );
      document.getElementById(
        "totalRevenue"
      ).innerText = `$${revenue.toLocaleString()}`;

      // --- LOGIC: FILTERING ---
      const filtered = data.filter(
        (h) =>
          h.nama_member.toLowerCase().includes(st.searchQuery.toLowerCase()) ||
          h.item_detail.toLowerCase().includes(st.searchQuery.toLowerCase())
      );

      // --- LOGIC: PAGINATION ---
      const totalPages = Math.ceil(filtered.length / st.itemsPerPage) || 1;
      const paginatedData = filtered.slice(
        (st.currentPage - 1) * st.itemsPerPage,
        st.currentPage * st.itemsPerPage
      );

      renderTable(paginatedData, data); // 'data' asli dikirim untuk referensi updateStatus
      renderPagination(totalPages);
    };

    const renderTable = (paginatedData, originalData) => {
      const tableBody = document.getElementById("historyTableBody");
      tableBody.innerHTML = paginatedData
        .map((h) => {
          let statusColor = "#faa61a"; // Pending
          if (h.status === "Approved") statusColor = "#43b581";
          if (h.status === "Rejected") statusColor = "#ed4245";

          return `
          <tr style="border-bottom: 1px solid #40444b; transition: 0.2s;" onmouseover="this.style.background='#36393f'" onmouseout="this.style.background='transparent'">
              <td style="padding: 15px; font-size: 0.8rem; color: #b9bbbe;">
                  ${new Date(h.created_at).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </td>
              <td style="padding: 15px;">
                  <div style="font-weight:bold; color:#fff;">${
                    h.nama_member
                  }</div>
                  <div style="font-size:0.7rem; color:#72767d; text-transform:uppercase;">${
                    h.rank_member
                  }</div>
              </td>
              <td style="padding: 15px;">
                  <div style="background:#202225; padding:10px; border-radius:6px; font-size:0.8rem; font-family:'Consolas', monospace; color:#b9bbbe; white-space:pre-line; border:1px solid #36393f;">${
                    h.item_detail
                  }</div>
              </td>
              <td style="padding: 15px; color: #43b581; font-weight: bold; font-size:1rem;">${
                h.total_harga
              }</td>
              <td style="padding: 15px;">
                  <span style="color:${statusColor}; font-weight:bold; font-size:0.7rem; text-transform:uppercase; border:1px solid ${statusColor}44; padding:4px 8px; border-radius:20px; background:${statusColor}11; display:inline-block; min-width:80px; text-align:center;">
                      ${h.status}
                  </span>
              </td>
              <td style="padding: 15px; text-align: center;">
                  ${
                    h.status === "Pending"
                      ? `
                      <div style="display:flex; gap:8px; justify-content:center;">
                          <button class="btn-approve" data-id="${h.id}" style="background:#43b581; padding:6px 12px; border-radius:4px; font-weight:bold; font-size:0.7rem;">APPROVE</button>
                          <button class="btn-reject" data-id="${h.id}" style="background:#ed4245; padding:6px 12px; border-radius:4px; font-weight:bold; font-size:0.7rem;">REJECT</button>
                      </div>
                  `
                      : `<i class="fas fa-check-circle" style="color:#72767d;"></i> <span style="font-size:0.7rem; color:#72767d; font-weight:bold;">SELESAI</span>`
                  }
              </td>
          </tr>`;
        })
        .join("");

      // Bind Events
      tableBody.querySelectorAll(".btn-approve").forEach((btn) => {
        btn.onclick = () =>
          updateStatus(
            originalData.find((x) => x.id == btn.dataset.id),
            "Approved"
          );
      });
      tableBody.querySelectorAll(".btn-reject").forEach((btn) => {
        btn.onclick = () =>
          updateStatus(
            originalData.find((x) => x.id == btn.dataset.id),
            "Rejected"
          );
      });
    };

    const renderPagination = (totalPages) => {
      const container = document.getElementById("histPagination");
      if (totalPages <= 1) {
        container.innerHTML = "";
        return;
      }

      const curr = st.currentPage;
      const baseStyle = `border:none; color:white; padding:8px 12px; margin:0 2px; border-radius:6px; cursor:pointer; font-size:0.8rem; transition:0.2s; display:flex; align-items:center; min-width:35px; justify-content:center;`;

      let start = Math.max(1, curr - 1);
      let end = Math.min(totalPages, start + 2);
      if (end - start < 2) start = Math.max(1, end - 2);

      let html = `<div style="display:flex; background:#23272a; padding:5px; border-radius:8px; border:1px solid #36393f;">`;

      // First & Prev
      html += `
        <button class="pg-nav" data-page="1" ${
          curr === 1
            ? 'disabled style="opacity:0.2;' + baseStyle + '"'
            : 'style="' + baseStyle + 'background:#202225;"'
        }><i class="fas fa-angles-left"></i></button>
        <button class="pg-nav" data-page="${curr - 1}" ${
        curr === 1
          ? 'disabled style="opacity:0.2;' + baseStyle + '"'
          : 'style="' + baseStyle + 'background:#202225;"'
      }><i class="fas fa-chevron-left"></i></button>
      `;

      for (let i = start; i <= end; i++) {
        const active = i === curr;
        html += `<button class="pg-nav" data-page="${i}" style="${baseStyle} background:${
          active ? "#5865F2" : "#4f545c"
        }; ${
          active
            ? "box-shadow:0 4px 12px rgba(88,101,242,0.4); border:1px solid white;"
            : ""
        }">${i}</button>`;
      }

      html += `
        <button class="pg-nav" data-page="${curr + 1}" ${
        curr === totalPages
          ? 'disabled style="opacity:0.2;' + baseStyle + '"'
          : 'style="' + baseStyle + 'background:#202225;"'
      }><i class="fas fa-chevron-right"></i></button>
        <button class="pg-nav" data-page="${totalPages}" ${
        curr === totalPages
          ? 'disabled style="opacity:0.2;' + baseStyle + '"'
          : 'style="' + baseStyle + 'background:#202225;"'
      }><i class="fas fa-angles-right"></i></button>
      </div>`;

      container.innerHTML = html;
      container.querySelectorAll(".pg-nav").forEach((btn) => {
        btn.onclick = () => {
          st.currentPage = parseInt(btn.dataset.page);
          loadHistory();
        };
      });
    };

    const updateStatus = async (record, status) => {
      const { isConfirmed } = await Swal.fire({
        title: `Konfirmasi ${status}?`,
        text:
          status === "Approved"
            ? "Stok akan dipotong & Weapon akan di-assign otomatis."
            : "Data akan ditolak.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: status === "Approved" ? "#43b581" : "#ed4245",
        background: "#2f3136",
        color: "#fff",
      });

      if (isConfirmed) {
        if (status === "Approved") {
          const { data: weaponsKatalog } = await supabase
            .from("katalog_barang")
            .select("nama_barang")
            .eq("jenis_barang", "Weapon");
          const weaponNames = weaponsKatalog.map((w) => w.nama_barang);

          for (const wName of weaponNames) {
            if (record.item_detail.includes(wName)) {
              const { data: availWeap } = await supabase
                .from("inventory_weapons")
                .select("id")
                .eq("weapon_name", wName)
                .is("hold_by", null)
                .limit(1)
                .single();
              if (availWeap) {
                await supabase
                  .from("inventory_weapons")
                  .update({ hold_by: record.nama_member })
                  .eq("id", availWeap.id);
              }
            }
          }
        }

        await supabase
          .from("history_listing")
          .update({ status })
          .eq("id", record.id);
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          timer: 1000,
          showConfirmButton: false,
        });
        loadHistory();
      }
    };

    // Event Search
    document.getElementById("histSearch").oninput = (e) => {
      st.searchQuery = e.target.value;
      st.currentPage = 1;
      loadHistory();
    };

    loadHistory();
  },
};
