export const HistoryPage = {
  render: () => `
    <div class="category-page">
        <div class="category-header" style="--header-bg: rgba(114, 118, 125, 0.1); --header-color: #72767d;">
            <button onclick="window.loadPage('home')" class="back-btn-modern"><i class="fas fa-chevron-left"></i></button>
            <div class="header-title">
                <h2 style="letter-spacing: 4px;">ORDER LOGS</h2>
                <span class="header-subtitle">Arsip digital transaksi perlengkapan</span>
            </div>
            <div class="header-icon-main"><i class="fas fa-terminal"></i></div>
        </div>

        <div class="history-table-wrapper">
            <div class="history-table-header">
                <div class="col-date">TANGGAL</div>
                <div class="col-main">DETAIL ITEM</div>
                <div class="col-status">STATUS</div>
            </div>
            <div id="history-list" class="history-rows-container">
                <div style="text-align:center; padding: 40px; color:#72767d;">
                    <i class="fas fa-sync fa-spin"></i> Synchronizing logs...
                </div>
            </div>
        </div>
    </div>
  `,

  init: async (supabase, userData) => {
    const listContainer = document.getElementById("history-list");
    if (!listContainer) return;

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("requested_by", userData.nama_lengkap)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      if (!data || data.length === 0) {
        listContainer.innerHTML = `<div class="empty-history">Empty Database</div>`;
        return;
      }

      listContainer.innerHTML = data
        .map((item) => {
          // --- LOGIKA STATUS ---
          let statusClass = "st-pending";
          let statusIcon = "fa-spinner";
          const currentStatus = (item.status || "pending").toLowerCase();

          if (
            ["completed", "processed", "approved", "success"].includes(
              currentStatus
            )
          ) {
            statusClass = "st-success";
            statusIcon = "fa-check";
          } else if (
            ["cancelled", "rejected", "failed"].includes(currentStatus)
          ) {
            statusClass = "st-error";
            statusIcon = "fa-exclamation-triangle";
          }

          // --- FIX NaN (Pembersihan Karakter Non-Angka) ---
          // Kita ambil nilai dari total_price atau price
          let rawPrice = item.total_price || item.price || "0";

          // Jika rawPrice berupa string (misal: "1.000.000"), hapus titik/koma/simbol
          if (typeof rawPrice === "string") {
            rawPrice = rawPrice.replace(/[^0-9.-]+/g, "");
          }

          const cleanPrice = parseFloat(rawPrice);
          const displayPrice = isNaN(cleanPrice)
            ? "0"
            : cleanPrice.toLocaleString("id-ID");

          const dateObj = new Date(item.created_at);
          const day = dateObj.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
          });
          const time = dateObj.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return `
          <div class="history-row-item">
            <div class="col-date">
                <div class="date-txt">${day}</div>
                <div class="time-txt">${time}</div>
            </div>
            <div class="col-main">
                <div class="item-type-tag">${item.item_type || "ITEM"}</div>
                <div class="item-name-row">${
                  item.item_name
                } <span class="qty-badge">x${item.quantity || 0}</span></div>
                <div class="item-price-row">$ ${displayPrice}</div>
            </div>
            <div class="col-status">
                <div class="status-pill ${statusClass}">
                    <i class="fas ${statusIcon}"></i>
                    <span>${
                      item.status ? item.status.toUpperCase() : "PENDING"
                    }</span>
                </div>
            </div>
          </div>
        `;
        })
        .join("");
    } catch (err) {
      console.error(err);
      listContainer.innerHTML = `<div class="empty-history" style="color:#f04747">Database Error</div>`;
    }
  },
};
