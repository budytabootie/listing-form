import { GlobalCart } from "./globalCart.js";
import { API } from "../js/core/api.js"; // Import API wrapper

export const AmmoPage = {
  state: { items: [] },

  renderCard: (item, isOut) => {
    const formatHarga = item.harga_satuan
      ? `$ ${Number(item.harga_satuan).toLocaleString()}`
      : "$ 0";

    // Logika deskripsi senjata yang kompatibel
    // Jika kolom 'deskripsi' di DB berisi: "9mm, Compatible: Glock, Sig Sauer"
    const compatibleInfo = item.deskripsi || "Amunisi standar operasional.";

    return `
      <div class="item-card" style="background: #2f3136; border-radius: 12px; padding: 20px; border: 1px solid #40444b; display: flex; flex-direction: column; transition: transform 0.2s; ${
        isOut ? "opacity: 0.6; filter: grayscale(1);" : ""
      }">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
              <div style="background: rgba(250, 166, 26, 0.1); color: #faa61a; width: 45px; height: 45px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; border: 1px solid rgba(250, 166, 26, 0.2);">
                  <i class="fas fa-box-open"></i>
              </div>
              <div style="text-align: right;">
                  <div style="color: #43b581; font-weight: 800; font-size: 1.2rem;">${formatHarga}</div>
                  <div style="font-size: 0.75rem; color: ${
                    isOut ? "#ed4245" : "#43b581"
                  }; font-weight: bold; margin-top: 2px;">
                    ${
                      item.status !== "Ready"
                        ? item.status.toUpperCase()
                        : isOut
                        ? "STOK HABIS"
                        : `STOK: ${item.stok}`
                    }
                  </div>
              </div>
          </div>
          <div style="flex-grow: 1;">
              <h3 style="color: #fff; margin: 0 0 4px 0; font-size: 1.1rem; letter-spacing: 0.5px;">${
                item.nama_barang
              }</h3>
              
              <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px; margin-bottom: 20px; border-left: 3px solid #faa61a;">
                <p style="color: #8e9297; font-size: 0.7rem; text-transform: uppercase; font-weight: 800; margin: 0 0 4px 0;">Cocok Untuk:</p>
                <p style="color: #b9bbbe; font-size: 0.85rem; line-height: 1.4; margin: 0; font-style: italic;">
                  ${compatibleInfo}
                </p>
              </div>
          </div>
          <button onclick="${
            isOut
              ? ""
              : `window.openOrderAmmo('${item.nama_barang}', ${item.stok}, ${item.harga_satuan})`
          }" 
              ${isOut ? "disabled" : ""} 
              class="btn-order" 
              style="width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 800; font-size: 0.85rem; cursor: ${
                isOut ? "not-allowed" : "pointer"
              }; 
              background: ${
                isOut ? "#4f545c" : "#faa61a"
              }; color: white; transition: 0.3s; text-transform: uppercase;">
              ${
                isOut
                  ? "Out of Stock"
                  : '<i class="fas fa-cart-plus" style="margin-right:8px;"></i> Ambil Ammo'
              }
          </button>
      </div>`;
  },

  renderOrderForm: (itemName, availableStock, price) => `
    <div class="selection-container">
        <div class="order-card-modern">
            <div class="selected-item-info">
                <span class="label">Item:</span>
                <h3 class="item-name-display" style="color: #faa61a;">${itemName}</h3>
                <div style="color: #43b581; font-weight: bold;">$${Number(
                  price
                ).toLocaleString()} / Unit</div>
            </div>
            <div class="input-group-modern">
                <label>Jumlah Amunisi</label>
                <div class="qty-wrapper-modern" style="border-color: #4f545c;">
                    <button class="qty-ctrl" onclick="this.nextElementSibling.stepDown(); event.stopPropagation();">-</button>
                    <input type="number" id="ammoQty" value="1" min="1" max="${availableStock}">
                    <button class="qty-ctrl" onclick="this.previousElementSibling.stepUp(); event.stopPropagation();">+</button>
                </div>
            </div>
            <div class="status-container">
                <div class="stock-badge-modern" style="border-color: #43b581;">Tersedia: ${availableStock}</div>
            </div>
            <button id="submitAmmo" class="btn-submit-weapon" style="background: #faa61a;">MASUKKAN KERANJANG</button>
            <button onclick="window.loadPage('ammo')" class="btn-cancel-weapon">Batal</button>
        </div>
    </div>
  `,

  render: () => `
    <div class="category-page">
        <div class="category-header" style="--header-bg: rgba(250, 166, 26, 0.2); --header-color: #faa61a;">
            <button onclick="window.loadPage('home')" class="back-btn-modern"><i class="fas fa-chevron-left"></i></button>
            <div class="header-title"><h2>AMMO SUPPLY</h2><span class="header-subtitle">Pastikan stok amunisi Anda sesuai dengan spesifikasi senjata</span></div>
            <div class="header-icon-main"><i class="fas fa-box-open"></i></div>
        </div>
        <div class="category-main-content" id="ammo-main-container">
            <div class="catalog-grid" id="ammoList">
                <div style="color: #72767d; text-align: center; padding: 50px; grid-column: 1/-1;"><i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-bottom:10px;"></i><p>Sinkronisasi data amunisi...</p></div>
            </div>
        </div>
    </div>
  `,

  init: async () => {
    const container = document.getElementById("ammoList");
    if (!container) return;

    // Di dalam ammo.js bagian loadAmmo
    const loadAmmo = async () => {
      try {
        const { data: katalog, error: errKatalog } =
          await API.getItemsByCategory("Ammo");
        const { data: inventory, error: errInv } = await API.getInventory();

        if (errKatalog) {
          console.error("Error Katalog:", errKatalog.message);
          return;
        }

        // Gunakan array kosong jika data null
        const safeKatalog = katalog || [];
        const safeInventory = inventory || [];

        AmmoPage.state.items = safeKatalog.map((a) => ({
          ...a,
          // Fallback stok jika tidak ada di inventory
          stok:
            (safeInventory.find((i) => i.item_name === a.nama_barang)?.stock ||
              0) - GlobalCart.getQtyInCart(a.nama_barang),
        }));

        renderAmmo();
      } catch (error) {
        console.error("System Error:", error);
      }
    };

    const renderAmmo = () => {
      if (AmmoPage.state.items.length === 0) {
        container.innerHTML = `<p style="color:white; text-align:center; grid-column:1/-1;">Tidak ada amunisi tersedia.</p>`;
        return;
      }
      container.innerHTML = AmmoPage.state.items
        .map((item) =>
          AmmoPage.renderCard(item, item.stok <= 0 || item.status !== "Ready")
        )
        .join("");
    };

    loadAmmo();
  },
};
