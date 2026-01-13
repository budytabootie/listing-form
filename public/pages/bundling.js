import { GlobalCart } from "./globalCart.js";

export const BundlingPage = {
  state: { items: [] },

  renderCard: (paket, isOut) => {
    return `
      <div class="item-card" style="background: #2f3136; border-radius: 12px; padding: 20px; border: 1px solid #40444b; display: flex; flex-direction: column; transition: transform 0.2s; ${
        isOut ? "opacity: 0.6; filter: grayscale(1);" : ""
      }">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
              <div style="background: rgba(241, 196, 15, 0.1); color: #f1c40f; width: 45px; height: 45px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; border: 1px solid rgba(241, 196, 15, 0.2);">
                  <i class="fas fa-box-open"></i>
              </div>
              <div style="text-align: right;">
                  <div style="color: #43b581; font-weight: 800; font-size: 1.2rem;">$ ${Number(
                    paket.total_harga
                  ).toLocaleString()}</div>
                  <div style="font-size: 0.75rem; color: ${
                    isOut ? "#ed4245" : "#43b581"
                  }; font-weight: bold; margin-top: 2px;">
                    ${
                      isOut
                        ? "STOK TIDAK CUKUP"
                        : `TERSEDIA: ${paket.stok} PAKET`
                    }
                  </div>
              </div>
          </div>
          <div style="flex-grow: 1;">
              <h3 style="color: #fff; margin: 0 0 5px 0; font-size: 1.1rem;">${
                paket.nama_paket
              }</h3>
              <p style="color: #b9bbbe; font-size: 0.8rem; margin-bottom: 15px;">${
                paket.deskripsi_isi || "Paket bundling spesial."
              }</p>
              
              <div style="background: #202225; padding: 10px; border-radius: 6px; margin-bottom: 20px;">
                  <div style="font-size: 0.7rem; color: #72767d; text-transform: uppercase; margin-bottom: 5px; font-weight: bold;">Rincian Isi:</div>
                  ${paket.komponen
                    .map(
                      (k) => `
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:${
                      k.ada < k.butuh ? "#ed4245" : "#fff"
                    };">
                        <span>• ${k.nama}</span>
                        <span>${k.butuh} pcs ${
                        k.ada < k.butuh ? `(Sisa ${k.ada})` : ""
                      }</span>
                    </div>
                  `
                    )
                    .join("")}
              </div>
          </div>
          <button onclick="${
            isOut
              ? ""
              : `window.openOrderBundling('${paket.nama_paket}', ${paket.stok}, ${paket.total_harga})`
          }" 
              ${isOut ? "disabled" : ""} 
              class="btn-order" 
              style="width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 800; font-size: 0.85rem; cursor: ${
                isOut ? "not-allowed" : "pointer"
              }; 
              background: ${isOut ? "#4f545c" : "#f1c40f"}; color: ${
      isOut ? "white" : "#2f3136"
    }; transition: 0.3s; text-transform: uppercase;">
              ${
                isOut
                  ? "Komponen Kurang"
                  : '<i class="fas fa-cart-plus" style="margin-right:8px;"></i> Ambil Paket'
              }
          </button>
      </div>`;
  },

  renderOrderForm: (itemName, availableStock, price) => `
    <div class="selection-container">
        <div class="order-card-modern">
            <div class="selected-item-info">
                <span class="label">Paket:</span>
                <h3 class="item-name-display" style="color: #f1c40f;">${itemName}</h3>
                <div style="color: #43b581; font-weight: bold;">$${Number(
                  price
                ).toLocaleString()} / Paket</div>
            </div>
            <div class="input-group-modern">
                <label>Jumlah Paket</label>
                <div class="qty-wrapper-modern" style="border-color: #4f545c;">
                    <button class="qty-ctrl" onclick="this.nextElementSibling.stepDown()">-</button>
                    <input type="number" id="bundleQty" value="1" min="1" max="${availableStock}">
                    <button class="qty-ctrl" onclick="this.previousElementSibling.stepUp()">+</button>
                </div>
            </div>
            <div class="status-container">
                <div class="stock-badge-modern" style="border-color: #43b581;">Maksimal: ${availableStock} Paket</div>
            </div>
            <button id="submitBundle" class="btn-submit-weapon" style="background: #f1c40f; color: #2f3136;">MASUKKAN KERANJANG</button>
            <button onclick="window.loadPage('bundling')" class="btn-cancel-weapon">Batal</button>
        </div>
    </div>
  `,

  render: () => `
    <div class="category-page">
        <div class="category-header" style="--header-bg: rgba(241, 196, 15, 0.2); --header-color: #f1c40f;">
            <button onclick="window.loadPage('home')" class="back-btn-modern"><i class="fas fa-chevron-left"></i></button>
            <div class="header-title">
                <h2>SPECIAL BUNDLING</h2>
                <span class="header-subtitle">Paket eksklusif dengan harga khusus</span>
            </div>
            <div class="header-icon-main"><i class="fas fa-layer-group"></i></div>
        </div>
        <div class="category-main-content" id="bundling-main-container">
            <div class="catalog-grid" id="bundlingList">
                <div style="color: #72767d; text-align: center; padding: 50px; grid-column: 1/-1;">
                    <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-bottom:10px;"></i>
                    <p>Mengkalkulasi stok komponen...</p>
                </div>
            </div>
        </div>
    </div>
  `,

  init: async (supabase) => {
    const container = document.getElementById("bundlingList");
    if (!container) return;

    const loadBundlingData = async () => {
      const [
        { data: masterPaket },
        { data: bundleItems },
        { data: inventory },
        { data: weapons },
      ] = await Promise.all([
        supabase.from("master_paket").select("*").eq("is_active", true),
        supabase.from("bundle_items").select("*"),
        supabase.from("inventory").select("item_name, stock"),
        supabase
          .from("inventory_weapons")
          .select("weapon_name")
          .eq("status", "available")
          .is("hold_by", null),
      ]);

      const weaponStockMap = (weapons || []).reduce((acc, w) => {
        acc[w.weapon_name] = (acc[w.weapon_name] || 0) + 1;
        return acc;
      }, {});

      BundlingPage.state.items = (masterPaket || []).map((paket) => {
        const isiPaket = bundleItems.filter(
          (bi) => bi.nama_paket === paket.nama_paket
        );
        let stokMaksimalPaket = Infinity;

        const detailStok = isiPaket.map((item) => {
          let stokTersedia =
            weaponStockMap[item.nama_barang_stok] ??
            (inventory.find((i) => i.item_name === item.nama_barang_stok)
              ?.stock ||
              0);

          stokTersedia -= GlobalCart.getQtyInCart(item.nama_barang_stok);

          const kapasitas = Math.floor(stokTersedia / item.jumlah_potong);
          if (kapasitas < stokMaksimalPaket) stokMaksimalPaket = kapasitas;

          return {
            nama: item.nama_barang_stok,
            butuh: item.jumlah_potong,
            ada: Math.max(0, stokTersedia),
          };
        });

        return {
          ...paket,
          stok:
            stokMaksimalPaket === Infinity ? 0 : Math.max(0, stokMaksimalPaket),
          komponen: detailStok,
        };
      });
      renderBundling();
    };

    const renderBundling = () => {
      container.innerHTML = BundlingPage.state.items
        .map((p) => BundlingPage.renderCard(p, p.stok <= 0))
        .join("");
    };

    window.openOrderBundling = (name, availableStock, price) => {
      const mainContainer = document.getElementById("bundling-main-container");
      if (mainContainer) {
        mainContainer.innerHTML = BundlingPage.renderOrderForm(
          name,
          availableStock,
          price
        );
        document.getElementById("submitBundle").onclick = () => {
          const qtyField = document.getElementById("bundleQty");
          const qty = parseInt(qtyField.value);

          if (isNaN(qty) || qty < 1) return;

          // Perbaikan pengiriman data ke Cart
          const success = GlobalCart.addToCart(
            {
              nama: name,
              harga: price, // Tetap gunakan price original (number)
              kategori: "Bundling",
              qty: qty,
            },
            availableStock + GlobalCart.getQtyInCart(name)
          );

          if (success) {
            window.loadPage("bundling");
          }
        };
      }
    };

    loadBundlingData();
  },
};
