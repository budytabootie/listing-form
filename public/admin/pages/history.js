/** @param {any} supabase */
export const HistoryPage = {
  state: {
    searchQuery: "",
    currentPage: 1,
    itemsPerPage: 10,
    allData: [],
    searchTimeout: null,
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
                <div id="totalRevenue" style="color:#43b581; font-weight:bold; font-size:1.8rem; margin-top:5px;">$ 0</div>
            </div>
        </div>

        <div style="background: #2f3136; border-radius: 12px; overflow: hidden; border: 1px solid #40444b; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            <table style="width: 100%; border-collapse: collapse; font-size:0.9rem;">
                <thead>
                    <tr style="background: #202225; text-align: left;">
                        <th style="padding: 18px; font-size:0.75rem; color:#b9bbbe; text-transform:uppercase;">Waktu Selesai</th>
                        <th style="padding: 18px; font-size:0.75rem; color:#b9bbbe; text-transform:uppercase;">Member</th>
                        <th style="padding: 18px; font-size:0.75rem; color:#b9bbbe; text-transform:uppercase;">Ringkasan Item</th>
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
      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items (*)`)
        .neq("status", "pending")
        .order("processed_at", { ascending: false });

      if (error) return console.error(error);
      st.allData = data || [];

      calculateRevenue(st.allData);
      refreshUI();
    };

    const calculateRevenue = (data) => {
      const revenue = data
        .filter((h) =>
          ["approved", "processed", "success"].includes(
            h.status?.toLowerCase(),
          ),
        )
        .reduce((sum, h) => {
          // Menghitung total dengan menjumlahkan 'price' dari array order_items
          // Ini jauh lebih akurat daripada mengambil teks total_price
          const itemTotal =
            h.order_items?.reduce(
              (s, item) => s + (Number(item.price) || 0),
              0,
            ) || 0;

          return sum + itemTotal;
        }, 0);

      const el = document.getElementById("totalRevenue");
      if (el) el.innerText = `$ ${revenue.toLocaleString("en-US")}`;
    };

    const refreshUI = () => {
      const filtered = st.allData.filter((h) => {
        const search = st.searchQuery.toLowerCase();
        return (
          h.requested_by?.toLowerCase().includes(search) ||
          h.item_name?.toLowerCase().includes(search) ||
          h.order_items?.some((item) =>
            item.item_name.toLowerCase().includes(search),
          )
        );
      });

      const totalPages = Math.ceil(filtered.length / st.itemsPerPage) || 1;
      const paginatedData = filtered.slice(
        (st.currentPage - 1) * st.itemsPerPage,
        st.currentPage * st.itemsPerPage,
      );

      renderTable(paginatedData);
      renderPagination(totalPages);
    };

    const renderTable = (data) => {
      const tableBody = document.getElementById("historyTableBody");
      if (!tableBody) return;

      if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="padding:50px; text-align:center; color:#72767d;">Data tidak ditemukan.</td></tr>`;
        return;
      }

      tableBody.innerHTML = data
        .map((h) => {
          const currentStatus = (h.status || "pending").toLowerCase();
          let statusColor = "#72767d";
          let statusLabel = h.status.toUpperCase();

          if (["processed", "approved", "success"].includes(currentStatus)) {
            statusColor = "#43b581";
            statusLabel = "SUCCESS";
          } else if (
            ["rejected", "cancelled", "failed"].includes(currentStatus)
          ) {
            statusColor = "#f04747";
            statusLabel = "REJECTED";
          }

          const date = new Date(h.processed_at || h.created_at);

          // Fallback jika item_name kosong, ambil dari order_items pertama
          const displayItem =
            h.item_name ||
            h.order_items?.[0]?.item_name +
              (h.order_items?.length > 1 ? "..." : "") ||
            "Multi Items";

          return `
            <tr style="border-bottom: 1px solid #40444b; cursor:pointer;" class="hist-row" onclick="window.viewHistoryDetail('${
              h.id
            }')">
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
                    <div style="color:#fff; font-size:0.85rem; max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${displayItem}</div>
                    <div style="font-size:0.65rem; color:#5865F2; font-weight:bold;">${
                      h.item_type || "LOGISTICS"
                    }</div>
                </td>
                <td style="padding: 15px; text-align:center;">
                    <span style="color:${statusColor}; font-weight:bold; font-size:0.65rem; text-transform:uppercase; border:1px solid ${statusColor}44; padding:4px 12px; border-radius:20px; background:${statusColor}22; display:inline-block; min-width:80px;">
                        ${statusLabel}
                    </span>
                </td>
                <td style="padding: 15px; color: #43b581; font-weight: bold;">${
                  h.total_price
                }</td>
                <td style="padding: 15px; color: #72767d; font-size: 0.8rem;">
                  ${h.processed_by_name || "System"}
                </td>
            </tr>`;
        })
        .join("");
    };

    window.viewHistoryDetail = (id) => {
      const order = st.allData.find((h) => h.id == id);
      if (!order) return;

      const itemRincianHtml = (order.order_items || [])
        .map(
          (item) => `
        <div style="background: #18191c; padding: 12px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #444;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:#fff;">${item.item_name}</strong>
            <span style="color:#43b581; font-weight:bold; background:#43b58122; padding:2px 8px; border-radius:4px;">x${
              item.quantity
            }</span>
          </div>
          ${
            item.sn_list
              ? `
            <div style="margin-top:8px;">
                <small style="color:#b9bbbe; font-size:0.7rem;">SERIAL NUMBERS:</small>
                <div style="font-family:monospace; font-size:0.75rem; color:#faa61a; background:#000; padding:6px; border-radius:4px; margin-top:4px; border:1px solid #333;">${item.sn_list}</div>
            </div>`
              : ""
          }
          <div style="font-size:0.65rem; color:${
            item.status === "rejected" ? "#f04747" : "#72767d"
          }; text-transform:uppercase; margin-top:5px; font-weight:bold;">
            Status: ${item.status}
          </div>
        </div>`,
        )
        .join("");

      Swal.fire({
        title: `<span style="color: #fff;">Detail Riwayat</span>`,
        background: "#2f3136",
        color: "#fff",
        width: "500px",
        html: `
            <div style="text-align: left; font-size: 0.9rem; line-height: 1.6;">
                <div style="margin-bottom: 15px;">
                    <small style="color:#b9bbbe;">Daftar Item & Rincian:</small>
                    <div style="margin-top:10px; max-height:280px; overflow-y:auto; padding-right:5px;" class="custom-scroll">
                      ${itemRincianHtml}
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div style="background: #202225; padding: 10px; border-radius: 8px; border: 1px solid #444;">
                        <small style="color: #b9bbbe;">Member:</small><br>
                        <strong>${order.requested_by}</strong>
                    </div>
                    <div style="background: #202225; padding: 10px; border-radius: 8px; border: 1px solid #444;">
                        <small style="color: #b9bbbe;">Admin:</small><br>
                        <strong>${order.processed_by_name || "System"}</strong>
                    </div>
                </div>
                <div style="background: #202225; padding: 15px; border-radius: 8px; border: 1px solid #444;">
                    <p style="margin:0; display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:#b9bbbe;">Total Transaksi:</span>
                        <span style="color:#43b581; font-weight:bold; font-size:1.2rem;">${
                          order.total_price
                        }</span>
                    </p>
                </div>
            </div>
        `,
        confirmButtonText: "Tutup",
        confirmButtonColor: "#4f545c",
      });
    };

    const renderPagination = (totalPages) => {
      const container = document.getElementById("histPagination");
      if (!container || totalPages <= 1) {
        if (container) container.innerHTML = "";
        return;
      }
      const curr = st.currentPage;
      const baseStyle = `border:none; color:white; padding:8px 12px; margin:0 2px; border-radius:6px; cursor:pointer; font-size:0.8rem; transition:all 0.2s; display:flex; align-items:center; justify-content:center; min-width:35px;`;
      const navStyle = `background: #202225; color: #b9bbbe;`;

      let start = Math.max(1, curr - 1);
      let end = Math.min(totalPages, start + 2);
      if (end - start < 2) start = Math.max(1, end - 2);

      let html = `<div style="display:flex; background:#23272a; padding:5px; border-radius:8px; border:1px solid #36393f;">`;
      html += `<button class="pg-nav" data-page="1" ${
        curr === 1
          ? 'disabled style="' + baseStyle + navStyle + 'opacity:0.2"'
          : 'style="' + baseStyle + navStyle + '"'
      }><i class="fas fa-angles-left"></i></button>`;

      for (let i = start; i <= end; i++) {
        const isActive = i === curr;
        html += `<button class="pg-nav" data-page="${i}" style="${baseStyle} background:${
          isActive ? "#5865F2" : "#4f545c"
        }; ${
          isActive
            ? "box-shadow: 0 4px 12px rgba(88,101,242,0.4); border:1px solid white;"
            : ""
        }"> ${i} </button>`;
      }

      html += `<button class="pg-nav" data-page="${totalPages}" ${
        curr === totalPages
          ? 'disabled style="' + baseStyle + navStyle + 'opacity:0.2"'
          : 'style="' + baseStyle + navStyle + '"'
      }><i class="fas fa-angles-right"></i></button></div>`;

      container.innerHTML = html;
      container.querySelectorAll(".pg-nav").forEach((btn) => {
        btn.onclick = () => {
          st.currentPage = parseInt(btn.dataset.page);
          refreshUI();
        };
      });
    };

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
