/** @param {any} supabase */
export const OrdersPage = {
  state: {
    orders: [],
    inventory: [],
    bundleDetails: {},
    isProcessing: false,
  },

  render: () => `
        <div class="header-container">
            <h2>Order Requests</h2>
            <p style="color: #b9bbbe; margin-top: -10px; font-size: 0.9rem;">Kelola permintaan barang secara real-time dengan rincian bundling otomatis.</p>
        </div>
        <div id="ordersList" style="display: grid; gap: 15px;"></div>
    `,

  // MODIFIKASI: Tambahkan userData sebagai parameter kedua
  init: async (supabase, userData) => {
    const container = document.getElementById("ordersList");

    const loadOrders = async () => {
      const [
        { data: orders },
        { data: inv },
        { data: weaponStocks },
        { data: bundles },
      ] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase.from("inventory").select("item_name, stock"),
        supabase
          .from("inventory_weapons")
          .select("weapon_name")
          .eq("status", "available")
          .is("hold_by", null),
        supabase
          .from("bundle_items")
          .select("nama_paket, nama_barang_stok, jumlah_potong"),
      ]);

      const weaponCountMap = (weaponStocks || []).reduce((acc, w) => {
        acc[w.weapon_name] = (acc[w.weapon_name] || 0) + 1;
        return acc;
      }, {});

      const bundleMap = (bundles || []).reduce((acc, b) => {
        if (!acc[b.nama_paket]) acc[b.nama_paket] = [];
        acc[b.nama_paket].push(`${b.nama_barang_stok} (x${b.jumlah_potong})`);
        return acc;
      }, {});

      OrdersPage.state.orders = orders || [];
      OrdersPage.state.bundleDetails = bundleMap;
      OrdersPage.state.inventory = [
        ...(inv || []),
        ...Object.entries(weaponCountMap).map(([name, count]) => ({
          item_name: name,
          stock: count,
        })),
      ];

      renderOrders();
    };

    const renderOrders = () => {
      if (OrdersPage.state.orders.length === 0) {
        container.innerHTML = `<div style="background:#2f3136; padding:40px; border-radius:12px; text-align:center; color:#72767d; border: 1px dashed #4f545c;">Antrean kosong.</div>`;
        return;
      }

      container.innerHTML = OrdersPage.state.orders
        .map((order) => {
          const currentStock =
            OrdersPage.state.inventory.find(
              (i) => i.item_name === order.item_name
            )?.stock || 0;
          const isStockLow = currentStock < order.quantity;
          const timeDiff = Math.floor(
            (new Date() - new Date(order.created_at)) / 60000
          );
          const timeLabel =
            timeDiff < 1 ? "Baru saja" : `${timeDiff}m yang lalu`;
          const typeColor =
            order.item_type === "Weapon"
              ? "#5865F2"
              : order.item_type === "Bundling"
              ? "#9b59b6"
              : "#faa61a";

          const rincianPaket =
            OrdersPage.state.bundleDetails[order.item_name]?.join(", ") ||
            "Rincian tidak ditemukan";

          return `
            <div class="order-card" style="background: #2f3136; border-radius: 12px; padding: 20px; border-left: 5px solid ${typeColor}; display: flex; justify-content: space-between; align-items: center; position: relative;">
                <div style="position: absolute; top: 0; right: 0; background: ${
                  timeDiff > 15 ? "#ed4245" : "#4f545c"
                }; color: white; padding: 2px 10px; font-size: 0.65rem; border-bottom-left-radius: 8px; font-weight: bold;">
                    <i class="far fa-clock"></i> ${timeLabel}
                </div>
                <div style="flex:1;">
                    <span style="font-size:0.6rem; background:${typeColor}22; padding:2px 8px; border-radius:4px; color:${typeColor}; font-weight:bold; border: 1px solid ${typeColor}44;">${order.item_type.toUpperCase()}</span>
                    <div style="font-size: 1.15rem; font-weight: bold; color: #fff; margin-top:5px;">
                        ${order.item_name} <span style="color:#43b581;">x${
            order.quantity
          }</span>
                    </div>
                    ${
                      order.item_type === "Bundling"
                        ? `<div style="margin-top:8px; padding:8px; background:#202225; border-radius:6px; border:1px solid #444; width:fit-content; max-width:90%;">
                            <div style="font-size:0.65rem; color:#b9bbbe; font-weight:bold; margin-bottom:2px;">ISI PAKET:</div>
                            <div style="font-size:0.75rem; color:#eee; line-height:1.4;">${rincianPaket}</div>
                        </div>`
                        : ""
                    }
                    <div style="font-size: 0.85rem; color: #b9bbbe; margin-top: 8px;">
                        User: <strong style="color:#fff;">${
                          order.requested_by
                        }</strong>
                        ${
                          order.total_price
                            ? `<span style="margin-left:10px; color:#faa61a;">| Total: Rp ${order.total_price.toLocaleString()}</span>`
                            : ""
                        }
                    </div>
                    <div style="margin-top: 10px; font-size: 0.75rem; display: flex; align-items: center; gap: 8px;">
                        <span style="color: #b9bbbe;">Stok:</span>
                        <span style="padding: 2px 8px; border-radius: 10px; font-weight: bold; background: ${
                          isStockLow ? "#ed424522" : "#43b58122"
                        }; color: ${isStockLow ? "#ed4245" : "#43b581"};">
                            ${currentStock} unit
                        </span>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-action btn-app" data-id="${
                      order.id
                    }" data-status="approved" 
                        ${
                          isStockLow
                            ? 'disabled style="background:#4f545c; opacity:0.5; border:none; color:white; padding:10px 20px; border-radius:6px;"'
                            : 'style="background:#43b581; border:none; color:white; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold;"'
                        }>APPROVE</button>
                    <button class="btn-action btn-rej" data-id="${
                      order.id
                    }" data-status="rejected" style="background:#ed4245; border:none; color:white; padding:10px 20px; border-radius:6px; cursor:pointer;">REJECT</button>
                </div>
            </div>`;
        })
        .join("");
    };

    container.onclick = async (e) => {
      const btn = e.target.closest(".btn-action");
      if (!btn || OrdersPage.state.isProcessing) return;

      const order = OrdersPage.state.orders.find((o) => o.id == btn.dataset.id);
      const status = btn.dataset.status;

      const { isConfirmed } = await Swal.fire({
        title: status === "approved" ? "Approve?" : "Reject?",
        text: `${status === "approved" ? "Berikan" : "Tolak"} ${
          order.item_name
        } untuk ${order.requested_by}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: status === "approved" ? "#43b581" : "#ed4245",
        background: "#2f3136",
        color: "#fff",
      });

      if (isConfirmed) processOrder(order, status);
    };

    const processOrder = async (order, status) => {
      OrdersPage.state.isProcessing = true;
      let orderNotes = "";

      try {
        if (status === "approved") {
          if (order.item_type === "Weapon") {
            const { data: units } = await supabase
              .from("inventory_weapons")
              .select("id, serial_number")
              .eq("weapon_name", order.item_name)
              .eq("status", "available")
              .is("hold_by", null);

            const { value: selectedId } = await Swal.fire({
              title: "Pilih Serial Number",
              background: "#2f3136",
              color: "#fff",
              html: `<div id="snGrid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 250px; overflow-y: auto;">
                ${units
                  .map(
                    (u) =>
                      `<button class="sn-choice" data-id="${u.id}" style="background:#202225; border:1px solid #4f545c; color:#43b581; padding:10px; border-radius:8px; cursor:pointer;">${u.serial_number}</button>`
                  )
                  .join("")}
              </div>`,
              preConfirm: () =>
                document.querySelector(".sn-choice.selected")?.dataset.id,
              didOpen: () => {
                document.getElementById("snGrid").onclick = (e) => {
                  const b = e.target.closest(".sn-choice");
                  if (b) {
                    document
                      .querySelectorAll(".sn-choice")
                      .forEach((x) => x.classList.remove("selected", "active"));
                    b.classList.add("selected");
                    b.style.borderColor = "#43b581";
                    Swal.clickConfirm();
                  }
                };
              },
            });

            if (!selectedId) throw new Error("Dibatalkan");
            const selUnit = units.find((u) => u.id == selectedId);
            orderNotes = `SN: ${selUnit.serial_number}`;
            await supabase
              .from("inventory_weapons")
              .update({ status: "in_use", hold_by: order.requested_by })
              .eq("id", selectedId);
          } else if (order.item_type === "Bundling") {
            const { data: recipe } = await supabase
              .from("bundle_items")
              .select("nama_barang_stok, jumlah_potong")
              .eq("nama_paket", order.item_name);

            // --- MODIFIKASI DIMULAI DISINI ---
            let bundlingNotes = "Isi Paket: ";
            recipe.forEach((r, index) => {
              bundlingNotes += `${r.nama_barang_stok} (x${r.jumlah_potong})${
                index === recipe.length - 1 ? "" : ", "
              }`;
            });
            orderNotes = bundlingNotes; // Simpan rincian ke orderNotes
            // --- MODIFIKASI SELESAI ---

            for (const item of recipe) {
              const { data: inv } = await supabase
                .from("inventory")
                .select("id, stock")
                .eq("item_name", item.nama_barang_stok)
                .single();
              await supabase
                .from("inventory")
                .update({
                  stock: inv.stock - item.jumlah_potong * order.quantity,
                })
                .eq("id", inv.id);
            }
          } else {
            const { data: inv } = await supabase
              .from("inventory")
              .select("id, stock")
              .eq("item_name", order.item_name)
              .single();
            await supabase
              .from("inventory")
              .update({ stock: inv.stock - order.quantity })
              .eq("id", inv.id);
          }
        }

        // MODIFIKASI: Sertakan processed_by dan processed_by_name
        await supabase
          .from("orders")
          .update({
            status,
            processed_at: new Date().toISOString(),
            processed_by: userData.id,
            processed_by_name: userData.nama_lengkap,
            notes: orderNotes,
          })
          .eq("id", order.id);

        // MODIFIKASI: Catat ke Audit Log
        const actionLabel = status === "approved" ? "APPROVE" : "REJECT";
        await window.createAuditLog(
          actionLabel,
          "orders",
          `${actionLabel} order ${order.item_name} x${order.quantity} untuk ${order.requested_by}`
        );

        Swal.fire({
          icon: "success",
          title: "Berhasil",
          background: "#2f3136",
          color: "#fff",
          timer: 1000,
          showConfirmButton: false,
        });
        loadOrders();
      } catch (err) {
        if (err.message !== "Dibatalkan")
          Swal.fire("Gagal", err.message, "error");
      } finally {
        OrdersPage.state.isProcessing = false;
      }
    };

    loadOrders();
  },
};
