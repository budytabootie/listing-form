import { GlobalCart } from "./globalCart.js";

export const BundlingPage = {
  state: {
    items: [],
  },

  render: () => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
            <div>
                <h2 style="margin:0; color:#fff;">Special Bundling</h2>
                <p style="color:#b9bbbe; margin:5px 0 0 0; font-size:0.9rem;">Paket eksklusif dengan sistem validasi stok multi-tabel.</p>
            </div>
            <button onclick="loadPage('home')" style="background:#4f545c; color:white; border:none; padding:10px 18px; border-radius:8px; cursor:pointer; font-weight:bold; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-arrow-left"></i> Kembali
            </button>
        </div>

        <div id="bundlingList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
            <div style="color: #72767d; text-align: center; padding: 50px; grid-column: 1/-1;">
                <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-bottom:10px;"></i>
                <p>Mengkalkulasi stok dari berbagai gudang...</p>
            </div>
        </div>
    `,

  init: async (supabase) => {
    const container = document.getElementById("bundlingList");

    const loadBundlingData = async () => {
      // 1. Ambil data master paket
      const { data: masterPaket } = await supabase
        .from("master_paket")
        .select("*")
        .eq("is_active", true);
      const { data: bundleItems } = await supabase
        .from("bundle_items")
        .select("*");

      // 2. Ambil Stok Item Biasa (Vest, Ammo, dll)
      const { data: inventory } = await supabase
        .from("inventory")
        .select("item_name, stock");

      // 3. Ambil Stok Senjata (Hanya yang statusnya 'available')
      const { data: weapons } = await supabase
        .from("inventory_weapons")
        .select("weapon_name")
        .eq("status", "available");

      // Hitung jumlah senjata tersedia per nama
      const weaponStockMap = {};
      weapons?.forEach((w) => {
        weaponStockMap[w.weapon_name] =
          (weaponStockMap[w.weapon_name] || 0) + 1;
      });

      // 4. Gabungkan & Kalkulasi Stok Bundling
      const mergedBundles = masterPaket.map((paket) => {
        const isiPaket = bundleItems.filter(
          (bi) => bi.nama_paket === paket.nama_paket
        );
        let stokMaksimalPaket = Infinity;

        const detailStok = isiPaket.map((item) => {
          let stokTersedia = 0;

          // Cek di Map Senjata dulu
          if (weaponStockMap[item.nama_barang_stok] !== undefined) {
            stokTersedia = weaponStockMap[item.nama_barang_stok];
          } else {
            // Jika tidak ada di senjata, cek di inventory biasa
            const inv = inventory.find(
              (i) => i.item_name === item.nama_barang_stok
            );
            stokTersedia = inv ? inv.stock : 0;
          }

          const kapasitas = Math.floor(stokTersedia / item.jumlah_potong);
          if (kapasitas < stokMaksimalPaket) stokMaksimalPaket = kapasitas;

          return {
            nama: item.nama_barang_stok,
            butuh: item.jumlah_potong,
            ada: stokTersedia,
          };
        });

        return {
          ...paket,
          stok: stokMaksimalPaket === Infinity ? 0 : stokMaksimalPaket,
          komponen: detailStok,
        };
      });

      BundlingPage.state.items = mergedBundles;
      renderBundling();
    };

    const renderBundling = () => {
      if (BundlingPage.state.items.length === 0) {
        container.innerHTML = `<p style="color:#72767d; text-align:center; grid-column:1/-1;">Belum ada paket bundling aktif.</p>`;
        return;
      }

      container.innerHTML = BundlingPage.state.items
        .map((paket) => {
          const isOut = paket.stok <= 0;
          return `
          <div class="item-card" style="background: #2f3136; border-radius: 12px; padding: 20px; border: 1px solid #40444b; display: flex; flex-direction: column;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                  <div style="background: rgba(241, 196, 15, 0.1); color: #f1c40f; width: 45px; height: 45px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                      <i class="fas fa-box-open"></i>
                  </div>
                  <div style="text-align: right;">
                      <div style="color: #43b581; font-weight: 800; font-size: 1.2rem;">$ ${Number(
                        paket.total_harga
                      ).toLocaleString()}</div>
                      <div style="font-size: 0.75rem; color: ${
                        isOut ? "#ed4245" : "#43b581"
                      }; font-weight: bold;">
                          ${
                            isOut
                              ? "STOK HABIS"
                              : `TERSEDIA: ${paket.stok} PAKET`
                          }
                      </div>
                  </div>
              </div>
              
              <div style="flex-grow: 1;">
                  <h3 style="color: #fff; margin: 0 0 5px 0;">${
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
              
              <button 
                  onclick="window.addToCartBundling('${paket.nama_paket}', ${
            paket.total_harga
          }, ${paket.stok})"
                  ${isOut ? "disabled" : ""}
                  style="width: 100%; padding: 12px; border-radius: 8px; border: none; font-weight: 800; cursor: ${
                    isOut ? "not-allowed" : "pointer"
                  }; 
                  background: ${isOut ? "#4f545c" : "#f1c40f"}; color: ${
            isOut ? "white" : "#2f3136"
          }; text-transform: uppercase;">
                  ${isOut ? "Komponen Tidak Cukup" : "Ambil Paket"}
              </button>
          </div>
        `;
        })
        .join("");
    };

    window.addToCartBundling = (name, price, stock) => {
      if (stock <= 0) return;
      GlobalCart.addToCart(
        {
          nama: name,
          harga: Number(price),
          tipe: "Bundling",
          qty: 1,
        },
        stock
      );
    };

    loadBundlingData();
  },
};
