export const WeedPage = {
  render: () => `
    <div class="dashboard-header">
        <h1><i class="fas fa-microscope" style="color: #43b581;"></i> Weed Operations Traceability</h1>
        <p style="color: #b9bbbe;">Sistem Pelacakan Berbasis Batch: Seed Source → Production → Distribution.</p>
    </div>

    <div class="weed-grid-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
        
        <div class="admin-card" style="border-left: 4px solid #faa61a;">
            <div class="card-header-modern"><i class="fas fa-seedling"></i> Seed Bank Summary</div>
            <div class="inv-box" style="background:#202225; padding:15px; border-radius:8px; text-align:center; margin: 10px 0;">
                <span id="display-available-seeds" style="font-size:2rem; font-weight:bold; color:#faa61a;">0</span>
                <small style="display:block; color:#72767d;">Total Seeds Available</small>
            </div>
            <div id="seed-batch-details" style="font-size:0.7rem; color:#b9bbbe; max-height:100px; overflow-y:auto;"></div>
            <button class="btn-primary-weed" onclick="window.weedActions.restockSeeds()" style="width:100%; background:#faa61a; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer; font-weight:bold; margin-top:10px;">New Seed Shipment</button>
        </div>

        <div class="admin-card" style="border-left: 4px solid #43b581;">
            <div class="card-header-modern"><i class="fas fa-warehouse"></i> Warehouse Summary</div>
            <div class="inv-box" style="background:#202225; padding:15px; border-radius:8px; text-align:center; margin: 10px 0;">
                <span id="display-warehouse-buds" style="font-size:2rem; font-weight:bold; color:#43b581;">0</span>
                <small style="display:block; color:#72767d;">Total Buds Ready</small>
            </div>
            <div id="warehouse-batch-details" style="font-size:0.7rem; color:#b9bbbe; max-height:100px; overflow-y:auto;"></div>
        </div>

        <div class="admin-card" style="border-left: 4px solid #f04747;">
          <div class="card-header-modern"><i class="fas fa-hand-holding-slash"></i> Total Loss Tracking</div>
          <div class="inv-box" style="background:#202225; padding:15px; border-radius:8px; text-align:center; margin: 10px 0;">
              <span id="display-total-loss" style="font-size:2rem; font-weight:bold; color:#f04747;">0</span>
              <small style="display:block; color:#72767d;">Buds Lost / Seized</small>
          </div>
          <div id="loss-by-source" style="font-size:0.7rem; color:#b9bbbe;"></div>
        </div>

    </div>

    <div class="weed-grid-container" style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px; margin-top: 20px;">
        <div class="admin-card">
            <div class="card-header-modern"><i class="fas fa-industry"></i> Production Log</div>
            <div id="active-batches-list" class="mini-log-container" style="max-height: 450px; overflow-y: auto; margin-top:10px;"></div>
            <button class="btn-primary-weed" onclick="window.weedActions.startBatch()" style="width:100%; background:#5865f2; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer; margin-top:10px;">Start Production from Batch</button>
        </div>

        <div class="admin-card">
            <div class="card-header-modern"><i class="fas fa-biking"></i> Distribution (On Street)</div>
            <div class="table-responsive">
                <table class="admin-table" style="width: 100%; margin-top:10px; font-size:0.85rem;">
                    <thead>
                        <tr style="text-align: left; color: #72767d; border-bottom: 1px solid #40444b;">
                            <th style="padding:10px;">BATCH ORIGIN</th>
                            <th>DEALER</th>
                            <th>QTY</th>
                            <th>LOSS</th>
                            <th>STATUS</th>
                            <th style="text-align:right;">ACTION</th>
                        </tr>
                    </thead>
                    <tbody id="sales-tracker-body"></tbody>
                </table>
            </div>
            <button class="btn-success-weed" onclick="window.weedActions.assignSales()" style="margin-top:15px; background:#43b581; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold;">Assign New Dealer</button>
        </div>
    </div>

    <div class="admin-card" style="margin-top: 20px; border-top: 4px solid #f04747;">
        <div class="card-header-modern">
            <i class="fas fa-exclamation-triangle" style="color:#f04747;"></i> Dealer Risk Assessment (Loss Analytics)
        </div>
        <div class="table-responsive">
            <table class="admin-table" style="width: 100%; margin-top:10px; font-size:0.85rem;">
                <thead>
                    <tr style="text-align: left; color: #72767d; border-bottom: 1px solid #40444b;">
                        <th style="padding:10px;">DEALER NAME</th>
                        <th>TOTAL ASSIGNED</th>
                        <th>TOTAL LOSS</th>
                        <th>SUCCESS RATE</th>
                        <th style="text-align:right;">RISK LEVEL</th>
                    </tr>
                </thead>
                <tbody id="loss-analytics-body"></tbody>
            </table>
        </div>
    </div>
  `,

  init: async (supabase, userData) => {
    const allowedRoles = [1, 2, 5];
    if (!allowedRoles.includes(userData.role_id)) {
      document.getElementById(
        "content-area"
      ).innerHTML = `<div style="text-align:center; padding:50px; color:white;"><h2>Akses Ditolak</h2></div>`;
      return;
    }

    const formatDateBatch = (dateStr) => {
      const d = new Date(dateStr);
      const months = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MEI",
        "JUN",
        "JUL",
        "AGU",
        "SEP",
        "OKT",
        "NOV",
        "DES",
      ];
      const week = Math.ceil(d.getDate() / 7);
      return `${months[d.getMonth()]}-W${week}`;
    };

    const updateAllData = async () => {
      const { data: restocks } = await supabase
        .from("weed_seed_restocks")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: batches } = await supabase
        .from("weed_batches")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: sales } = await supabase
        .from("weed_sales")
        .select("*")
        .order("created_at", { ascending: false });

      let seedSummary = [];
      let warehouseSummary = [];
      let totalLossGlobal = 0;
      const dealerStats = {};

      restocks?.forEach((r) => {
        const batchName = `Batch-${formatDateBatch(r.created_at)}-${r.id
          .slice(0, 3)
          .toUpperCase()}`;
        const usedSeeds =
          batches
            ?.filter((b) => b.restock_id === r.id)
            .reduce((sum, b) => sum + b.seeds_planted, 0) || 0;
        const remainingSeeds = r.quantity_received - usedSeeds;

        if (remainingSeeds > 0) {
          seedSummary.push({ name: batchName, qty: remainingSeeds, id: r.id });
        }

        const harvestedFromThisBatch =
          batches
            ?.filter((b) => b.restock_id === r.id)
            .reduce((sum, b) => sum + (b.harvest_buds || 0), 0) || 0;
        const distributedFromThisBatch =
          sales
            ?.filter((s) => s.batch_origin === batchName)
            .reduce((sum, s) => sum + s.pouch_count, 0) || 0;
        const remainingBuds = harvestedFromThisBatch - distributedFromThisBatch;

        if (remainingBuds > 0) {
          warehouseSummary.push({ name: batchName, qty: remainingBuds });
        }

        const lossFromThisBatch =
          sales
            ?.filter((s) => s.batch_origin === batchName)
            .reduce((sum, s) => sum + (s.pouches_lost || 0), 0) || 0;
        totalLossGlobal += lossFromThisBatch;
      });

      // Kalkulasi Dealer Stats
      sales?.forEach((s) => {
        const name = s.assigned_to;
        if (!dealerStats[name]) {
          dealerStats[name] = { assigned: 0, lost: 0 };
        }
        dealerStats[name].assigned += s.pouch_count;
        dealerStats[name].lost += s.pouches_lost || 0;
      });

      // Update UI
      document.getElementById("display-available-seeds").innerText =
        seedSummary.reduce((a, b) => a + b.qty, 0);
      document.getElementById("display-warehouse-buds").innerText =
        warehouseSummary.reduce((a, b) => a + b.qty, 0);
      document.getElementById("display-total-loss").innerText = totalLossGlobal;

      document.getElementById("seed-batch-details").innerHTML = seedSummary
        .map(
          (s) =>
            `<div style="display:flex; justify-content:space-between; border-bottom:1px solid #2f3136;"><span>${s.name}</span><span style="color:#faa61a;">${s.qty} sds</span></div>`
        )
        .join("");

      document.getElementById("warehouse-batch-details").innerHTML =
        warehouseSummary
          .map(
            (w) =>
              `<div style="display:flex; justify-content:space-between; border-bottom:1px solid #2f3136;"><span>${w.name}</span><span style="color:#43b581;">${w.qty} buds</span></div>`
          )
          .join("");

      // Render Risk Assessment Table
      const sortedRisk = Object.entries(dealerStats).sort(
        (a, b) => b[1].lost - a[1].lost
      );
      document.getElementById("loss-analytics-body").innerHTML =
        sortedRisk
          .map(([name, stat]) => {
            const lossRate =
              stat.assigned > 0
                ? ((stat.lost / stat.assigned) * 100).toFixed(1)
                : 0;
            let riskColor = "#43b581";
            let riskText = "LOW";
            if (lossRate > 15) {
              riskColor = "#f04747";
              riskText = "EXTREME";
            } else if (lossRate > 10) {
              riskColor = "#faa61a";
              riskText = "HIGH";
            } else if (lossRate > 5) {
              riskColor = "#fee75c";
              riskText = "MEDIUM";
            }

            return `
              <tr style="border-bottom:1px solid #36393f;">
                  <td style="padding:12px; font-weight:bold; color:#fff;">${name}</td>
                  <td>${stat.assigned} Buds</td>
                  <td style="color:#f04747;">${stat.lost} Buds</td>
                  <td style="color:#b9bbbe;">${(100 - lossRate).toFixed(
                    1
                  )}%</td>
                  <td style="text-align:right;">
                      <span style="background:${riskColor}; color:#000; padding:2px 8px; border-radius:10px; font-size:0.65rem; font-weight:bold;">${riskText} (${lossRate}%)</span>
                  </td>
              </tr>`;
          })
          .join("") ||
        "<tr><td colspan='5' style='text-align:center; padding:20px;'>No dealer records.</td></tr>";

      renderTables(batches, sales);
    };

    const renderTables = (batches, sales) => {
      document.getElementById("sales-tracker-body").innerHTML =
        sales
          ?.map(
            (s) => `
        <tr style="border-bottom:1px solid #36393f;">
            <td style="padding:10px; font-size:0.7rem;">${
              s.batch_origin || "Legacy"
            }</td>
            <td style="font-weight:bold;">${s.assigned_to}</td>
            <td>${s.pouch_count}</td>
            <td style="color:#f04747;">${s.pouches_lost || 0}</td>
            <td><span class="badge-${s.status}">${s.status.replace(
              "_",
              " "
            )}</span></td>
            <td style="text-align:right;">
                ${
                  s.status === "on_street"
                    ? `<button onclick="window.weedActions.returnMoney('${s.id}', ${s.pouch_count})" class="btn-sm" style="background:#faa61a; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">SETTLE</button>`
                    : "✅"
                }
            </td>
        </tr>`
          )
          .join("") ||
        "<tr><td colspan='6' style='text-align:center; padding:20px;'>No records</td></tr>";

      document.getElementById("active-batches-list").innerHTML =
        batches
          ?.map(
            (b) => `
        <div class="batch-item" style="background:#2f3136; padding:10px; margin-bottom:10px; border-radius:5px; border-left:4px solid ${
          b.status === "growing" ? "#faa61a" : "#43b581"
        }">
           <div style="font-size:0.7rem; color:#72767d;">Origin: ${
             b.restock_id?.slice(0, 8) || "Unknown"
           }</div>
           <div style="display:flex; justify-content:space-between;">
             <b>${b.seeds_planted} Seeds Planted</b>
             <span>${b.status}</span>
           </div>
           ${
             b.status === "growing"
               ? `<button onclick="window.weedActions.harvestBatch('${b.id}')" style="width:100%; margin-top:5px; background:#43b581; color:white; border:none; padding:4px; border-radius:3px; cursor:pointer;">HARVEST</button>`
               : `<div style="font-size:0.8rem; color:#43b581;">Yield: ${b.harvest_buds} Buds</div>`
           }
        </div>`
          )
          .join("") || "No production history";
    };

    window.weedActions = {
      restockSeeds: async () => {
        const { value: qty } = await Swal.fire({
          title: "Input Seed Shipment",
          input: "number",
          background: "#2f3136",
          color: "#fff",
        });
        if (qty) {
          await supabase
            .from("weed_seed_restocks")
            .insert([{ quantity_received: parseInt(qty) }]);
          updateAllData();
        }
      },

      startBatch: async () => {
        const { data: restocks } = await supabase
          .from("weed_seed_restocks")
          .select("*");
        const { data: batches } = await supabase
          .from("weed_batches")
          .select("*");
        let options = {};
        restocks.forEach((r) => {
          const used =
            batches
              ?.filter((b) => b.restock_id === r.id)
              .reduce((sum, b) => sum + b.seeds_planted, 0) || 0;
          const remain = r.quantity_received - used;
          if (remain > 0)
            options[r.id] = `Batch ${formatDateBatch(
              r.created_at
            )} (Sisa: ${remain})`;
        });

        const { value: form } = await Swal.fire({
          title: "Mulai Menanam",
          html: `<select id="p-batch" class="swal2-input">${Object.entries(
            options
          )
            .map(([id, label]) => `<option value="${id}">${label}</option>`)
            .join("")}</select>
                 <input id="p-qty" type="number" class="swal2-input" placeholder="Jumlah Seeds">`,
          preConfirm: () => [
            document.getElementById("p-batch").value,
            document.getElementById("p-qty").value,
          ],
        });
        if (form && form[1]) {
          await supabase
            .from("weed_batches")
            .insert([
              {
                restock_id: form[0],
                seeds_planted: parseInt(form[1]),
                status: "growing",
              },
            ]);
          updateAllData();
        }
      },

      assignSales: async () => {
        const { data: users } = await supabase
          .from("users_login")
          .select("nama_lengkap")
          .order("nama_lengkap", { ascending: true });
        const { data: restocks } = await supabase
          .from("weed_seed_restocks")
          .select("*");
        const { data: batches } = await supabase
          .from("weed_batches")
          .select("*");
        const { data: sales } = await supabase.from("weed_sales").select("*");

        let whOptions = {};
        restocks.forEach((r) => {
          const harvest =
            batches
              ?.filter((b) => b.restock_id === r.id)
              .reduce((sum, b) => sum + (b.harvest_buds || 0), 0) || 0;
          const bName = `Batch-${formatDateBatch(r.created_at)}-${r.id
            .slice(0, 3)
            .toUpperCase()}`;
          const sold =
            sales
              ?.filter((s) => s.batch_origin === bName)
              .reduce((sum, s) => sum + s.pouch_count, 0) || 0;
          const remain = harvest - sold;
          if (remain > 0) whOptions[bName] = `${bName} (Gudang: ${remain})`;
        });

        const { value: form } = await Swal.fire({
          title: "Distribusi Dealer",
          html: `<select id="s-batch" class="swal2-input">${Object.entries(
            whOptions
          )
            .map(([name, label]) => `<option value="${name}">${label}</option>`)
            .join("")}</select>
                 <select id="s-name" class="swal2-input">${users
                   .map(
                     (u) =>
                       `<option value="${u.nama_lengkap}">${u.nama_lengkap}</option>`
                   )
                   .join("")}</select>
                 <input id="s-qty" type="number" class="swal2-input" placeholder="Jumlah Buds">`,
          preConfirm: () => [
            document.getElementById("s-batch").value,
            document.getElementById("s-name").value,
            document.getElementById("s-qty").value,
          ],
        });
        if (form && form[2]) {
          await supabase
            .from("weed_sales")
            .insert([
              {
                batch_origin: form[0],
                assigned_to: form[1],
                pouch_count: parseInt(form[2]),
                status: "on_street",
              },
            ]);
          updateAllData();
        }
      },

      harvestBatch: async (id) => {
        const { value: buds } = await Swal.fire({
          title: "Harvest",
          input: "number",
          inputLabel: "Total Buds didapat",
        });
        if (buds) {
          await supabase
            .from("weed_batches")
            .update({ harvest_buds: parseInt(buds), status: "harvested" })
            .eq("id", id);
          updateAllData();
        }
      },

      returnMoney: async (id, qty) => {
        const { value: form } = await Swal.fire({
          title: "Settlement Dealer",
          html: `<input id="r-money" type="number" class="swal2-input" placeholder="Uang Kembali ($)">
                 <input id="r-lost" type="number" class="swal2-input" placeholder="Loss (Seized/Lost)">`,
          preConfirm: () => [
            document.getElementById("r-money").value,
            document.getElementById("r-lost").value,
          ],
        });
        if (form) {
          await supabase
            .from("weed_sales")
            .update({
              money_returned: parseInt(form[0] || 0),
              pouches_lost: parseInt(form[1] || 0),
              status: "sold",
            })
            .eq("id", id);
          updateAllData();
        }
      },
    };

    updateAllData();
  },
};
