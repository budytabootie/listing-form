import { GlobalCart } from "./globalCart.js";

/** @param {any} supabase */
export const VestPage = {
  state: {
    items: [],
  },

  render: () => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
            <div>
                <h2 style="margin:0; color:#fff;">Vest Inventory</h2>
                <p style="color:#b9bbbe; margin:5px 0 0 0; font-size:0.9rem;">Perlengkapan perlindungan tubuh Nakama.</p>
            </div>
            <button onclick="loadPage('home')" style="background:#4f545c; color:white; border:none; padding:10px 18px; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-arrow-left"></i> Kembali
            </button>
        </div>

        <div id="vestList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
            <div style="color: #72767d; text-align: center; padding: 50px; grid-column: 1/-1;">
                <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-bottom:10px;"></i>
                <p>Mengambil data vest...</p>
            </div>
        </div>
    `,

  init: async (supabase) => {
    const container = document.getElementById("vestList");

    const loadVests = async () => {
      const { data: katalog, error: err1 } = await supabase
        .from("katalog_barang")
        .select("*")
        .eq("jenis_barang", "Vest");

      const { data: inventory, error: err2 } = await supabase
        .from("inventory")
        .select("item_name, stock");

      if (err1 || err2) {
        container.innerHTML = `<div style="color:#ed4245; padding:20px; text-align:center; grid-column:1/-1;">Gagal memuat data inventory.</div>`;
        return;
      }

      const mergedItems = katalog.map((v) => {
        const inv = inventory.find((i) => i.item_name === v.nama_barang);
        return {
          ...v,
          stok: inv ? inv.stock : 0,
        };
      });

      VestPage.state.items = mergedItems;
      renderVests();
    };

    const renderVests = () => {
      if (VestPage.state.items.length === 0) {
        container.innerHTML = `<div style="color:#72767d; padding:50px; text-align:center; grid-column:1/-1;">Tidak ada item vest yang tersedia.</div>`;
        return;
      }

      container.innerHTML = VestPage.state.items
        .map((item) => {
          const isOut = item.stok <= 0;

          // 1. Tampilan UI menggunakan format string (toLocaleString)
          const formatHarga = item.harga_satuan
            ? `$ ${Number(item.harga_satuan).toLocaleString()}`
            : "$ 0";

          return `
            <div class="item-card" style="background: #2f3136; border-radius: 12px; padding: 20px; border: 1px solid #40444b; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                    <div style="background: rgba(52, 152, 219, 0.1); color: #3498db; width: 45px; height: 45px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; border: 1px solid rgba(52, 152, 219, 0.2);">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #43b581; font-weight: 800; font-size: 1.2rem;">${formatHarga}</div>
                        <div style="font-size: 0.75rem; color: ${
                          isOut ? "#ed4245" : "#b9bbbe"
                        }; font-weight: bold; margin-top: 2px;">
                            STOK: ${item.stok}
                        </div>
                    </div>
                </div>
                
                <div style="flex-grow: 1;">
                    <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 1.1rem; letter-spacing: 0.5px;">${
                      item.nama_barang
                    }</h3>
                    <p style="color: #b9bbbe; font-size: 0.8rem; line-height: 1.5; margin-bottom: 20px;">Vest pelindung untuk tugas operasional.</p>
                </div>
                
                <button 
                    /* 2. LOGIC: Kirim item.harga_satuan ASLI (angka murni) ke fungsi */
                    onclick="window.addToCartVest('${item.nama_barang}', ${
            item.harga_satuan
          }, ${item.stok})"
                    ${isOut ? "disabled" : ""}
                    class="btn-order"
                    style="width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 800; font-size: 0.85rem; letter-spacing: 0.5px; cursor: ${
                      isOut ? "not-allowed" : "pointer"
                    }; 
                    background: ${
                      isOut ? "#4f545c" : "#5865F2"
                    }; color: white; transition: 0.3s; text-transform: uppercase;">
                    ${
                      isOut
                        ? "Out of Stock"
                        : '<i class="fas fa-cart-plus" style="margin-right:8px;"></i> Ambil Vest'
                    }
                </button>
            </div>
        `;
        })
        .join("");
    };

    window.addToCartVest = (name, rawPrice, stock) => {
      if (stock <= 0) return;

      // 3. Data masuk ke GlobalCart sebagai Number murni
      GlobalCart.addToCart(
        {
          nama: name,
          harga: Number(rawPrice),
          tipe: "Vest",
          qty: 1,
        },
        stock
      );
    };

    loadVests();
  },
};
