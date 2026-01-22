/** @param {any} supabase */
export const AdminDashboard = {
  state: {
    chartInstances: [],
    timeFilter: "7",
  },

  render: () => `
    <div class="header-container" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <div>
            <h2 style="margin:0;">Executive Dashboard</h2>
            <p style="color: #b9bbbe; margin-top: 5px; font-size: 0.9rem;">Analisis performa logistik berdasarkan data real-time.</p>
        </div>
        <div style="background: #2f3136; padding: 10px; border-radius: 8px; border: 1px solid #4f545c;">
            <label style="color:#b9bbbe; font-size:0.75rem; font-weight:bold; margin-right:10px;">PERIODE:</label>
            <select id="dashboardTimeFilter" style="background: #202225; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                <option value="7">7 Hari Terakhir</option>
                <option value="30">30 Hari Terakhir</option>
                <option value="365">1 Tahun Terakhir</option>
                <option value="all">Semua Waktu</option>
            </select>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
        <div style="background: #2f3136; padding: 20px; border-radius: 12px; border-left: 4px solid #43b581;">
            <div style="color: #b9bbbe; font-size: 0.75rem; font-weight: bold;">PENDAPATAN (PERIODE)</div>
            <div id="revenueVal" style="font-size: 1.5rem; color: #fff; font-weight: bold; margin-top: 5px;">$ 0</div>
        </div>
        <div style="background: #2f3136; padding: 20px; border-radius: 12px; border-left: 4px solid #5865f2;">
            <div style="color: #b9bbbe; font-size: 0.75rem; font-weight: bold;">TOTAL TRANSAKSI</div>
            <div id="ordersVal" style="font-size: 1.5rem; color: #fff; font-weight: bold; margin-top: 5px;">0</div>
        </div>
        <div style="background: #2f3136; padding: 20px; border-radius: 12px; border-left: 4px solid #faa61a;">
            <div style="color: #b9bbbe; font-size: 0.75rem; font-weight: bold;">ITEM KELUAR</div>
            <div id="itemsVal" style="font-size: 1.5rem; color: #fff; font-weight: bold; margin-top: 5px;">0</div>
        </div>
        <div style="background: #2f3136; padding: 20px; border-radius: 12px; border-left: 4px solid #9b59b6;">
            <div style="color: #b9bbbe; font-size: 0.75rem; font-weight: bold;">TOP REQUESTER</div>
            <div id="topMemberVal" style="font-size: 1.1rem; color: #fff; font-weight: bold; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">-</div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px;">
        <div style="background: #2f3136; padding: 20px; border-radius: 12px; height: 450px;">
            <h4 style="color:#fff; margin-top:0;"><i class="fas fa-poll"></i> Tren Penjualan Item</h4>
            <div style="height: 380px; position: relative;"><canvas id="itemTrendChart"></canvas></div>
        </div>
        <div style="background: #2f3136; padding: 20px; border-radius: 12px; height: 450px;">
            <h4 style="color:#fff; margin-top:0;"><i class="fas fa-chart-pie"></i> Komposisi Tipe</h4>
            <div style="height: 380px; position: relative;"><canvas id="categoryChart"></canvas></div>
        </div>
    </div>
  `,

  init: async (supabase) => {
    const st = AdminDashboard.state;

    // Helper: Fungsi Animasi Angka
    const animateValue = (id, value, prefix = "") => {
      const el = document.getElementById(id);
      if (!el) return;
      let start = 0;
      const duration = 1000;
      const step = Math.ceil(value / (duration / 16));
      const timer = setInterval(() => {
        start += step;
        if (start >= value) {
          el.innerText = prefix + value.toLocaleString();
          clearInterval(timer);
        } else {
          el.innerText = prefix + start.toLocaleString();
        }
      }, 16);
    };

    const loadData = async () => {
      st.chartInstances.forEach((chart) => chart.destroy());
      st.chartInstances = [];

      // Query database: Ambil order_items dan join dengan orders untuk filter status
      let query = supabase.from("order_items").select(`
                *,
                orders (requested_by, status, processed_at, created_at)
            `);

      // Filter Waktu berdasarkan created_at di tabel order_items
      if (st.timeFilter !== "all") {
        const days = parseInt(st.timeFilter);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte("created_at", startDate.toISOString());
      }

      const { data: items, error } = await query;
      if (error) return console.error("Dashboard Error:", error);

      let metrics = {
        revenue: 0,
        itemsOut: 0,
        totalOrders: new Set(),
      };
      const itemStats = {};
      const categoryStats = {};
      const memberStats = {};

      if (items) {
        items.forEach((item) => {
          // Hanya hitung jika status order (bukan status item) adalah approved/processed/success
          const orderStatus = item.orders?.status?.toLowerCase() || "";

          if (["approved", "processed", "success"].includes(orderStatus)) {
            // Catat ID Order yang unik
            if (item.order_id) metrics.totalOrders.add(item.order_id);

            // Perhitungan Revenue & Qty
            const price = Number(item.price) || 0;
            const qty = Number(item.quantity) || 1;

            metrics.revenue += price;
            metrics.itemsOut += qty;

            // Stats Item & Kategori
            const name = item.item_name || "Unknown";
            itemStats[name] = (itemStats[name] || 0) + qty;

            const type = item.item_type || "Lain-lain";
            categoryStats[type] = (categoryStats[type] || 0) + qty;

            // Stats Member
            const req = item.orders?.requested_by || "Unknown";
            memberStats[req] = (memberStats[req] || 0) + 1;
          }
        });
      }

      // Update UI
      animateValue("revenueVal", metrics.revenue, "$ ");
      document.getElementById("ordersVal").innerText = metrics.totalOrders.size;
      document.getElementById("itemsVal").innerText = metrics.itemsOut;

      const topMember = Object.entries(memberStats).sort(
        (a, b) => b[1] - a[1],
      )[0];
      document.getElementById("topMemberVal").innerText = topMember
        ? topMember[0]
        : "-";

      renderCharts(itemStats, categoryStats);
    };

    const renderCharts = (itemStats, categoryStats) => {
      const canvasBar = document.getElementById("itemTrendChart");
      const canvasPie = document.getElementById("categoryChart");
      if (!canvasBar || !canvasPie) return;

      const sortedItems = Object.entries(itemStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const barChart = new Chart(canvasBar.getContext("2d"), {
        type: "bar",
        data: {
          labels: sortedItems.map((x) => x[0]),
          datasets: [
            {
              label: "Unit",
              data: sortedItems.map((x) => x[1]),
              backgroundColor: "#5865f2",
              borderRadius: 5,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: "#444" }, ticks: { color: "#b9bbbe" } },
            y: { grid: { display: false }, ticks: { color: "#fff" } },
          },
        },
      });

      const pieChart = new Chart(canvasPie.getContext("2d"), {
        type: "doughnut",
        data: {
          labels: Object.keys(categoryStats),
          datasets: [
            {
              data: Object.values(categoryStats),
              backgroundColor: [
                "#5865f2",
                "#9b59b6",
                "#faa61a",
                "#43b581",
                "#e91e63",
                "#00bcd4",
                "#8e44ad",
              ],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#b9bbbe", padding: 20 },
            },
          },
          cutout: "70%",
        },
      });

      st.chartInstances.push(barChart, pieChart);
    };

    // Filter Event Listener
    const filterEl = document.getElementById("dashboardTimeFilter");
    if (filterEl) {
      filterEl.value = st.timeFilter;
      filterEl.onchange = (e) => {
        st.timeFilter = e.target.value;
        loadData();
      };
    }

    await loadData();
  },
};
