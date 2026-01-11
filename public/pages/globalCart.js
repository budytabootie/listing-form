export const GlobalCart = {
  items: [],

  getQtyInCart: function (itemName) {
    const item = this.items.find((i) => i.nama === itemName);
    return item ? item.qty : 0;
  },

  addToCart: function (item, maxStock) {
    item.harga = Number(item.harga) || 0;
    const currentInCart = this.getQtyInCart(item.nama);

    if (currentInCart + item.qty > maxStock) {
      Swal.fire({
        icon: "error",
        title: "Stok Terbatas",
        text: `Gudang hanya sisa ${maxStock}. Di keranjang sudah ada ${currentInCart}.`,
        background: "#2f3136",
        color: "#fff",
      });
      return false;
    }

    const existingItem = this.items.find((i) => i.nama === item.nama);
    if (existingItem) {
      existingItem.qty += item.qty;
    } else {
      this.items.push(item);
    }

    this.updateBadge();
    Swal.fire({
      icon: "success",
      title: "Masuk Keranjang",
      text: `${item.nama} ditambahkan!`,
      timer: 1000,
      showConfirmButton: false,
      background: "#2f3136",
      color: "#fff",
    });
    return true;
  },

  updateBadge: function () {
    const badge = document.getElementById("cart-count-badge");
    if (badge) {
      const total = this.items.reduce((sum, i) => sum + i.qty, 0);
      badge.innerText = total;
      badge.style.display = total > 0 ? "flex" : "none";
    }
  },

  getItems: function () {
    return this.items;
  },

  clearCart: function () {
    this.items = [];
    this.updateBadge();
  },
};
