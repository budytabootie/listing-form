import { GlobalCart } from "./globalCart.js";

export const WeaponPage = {
  render: () => `
    <div class="category-page">
        <div class="page-header-weapon">
            <button onclick="window.loadPage('home')" class="back-btn-modern">
                <i class="fas fa-chevron-left"></i>
            </button>
            <div class="header-title">
                <h2>WEAPON STORE</h2>
                <span id="weapon-subtitle">Katalog persenjataan tersedia</span>
            </div>
            <div class="header-icon-main"><i class="fas fa-gun"></i></div>
        </div>
        <div id="weapon-main-container">
            <div class="catalog-grid" id="weapon-catalog">
                <div class="loading-state">Memuat katalog...</div>
            </div>
        </div>
    </div>
  `,

  renderOrderForm: (itemName, availableStock, price) => `
    <div class="selection-container">
        <div id="weapon-form" class="order-card-modern">
            <div class="selected-item-info">
                <span class="label">Item:</span>
                <h3 class="item-name-display">${itemName}</h3>
                <div style="color: #43b581; font-weight: bold;">$${Number(
                  price
                ).toLocaleString()} / Unit</div>
            </div>
            <div class="input-group-modern">
                <label>Jumlah Unit</label>
                <div class="qty-wrapper-modern">
                    <button class="qty-ctrl" onclick="this.nextElementSibling.stepDown()">-</button>
                    <input type="number" id="itemQty" value="1" min="1" max="${availableStock}">
                    <button class="qty-ctrl" onclick="this.previousElementSibling.stepUp()">+</button>
                </div>
            </div>
            <div class="status-container">
                <div class="stock-badge-modern">Tersedia: ${availableStock}</div>
            </div>
            <button id="submitWeapon" class="btn-submit-weapon">MASUKKAN KERANJANG</button>
            <button onclick="window.loadPage('weapon')" class="btn-cancel-weapon">Batal</button>
        </div>
    </div>
  `,

  init: async (supabase) => {
    const catalogContainer = document.getElementById("weapon-catalog");
    if (!catalogContainer) return;

    try {
      const [resWeapons, resPrice] = await Promise.all([
        supabase
          .from("inventory_weapons")
          .select("weapon_name")
          .eq("status", "available")
          .is("hold_by", null),
        supabase
          .from("katalog_barang")
          .select("nama_barang, harga_satuan")
          .eq("jenis_barang", "Weapon"),
      ]);

      const priceMap = (resPrice.data || []).reduce((acc, curr) => {
        // Pastikan harga disimpan sebagai Number murni
        acc[curr.nama_barang] = Number(curr.harga_satuan) || 0;
        return acc;
      }, {});

      const dbStockMap = (resWeapons.data || []).reduce((acc, item) => {
        acc[item.weapon_name] = (acc[item.weapon_name] || 0) + 1;
        return acc;
      }, {});

      const uniqueWeapons = Object.keys(dbStockMap);

      catalogContainer.innerHTML = uniqueWeapons
        .map((name) => {
          const qtyInCart = GlobalCart.getQtyInCart(name);
          const displayStock = dbStockMap[name] - qtyInCart;
          const isOutOfStock = displayStock <= 0;
          const rawPrice = priceMap[name] || 0;

          return `
          <div class="weapon-card ${isOutOfStock ? "disabled" : "ready"}" 
               ${
                 isOutOfStock
                   ? ""
                   : `onclick="window.openOrder('${name}', ${displayStock}, ${rawPrice})"`
               }>
              <div class="weapon-card-details">
                  <h4>${name}</h4>
                  <div style="color: #43b581; font-size: 0.8rem; font-weight: bold; margin-bottom: 5px;">
                    $${rawPrice.toLocaleString()}
                  </div>
                  <div class="badge-status ${isOutOfStock ? "out" : "ready"}">
                      ${isOutOfStock ? "FULL" : `STOK: ${displayStock}`}
                  </div>
              </div>
          </div>`;
        })
        .join("");

      window.openOrder = (name, availableStock, price) => {
        document.getElementById("weapon-main-container").innerHTML =
          WeaponPage.renderOrderForm(name, availableStock, price);

        document.getElementById("submitWeapon").onclick = () => {
          const qty = parseInt(document.getElementById("itemQty").value);

          // Kirim harga sebagai Number murni ke GlobalCart
          const success = GlobalCart.addToCart(
            {
              nama: name,
              qty: qty,
              harga: Number(price),
              kategori: "Weapon",
            },
            availableStock + GlobalCart.getQtyInCart(name)
          );

          if (success) window.loadPage("weapon");
        };
      };
    } catch (err) {
      catalogContainer.innerHTML = `<div style="color:#ed4245; padding:20px;">Error loading catalog.</div>`;
    }
  },
};
