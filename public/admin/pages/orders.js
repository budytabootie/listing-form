/** @param {any} supabase */
export const OrdersPage = {
  state: {
    orders: [],
    inventory: [],
    katalog: [],
    isProcessing: false,
  },

  render: () => `
        <div class="header-container">
            <h2>Pending Orders</h2>
            <p style="color: #b9bbbe; margin-top: -10px; font-size: 0.9rem;">Proses item secara satuan. Pesanan otomatis selesai jika semua item sudah diproses.</p>
        </div>
        <div id="ordersList" style="display: grid; gap: 20px;"></div>
    `,

  init: async (supabase, userData) => {
    const container = document.getElementById("ordersList");

    const loadOrders = async () => {
      const [
        { data: orders },
        { data: allItems },
        { data: inv },
        { data: weaponStocks },
        { data: katalog },
      ] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase.from("order_items").select("*").eq("status", "pending"),
        supabase.from("inventory").select("item_name, stock"),
        supabase
          .from("inventory_weapons")
          .select("weapon_name")
          .eq("status", "available")
          .is("hold_by", null),
        supabase.from("katalog_barang").select("nama_barang, jenis_barang"),
      ]);

      const weaponCountMap = (weaponStocks || []).reduce((acc, w) => {
        acc[w.weapon_name] = (acc[w.weapon_name] || 0) + 1;
        return acc;
      }, {});

      OrdersPage.state.katalog = katalog || [];
      OrdersPage.state.inventory = [
        ...(inv || []),
        ...Object.entries(weaponCountMap).map(([name, count]) => ({
          item_name: name,
          stock: count,
        })),
      ];

      OrdersPage.state.orders = (orders || [])
        .map((order) => ({
          ...order,
          rincian: (allItems || []).filter(
            (item) => item.order_id === order.id
          ),
        }))
        .filter((order) => order.rincian.length > 0);

      renderOrders();
    };

    const renderOrders = () => {
      if (OrdersPage.state.orders.length === 0) {
        container.innerHTML = `<div style="background:#2f3136; padding:40px; border-radius:12px; text-align:center; color:#72767d; border: 1px dashed #4f545c;">Semua item pesanan telah diproses.</div>`;
        return;
      }

      container.innerHTML = OrdersPage.state.orders
        .map((order) => {
          const itemsHtml = order.rincian
            .map((item) => {
              const stockExist =
                OrdersPage.state.inventory.find(
                  (i) => i.item_name === item.item_name
                )?.stock || 0;
              const isStockLow = stockExist < item.quantity;

              const categoryColors = {
                Weapon: "#e74c3c",
                Ammo: "#f1c40f",
                Vest: "#3498db",
                Attachment: "#e67e22",
              };

              // SOLUSI NULL: Cek item_type di order_items,
              // jika kosong cek item_type di tabel orders (induk),
              // jika masih kosong gunakan 'Item'.
              const safeType = item.item_type || order.item_type || "Item";
              const typeColor = categoryColors[safeType] || "#72767d";

              return `
              <div style="background:#18191c; margin-top:10px; padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; border-left: 4px solid ${typeColor};">
                <div>
                  <div style="font-size:0.65rem; color:${typeColor}; font-weight:bold; text-transform:uppercase; margin-bottom:4px;">
                    ${safeType}
                  </div>
                  <div style="color:#fff; font-weight:bold;">${
                    item.item_name
                  } <span style="color:#43b581;">x${item.quantity}</span></div>
                  <div style="font-size:0.75rem; color:${
                    isStockLow ? "#f04747" : "#b9bbbe"
                  }; font-weight:${isStockLow ? "bold" : "normal"};">
                    ${
                      isStockLow
                        ? '<i class="fas fa-exclamation-triangle"></i> Stok: '
                        : "Gudang: "
                    } ${stockExist}
                  </div>
                </div>
                <div style="display:flex; gap:10px;">
                  <button class="btn-item-action" data-item-id="${
                    item.id
                  }" data-order-id="${order.id}" data-action="approved" 
                    ${
                      isStockLow
                        ? 'disabled style="background:#4f545c; opacity:0.5;"'
                        : 'style="background:#43b581; cursor:pointer;"'
                    }>
                    APPROVE
                  </button>
                  <button class="btn-item-action" data-item-id="${
                    item.id
                  }" data-order-id="${order.id}" data-action="rejected" 
                    style="background:#ed4245; cursor:pointer;">
                    REJECT
                  </button>
                </div>
              </div>
            `;
            })
            .join("");

          return `
            <div class="order-card-container" style="background: #2f3136; border-radius: 12px; padding: 20px; border: 1px solid #4f545c; margin-bottom:15px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #4f545c; padding-bottom:12px; margin-bottom:5px;">
                  <div>
                    <h3 style="margin:0; color:#fff; font-size:1.1rem;">${
                      order.requested_by
                    }</h3>
                    <span style="font-size:0.75rem; color:#faa61a; font-weight:bold;">RANK: ${
                      order.rank || "MEMBER"
                    }</span>
                  </div>
                  <div style="text-align:right;">
                    <div style="color:#43b581; font-weight:bold; font-size:1rem;">${
                      order.total_price || "$ 0"
                    }</div>
                    <div style="font-size:0.65rem; color:#72767d;">${new Date(
                      order.created_at
                    ).toLocaleString()}</div>
                  </div>
                </div>
                <div>${itemsHtml}</div>
            </div>`;
        })
        .join("");
    };

    container.onclick = async (e) => {
      const btn = e.target.closest(".btn-item-action");
      if (!btn || OrdersPage.state.isProcessing) return;

      const { itemId, orderId, action } = btn.dataset;
      const order = OrdersPage.state.orders.find((o) => o.id === orderId);
      const item = order.rincian.find((i) => i.id === itemId);

      if (action === "rejected") {
        const confirm = await Swal.fire({
          title: "Reject Item?",
          text: `Tolak ${item.item_name} untuk ${order.requested_by}?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#ed4245",
          background: "#2f3136",
          color: "#fff",
        });
        if (confirm.isConfirmed) await processItem(order, item, "rejected");
        return;
      }

      try {
        let snNotes = "";
        const katalogItem = OrdersPage.state.katalog.find(
          (k) => k.nama_barang === item.item_name
        );

        if (katalogItem?.jenis_barang === "Weapon") {
          const { data: units } = await supabase
            .from("inventory_weapons")
            .select("id, serial_number")
            .eq("weapon_name", item.item_name)
            .eq("status", "available")
            .is("hold_by", null);

          if (!units || units.length < item.quantity)
            throw new Error("Stok SN tidak mencukupi!");

          const { value: selectedSns } = await Swal.fire({
            title: `Pilih ${item.quantity} SN - ${item.item_name}`,
            background: "#2f3136",
            color: "#fff",
            html: `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">${units
              .map(
                (u) =>
                  `<button class="sn-choice" data-id="${u.id}" data-sn="${u.serial_number}" style="background:#202225; border:1px solid #4f545c; color:#eee; padding:8px; border-radius:6px; cursor:pointer;">${u.serial_number}</button>`
              )
              .join("")}</div>`,
            didOpen: () => {
              const btns = document.querySelectorAll(".sn-choice");
              let count = 0;
              btns.forEach(
                (b) =>
                  (b.onclick = () => {
                    if (b.classList.contains("selected")) {
                      b.classList.remove("selected");
                      b.style.background = "#202225";
                      count--;
                    } else if (count < item.quantity) {
                      b.classList.add("selected");
                      b.style.background = "#43b58144";
                      count++;
                    }
                  })
              );
            },
            preConfirm: () => {
              const sel = document.querySelectorAll(".sn-choice.selected");
              if (sel.length !== item.quantity) {
                Swal.showValidationMessage(`Pilih tepat ${item.quantity} SN!`);
                return false;
              }
              return Array.from(sel).map((el) => ({
                id: el.dataset.id,
                sn: el.dataset.sn,
              }));
            },
          });

          if (!selectedSns) return;
          snNotes = selectedSns.map((s) => s.sn).join(", ");
          await supabase
            .from("inventory_weapons")
            .update({ status: "in_use", hold_by: order.requested_by })
            .in(
              "id",
              selectedSns.map((s) => s.id)
            );
        } else {
          const { data: inv } = await supabase
            .from("inventory")
            .select("id, stock")
            .eq("item_name", item.item_name)
            .maybeSingle();
          if (inv)
            await supabase
              .from("inventory")
              .update({ stock: inv.stock - item.quantity })
              .eq("id", inv.id);
        }

        await processItem(order, item, "approved", snNotes);
      } catch (err) {
        Swal.fire("Gagal", err.message, "error");
      }
    };

    const processItem = async (order, item, status, snNotes = "") => {
      OrdersPage.state.isProcessing = true;
      Swal.fire({
        title: "Memproses Item...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await supabase
        .from("order_items")
        .update({
          status: status,
          sn_list: snNotes,
        })
        .eq("id", item.id);

      const { data: remaining } = await supabase
        .from("order_items")
        .select("id")
        .eq("order_id", order.id)
        .eq("status", "pending");

      if (!remaining || remaining.length === 0) {
        await supabase
          .from("orders")
          .update({
            status: "processed",
            processed_at: new Date().toISOString(),
            processed_by_name: userData.nama_lengkap,
          })
          .eq("id", order.id);
      }

      await window.createAuditLog(
        status.toUpperCase(),
        "order_items",
        `${status.toUpperCase()} ${item.item_name} (x${item.quantity}) for ${
          order.requested_by
        }`
      );

      Swal.close();
      loadOrders();
      OrdersPage.state.isProcessing = false;
    };

    loadOrders();
  },
};
