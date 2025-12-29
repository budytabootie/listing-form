/** @param {any} supabase */
export const OrdersPage = {
  state: {
    orders: [],
    inventory: [],
    isProcessing: false,
  },

  render: () => `
        <div class="header-container">
            <h2>Order Requests</h2>
            <p style="color: #b9bbbe; margin-top: -10px; font-size: 0.9rem;">Kelola permintaan barang secara real-time dengan validasi stok otomatis.</p>
        </div>
        <div id="ordersList" style="display: grid; gap: 15px;"></div>
    `,

  init: async (supabase) => {
    const container = document.getElementById("ordersList");

    const loadOrders = async () => {
      // 1. Ambil data orders, inventory umum, dan hitung unit senjata (status: available)
      const [{ data: orders }, { data: inv }, { data: weaponStocks }] =
        await Promise.all([
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
        ]);

      // 2. Mapping stok senjata agar bisa dibandingkan dengan order
      const weaponCountMap = (weaponStocks || []).reduce((acc, w) => {
        acc[w.weapon_name] = (acc[w.weapon_name] || 0) + 1;
        return acc;
      }, {});

      OrdersPage.state.orders = orders || [];
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

          return `
            <div class="order-card" style="background: #2f3136; border-radius: 12px; padding: 20px; border-left: 5px solid ${typeColor}; display: flex; justify-content: space-between; align-items: center; position: relative;">
                
                <div style="position: absolute; top: 0; right: 0; background: ${
                  timeDiff > 15 ? "#ed4245" : "#4f545c"
                }; color: white; padding: 2px 10px; font-size: 0.65rem; border-bottom-left-radius: 8px; font-weight: bold;">
                    <i class="far fa-clock"></i> ${timeLabel}
                </div>

                <div>
                    <span style="font-size:0.6rem; background:${typeColor}22; padding:2px 8px; border-radius:4px; color:${typeColor}; font-weight:bold; border: 1px solid ${typeColor}44; text-transform: uppercase;">${
            order.item_type
          }</span>
                    <div style="font-size: 1.15rem; font-weight: bold; color: #fff; margin-top:5px;">
                        ${order.item_name} <span style="color:#43b581;">x${
            order.quantity
          }</span>
                    </div>
                    <div style="font-size: 0.85rem; color: #b9bbbe; margin-top: 4px;">
                        User: <strong style="color:#fff;">${
                          order.requested_by
                        }</strong>
                    </div>
                    
                    <div style="margin-top: 10px; font-size: 0.75rem; display: flex; align-items: center; gap: 8px;">
                        <span style="color: #b9bbbe;">Stok Tersedia:</span>
                        <span style="padding: 2px 8px; border-radius: 10px; font-weight: bold; background: ${
                          isStockLow ? "#ed424522" : "#43b58122"
                        }; color: ${
            isStockLow ? "#ed4245" : "#43b581"
          }; border: 1px solid ${isStockLow ? "#ed424544" : "#43b58144"};">
                            ${currentStock} unit
                        </span>
                        ${
                          isStockLow
                            ? `<span style="color: #ed4245; font-size: 0.7rem; font-weight: bold;"><i class="fas fa-exclamation-triangle"></i> STOK TIDAK CUKUP</span>`
                            : ""
                        }
                    </div>
                </div>

                <div style="display: flex; gap: 10px; z-index: 1;">
                    <button class="btn-action btn-app" data-id="${
                      order.id
                    }" data-status="approved" 
                        ${
                          isStockLow
                            ? 'disabled style="background:#4f545c; cursor:not-allowed; opacity:0.5; border:none; color:white; padding:10px 20px; border-radius:6px;"'
                            : 'style="background:#43b581; border:none; color:white; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold;"'
                        }>
                        APPROVE
                    </button>
                    <button class="btn-action btn-rej" data-id="${
                      order.id
                    }" data-status="rejected" style="background:#ed4245; border:none; color:white; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold;">REJECT</button>
                </div>
            </div>`;
        })
        .join("");
    };

    container.onclick = async (e) => {
      const btn = e.target.closest(".btn-action");
      if (!btn || OrdersPage.state.isProcessing) return;
      confirmAction(btn.dataset.id, btn.dataset.status);
    };

    const confirmAction = async (id, status) => {
      const order = OrdersPage.state.orders.find((o) => o.id == id);
      const { isConfirmed } = await Swal.fire({
        title: status === "approved" ? "Approve Order?" : "Reject Order?",
        text: `${status === "approved" ? "Berikan" : "Tolak"} ${
          order.item_name
        } untuk ${order.requested_by}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: status === "approved" ? "#43b581" : "#ed4245",
        cancelButtonColor: "#4f545c",
        background: "#2f3136",
        color: "#fff",
      });
      if (isConfirmed) process(id, status);
    };

    const process = async (id, status) => {
      OrdersPage.state.isProcessing = true;
      const order = OrdersPage.state.orders.find((o) => o.id == id);
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
            if (!units || units.length === 0)
              throw new Error(`Unit ${order.item_name} tidak tersedia.`);

            const { value: selectedId } = await Swal.fire({
              title: "Pilih Serial Number",
              background: "#2f3136",
              color: "#fff",
              html: `
                <input type="text" id="snSearch" placeholder="Cari SN..." style="width: 100%; padding: 10px; background: #202225; border: 1px solid #4f545c; color: white; border-radius: 6px; margin-bottom: 15px;">
                <div id="snGrid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 250px; overflow-y: auto; padding: 5px;">
                    ${units
                      .map(
                        (u) =>
                          `<button class="sn-choice" data-id="${u.id}" data-sn="${u.serial_number}" style="background: #202225; border: 1px solid #4f545c; color: #43b581; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold; font-family: monospace;">${u.serial_number}</button>`
                      )
                      .join("")}
                </div>
                <style>.sn-choice:hover { border-color: #43b581 !important; background: #2f3136 !important; }</style>
              `,
              didOpen: () => {
                const search = document.getElementById("snSearch");
                const choices = document.querySelectorAll(".sn-choice");
                search.oninput = () => {
                  const term = search.value.toLowerCase();
                  choices.forEach(
                    (btn) =>
                      (btn.style.display = btn.dataset.sn
                        .toLowerCase()
                        .includes(term)
                        ? "block"
                        : "none")
                  );
                };
                document.getElementById("snGrid").onclick = (e) => {
                  const btn = e.target.closest(".sn-choice");
                  if (btn) {
                    document.activeElement.blur();
                    btn.classList.add("selected");
                    Swal.clickConfirm();
                  }
                };
              },
              preConfirm: () => {
                const selected =
                  document.querySelector(".sn-choice.selected") ||
                  document.activeElement;
                return selected.dataset.id;
              },
              showCancelButton: true,
            });

            if (!selectedId) throw new Error("Proses dibatalkan.");
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
            orderNotes = `Bundling Approved.`;
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

        await supabase
          .from("orders")
          .update({
            status: status,
            processed_at: new Date().toISOString(),
            notes: orderNotes,
            processed_by: "Admin Logistik",
          })
          .eq("id", id);
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          timer: 1000,
          showConfirmButton: false,
          background: "#2f3136",
          color: "#fff",
        });
        loadOrders();
      } catch (err) {
        if (err.message !== "Proses dibatalkan.")
          Swal.fire({
            title: "Gagal",
            text: err.message,
            icon: "error",
            background: "#2f3136",
            color: "#fff",
          });
      } finally {
        OrdersPage.state.isProcessing = false;
      }
    };

    loadOrders();
  },
};
