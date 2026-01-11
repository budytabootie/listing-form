import { GlobalCart } from "./globalCart.js";
import { API } from "../js/core/api.js";

export const AmmoPage = {
  state: { items: [] },

  renderCard: (item, isOut) => {
    const formatHarga = item.harga_satuan
      ? `$ ${Number(item.harga_satuan).toLocaleString()}`
      : "$ 0";

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
                <p style="color: #b9bbbe; font-size: 0.85rem; line-height: 1.4; margin: 0; font-style: italic;">${compatibleInfo}</p>
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
                <span class="label" style="display:block; margin-bottom:5px; color:#b9bbbe; font-size:0.8rem;">Item Terpilih:</span>
                <h3 class="item-name-display" style="color: #faa61a; margin:0; font-size:1.5rem;">${itemName}</h3>
                <div style="color: #43b581; font-weight: bold; margin-top:5px;">$${Number(
                  price
                ).toLocaleString()} / Unit</div>
            </div>
            <div class="input-group-modern" style="margin: 25px 0;">
                <label style="display:block; margin-bottom:10px; color:#b9bbbe; font-size:0.9rem;">Tentukan Jumlah</label>
                <div class="qty-wrapper-modern" style="display:flex; align-items:center; background:#18191c; border-radius:10px; padding:5px; border:1px solid #4f545c;">
                    <button class="qty-ctrl" style="width:45px; height:45px; background:none; border:none; color:white; font-size:1.2rem; cursor:pointer;" onclick="this.nextElementSibling.stepDown()">-</button>
                    <input type="number" id="ammoQty" value="1" min="1" max="${availableStock}" style="flex:1; background:none; border:none; color:white; text-align:center; font-weight:bold; font-size:1.1rem; outline:none;">
                    <button class="qty-ctrl" style="width:45px; height:45px; background:none; border:none; color:white; font-size:1.2rem; cursor:pointer;" onclick="this.previousElementSibling.stepUp()">+</button>
                </div>
            </div>
            <div class="status-container">
                <div class="stock-badge-modern" style="border:1px dashed #43b581; color:#43b581; text-align:center; padding:10px; border-radius:8px; font-size:0.85rem; margin-bottom:20px;">
                    Stok Tersedia: ${availableStock}
                </div>
            </div>
            <button id="btnAddToCart" class="btn-submit-weapon" style="background: #faa61a; width:100%; padding:15px; border:none; border-radius:12px; color:white; font-weight:bold; cursor:pointer; font-size:1rem;">MASUKKAN KERANJANG</button>
            <button onclick="window.loadPage('ammo')" class="btn-cancel-weapon" style="width:100%; background:none; border:none; color:#72767d; margin-top:15px; cursor:pointer; text-decoration:underline; font-size:0.9rem;">Kembali ke Katalog</button>
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

    window.openOrderAmmo = (itemName, stock, price) => {
      const mainContainer = document.getElementById("ammo-main-container");
      mainContainer.innerHTML = AmmoPage.renderOrderForm(
        itemName,
        stock,
        price
      );

      document.getElementById("btnAddToCart").onclick = () => {
        const qty = parseInt(document.getElementById("ammoQty").value);
        if (qty > 0 && qty <= stock) {
          // Sinkron dengan globalCart.js: nama, harga, qty, kategori
          GlobalCart.addToCart(
            {
              nama: itemName,
              harga: price,
              qty: qty,
              kategori: "Ammo",
            },
            stock
          );
          window.loadPage("ammo");
        }
      };
    };

    const loadAmmo = async () => {
      try {
        const { data: katalog, error: errKatalog } =
          await API.getItemsByCategory("Ammo");
        const { data: inventory, error: errInv } = await API.getInventory();

        if (errKatalog) throw errKatalog;

        const safeKatalog = katalog || [];
        const safeInventory = inventory || [];

        AmmoPage.state.items = safeKatalog.map((a) => {
          const invData = safeInventory.find(
            (i) => i.item_name === a.nama_barang
          );
          const dbStock = invData ? invData.stock : 0;
          // Memastikan memanggil nama_barang agar sinkron dengan getQtyInCart
          const cartQty = GlobalCart.getQtyInCart(a.nama_barang);

          return {
            ...a,
            stok: dbStock - cartQty,
          };
        });

        renderAmmo();
      } catch (error) {
        console.error("System Error:", error);
        container.innerHTML = `<p style="color:#ed4245; text-align:center; grid-column:1/-1;">Gagal sinkronisasi data amunisi.</p>`;
      }
    };

    const renderAmmo = () => {
      if (AmmoPage.state.items.length === 0) {
        container.innerHTML = `<p style="color:white; text-align:center; grid-column:1/-1;">Tidak ada amunisi tersedia saat ini.</p>`;
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
