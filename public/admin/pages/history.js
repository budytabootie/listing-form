/** @param {any} supabase */
export const HistoryPage = {
  state: {
    searchQuery: "",
    currentPage: 1,
    itemsPerPage: 10,
    allData: [],
    searchTimeout: null, // Untuk debouncing
  },

  render: () => `
        <div style="display:flex; justify-content:space-between; align-items:end; margin-bottom: 25px; gap: 20px;">
            <div>
                <h2 style="margin:0 0 10px 0;">Riwayat Logistik</h2>
                <div style="position:relative;">
                    <i class="fas fa-search" style="position:absolute; left:12px; top:12px; color:#4f545c;"></i>
                    <input type="text" id="histSearch" placeholder="Cari member atau item..." 
                        style="width: 320px; padding: 10px 10px 10px 40px; background:#202225; color:white; border-radius:8px; border:1px solid #4f545c; font-size:0.9rem;">
                </div>
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
                        <th style="padding: 18px; font-size:0.75rem; color:#b9bbbe; text-transform:uppercase; text-align:center;">Status</th>
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
      // Optimalisasi 4: Hanya ambil kolom yang diperlukan (Select Specific Columns)
      const { data, error } = await supabase
        .from("orders")
        .select(
          "processed_at, created_at, requested_by, item_name, quantity, item_type, notes, status, total_price, processed_by"
        )
        .neq("status", "pending")
        .order("processed_at", { ascending: false });

      if (error) return console.error(error);
      st.allData = data || [];

      calculateRevenue(st.allData);
      refreshUI();
    };

    const calculateRevenue = (data) => {
      const revenue = data
        .filter((h) => h.status === "approved")
        .reduce((sum, h) => {
          // Robust Price Parsing
          const price =
            typeof h.total_price === "string"
              ? parseFloat(h.total_price.replace(/[^-0-9.]/g, ""))
              : h.total_price;
          return sum + (price || 0);
        }, 0);

      document.getElementById(
        "totalRevenue"
      ).innerText = `$${revenue.toLocaleString()}`;
    };

    const refreshUI = () => {
      const filtered = st.allData.filter(
        (h) =>
          h.requested_by
            ?.toLowerCase()
            .includes(st.searchQuery.toLowerCase()) ||
          h.item_name?.toLowerCase().includes(st.searchQuery.toLowerCase())
      );

      const totalPages = Math.ceil(filtered.length / st.itemsPerPage) || 1;
      const paginatedData = filtered.slice(
        (st.currentPage - 1) * st.itemsPerPage,
        st.currentPage * st.itemsPerPage
      );

      renderTable(paginatedData);
      renderPagination(totalPages);
    };

    const renderTable = (data) => {
      const tableBody = document.getElementById("historyTableBody");
      if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="padding:50px; text-align:center; color:#72767d;">Data tidak ditemukan.</td></tr>`;
        return;
      }

      tableBody.innerHTML = data
        .map((h) => {
          const isApproved = h.status === "approved";
          const statusBg = isApproved ? "#43b58122" : "#ed424522";
          const statusText = isApproved ? "#43b581" : "#ed4245";
          const date = new Date(h.processed_at || h.created_at);

          return `
            <tr style="border-bottom: 1px solid #40444b;" class="hist-row">
                <td style="padding: 15px; font-size: 0.8rem; color: #b9bbbe;">
                    ${date.toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </td>
                <td style="padding: 15px; font-weight:bold; color:#fff;">${
                  h.requested_by
                }</td>
                <td style="padding: 15px;">
                    <div style="color:#fff;">${
                      h.item_name
                    } <span style="color:#72767d;">x${h.quantity}</span></div>
                    <div style="font-size:0.65rem; color:#5865F2; font-weight:bold;">${
                      h.item_type || "ITEM"
                    }</div>
                </td>
                <td style="padding: 15px; text-align:center;">
                    <span style="color:${statusText}; font-weight:bold; font-size:0.65rem; text-transform:uppercase; border:1px solid ${statusText}44; padding:4px 12px; border-radius:20px; background:${statusBg}; display:inline-block; min-width:80px;">
                        ${h.status}
                    </span>
                </td>
                <td style="padding: 15px; color: #43b581; font-weight: bold;">${
                  h.total_price || "$0"
                }</td>
                <td style="padding: 15px; color: #72767d; font-size: 0.8rem;">${
                  h.processed_by || "System"
                }</td>
            </tr>`;
        })
        .join("");
    };

    const renderPagination = (totalPages) => {
      const container = document.getElementById("histPagination");
      if (!container || totalPages <= 1) {
        container.innerHTML = "";
        return;
      }

      const curr = st.currentPage;
      // Style dasar yang disamakan dengan BundlePage
      const baseStyle = `border:none; color:white; padding:8px 12px; margin:0 2px; border-radius:6px; cursor:pointer; font-size:0.8rem; transition:all 0.2s; display:flex; align-items:center; justify-content:center; min-width:35px;`;
      const navStyle = `background: #202225; color: #b9bbbe;`;

      let start = Math.max(1, curr - 1);
      let end = Math.min(totalPages, start + 2);
      if (end - start < 2) start = Math.max(1, end - 2);

      let html = `<div style="display:flex; background:#23272a; padding:5px; border-radius:8px; border:1px solid #36393f; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">`;

      // Tombol First & Prev
      html += `
        <button class="pg-nav" data-page="1" ${
          curr === 1
            ? 'disabled style="' + baseStyle + navStyle + 'opacity:0.2"'
            : 'style="' + baseStyle + navStyle + '"'
        }>
          <i class="fas fa-angles-left"></i>
        </button>
        <button class="pg-nav" data-page="${curr - 1}" ${
        curr === 1
          ? 'disabled style="' + baseStyle + navStyle + 'opacity:0.2"'
          : 'style="' + baseStyle + navStyle + '"'
      }>
          <i class="fas fa-chevron-left"></i>
        </button>
      `;

      // Nomor Halaman (Smart Range)
      for (let i = start; i <= end; i++) {
        const isActive = i === curr;
        html += `<button class="pg-nav" data-page="${i}" style="${baseStyle} background:${
          isActive ? "#5865F2" : "#4f545c"
        }; ${
          isActive
            ? "box-shadow: 0 4px 12px rgba(88,101,242,0.4); border:1px solid white;"
            : ""
        }">
          ${i}
        </button>`;
      }

      // Tombol Next & Last
      html += `
        <button class="pg-nav" data-page="${curr + 1}" ${
        curr === totalPages
          ? 'disabled style="' + baseStyle + navStyle + 'opacity:0.2"'
          : 'style="' + baseStyle + navStyle + '"'
      }>
          <i class="fas fa-chevron-right"></i>
        </button>
        <button class="pg-nav" data-page="${totalPages}" ${
        curr === totalPages
          ? 'disabled style="' + baseStyle + navStyle + 'opacity:0.2"'
          : 'style="' + baseStyle + navStyle + '"'
      }>
          <i class="fas fa-angles-right"></i>
        </button>
      </div>`;

      container.innerHTML = html;

      container.querySelectorAll(".pg-nav").forEach((btn) => {
        btn.onclick = () => {
          if (btn.disabled || btn.style.opacity === "0.2") return;
          st.currentPage = parseInt(btn.dataset.page);
          refreshUI();
        };
      });
    };

    // --- Optimalisasi 1: Debounced Search ---
    document.getElementById("histSearch").oninput = (e) => {
      clearTimeout(st.searchTimeout);
      st.searchTimeout = setTimeout(() => {
        st.searchQuery = e.target.value;
        st.currentPage = 1;
        refreshUI();
      }, 300);
    };

    loadHistory();
  },
};
