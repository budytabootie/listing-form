import { GlobalCart } from "./globalCart.js";

export const WeaponPage = {
  // Fungsi pembantu untuk render card gaya Attachment
  renderCard: (name, price, stock, isOut) => `
    <div class="item-card ${
      isOut ? "disabled" : ""
    }" style="background: #2f3136; border-radius: 12px; padding: 20px; border: 1px solid #40444b; display: flex; flex-direction: column; transition: transform 0.2s;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
            <div style="background: rgba(240, 71, 71, 0.1); color: #f04747; width: 45px; height: 45px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; border: 1px solid rgba(240, 71, 71, 0.2);">
                <i class="fas fa-gun"></i>
            </div>
            <div style="text-align: right;">
                <div style="color: #43b581; font-weight: 800; font-size: 1.2rem;">$ ${price.toLocaleString()}</div>
                <div style="font-size: 0.75rem; color: ${
                  isOut ? "#ed4245" : "#43b581"
                }; font-weight: bold; margin-top: 2px;">
                    ${isOut ? "STOK HABIS" : `STOK: ${stock}`}
                </div>
            </div>
        </div>
        <div style="flex-grow: 1;">
            <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 1.1rem; letter-spacing: 0.5px;">${name}</h3>
            <p style="color: #b9bbbe; font-size: 0.8rem; line-height: 1.5; margin-bottom: 20px;">Senjata api kualitas standar operasional.</p>
        </div>
        <button onclick="${
          isOut ? "" : `window.openOrder('${name}', ${stock}, ${price})`
        }" 
            ${isOut ? "disabled" : ""} 
            class="btn-order" 
            style="width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 800; font-size: 0.85rem; cursor: ${
              isOut ? "not-allowed" : "pointer"
            }; 
            background: ${
              isOut ? "#4f545c" : "#f04747"
            }; color: white; transition: 0.3s; text-transform: uppercase;">
            ${
              isOut
                ? "Out of Stock"
                : '<i class="fas fa-cart-plus" style="margin-right:8px;"></i> Ambil Weapon'
            }
        </button>
    </div>
  `,

  render: () => `
    <div class="category-page">
        <div class="category-header" style="--header-bg: rgba(240, 71, 71, 0.2); --header-color: #f04747;">
            <button onclick="window.loadPage('home')" class="back-btn-modern">
                <i class="fas fa-chevron-left"></i>
            </button>
            <div class="header-title">
                <h2>WEAPON STORE</h2>
                <span class="header-subtitle">Katalog persenjataan tersedia</span>
            </div>
            <div class="header-icon-main"><i class="fas fa-gun"></i></div>
        </div>
        <div class="category-main-content" id="weapon-main-container">
            <div class="catalog-grid" id="weapon-catalog">
                <div style="color: #72767d; text-align: center; padding: 50px; grid-column: 1/-1;">
                    <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-bottom:10px;"></i>
                    <p>Memuat katalog...</p>
                </div>
            </div>
        </div>
    </div>
  `,

  renderOrderForm: (itemName, availableStock, price) => `
    <div class="selection-container">
        <div id="weapon-form" class="order-card-modern">
            <div class="selected-item-info">
                <span class="label">Item:</span>
                <h3 class="item-name-display" style="color: #f04747;">${itemName}</h3>
                <div style="color: #43b581; font-weight: bold;">$${Number(
                  price
                ).toLocaleString()} / Unit</div>
            </div>
            <div class="input-group-modern">
                <label>Jumlah Unit</label>
                <div class="qty-wrapper-modern" style="border-color: #4f545c;">
                    <button class="qty-ctrl" onclick="this.nextElementSibling.stepDown()">-</button>
                    <input type="number" id="itemQty" value="1" min="1" max="${availableStock}">
                    <button class="qty-ctrl" onclick="this.previousElementSibling.stepUp()">+</button>
                </div>
            </div>
            <div class="status-container">
                <div class="stock-badge-modern" style="border-color: #43b581;">Tersedia: ${availableStock}</div>
            </div>
            <button id="submitWeapon" class="btn-submit-weapon" style="background: #f04747;">MASUKKAN KERANJANG</button>
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
        acc[curr.nama_barang] = Number(curr.harga_satuan) || 0;
        return acc;
      }, {});

      const dbStockMap = (resWeapons.data || []).reduce((acc, item) => {
        acc[item.weapon_name] = (acc[item.weapon_name] || 0) + 1;
        return acc;
      }, {});

      catalogContainer.innerHTML = Object.keys(dbStockMap)
        .map((name) => {
          const displayStock = dbStockMap[name] - GlobalCart.getQtyInCart(name);
          return WeaponPage.renderCard(
            name,
            priceMap[name] || 0,
            displayStock,
            displayStock <= 0
          );
        })
        .join("");

      window.openOrder = (name, availableStock, price) => {
        const mainContainer = document.getElementById("weapon-main-container");
        if (mainContainer) {
          mainContainer.innerHTML = WeaponPage.renderOrderForm(
            name,
            availableStock,
            price
          );
          document.getElementById("submitWeapon").onclick = () => {
            const qty = parseInt(document.getElementById("itemQty").value);
            if (
              GlobalCart.addToCart(
                { nama: name, qty, harga: Number(price), kategori: "Weapon" },
                availableStock + GlobalCart.getQtyInCart(name)
              )
            ) {
              window.loadPage("weapon");
            }
          };
        }
      };
    } catch (err) {
      catalogContainer.innerHTML = `<div style="color:#ed4245; padding:20px;">Error loading catalog.</div>`;
    }
  },
};
