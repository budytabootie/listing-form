export const WeedPage = {
  render: () => `
    <div class="dashboard-header">
        <h1><i class="fas fa-chart-line" style="color: #43b581;"></i> Weed Operations Control</h1>
        <p style="color: #b9bbbe;">Pelacakan Real-time: Seed -> Harvest -> Sales -> Loss.</p>
    </div>

    <div class="weed-grid-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
        
        <div class="admin-card" style="border-left: 4px solid #faa61a; display: flex; flex-direction: column;">
            <div class="card-header-modern"><i class="fas fa-warehouse"></i> Seed Bank</div>
            <div class="inv-box" style="background:#202225; padding:15px; border-radius:8px; text-align:center; margin: 10px 0;">
                <span id="display-available-seeds" style="font-size:2rem; font-weight:bold; color:#faa61a;">0</span>
                <small style="display:block; color:#72767d;">Seeds Available</small>
            </div>
            
            <div style="flex-grow: 1; margin-bottom: 10px;">
                <small style="color:#72767d; text-transform:uppercase; font-size:0.65rem; font-weight:bold;">Recent Restocks:</small>
                <div id="restock-history-list" style="max-height: 80px; overflow-y: auto; font-size: 0.75rem; color: #dcddde; margin-top: 5px;">
                    <p style="color:#4f545c;">No restock data</p>
                </div>
            </div>

            <button class="btn-primary-weed" onclick="window.weedActions.restockSeeds()" style="width:100%; background:#faa61a; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer; font-weight:bold;">Restock</button>
        </div>

        <div class="admin-card" style="border-left: 4px solid #43b581;">
            <div class="card-header-modern"><i class="fas fa-box"></i> Warehouse</div>
            <div class="inv-box" style="background:#202225; padding:15px; border-radius:8px; text-align:center; margin: 10px 0;">
                <span id="display-warehouse-buds" style="font-size:2rem; font-weight:bold; color:#43b581;">0</span>
                <small style="display:block; color:#72767d;">Buds Ready</small>
            </div>
            <div style="font-size:0.75rem; color:#b9bbbe; display:flex; justify-content:space-between;">
                <span>On Street: <b id="display-street-pouches" style="color:#faa61a;">0</b></span>
                <span>Sold: <b id="display-total-sold" style="color:#fff;">0</b></span>
            </div>
        </div>

        <div class="admin-card" style="border-left: 4px solid #f04747;">
            <div class="card-header-modern"><i class="fas fa-skull-crossbones"></i> Total Loss</div>
            <div class="inv-box" style="background:#202225; padding:15px; border-radius:8px; text-align:center; margin: 10px 0;">
                <span id="display-total-loss" style="font-size:2rem; font-weight:bold; color:#f04747;">0</span>
                <small style="display:block; color:#72767d;">Buds Lost/Seized</small>
            </div>
            <div style="font-size:0.75rem; color:#b9bbbe; text-align:center;">
                Dead Seeds: <b id="display-dead-seeds" style="color:#f04747;">0</b>
            </div>
        </div>

        <div class="admin-card">
            <div class="card-header-modern"><i class="fas fa-trophy" style="color:#faa61a;"></i> Top Dealers</div>
            <div id="seller-leaderboard" style="margin-top:10px; font-size:0.85rem;">
                <p style="color:#72767d; text-align:center;">Calculating...</p>
            </div>
        </div>
    </div>

    <div class="weed-grid-container" style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px; margin-top: 20px;">
        
        <div class="admin-card">
            <div class="card-header-modern"><i class="fas fa-seedling"></i> Production Log</div>
            <div id="active-batches-list" class="mini-log-container" style="max-height: 450px; overflow-y: auto; margin-top:10px;"></div>
            <button class="btn-primary-weed" onclick="window.weedActions.startBatch()" style="width:100%; background:#5865f2; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer; margin-top:10px;">Plant New Batch</button>
        </div>

        <div class="admin-card">
            <div class="card-header-modern"><i class="fas fa-shipping-fast"></i> Distribution Log</div>
            <div class="table-responsive">
                <table class="admin-table" style="width: 100%; margin-top:10px; font-size:0.85rem;">
                    <thead>
                        <tr style="text-align: left; color: #72767d; border-bottom: 1px solid #40444b;">
                            <th style="padding:10px;">DATE</th>
                            <th>DEALER</th>
                            <th>QTY</th>
                            <th>LOSS</th>
                            <th>RETURN</th>
                            <th style="text-align:right;">ACTION</th>
                        </tr>
                    </thead>
                    <tbody id="sales-tracker-body"></tbody>
                </table>
            </div>
            <button class="btn-success-weed" onclick="window.weedActions.assignSales()" style="margin-top:15px; background:#43b581; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold;">Assign New Dealer</button>
        </div>
    </div>
  `,

  init: async (supabase, userData) => {
    // Cek apakah role_id user diizinkan mengakses menu ini
    const allowedRoles = [1, 2, 5]; // Admin, Treasurer, BNN

    if (!allowedRoles.includes(userData.role_id)) {
      document.getElementById("app").innerHTML = `
            <div style="text-align:center; padding:50px; color:white;">
                <h2>Akses Ditolak</h2>
                <p>Anda tidak memiliki izin untuk mengakses monitoring BNN/Weed.</p>
            </div>`;
      return;
    }

    const formatDate = (dateStr) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
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

      // 1. SEED BANK & RESTOCK LOG
      const totalRestock =
        restocks?.reduce((sum, r) => sum + r.quantity_received, 0) || 0;
      const totalRecovered =
        batches?.reduce((sum, b) => sum + (b.seeds_recovered || 0), 0) || 0;
      const totalPlanted =
        batches?.reduce((sum, b) => sum + b.seeds_planted, 0) || 0;
      const availableSeeds = totalRestock + totalRecovered - totalPlanted;

      // Render Restock History (Mini Log)
      document.getElementById("restock-history-list").innerHTML =
        restocks
          ?.slice(0, 5)
          .map(
            (r) => `
        <div style="display:flex; justify-content:space-between; padding:2px 0; border-bottom:1px solid #2f3136;">
            <span>${formatDate(r.created_at)}</span>
            <span style="color:#faa61a;">+${r.quantity_received}</span>
        </div>
      `
          )
          .join("") || "No data";

      // 2. WAREHOUSE
      const totalHarvest =
        batches?.reduce((sum, b) => sum + (b.harvest_buds || 0), 0) || 0;
      const totalReleased =
        sales?.reduce((sum, s) => sum + s.pouch_count, 0) || 0;
      const warehouseBuds = totalHarvest - totalReleased;

      // 3. STATS
      const totalOnStreet =
        sales
          ?.filter((s) => s.status === "on_street")
          .reduce((sum, s) => sum + s.pouch_count, 0) || 0;
      const totalSold =
        sales
          ?.filter((s) => s.status === "sold")
          .reduce(
            (sum, s) => sum + (s.pouch_count - (s.pouches_lost || 0)),
            0
          ) || 0;
      const totalLossInStreet =
        sales?.reduce((sum, s) => sum + (s.pouches_lost || 0), 0) || 0;
      const totalDeadSeeds =
        batches?.reduce((sum, b) => sum + (b.seeds_lost || 0), 0) || 0;

      // UI UPDATES
      document.getElementById("display-available-seeds").innerText =
        availableSeeds;
      document.getElementById("display-warehouse-buds").innerText =
        warehouseBuds;
      document.getElementById("display-street-pouches").innerText =
        totalOnStreet;
      document.getElementById("display-total-sold").innerText = totalSold;
      document.getElementById("display-total-loss").innerText =
        totalLossInStreet;
      document.getElementById("display-dead-seeds").innerText = totalDeadSeeds;

      // LEADERBOARD (7 Days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const leaderboard = {};
      sales
        ?.filter(
          (s) => new Date(s.created_at) > oneWeekAgo && s.status === "sold"
        )
        .forEach((s) => {
          leaderboard[s.assigned_to] =
            (leaderboard[s.assigned_to] || 0) + s.money_returned;
        });
      const sorted = Object.entries(leaderboard)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      document.getElementById("seller-leaderboard").innerHTML = sorted.length
        ? sorted
            .map(
              ([n, m]) =>
                `<div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>${n}</span><span style="color:#43b581;">$${m.toLocaleString()}</span></div>`
            )
            .join("")
        : "No sales yet";

      renderTables(batches, sales);
      return { warehouseBuds, availableSeeds };
    };

    const renderTables = (batches, sales) => {
      document.getElementById("active-batches-list").innerHTML =
        batches
          ?.map(
            (b) => `
            <div class="batch-item" style="background: #36393f; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${
              b.status === "growing" ? "#faa61a" : "#43b581"
            };">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div>
                        <strong style="font-size:0.85rem;">#Batch-${b.id.slice(
                          0,
                          5
                        )}</strong><br>
                        <small style="color:#72767d;">${formatDate(
                          b.created_at
                        )}</small>
                    </div>
                    <span style="font-size:0.7rem; color:${
                      b.seeds_lost > 0 ? "#f04747" : "#72767d"
                    }; background:#202225; padding:2px 6px; border-radius:4px;">Loss: ${
              b.seeds_lost || 0
            }</span>
                </div>
                <div style="margin-top:8px; font-size:0.8rem;">
                    ${b.seeds_planted} Planted → ${b.harvest_buds || 0} Buds
                </div>
                ${
                  b.status === "growing"
                    ? `<button onclick="window.weedActions.harvestBatch('${b.id}')" style="width:100%; margin-top:8px; background:#43b581; border:none; color:white; border-radius:4px; cursor:pointer; font-size:0.75rem; padding:5px; font-weight:bold;">MARK HARVESTED</button>`
                    : ""
                }
            </div>
      `
          )
          .join("") || "No production history";

      document.getElementById("sales-tracker-body").innerHTML =
        sales
          ?.map(
            (s) => `
            <tr style="border-bottom:1px solid #36393f; color:#dcddde;">
                <td style="padding:12px; font-size:0.75rem; color:#72767d;">${formatDate(
                  s.created_at
                )}</td>
                <td style="font-weight:bold;">${s.assigned_to}</td>
                <td>${s.pouch_count}</td>
                <td style="color:${
                  s.pouches_lost > 0 ? "#f04747" : "#72767d"
                }; font-weight:bold;">${s.pouches_lost || 0}</td>
                <td style="color:#43b581; font-weight:bold;">$${(
                  s.money_returned || 0
                ).toLocaleString()}</td>
                <td style="text-align:right;">
                    ${
                      s.status === "on_street"
                        ? `<button onclick="window.weedActions.returnMoney('${s.id}', ${s.pouch_count})" style="background:#faa61a; border:none; color:white; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:0.75rem;">RETURN</button>`
                        : '<i class="fas fa-check-circle" style="color:#43b581;"></i>'
                    }
                </td>
            </tr>
      `
          )
          .join("") || "No distribution logs";
    };

    window.weedActions = {
      restockSeeds: async () => {
        const { value: qty } = await Swal.fire({
          title: "Weekly Restock",
          input: "number",
          inputLabel: "Bibit datang minggu ini",
        });
        if (qty) {
          await supabase
            .from("weed_seed_restocks")
            .insert([{ quantity_received: parseInt(qty) }]);
          updateAllData();
        }
      },

      startBatch: async () => {
        const { availableSeeds } = await updateAllData();
        const { value: seeds } = await Swal.fire({
          title: "Start Planting",
          input: "number",
          inputLabel: `Seeds available: ${availableSeeds}`,
        });
        if (seeds) {
          if (parseInt(seeds) > availableSeeds)
            return Swal.fire("Error", "Bibit tidak cukup!", "error");
          await supabase
            .from("weed_batches")
            .insert([{ seeds_planted: parseInt(seeds), status: "growing" }]);
          updateAllData();
        }
      },

      harvestBatch: async (id) => {
        const { value: form } = await Swal.fire({
          title: "Harvest Session",
          html: `<input id="h-buds" class="swal2-input" type="number" placeholder="Total Buds didapat">
                 <input id="h-lost" class="swal2-input" type="number" placeholder="Seeds Mati/Gagal">
                 <input id="h-rec" class="swal2-input" type="number" placeholder="Seeds Recovered (Bonus)">`,
          preConfirm: () => [
            document.getElementById("h-buds").value,
            document.getElementById("h-lost").value,
            document.getElementById("h-rec").value,
          ],
        });
        if (form) {
          await supabase
            .from("weed_batches")
            .update({
              status: "harvested",
              harvest_buds: parseInt(form[0] || 0),
              seeds_lost: parseInt(form[1] || 0),
              seeds_recovered: parseInt(form[2] || 0),
            })
            .eq("id", id);
          updateAllData();
        }
      },

      assignSales: async () => {
        const { warehouseBuds } = await updateAllData();
        const { value: form } = await Swal.fire({
          title: "Distribute to Street",
          html: `<p style="font-size:0.8rem; color:#faa61a;">Warehouse: ${warehouseBuds} Buds</p>
                 <input id="s-name" class="swal2-input" placeholder="Dealer Name">
                 <input id="s-qty" class="swal2-input" type="number" placeholder="Amount of Buds">`,
          preConfirm: () => [
            document.getElementById("s-name").value,
            document.getElementById("s-qty").value,
          ],
        });

        if (form && form[0] && form[1]) {
          const qty = parseInt(form[1]);
          if (qty > warehouseBuds)
            return Swal.fire(
              "Gagal!",
              `Stok gudang tidak cukup (${warehouseBuds})`,
              "error"
            );
          await supabase
            .from("weed_sales")
            .insert([
              { assigned_to: form[0], pouch_count: qty, status: "on_street" },
            ]);
          updateAllData();
        }
      },

      returnMoney: async (id, qty) => {
        const { value: form } = await Swal.fire({
          title: "Dealer Settlement",
          html: `<p style="font-size:0.8rem; color:#72767d;">Settling ${qty} buds</p>
                 <input id="r-money" class="swal2-input" type="number" placeholder="Total Money Returned ($)">
                 <input id="r-lost" class="swal2-input" type="number" placeholder="Loss (Seized/Lost)">`,
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
