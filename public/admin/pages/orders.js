/** @param {any} supabase */
export const OrdersPage = {
  state: { orders: [] },
  render: () => `
        <div class="header-container">
            <h2>Order Requests</h2>
            <p style="color: #b9bbbe; margin-top: -10px; font-size: 0.9rem;">Kelola permintaan barang dari member.</p>
        </div>
        <div id="ordersList" style="display: grid; gap: 15px;"></div>
    `,
  init: async (supabase) => {
    const loadOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      OrdersPage.state.orders = data || [];
      renderOrders();
    };

    const renderOrders = () => {
      const container = document.getElementById("ordersList");
      if (OrdersPage.state.orders.length === 0) {
        container.innerHTML = `<div style="background:#2f3136; padding:40px; border-radius:12px; text-align:center; color:#72767d; border: 1px dashed #4f545c;">Tidak ada permintaan masuk.</div>`;
        return;
      }
      container.innerHTML = OrdersPage.state.orders
        .map(
          (order) => `
                <div style="background: #2f3136; border-radius: 12px; padding: 20px; border-left: 5px solid ${
                  order.item_type === "Weapon" ? "#5865F2" : "#faa61a"
                }; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-size:0.65rem; background:#202225; padding:2px 6px; border-radius:4px; color:#b9bbbe;">${
                          order.item_type
                        }</span>
                        <div style="font-size: 1.1rem; font-weight: bold; color: #fff; margin-top:5px;">${
                          order.item_name
                        } <span style="color:#43b581;">x${
            order.quantity
          }</span></div>
                        <div style="font-size: 0.85rem; color: #b9bbbe;">User: <strong>${
                          order.requested_by
                        }</strong> | ${order.total_price}</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-app" data-id="${
                          order.id
                        }" style="background:#43b581; border:none; color:white; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold;">APPROVE</button>
                        <button class="btn-rej" data-id="${
                          order.id
                        }" style="background:#ed4245; border:none; color:white; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold;">REJECT</button>
                    </div>
                </div>
            `
        )
        .join("");

      container
        .querySelectorAll(".btn-app")
        .forEach(
          (btn) => (btn.onclick = () => process(btn.dataset.id, "approved"))
        );
      container
        .querySelectorAll(".btn-rej")
        .forEach(
          (btn) => (btn.onclick = () => process(btn.dataset.id, "rejected"))
        );
    };

    const process = async (id, status) => {
      const order = OrdersPage.state.orders.find((o) => o.id == id);
      if (status === "approved") {
        if (order.item_type === "Weapon") {
          const { data: unit } = await supabase
            .from("inventory_weapons")
            .select("id")
            .eq("weapon_name", order.item_name)
            .eq("status", "available")
            .limit(1)
            .single();
          if (!unit)
            return Swal.fire(
              "Stok Kosong",
              "Tidak ada unit tersedia di gudang!",
              "error"
            );
          await supabase
            .from("inventory_weapons")
            .update({ status: "in_use", hold_by: order.requested_by })
            .eq("id", unit.id);
        } else if (order.item_type === "General") {
          const { data: inv } = await supabase
            .from("inventory")
            .select("stock, id")
            .eq("item_name", order.item_name)
            .single();
          if (!inv || inv.stock < order.quantity)
            return Swal.fire(
              "Stok Kurang",
              "Stok gudang tidak mencukupi!",
              "error"
            );
          await supabase
            .from("inventory")
            .update({ stock: inv.stock - order.quantity })
            .eq("id", inv.id);
        }
        // Note: Untuk Bundling, Anda bisa menambah logic breakdown item di sini jika perlu.
      }
      await supabase
        .from("orders")
        .update({ status: status, processed_at: new Date().toISOString() })
        .eq("id", id);
      loadOrders();
    };
    loadOrders();
  },
};
