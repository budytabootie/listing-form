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
            <h2 style="color: #fff; margin-bottom: 10px;">Pending Orders</h2>
            <p style="color: #b9bbbe; margin-top: -10px; font-size: 0.9rem;">Proses item secara satuan. Pesanan otomatis selesai jika semua item sudah diproses.</p>
        </div>
        <div id="ordersListContainer" style="display: grid; gap: 20px;">
            <div style="color: #72767d; text-align: center; padding: 20px;">Memuat data pesanan...</div>
        </div>
    `,

  init: async (supabase, userData) => {
    const container = document.getElementById("ordersListContainer");
    if (!container) return;

    // --- HELPER: UPDATE HARGA TOTAL ORDER SETELAH REJECT ---
    const updateOrderTotal = async (orderId) => {
      const { data: items, error } = await supabase
        .from("order_items")
        .select("price, quantity")
        .eq("order_id", orderId)
        .neq("status", "rejected");

      const newTotal = (items || []).reduce((sum, i) => {
        // Karena sekarang database angka, langsung hitung
        return sum + Number(i.price) * Number(i.quantity);
      }, 0);

      await supabase
        .from("orders")
        .update({ total_price: newTotal })
        .eq("id", orderId);

      return newTotal;
    };

    const loadOrders = async () => {
      const currentContainer = document.getElementById("ordersListContainer");
      if (!currentContainer) return;

      try {
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
              (item) => item.order_id === order.id,
            ),
          }))
          .filter((order) => order.rincian.length > 0);

        renderOrders(currentContainer);
      } catch (err) {
        console.error("Load Error:", err);
      }
    };

    const renderOrders = (targetEl) => {
      if (OrdersPage.state.orders.length === 0) {
        targetEl.innerHTML = `<div style="background:#2f3136; padding:40px; border-radius:12px; text-align:center; color:#72767d; border: 1px dashed #4f545c;">Semua item pesanan telah diproses.</div>`;
        return;
      }

      targetEl.innerHTML = OrdersPage.state.orders
        .map((order) => {
          const itemsHtml = order.rincian
            .map((item) => {
              const stockItem = OrdersPage.state.inventory.find(
                (i) => i.item_name === item.item_name,
              );
              const isBundling = item.item_type === "Bundling";
              const stockExist = stockItem ? stockItem.stock : 0;
              const isStockLow = isBundling
                ? false
                : stockExist < item.quantity;

              const categoryColors = {
                Weapon: "#e74c3c",
                Ammo: "#f1c40f",
                Vest: "#3498db",
                Attachment: "#e67e22",
                Bundling: "#9b59b6",
              };
              const safeType = item.item_type || "Item";
              const typeColor = categoryColors[safeType] || "#72767d";

              return `
                <div style="background:#18191c; margin-top:10px; padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; border-left: 4px solid ${typeColor};">
                  <div>
                    <div style="font-size:0.65rem; color:${typeColor}; font-weight:bold; text-transform:uppercase; margin-bottom:4px;">${safeType}</div>
                    <div style="color:#fff; font-weight:bold;">${
                      item.item_name
                    } <span style="color:#43b581;">x${
                      item.quantity
                    }</span></div>
                    <div style="font-size:0.75rem; color:${
                      isStockLow ? "#f04747" : "#b9bbbe"
                    };">
                      ${isBundling ? "Paket Bundling" : "Gudang: " + stockExist}
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
                </div>`;
            })
            .join("");

          return `
            <div class="order-card-container" style="background:#2f3136; border-radius:12px; padding:20px; border:1px solid #4f545c; margin-bottom:15px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #4f545c; padding-bottom:12px; margin-bottom:5px;">
                  <div><h3 style="margin:0; color:#fff;">${
                    order.requested_by
                  }</h3></div>
                  <div style="text-align:right;">
                    <div style="color:#43b581; font-weight:bold;">
                      $ ${(Number(order.total_price) || 0).toLocaleString()}
                    </div>
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
          title: "Reject?",
          text: `Tolak ${item.item_name}?`,
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
        let finalSnNotes = "";
        let selectedWeaponData = [];

        // --- HANDLING SN UNTUK APPROVE ---
        if (item.item_type === "Bundling") {
          const { data: components } = await supabase
            .from("bundle_items")
            .select("nama_barang_stok, jumlah_potong")
            .eq("nama_paket", item.item_name);
          if (!components || components.length === 0)
            throw new Error("Komponen bundling tidak ditemukan!");

          for (const comp of components) {
            const katalogComp = OrdersPage.state.katalog.find(
              (k) => k.nama_barang === comp.nama_barang_stok,
            );
            if (katalogComp?.jenis_barang === "Weapon") {
              const sns = await pickSnForWeapon(
                comp.nama_barang_stok,
                comp.jumlah_potong * item.quantity,
              );
              if (!sns) return;
              finalSnNotes += `${comp.nama_barang_stok}: ${sns
                .map((s) => s.sn)
                .join(", ")} | `;
              selectedWeaponData.push(...sns.map((s) => s.id));
            }
          }
        } else {
          const katalogItem = OrdersPage.state.katalog.find(
            (k) => k.nama_barang === item.item_name,
          );
          if (katalogItem?.jenis_barang === "Weapon") {
            const sns = await pickSnForWeapon(item.item_name, item.quantity);
            if (!sns) return;
            finalSnNotes = sns.map((s) => s.sn).join(", ");
            selectedWeaponData.push(...sns.map((s) => s.id));
          }
        }

        // Jalankan proses approve dengan data SN yang sudah dikumpulkan
        await processItem(
          order,
          item,
          "approved",
          finalSnNotes,
          selectedWeaponData,
        );
      } catch (err) {
        Swal.fire("Gagal", err.message, "error");
      }
    };

    const pickSnForWeapon = async (weaponName, qty) => {
      const { data: units } = await supabase
        .from("inventory_weapons")
        .select("id, serial_number")
        .eq("weapon_name", weaponName)
        .eq("status", "available")
        .is("hold_by", null);
      if (!units || units.length < qty)
        throw new Error(`Stok SN untuk ${weaponName} tidak cukup!`);

      const { value: selectedSns } = await Swal.fire({
        title: `Pilih ${qty} SN untuk ${weaponName}`,
        background: "#2f3136",
        color: "#fff",
        html: `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">${units
          .map(
            (u) =>
              `<button class="sn-choice" data-id="${u.id}" data-sn="${u.serial_number}" style="background:#202225; border:1px solid #4f545c; color:#eee; padding:8px; border-radius:6px; cursor:pointer;">${u.serial_number}</button>`,
          )
          .join("")}</div>`,
        didOpen: () => {
          let count = 0;
          document.querySelectorAll(".sn-choice").forEach((b) => {
            b.onclick = () => {
              if (b.classList.toggle("selected")) {
                if (count < qty) {
                  b.style.background = "#43b58144";
                  b.style.borderColor = "#43b581";
                  count++;
                } else {
                  b.classList.remove("selected");
                }
              } else {
                b.style.background = "#202225";
                b.style.borderColor = "#4f545c";
                count--;
              }
            };
          });
        },
        preConfirm: () => {
          const sel = document.querySelectorAll(".sn-choice.selected");
          if (sel.length !== qty)
            return Swal.showValidationMessage(`Pilih tepat ${qty} SN!`);
          return Array.from(sel).map((el) => ({
            id: el.dataset.id,
            sn: el.dataset.sn,
          }));
        },
      });
      return selectedSns;
    };

    const processItem = async (
      order,
      item,
      status,
      snNotes = "",
      selectedWeaponIds = [],
    ) => {
      OrdersPage.state.isProcessing = true;
      Swal.fire({
        title: "Processing...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        if (status === "approved") {
          // --- 1. HANDLING KHUSUS BUNDLING (Potong stok komponen) ---
          if (item.item_type === "Bundling") {
            const { data: components } = await supabase
              .from("bundle_items")
              .select("nama_barang_stok, jumlah_potong")
              .eq("nama_paket", item.item_name);

            if (components) {
              for (const comp of components) {
                // Potong stok masing-masing komponen bundling
                await supabase.rpc("decrement_inventory", {
                  i_name: comp.nama_barang_stok,
                  i_qty: comp.jumlah_potong * item.quantity,
                });
              }
            }
          }

          // --- 2. JALANKAN RPC APPROVE (Untuk item satuan atau update status item) ---
          const kat = OrdersPage.state.katalog.find(
            (k) => k.nama_barang === item.item_name,
          );

          const { error } = await supabase.rpc("approve_order_item", {
            p_item_id: item.id,
            p_order_id: order.id,
            p_item_name: item.item_name,
            p_qty: item.quantity,
            p_is_weapon: kat?.jenis_barang === "Weapon",
            p_weapon_ids: selectedWeaponIds,
            p_sn_notes: snNotes,
            p_admin_name: userData.nama_lengkap,
            p_admin_id: userData.id, // <--- TAMBAHKAN LINE INI
          });

          if (error) throw error;
        } else {
          // --- LOGIKA REJECT (Bundling, Weapon, Non-Weapon SEMUA SAMA) ---
          // Tidak ada potong stok, hanya ubah status dan kurangi Total Harga
          const { error: updateError } = await supabase
            .from("order_items")
            .update({ status: "rejected" })
            .eq("id", item.id);

          if (updateError) throw updateError;

          // Hitung ulang total harga di tabel 'orders'
          await updateOrderTotal(order.id);

          // Cek apakah semua item dalam order ini sudah selesai diproses
          const { data: remainingPending } = await supabase
            .from("order_items")
            .select("id")
            .eq("order_id", order.id)
            .eq("status", "pending");

          if (!remainingPending || remainingPending.length === 0) {
            // SAAT ORDER SELESAI KARENA REJECT, ISI DATA ADMIN
            await supabase
              .from("orders")
              .update({
                status: "processed",
                processed_at: new Date().toISOString(),
                processed_by: userData.id, // ID dari users_login
                processed_by_name: userData.nama_lengkap, // Nama dari users_login
              })
              .eq("id", order.id);
          }
        }

        // --- 3. AUDIT LOG ---
        await supabase.functions.invoke("admin-actions", {
          body: {
            action: "create_audit_log",
            log_data: {
              action_type: status.toUpperCase(),
              target_table: "order_items",
              details: `${status.toUpperCase()} ${item.item_name} (x${item.quantity}) untuk ${order.requested_by}`,
              admin_name: userData.nama_lengkap,
            },
          },
        });

        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          timer: 1000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Process Error:", error);
        Swal.fire("Error", error.message || "Gagal memproses", "error");
      } finally {
        await loadOrders();
        OrdersPage.state.isProcessing = false;
      }
    };

    loadOrders();
  },
};
