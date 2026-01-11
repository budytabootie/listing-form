import { GlobalCart } from "./globalCart.js";
import { API } from "../js/core/api.js";

export const AttachmentPage = {
  state: { items: [] },

  renderCard: (item, isOut, isNotReady) => {
    const formatHarga = item.harga_satuan
      ? `$ ${Number(item.harga_satuan).toLocaleString()}`
      : "$ 0";
    const cannotBuy = isOut || isNotReady;

    // Ambil info senjata dari kolom deskripsi
    const compatibility =
      item.deskripsi || "Aksesoris peningkatan performa senjata.";

    return `
      <div class="item-card" style="background: #2f3136; border-radius: 12px; padding: 20px; border: 1px solid #40444b; display: flex; flex-direction: column; transition: transform 0.2s; ${
        cannotBuy ? "opacity: 0.6; filter: grayscale(1);" : ""
      }">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
              <div style="background: rgba(88, 101, 242, 0.1); color: #5865f2; width: 45px; height: 45px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; border: 1px solid rgba(88, 101, 242, 0.2);">
                  <i class="fas fa-microchip"></i>
              </div>
              <div style="text-align: right;">
                  <div style="color: #43b581; font-weight: 800; font-size: 1.2rem;">${formatHarga}</div>
                  <div style="font-size: 0.75rem; color: ${
                    cannotBuy ? "#ed4245" : "#43b581"
                  }; font-weight: bold; margin-top: 2px;">
                    ${
                      isNotReady
                        ? "NOT READY"
                        : isOut
                        ? "STOK HABIS"
                        : `STOK: ${item.stok}`
                    }
                  </div>
              </div>
          </div>
          <div style="flex-grow: 1;">
              <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 1.1rem; letter-spacing: 0.5px;">${
                item.nama_barang
              }</h3>
              
              <div style="background: rgba(88, 101, 242, 0.05); padding: 10px; border-radius: 8px; border-left: 3px solid #5865f2; margin-bottom: 20px;">
                <p style="color: #8e9297; font-size: 0.65rem; text-transform: uppercase; font-weight: 800; margin: 0 0 4px 0; letter-spacing: 0.5px;">Cocok Untuk:</p>
                <p style="color: #b9bbbe; font-size: 0.8rem; line-height: 1.4; margin: 0;">${compatibility}</p>
              </div>
          </div>
          <button onclick="${
            cannotBuy
              ? ""
              : `window.openOrderAttach('${item.nama_barang}', ${item.stok}, ${item.harga_satuan})`
          }" 
              ${cannotBuy ? "disabled" : ""} 
              class="btn-order" 
              style="width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 800; font-size: 0.85rem; cursor: ${
                cannotBuy ? "not-allowed" : "pointer"
              }; 
              background: ${
                cannotBuy ? "#4f545c" : "#5865f2"
              }; color: white; transition: 0.3s; text-transform: uppercase;">
              ${
                isNotReady
                  ? "Not Ready"
                  : isOut
                  ? "Out of Stock"
                  : '<i class="fas fa-cart-plus" style="margin-right:8px;"></i> Ambil Attach'
              }
          </button>
      </div>`;
  },

  renderOrderForm: (itemName, availableStock, price) => `
    <div class="selection-container">
        <div class="order-card-modern">
            <div class="selected-item-info">
                <span class="label">Item:</span>
                <h3 class="item-name-display" style="color: #5865f2;">${itemName}</h3>
                <div style="color: #43b581; font-weight: bold;">$${Number(
                  price
                ).toLocaleString()} / Unit</div>
            </div>
            <div class="input-group-modern">
                <label>Jumlah Unit</label>
                <div class="qty-wrapper-modern" style="border-color: #4f545c;">
                    <button class="qty-ctrl" onclick="this.nextElementSibling.stepDown(); event.stopPropagation();">-</button>
                    <input type="number" id="attachQty" value="1" min="1" max="${availableStock}">
                    <button class="qty-ctrl" onclick="this.previousElementSibling.stepUp(); event.stopPropagation();">+</button>
                </div>
            </div>
            <div class="status-container">
                <div class="stock-badge-modern" style="border-color: #43b581;">Tersedia: ${availableStock}</div>
            </div>
            <button id="submitAttach" class="btn-submit-weapon" style="background: #5865f2;">MASUKKAN KERANJANG</button>
            <button onclick="window.loadPage('attachment')" class="btn-cancel-weapon">Batal</button>
        </div>
    </div>
  `,

  render: () => `
    <div class="category-page">
        <div class="category-header" style="--header-bg: rgba(88, 101, 242, 0.2); --header-color: #5865f2;">
            <button onclick="window.loadPage('home')" class="back-btn-modern"><i class="fas fa-chevron-left"></i></button>
            <div class="header-title">
                <h2>WEAPON ATTACHMENTS</h2>
                <span class="header-subtitle">Modifikasi senjata Anda untuk performa maksimal</span>
            </div>
            <div class="header-icon-main"><i class="fas fa-microchip"></i></div>
        </div>
        <div class="category-main-content" id="attach-main-container">
            <div class="catalog-grid" id="attachmentList">
                <div style="color: #72767d; text-align: center; padding: 50px; grid-column: 1/-1;">
                    <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-bottom:10px;"></i>
                    <p>Sinkronisasi modul attachment...</p>
                </div>
            </div>
        </div>
    </div>
  `,

  init: async () => {
    const container = document.getElementById("attachmentList");
    if (!container) return;

    const loadAttachments = async () => {
      try {
        // MENGGUNAKAN API WRAPPER
        const { data: katalog } = await API.getItemsByCategory("Attachment");
        const { data: inventory } = await API.getInventory();

        AttachmentPage.state.items = (katalog || []).map((a) => ({
          ...a,
          stok:
            (inventory?.find((i) => i.item_name === a.nama_barang)?.stock ||
              0) - GlobalCart.getQtyInCart(a.nama_barang),
        }));
        renderAttachments();
      } catch (err) {
        console.error("Load Attachments Error:", err);
      }
    };

    const renderAttachments = () => {
      if (AttachmentPage.state.items.length === 0) {
        container.innerHTML = `<div style="color:#72767d; padding:50px; text-align:center; grid-column:1/-1;">Tidak ada item attachment yang tersedia.</div>`;
        return;
      }
      container.innerHTML = AttachmentPage.state.items
        .map((item) =>
          AttachmentPage.renderCard(
            item,
            item.stok <= 0,
            item.status !== "Ready"
          )
        )
        .join("");
    };

    window.openOrderAttach = (name, availableStock, price) => {
      const mainContainer = document.getElementById("attach-main-container");
      if (mainContainer) {
        mainContainer.innerHTML = AttachmentPage.renderOrderForm(
          name,
          availableStock,
          price
        );
        document.getElementById("submitAttach").onclick = () => {
          const qty = parseInt(document.getElementById("attachQty").value);
          if (
            GlobalCart.addToCart(
              {
                nama: name,
                harga: Number(price),
                kategori: "Attachment",
                qty: qty,
              },
              availableStock + GlobalCart.getQtyInCart(name)
            )
          ) {
            window.loadPage("attachment");
          }
        };
      }
    };

    loadAttachments();
  },
};
