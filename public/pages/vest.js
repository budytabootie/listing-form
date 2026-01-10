import { GlobalCart } from "./globalCart.js";

export const VestPage = {
  state: { items: [] },

  renderCard: (item, isOut) => {
    const formatHarga = item.harga_satuan
      ? `$ ${Number(item.harga_satuan).toLocaleString()}`
      : "$ 0";
    return `
      <div class="item-card" style="background: #2f3136; border-radius: 12px; padding: 20px; border: 1px solid #40444b; display: flex; flex-direction: column; transition: transform 0.2s; ${
        isOut ? "opacity: 0.6; filter: grayscale(1);" : ""
      }">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
              <div style="background: rgba(52, 152, 219, 0.1); color: #3498db; width: 45px; height: 45px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; border: 1px solid rgba(52, 152, 219, 0.2);">
                  <i class="fas fa-shield-alt"></i>
              </div>
              <div style="text-align: right;">
                  <div style="color: #43b581; font-weight: 800; font-size: 1.2rem;">${formatHarga}</div>
                  <div style="font-size: 0.75rem; color: ${
                    isOut ? "#ed4245" : "#43b581"
                  }; font-weight: bold; margin-top: 2px;">
                    ${isOut ? "STOK HABIS" : `STOK: ${item.stok}`}
                  </div>
              </div>
          </div>
          <div style="flex-grow: 1;">
              <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 1.1rem; letter-spacing: 0.5px;">${
                item.nama_barang
              }</h3>
              <p style="color: #b9bbbe; font-size: 0.8rem; line-height: 1.5; margin-bottom: 20px;">Vest pelindung untuk tugas operasional.</p>
          </div>
          <button onclick="${
            isOut
              ? ""
              : `window.openOrderVest('${item.nama_barang}', ${item.stok}, ${item.harga_satuan})`
          }" 
              ${isOut ? "disabled" : ""} 
              class="btn-order" 
              style="width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 800; font-size: 0.85rem; cursor: ${
                isOut ? "not-allowed" : "pointer"
              }; 
              background: ${
                isOut ? "#4f545c" : "#3498db"
              }; color: white; transition: 0.3s; text-transform: uppercase;">
              ${
                isOut
                  ? "Out of Stock"
                  : '<i class="fas fa-cart-plus" style="margin-right:8px;"></i> Ambil Vest'
              }
          </button>
      </div>`;
  },

  renderOrderForm: (itemName, availableStock, price) => `
    <div class="selection-container">
        <div class="order-card-modern">
            <div class="selected-item-info">
                <span class="label">Item:</span>
                <h3 class="item-name-display" style="color: #3498db;">${itemName}</h3>
                <div style="color: #43b581; font-weight: bold;">$${Number(
                  price
                ).toLocaleString()} / Unit</div>
            </div>
            <div class="input-group-modern">
                <label>Jumlah Unit</label>
                <div class="qty-wrapper-modern" style="border-color: #4f545c;">
                    <button class="qty-ctrl" onclick="this.nextElementSibling.stepDown()">-</button>
                    <input type="number" id="vestQty" value="1" min="1" max="${availableStock}">
                    <button class="qty-ctrl" onclick="this.previousElementSibling.stepUp()">+</button>
                </div>
            </div>
            <div class="status-container">
                <div class="stock-badge-modern" style="border-color: #43b581;">Tersedia: ${availableStock}</div>
            </div>
            <button id="submitVest" class="btn-submit-weapon" style="background: #3498db;">MASUKKAN KERANJANG</button>
            <button onclick="window.loadPage('vest')" class="btn-cancel-weapon">Batal</button>
        </div>
    </div>
  `,

  render: () => `
    <div class="category-page">
        <div class="category-header" style="--header-bg: rgba(52, 152, 219, 0.2); --header-color: #3498db;">
            <button onclick="window.loadPage('home')" class="back-btn-modern"><i class="fas fa-chevron-left"></i></button>
            <div class="header-title">
                <h2>VEST INVENTORY</h2>
                <span class="header-subtitle">Perlengkapan perlindungan tubuh Nakama</span>
            </div>
            <div class="header-icon-main"><i class="fas fa-shield-alt"></i></div>
        </div>
        <div class="category-main-content" id="vest-main-container">
            <div class="catalog-grid" id="vestList">
                <div style="color: #72767d; text-align: center; padding: 50px; grid-column: 1/-1;">
                    <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-bottom:10px;"></i>
                    <p>Mengambil data vest...</p>
                </div>
            </div>
        </div>
    </div>
  `,

  init: async (supabase) => {
    const container = document.getElementById("vestList");
    if (!container) return;

    const loadVests = async () => {
      const { data: katalog } = await supabase
        .from("katalog_barang")
        .select("*")
        .eq("jenis_barang", "Vest");
      const { data: inventory } = await supabase
        .from("inventory")
        .select("item_name, stock");

      VestPage.state.items = katalog.map((v) => ({
        ...v,
        stok:
          (inventory.find((i) => i.item_name === v.nama_barang)?.stock || 0) -
          GlobalCart.getQtyInCart(v.nama_barang),
      }));
      renderVests();
    };

    const renderVests = () => {
      if (VestPage.state.items.length === 0) {
        container.innerHTML = `<div style="color:#72767d; padding:50px; text-align:center; grid-column:1/-1;">Tidak ada item vest yang tersedia.</div>`;
        return;
      }
      container.innerHTML = VestPage.state.items
        .map((item) => VestPage.renderCard(item, item.stok <= 0))
        .join("");
    };

    window.openOrderVest = (name, availableStock, price) => {
      const mainContainer = document.getElementById("vest-main-container");
      if (mainContainer) {
        mainContainer.innerHTML = VestPage.renderOrderForm(
          name,
          availableStock,
          price
        );
        document.getElementById("submitVest").onclick = () => {
          const qty = parseInt(document.getElementById("vestQty").value);
          if (
            GlobalCart.addToCart(
              { nama: name, harga: Number(price), kategori: "Vest", qty: qty },
              availableStock + GlobalCart.getQtyInCart(name)
            )
          ) {
            window.loadPage("vest");
          }
        };
      }
    };

    loadVests();
  },
};
