export const HistoryPage = {
  render: () => `
    <div class="history-container">
        <h3>Riwayat Pesanan Anda</h3>
        <p style="text-align: center; font-size: 0.8rem; color: #b9bbbe; margin-bottom: 20px;">Daftar 20 pesanan terakhir Anda.</p>
        <div id="history-list" class="history-list">
            <p style="text-align:center; color:#72767d;">Memuat riwayat...</p>
        </div>
    </div>
  `,

  init: async (supabase, userData) => {
    const listContainer = document.getElementById("history-list");
    if (!listContainer) return;

    try {
      // Ambil data orders berdasarkan nama lengkap member
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("requested_by", userData.nama_lengkap)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      if (!data || data.length === 0) {
        listContainer.innerHTML = `<p style="text-align:center; color:#72767d; margin-top:20px;">Belum ada riwayat pesanan.</p>`;
        return;
      }

      listContainer.innerHTML = data.map(item => {
        // Tentukan warna badge status
        let statusColor = "#faa61a"; // Pending (Orange)
        if (item.status === "completed" || item.status === "processed") statusColor = "#43b581"; // Success (Green)
        if (item.status === "cancelled" || item.status === "rejected") statusColor = "#f04747"; // Failed (Red)

        const date = new Date(item.created_at).toLocaleDateString('id-ID', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });

        return `
          <div class="history-card">
            <div class="history-card-header">
              <span class="history-date">${date}</span>
              <span class="status-badge" style="background: ${statusColor}">${item.status.toUpperCase()}</span>
            </div>
            <div class="history-card-body">
              <div class="item-info">
                <span class="item-name">${item.item_name} (x${item.quantity})</span>
                <span class="item-price">${item.total_price}</span>
              </div>
              <small style="color: #72767d;">Tipe: ${item.item_type}</small>
            </div>
          </div>
        `;
      }).join("");

    } catch (err) {
      console.error("History Error:", err);
      listContainer.innerHTML = `<p style="text-align:center; color:#f04747;">Gagal memuat riwayat.</p>`;
    }
  }
};