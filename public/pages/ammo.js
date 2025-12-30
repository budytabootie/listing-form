import { GlobalCart } from "./globalCart.js";

/** @param {any} supabase */
export const AmmoPage = {
  state: {
    items: [],
  },

  render: () => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
            <div>
                <h2 style="margin:0; color:#fff;">Ammo Supply</h2>
                <p style="color:#b9bbbe; margin:5px 0 0 0; font-size:0.9rem;">Pastikan stok amunisi Anda selalu terpenuhi.</p>
            </div>
            <button onclick="loadPage('home')" style="background:#4f545c; color:white; border:none; padding:10px 18px; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-arrow-left"></i> Kembali
            </button>
        </div>

        <div id="ammoList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
            <div style="color: #72767d; text-align: center; padding: 50px; grid-column: 1/-1;">
                <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-bottom:10px;"></i>
                <p>Mengambil data amunisi...</p>
            </div>
        </div>
    `,

  init: async (supabase) => {
    const container = document.getElementById("ammoList");

    const loadAmmo = async () => {
      // 1. Ambil dari katalog_barang dengan jenis_barang 'Ammo'
      const { data: katalog, error: err1 } = await supabase
        .from("katalog_barang")
        .select("*")
        .eq("jenis_barang", "Ammo");

      // 2. Ambil stok dari inventory
      const { data: inventory, error: err2 } = await supabase
        .from("inventory")
        .select("item_name, stock");

      if (err1 || err2) {
        container.innerHTML = `<div style="color:#ed4245; padding:20px; text-align:center; grid-column:1/-1;">Gagal memuat data inventory.</div>`;
        return;
      }

      // 3. Gabungkan Data (Merge)
      const mergedItems = katalog.map((a) => {
        const inv = inventory.find((i) => i.item_name === a.nama_barang);
        return {
          ...a,
          stok: inv ? inv.stock : 0,
        };
      });

      AmmoPage.state.items = mergedItems;
      renderAmmo();
    };

    const renderAmmo = () => {
      if (AmmoPage.state.items.length === 0) {
        container.innerHTML = `<div style="color:#72767d; padding:50px; text-align:center; grid-column:1/-1;">Tidak ada item amunisi yang tersedia.</div>`;
        return;
      }

      container.innerHTML = AmmoPage.state.items
        .map((item) => {
          const isNotReady = item.status !== "Ready";
          const isOut = item.stok <= 0;
          const cannotBuy = isNotReady || isOut;

          const formatHarga = item.harga_satuan
            ? `$ ${Number(item.harga_satuan).toLocaleString("en-US")}`
            : "$ 0";

          // Tentukan Label Status
          let statusLabel = `<div style="font-size: 0.75rem; color: #43b581; font-weight: bold; margin-top: 2px;">STOK: ${item.stok}</div>`;
          if (isNotReady) {
            statusLabel = `<div style="font-size: 0.75rem; color: #f1c40f; font-weight: bold; margin-top: 2px;">STATUS: ${item.status.toUpperCase()}</div>`;
          } else if (isOut) {
            statusLabel = `<div style="font-size: 0.75rem; color: #ed4245; font-weight: bold; margin-top: 2px;">STOK HABIS</div>`;
          }

          return `
            <div class="item-card" style="background: #2f3136; border-radius: 12px; padding: 20px; border: 1px solid #40444b; display: flex; flex-direction: column; transition: transform 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                    <div style="background: rgba(250, 166, 26, 0.1); color: #faa61a; width: 45px; height: 45px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; border: 1px solid rgba(250, 166, 26, 0.2);">
                        <i class="fas fa-box-open"></i>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #43b581; font-weight: 800; font-size: 1.2rem;">${formatHarga}</div>
                        ${statusLabel}
                    </div>
                </div>
                
                <div style="flex-grow: 1;">
                    <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 1.1rem; letter-spacing: 0.5px;">${
                      item.nama_barang
                    }</h3>
                    <p style="color: #b9bbbe; font-size: 0.8rem; line-height: 1.5; margin-bottom: 20px;">Amunisi standar untuk perbekalan operasional.</p>
                </div>
                
                <button 
                    onclick="window.addToCartAmmo('${item.nama_barang}', ${
            item.harga_satuan
          }, ${item.stok})"
                    ${cannotBuy ? "disabled" : ""}
                    class="btn-order"
                    style="width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 800; font-size: 0.85rem; cursor: ${
                      cannotBuy ? "not-allowed" : "pointer"
                    }; 
                    background: ${
                      cannotBuy ? "#4f545c" : "#faa61a"
                    }; color: white; transition: 0.3s; text-transform: uppercase;">
                    ${
                      isNotReady
                        ? "Not Ready"
                        : isOut
                        ? "Out of Stock"
                        : '<i class="fas fa-cart-plus" style="margin-right:8px;"></i> Ambil Ammo'
                    }
                </button>
            </div>
        `;
        })
        .join("");
    };

    window.addToCartAmmo = (name, rawPrice, stock) => {
      if (stock <= 0) return;

      // Menggunakan method addToCart yang sama dengan Vest
      GlobalCart.addToCart(
        {
          nama: name,
          harga: Number(rawPrice),
          tipe: "Ammo",
          qty: 1,
        },
        stock
      );
    };

    loadAmmo();
  },
};
