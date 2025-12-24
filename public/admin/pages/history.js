/** @param {any} supabase */
export const HistoryPage = {
  state: {
    searchQuery: "",
    currentPage: 1,
    itemsPerPage: 10,
  },

  render: () => `
        <div style="display:flex; justify-content:space-between; align-items:end; margin-bottom: 25px; gap: 20px;">
            <div>
                <h2 style="margin:0 0 10px 0;">Riwayat Logistik</h2>
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
                        <th style="padding: 18px; font-size:0.75rem; color:#b9bbbe; text-transform:uppercase;">Waktu Selesai</th>
                        <th style="padding: 18px; font-size:0.75rem; color:#b9bbbe; text-transform:uppercase;">Member</th>
                        <th style="padding: 18px; font-size:0.75rem; color:#b9bbbe; text-transform:uppercase;">Item</th>
                        <th style="padding: 18px; font-size:0.75rem; color:#b9bbbe; text-transform:uppercase;">Status</th>
                        <th style="padding: 18px; font-size:0.75rem; color:#b9bbbe; text-transform:uppercase;">Total Tagihan</th>
                        <th style="padding: 18px; font-size:0.75rem; color:#b9bbbe; text-transform:uppercase;">Admin</th>
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
      // Kita ambil semua yang statusnya BUKAN pending
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .neq("status", "pending")
        .order("processed_at", { ascending: false });

      if (error) return console.error(error);

      // --- LOGIC: REVENUE CALCULATION ---
      const revenue = data
        .filter((h) => h.status === "approved")
        .reduce(
          (sum, h) =>
            sum + (parseInt(h.total_price?.replace(/[^0-9]/g, "")) || 0),
          0
        );

      document.getElementById(
        "totalRevenue"
      ).innerText = `$${revenue.toLocaleString()}`;

      // --- LOGIC: FILTERING ---
      const filtered = data.filter(
        (h) =>
          h.requested_by.toLowerCase().includes(st.searchQuery.toLowerCase()) ||
          h.item_name.toLowerCase().includes(st.searchQuery.toLowerCase())
      );

      // --- LOGIC: PAGINATION ---
      const totalPages = Math.ceil(filtered.length / st.itemsPerPage) || 1;
      const paginatedData = filtered.slice(
        (st.currentPage - 1) * st.itemsPerPage,
        st.currentPage * st.itemsPerPage
      );

      renderTable(paginatedData);
      renderPagination(totalPages);
    };

    const renderTable = (paginatedData) => {
      const tableBody = document.getElementById("historyTableBody");
      if (paginatedData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="padding:50px; text-align:center; color:#72767d;">Belum ada riwayat transaksi.</td></tr>`;
        return;
      }

      tableBody.innerHTML = paginatedData
        .map((h) => {
          const statusColor = h.status === "approved" ? "#43b581" : "#ed4245";
          const date = h.processed_at
            ? new Date(h.processed_at)
            : new Date(h.created_at);

          return `
                <tr style="border-bottom: 1px solid #40444b; transition: 0.2s;" onmouseover="this.style.background='#36393f'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 15px; font-size: 0.8rem; color: #b9bbbe;">
                        ${date.toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </td>
                    <td style="padding: 15px;">
                        <div style="font-weight:bold; color:#fff;">${
                          h.requested_by
                        }</div>
                    </td>
                    <td style="padding: 15px;">
                        <div style="color:#fff; font-size:0.9rem;">${
                          h.item_name
                        } <span style="color:#72767d;">x${
            h.quantity
          }</span></div>
                        <div style="font-size:0.7rem; color:#5865F2; text-transform:uppercase; font-weight:bold;">${
                          h.item_type
                        }</div>
                    </td>
                    <td style="padding: 15px;">
                        <span style="color:${statusColor}; font-weight:bold; font-size:0.65rem; text-transform:uppercase; border:1px solid ${statusColor}44; padding:3px 10px; border-radius:4px; background:${statusColor}11;">
                            ${h.status}
                        </span>
                    </td>
                    <td style="padding: 15px; color: #43b581; font-weight: bold;">${
                      h.total_price || "$0"
                    }</td>
                    <td style="padding: 15px; color: #72767d; font-size: 0.8rem;">
                        ${
                          h.processed_by ||
                          '<span style="font-style:italic; opacity:0.5;">System</span>'
                        }
                    </td>
                </tr>`;
        })
        .join("");
    };

    const renderPagination = (totalPages) => {
      const container = document.getElementById("histPagination");
      if (totalPages <= 1) {
        container.innerHTML = "";
        return;
      }

      const curr = st.currentPage;
      const btnStyle = `border:none; color:white; padding:8px 12px; margin:0 2px; border-radius:6px; cursor:pointer; font-size:0.8rem; background:#202225;`;

      let html = `<div style="display:flex; background:#23272a; padding:5px; border-radius:8px;">`;
      for (let i = 1; i <= totalPages; i++) {
        html += `<button class="pg-nav" data-page="${i}" style="${btnStyle} ${
          i === curr ? "background:#5865F2; border:1px solid white;" : ""
        }">${i}</button>`;
      }
      html += `</div>`;

      container.innerHTML = html;
      container.querySelectorAll(".pg-nav").forEach((btn) => {
        btn.onclick = () => {
          st.currentPage = parseInt(btn.dataset.page);
          loadHistory();
        };
      });
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
