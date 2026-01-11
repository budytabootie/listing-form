import { GlobalCart } from "./globalCart.js";

export const CartPage = {
  render: (cartItems) => {
    const totalHargaSemua = cartItems.reduce((sum, item) => {
      const harga =
        typeof item.harga === "string"
          ? parseInt(item.harga.replace(/\D/g, "")) || 0
          : item.harga || 0;
      return sum + harga * item.qty;
    }, 0);

    return `
        <div class="category-page">
            <div class="page-header-weapon" style="border-left-color: #43b581; background: linear-gradient(90deg, rgba(67, 181, 129, 0.2) 0%, transparent 100%);">
                <div class="header-title">
                    <h2>KERANJANG SAYA</h2>
                    <span>Tinjau pesanan sebelum submit</span>
                </div>
                <div class="header-icon-main"><i class="fas fa-shopping-basket"></i></div>
            </div>

            <div class="order-card-modern">
                ${
                  cartItems.length === 0
                    ? `
                    <div style="text-align:center; padding: 40px 0;">
                        <i class="fas fa-cart-arrow-down" style="font-size: 3rem; color: #4f545c; margin-bottom: 15px;"></i>
                        <p style="color:#b9bbbe;">Keranjang kosong.</p>
                    </div>
                `
                    : `
                    <div class="cart-list" style="margin-bottom: 20px;">
                        ${cartItems
                          .map((item, index) => {
                            const displayCategory =
                              item.kategori || item.tipe || "Item";
                            const hargaNumeric =
                              typeof item.harga === "string"
                                ? parseInt(item.harga.replace(/\D/g, "")) || 0
                                : item.harga || 0;

                            return `
                            <div style="display:flex; justify-content:space-between; align-items:center; background:#18191c; padding:15px; border-radius:10px; margin-bottom:10px; border-left:3px solid #43b581;">
                                <div style="flex: 1;">
                                    <h4 style="margin:0; color: #fff;">${
                                      item.nama
                                    }</h4>
                                    <small style="color:#b9bbbe;">${displayCategory} • <span style="color: #43b581;">$ ${hargaNumeric.toLocaleString()}</span></small>
                                </div>
                                
                                <div style="display: flex; align-items: center; background: #2f3136; border-radius: 6px; border: 1px solid #4f545c; overflow: hidden; margin: 0 15px;">
                                    <button onclick="updateCartQty(${index}, -1)" style="padding: 5px 10px; background:none; border:none; color:#fff; cursor:pointer;"><i class="fas fa-minus" style="font-size:0.7rem;"></i></button>
                                    <input type="number" value="${
                                      item.qty
                                    }" readonly style="width: 35px; background:none; border:none; color:#fff; text-align:center; font-size:0.9rem; font-weight:bold; pointer-events:none;">
                                    <button onclick="updateCartQty(${index}, 1)" style="padding: 5px 10px; background:none; border:none; color:#fff; cursor:pointer;"><i class="fas fa-plus" style="font-size:0.7rem;"></i></button>
                                </div>

                                <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#f04747; cursor:pointer; padding: 10px;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                          `;
                          })
                          .join("")}
                    </div>
                    
                    <div style="background: #202225; padding: 15px; border-radius: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border: 1px dashed #43b581;">
                        <span style="color: #b9bbbe; font-weight: bold;">TOTAL ESTIMASI:</span>
                        <span style="color: #43b581; font-size: 1.2rem; font-weight: 800;">$ ${totalHargaSemua.toLocaleString()}</span>
                    </div>

                    <button id="finalSubmitBtn" class="btn-submit-weapon" style="background:#43b581; width: 100%; padding: 15px; border-radius: 8px; color: white; border: none; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <i class="fas fa-paper-plane"></i>
                        <span>KIRIM PESANAN</span>
                    </button>
                `
                }
                
                <button onclick="window.loadPage('home')" class="btn-cancel-weapon" style="margin-top: 15px; display: block; text-align: center; width: 100%; background: none; border: 1px solid #4f545c; color: #b9bbbe; padding: 10px; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-plus"></i> Tambah Barang Lagi
                </button>
            </div>
        </div>
    `;
  },

  init: (supabase, userData) => {
    // Fungsi Hapus
    window.removeFromCart = (index) => {
      GlobalCart.items.splice(index, 1);
      GlobalCart.updateBadge();
      window.loadPage("cart");
    };

    // Fungsi Update Qty (Plus/Minus)
    window.updateCartQty = (index, delta) => {
      const item = GlobalCart.items[index];
      const newQty = item.qty + delta;

      if (newQty <= 0) {
        window.removeFromCart(index);
      } else {
        // Kita tidak cek maxStock di sini agar simpel,
        // tapi jika ingin ketat bisa simpan maxStock di objek item
        item.qty = newQty;
        GlobalCart.updateBadge();
        window.loadPage("cart");
      }
    };

    const submitBtn = document.getElementById("finalSubmitBtn");
    if (submitBtn) {
      submitBtn.onclick = async () => {
        const cartItems = GlobalCart.getItems();
        if (cartItems.length === 0) return;

        const confirm = await Swal.fire({
          title: "Kirim Pesanan?",
          text: "Pesanan akan dikirim ke sistem manajemen.",
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#43b581",
          background: "#2f3136",
          color: "#fff",
        });

        if (!confirm.isConfirmed) return;

        Swal.fire({
          title: "Mengirim...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        try {
          const totalHargaNumeric = cartItems.reduce((sum, i) => {
            const price =
              typeof i.harga === "string"
                ? parseInt(i.harga.replace(/\D/g, "")) || 0
                : i.harga || 0;
            return sum + price * i.qty;
          }, 0);

          const response = await fetch("/api/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userData.id,
              nama: userData.nama_lengkap,
              rank: userData.rank || "MEMBER",
              items: cartItems,
              totalHarga: `$ ${totalHargaNumeric.toLocaleString("en-US")}`,
              item_type: cartItems[0].kategori || "General",
              timestamp: new Date().toISOString(),
            }),
          });

          const result = await response.json();
          if (result.success) {
            Swal.fire({
              icon: "success",
              title: "Berhasil!",
              background: "#2f3136",
              color: "#fff",
              timer: 1500,
              showConfirmButton: false,
            });
            GlobalCart.clearCart();
            window.loadPage("home");
          } else {
            throw new Error(result.message);
          }
        } catch (err) {
          Swal.fire("Gagal", err.message, "error");
        }
      };
    }
  },
};
