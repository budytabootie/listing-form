import { GlobalCart } from "./globalCart.js";
import { API } from "../js/core/api.js";

export const WeaponPage = {
  relationMap: {},

  getRelatedItems: (weaponName) => {
    return WeaponPage.relationMap[weaponName] || [];
  },

  render: () => `
    <div class="category-page">
        <div class="category-header" style="--header-bg: rgba(240, 71, 71, 0.2); --header-color: #f04747;">
            <button onclick="window.loadPage('home')" class="back-btn-modern"><i class="fas fa-chevron-left"></i></button>
            <div class="header-title">
                <h2>WEAPON STORE</h2>
                <span class="header-subtitle">Persenjataan taktis & perlengkapan tempur</span>
            </div>
            <div class="header-icon-main"><i class="fas fa-gun"></i></div>
        </div>
        <div class="category-main-content" id="weapon-main-container">
            <div class="catalog-grid" id="weapon-catalog">
                <div style="color: #72767d; text-align: center; padding: 50px; grid-column: 1/-1;">
                    <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-bottom:10px;"></i>
                    <p>Sinkronisasi gudang senjata...</p>
                </div>
            </div>
        </div>
    </div>
  `,

  renderCard: (item, stock, isOut) => {
    const formatHarga = `$ ${Number(item.harga_satuan).toLocaleString()}`;
    return `
        <div class="item-card" style="background: #2f3136; border-radius: 12px; padding: 20px; border: 1px solid #40444b; display: flex; flex-direction: column; transition: transform 0.2s; ${
          isOut ? "opacity: 0.6; filter: grayscale(1);" : ""
        }">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div style="background: rgba(240, 71, 71, 0.1); color: #f04747; width: 45px; height: 45px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; border: 1px solid rgba(240, 71, 71, 0.2);">
                    <i class="fas fa-gun"></i>
                </div>
                <div style="text-align: right;">
                    <div style="color: #43b581; font-weight: 800; font-size: 1.2rem;">${formatHarga}</div>
                    <div style="font-size: 0.75rem; color: ${
                      isOut ? "#ed4245" : "#43b581"
                    }; font-weight: bold; margin-top: 2px;">
                        ${isOut ? "STOK HABIS" : `STOK: ${stock}`}
                    </div>
                </div>
            </div>
            <div style="flex-grow: 1;">
                <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 1.1rem; letter-spacing: 0.5px;">${
                  item.nama_barang
                }</h3>
                <p style="color: #b9bbbe; font-size: 0.8rem; line-height: 1.5; margin-bottom: 20px;">${
                  item.deskripsi || "Senjata api standar operasional."
                }</p>
            </div>
            <button onclick="${
              isOut
                ? ""
                : `window.openOrder('${item.nama_barang}', ${stock}, ${item.harga_satuan})`
            }" 
                ${isOut ? "disabled" : ""} class="btn-order" 
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
    `;
  },

  renderOrderForm: (itemName, availableStock, price, relatedItemsHtml) => `
    <div class="selection-container" style="max-width: 900px; margin: 0 auto; padding: 10px;">
        <div class="order-card-modern" style="background: #2f3136; padding: 25px; border-radius: 15px; border: 1px solid #40444b;">
            <div style="display: flex; gap: 30px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 280px;">
                    <h4 style="color: #72767d; text-transform: uppercase; font-size: 0.75rem; margin-bottom: 15px;">Main Weapon</h4>
                    <div class="selected-item-info" style="background: #202225; padding: 20px; border-radius: 12px; border-left: 4px solid #f04747;">
                        <h3 style="color: #fff; margin: 0 0 5px 0;">${itemName}</h3>
                        <div style="color: #43b581; font-weight: bold;">$${Number(
                          price
                        ).toLocaleString()}</div>
                        <div style="color: #b9bbbe; font-size: 0.8rem; margin-top: 10px;">Stok: <span style="color: #fff;">${availableStock}</span></div>
                    </div>
                    <div class="input-group-modern" style="margin-top: 25px;">
                        <label style="color: #fff; font-size: 0.9rem; display: block; margin-bottom: 10px;">Jumlah Unit</label>
                        <div style="display: flex; align-items: center; background: #202225; width: fit-content; border-radius: 8px; border: 1px solid #4f545c; overflow: hidden;">
                            <button class="qty-ctrl" onclick="this.nextElementSibling.stepDown(); event.stopPropagation();" 
                                style="padding: 12px 20px; background: rgba(255,255,255,0.05); border: none; color: #fff; cursor: pointer;">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" id="itemQty" value="1" min="1" max="${availableStock}" readonly 
                                style="width: 60px; background: none; border: none; color: #fff; text-align: center; font-weight: 800; font-size: 1.1rem; pointer-events: none;">
                            <button class="qty-ctrl" onclick="this.previousElementSibling.stepUp(); event.stopPropagation();" 
                                style="padding: 12px 20px; background: rgba(255,255,255,0.05); border: none; color: #fff; cursor: pointer;">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div style="flex: 1.2; min-width: 300px; border-left: 1px solid #40444b; padding-left: 20px;">
                    <h4 style="color: #faa61a; text-transform: uppercase; font-size: 0.75rem; margin-bottom: 15px;">RECOMMENDED ADD ONS</h4>
                    <div id="related-items-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto; padding-right: 5px;">
                        ${
                          relatedItemsHtml ||
                          '<p style="color: #72767d;">Tidak ada aksesoris untuk senjata ini.</p>'
                        }
                    </div>
                </div>
            </div>
            <div style="margin-top: 30px; display: flex; gap: 15px; border-top: 1px solid #40444b; padding-top: 25px;">
                <button id="submitAll" class="btn-submit-weapon" style="flex: 2; background: #43b581; color: white; border: none; padding: 15px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                    KONFIRMASI KE KERANJANG
                </button>
                <button onclick="window.loadPage('weapon')" style="flex: 1; background: #4f545c; color: white; border: none; border-radius: 8px; cursor: pointer;">Batal</button>
            </div>
        </div>
    </div>
  `,

  init: async () => {
    const catalogContainer = document.getElementById("weapon-catalog");
    if (!catalogContainer) return;

    try {
      const [resKatalog, resInvNormal, resInvWeapons, resRelations] =
        await Promise.all([
          API.getItemsByCategory("Weapon"),
          API.getInventory(),
          API._supabase
            .from("inventory_weapons")
            .select("weapon_name")
            .eq("status", "available")
            .is("hold_by", null),
          API._supabase
            .from("weapon_attachments")
            .select("weapon_name, attachment_name"),
        ]);

      WeaponPage.relationMap = (resRelations.data || []).reduce((acc, curr) => {
        if (!acc[curr.weapon_name]) acc[curr.weapon_name] = [];
        acc[curr.weapon_name].push(curr.attachment_name);
        return acc;
      }, {});

      const { data: allItems } = await API._supabase
        .from("katalog_barang")
        .select("*");
      const itemMap = (allItems || []).reduce((acc, curr) => {
        acc[curr.nama_barang] = curr;
        return acc;
      }, {});

      const stockMap = {};
      (resInvWeapons.data || []).forEach(
        (w) => (stockMap[w.weapon_name] = (stockMap[w.weapon_name] || 0) + 1)
      );
      (resInvNormal.data || []).forEach(
        (i) => (stockMap[i.item_name] = i.stock)
      );

      catalogContainer.innerHTML = (resKatalog.data || [])
        .map((item) => {
          const displayStock =
            (stockMap[item.nama_barang] || 0) -
            GlobalCart.getQtyInCart(item.nama_barang);
          return WeaponPage.renderCard(item, displayStock, displayStock <= 0);
        })
        .join("");

      window.openOrder = (name, availableStock, price) => {
        const mainContainer = document.getElementById("weapon-main-container");
        const relatedNames = WeaponPage.getRelatedItems(name);

        const relatedItemsHtml = relatedNames
          .map((rName) => {
            const rInfo = itemMap[rName];
            if (!rInfo) return "";
            const rStock =
              (stockMap[rName] || 0) - GlobalCart.getQtyInCart(rName);
            const isOut = rStock <= 0;

            return `
            <div style="background: #202225; padding: 12px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; border: 1px solid ${
              isOut ? "#ed424544" : "#4f545c"
            };">
                <div style="flex: 1;">
                    <div style="color: #fff; font-size: 0.85rem; font-weight: bold;">${rName}</div>
                    <div style="color: #43b581; font-size: 0.75rem;">$${Number(
                      rInfo.harga_satuan
                    ).toLocaleString()} | Stok: ${rStock}</div>
                </div>
                <div style="display: flex; align-items: center; background: #2f3136; border-radius: 6px; border: 1px solid #4f545c; overflow: hidden; margin-left: 10px;">
                    <button onclick="this.nextElementSibling.stepDown(); event.stopPropagation();" ${
                      isOut ? "disabled" : ""
                    } 
                        style="padding: 8px 12px; background: rgba(255,255,255,0.05); border: none; color: #fff; cursor: ${
                          isOut ? "not-allowed" : "pointer"
                        };">
                        <i class="fas fa-minus" style="font-size: 0.7rem;"></i>
                    </button>
                    <input type="number" class="related-qty" data-name="${rName}" data-price="${
              rInfo.harga_satuan
            }" data-category="${rInfo.jenis_barang}" 
                        value="0" min="0" max="${rStock}" readonly 
                        style="width: 40px; background: none; border: none; color: #fff; text-align: center; font-size: 0.9rem; font-weight: bold; pointer-events: none;">
                    <button onclick="this.previousElementSibling.stepUp(); event.stopPropagation();" ${
                      isOut ? "disabled" : ""
                    } 
                        style="padding: 8px 12px; background: rgba(255,255,255,0.05); border: none; color: #fff; cursor: ${
                          isOut ? "not-allowed" : "pointer"
                        };">
                        <i class="fas fa-plus" style="font-size: 0.7rem;"></i>
                    </button>
                </div>
            </div>`;
          })
          .join("");

        mainContainer.innerHTML = WeaponPage.renderOrderForm(
          name,
          availableStock,
          price,
          relatedItemsHtml
        );

        document.getElementById("submitAll").onclick = () => {
          const mainQty = parseInt(document.getElementById("itemQty").value);
          const success = GlobalCart.addToCart(
            {
              nama: name,
              qty: mainQty,
              harga: Number(price),
              kategori: "Weapon",
            },
            availableStock + GlobalCart.getQtyInCart(name)
          );

          document.querySelectorAll(".related-qty").forEach((input) => {
            const rQty = parseInt(input.value);
            if (rQty > 0) {
              GlobalCart.addToCart(
                {
                  nama: input.dataset.name,
                  qty: rQty,
                  harga: Number(input.dataset.price),
                  kategori: input.dataset.category,
                },
                stockMap[input.dataset.name] || 0
              );
            }
          });
          if (success) window.loadPage("weapon");
        };
      };
    } catch (err) {
      console.error(err);
      catalogContainer.innerHTML = `<div style="color:#ed4245; text-align:center; padding:50px;">Gagal memuat sistem senjata.</div>`;
    }
  },
};
