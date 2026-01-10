import { GlobalCart } from "./globalCart.js";

export const HomePage = {
  render: (userData) => {
    const cartItems = GlobalCart.getItems();
    const totalQty = cartItems.reduce((sum, i) => sum + i.qty, 0);

    return `
    <div class="portal-welcome">
        <h2 style="color: #fff; margin-bottom: 5px; text-align:center;">Nakama Management Center</h2>
        <p style="color: #b9bbbe; margin-bottom: 30px; text-align:center;">Halo, ${
          userData?.nama_lengkap || "Nakama"
        }! Pilih kategori untuk mulai belanja.</p>
        
        ${
          totalQty > 0
            ? `
        <div onclick="loadPage('cart')" style="background: rgba(67, 181, 129, 0.1); border: 1px solid #43b581; border-radius: 12px; padding: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.3s;">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="background: #43b581; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">${totalQty}</div>
                <div>
                    <div style="color: #fff; font-weight: bold; font-size: 0.9rem;">Item di Keranjang</div>
                    <div style="color: #43b581; font-size: 0.75rem;">Klik untuk selesaikan pesanan (Checkout)</div>
                </div>
            </div>
            <i class="fas fa-chevron-right" style="color: #43b581;"></i>
        </div>`
            : ""
        }

        <div class="category-grid">
            <div class="cat-card" onclick="loadPage('vest')">
                <div class="cat-icon" style="color: #5865F2;"><i class="fas fa-shield-alt"></i></div>
                <div class="cat-info">
                    <h3>VEST</h3>
                    <p>Perlindungan ekstra</p>
                </div>
            </div>

            <div class="cat-card" onclick="loadPage('ammo')">
                <div class="cat-icon" style="color: #faa61a;"><i class="fas fa-box-open"></i></div>
                <div class="cat-info">
                    <h3>AMMO</h3>
                    <p>Persediaan amunisi</p>
                </div>
            </div>

            <div class="cat-card" onclick="loadPage('weapon')">
                <div class="cat-icon" style="color: #f04747;"><i class="fas fa-gun"></i></div>
                <div class="cat-info">
                    <h3>WEAPON</h3>
                    <p>Persenjataan api & tajam</p>
                </div>
            </div>

            <div class="cat-card" onclick="loadPage('attachment')">
                <div class="cat-icon" style="color: #eb459e;"><i class="fas fa-tools"></i></div>
                <div class="cat-info">
                    <h3>ATTACHMENT</h3>
                    <p>Modifikasi & Scope</p>
                </div>
            </div>

            <div class="cat-card" onclick="loadPage('bundling')">
                <div class="cat-icon" style="color: #72767d;"><i class="fas fa-layer-group"></i></div>
                <div class="cat-info">
                    <h3>BUNDLING</h3>
                    <p>Paket Grosir / Set</p>
                </div>
            </div>
        </div>
    </div>
  `;
  },
  init: () => {
    console.log("Home Page Loaded");
  },
};
