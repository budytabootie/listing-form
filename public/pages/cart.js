import { GlobalCart } from "./globalCart.js";

export const CartPage = {
  render: (cartItems) => `
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
                    ? `<div style="text-align:center; padding: 40px 0;">
                        <i class="fas fa-cart-arrow-down" style="font-size: 3rem; color: #4f545c; margin-bottom: 15px;"></i>
                        <p style="color:#b9bbbe;">Keranjang kosong.</p>
                    </div>`
                    : `<div class="cart-list" style="margin-bottom: 20px;">
                        ${cartItems
                          .map((item, index) => {
                            const displayCategory =
                              item.kategori || item.tipe || "Item";

                            // Konversi ke Numeric murni (hapus semua karakter non-angka)
                            const hargaNumeric =
                              typeof item.harga === "string"
                                ? parseInt(item.harga.replace(/\D/g, "")) || 0
                                : item.harga || 0;

                            return `
                              <div style="display:flex; justify-content:space-between; align-items:center; background:#18191c; padding:15px; border-radius:10px; margin-bottom:10px; border-left:3px solid #43b581;">
                                  <div>
                                      <h4 style="margin:0; color: #fff;">${
                                        item.nama
                                      }</h4>
                                      <small style="color:#b9bbbe;">${displayCategory} • <span style="color: #43b581;">$ ${hargaNumeric.toLocaleString(
                              "en-US"
                            )}</span> • <b>${item.qty} Unit</b></small>
                                  </div>
                                  <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#f04747; cursor:pointer; padding: 10px;">
                                      <i class="fas fa-trash"></i>
                                  </button>
                              </div>
                              `;
                          })
                          .join("")}
                    </div>
                    
                    <button id="finalSubmitBtn" class="btn-submit-weapon" style="background:#43b581;">
                        <i class="fas fa-paper-plane"></i>
                        <span>KIRIM PESANAN</span>
                    </button>`
                }
                <button onclick="window.loadPage('home')" class="btn-cancel-weapon" style="margin-top: 15px; display: block; text-align: center; width: 100%;">
                    <i class="fas fa-plus"></i> Tambah Barang Lagi
                </button>
            </div>
        </div>
    `,

  init: (supabase, userData) => {
    window.removeFromCart = (index) => {
      const items = GlobalCart.getItems();
      items.splice(index, 1);
      GlobalCart.updateBadge();
      window.loadPage("cart");
    };

    const submitBtn = document.getElementById("finalSubmitBtn");
    if (submitBtn) {
      submitBtn.onclick = async () => {
        const cartItems = GlobalCart.getItems();
        if (cartItems.length === 0) return;

        const confirm = await Swal.fire({
          title: "Kirim Pesanan?",
          text: "Pastikan semua barang sudah sesuai.",
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
          // PROSES NUMERIC: Ambil angka murni, baru dikalikan qty
          const totalHargaNumeric = cartItems.reduce((sum, i) => {
            const price =
              typeof i.harga === "string"
                ? parseInt(i.harga.replace(/\D/g, "")) || 0
                : i.harga || 0;
            return sum + price * (i.qty || 1);
          }, 0);

          const formattedItems = cartItems.map((item) => ({
            ...item,
            item_type: item.kategori || item.tipe || "Item",
          }));

          const response = await fetch("/api/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userData.id,
              nama: userData.nama_lengkap,
              rank: userData.rank || "MEMBER",
              items: formattedItems,
              // Simpan dengan format Dollar yang bersih ($ 1,000,000)
              totalHarga: `$ ${totalHargaNumeric.toLocaleString("en-US")}`,
              item_type: formattedItems[0].item_type,
              subTipe: "",
              notes: "",
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
