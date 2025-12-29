export const ListingPage = {
  // State lokal untuk mencegah proses ganda dan menyimpan data sementara
  state: {
    fullKatalog: [],
    dbBundles: [],
    priceMap: {},
    isSubmitting: false,
  },

  render: () => `
        <form id="myForm">
            <h3>Internal Listing</h3>
            <p style="text-align: center; font-size: 0.8rem; color: #b9bbbe; margin-bottom: 20px;">Silakan buat laporan listing Anda.</p>

            <label>Nama Member</label>
            <div class="autocomplete-wrapper">
                <input type="text" id="nama" placeholder="Cari nama..." required autocomplete="off">
                <div id="autocomplete-list" class="autocomplete-items"></div>
            </div>

            <label>Rank Member</label>
            <select id="rank">
                <option value="-">-</option>
                <option value="High Rank">High Rank</option>
                <option value="Life Member">Life Member</option>
                <option value="Tail Gunner">Tail Gunner</option>
                <option value="Prospect">Prospect</option>
            </select>

            <label>Tipe Layanan</label>
            <select id="tipe">
                <option value="">-- Pilih Tipe --</option>
                <option value="Bundling">Bundling</option>
                <option value="Non Bundling">Non Bundling</option>
            </select>

            <div id="subTipeContainer" style="display:none;">
                <label id="labelSubTipe"></label>
                <select id="subTipe"></select>
                <div id="infoPaketDisplay" style="display:none; margin-top: 15px; font-size: 0.85rem; color: #b9bbbe; background: #23272a; padding: 10px; border-left: 4px solid #5865F2;"></div>
            </div>

            <div id="finalOptionsContainer" style="display:none;">
                <div id="checkboxList"></div>
                <div style="margin-top: 20px; padding: 15px; background: #23272a; border-radius: 8px; text-align: right;">
                    <span style="color: #b9bbbe; font-size: 0.8rem;">Estimasi Tagihan:</span>
                    <h2 id="totalDisplay" style="margin: 0; color: #43b581;">$0</h2>
                </div>
            </div>

            <button type="submit" id="submitBtn">Kirim Laporan</button>
        </form>
    `,

  init: async (supabase) => {
    const form = document.getElementById("myForm");
    if (!form) return;

    const inputNama = document.getElementById("nama");
    const listContainer = document.getElementById("autocomplete-list");
    const rankSelect = document.getElementById("rank");
    const tipeSelect = document.getElementById("tipe");
    const subSelect = document.getElementById("subTipe");
    const subContainer = document.getElementById("subTipeContainer");
    const finalContainer = document.getElementById("finalOptionsContainer");
    const checkList = document.getElementById("checkboxList");
    const infoDisplay = document.getElementById("infoPaketDisplay");
    const totalDisplay = document.getElementById("totalDisplay");
    const submitBtn = document.getElementById("submitBtn");

    ListingPage.state.isSubmitting = false;

    // --- LOAD DATA AWAL ---
    const [{ data: pkgData }, { data: katData }, { data: membersData }] =
      await Promise.all([
        supabase.from("master_paket").select("*"),
        supabase
          .from("katalog_barang")
          .select("nama_barang, jenis_barang, harga_satuan, status"),
        supabase.from("members").select("nama, rank"),
      ]);

    ListingPage.state.dbBundles = pkgData || [];
    ListingPage.state.fullKatalog = katData || [];
    const members = membersData || [];

    // Fungsi Update Total Harga
    const updateTotalPrice = () => {
      let total = 0;
      if (tipeSelect.value === "Bundling") {
        const selected = ListingPage.state.dbBundles.find(
          (p) => p.nama_paket === subSelect.value
        );
        total = selected ? selected.total_harga : 0;
      } else {
        form.querySelectorAll(".item-qty").forEach((input) => {
          const qty = parseInt(input.value) || 0;
          const price = ListingPage.state.priceMap[input.dataset.name] || 0;
          total += qty * price;
        });
      }
      totalDisplay.innerText = `$${total.toLocaleString()}`;
    };

    // --- 1. AUTOCOMPLETE LOGIC ---
    inputNama.addEventListener("input", () => {
      const val = inputNama.value;
      listContainer.innerHTML = "";
      if (!val) {
        rankSelect.disabled = false;
        rankSelect.value = "-";
        return;
      }
      const matches = members.filter((m) =>
        m.nama.toLowerCase().includes(val.toLowerCase())
      );
      matches.forEach((match) => {
        const item = document.createElement("div");
        item.className = "autocomplete-item";
        item.innerText = match.nama;
        item.onclick = () => {
          inputNama.value = match.nama;
          rankSelect.value =
            match.rank && match.rank !== "-" ? match.rank : "-";
          rankSelect.disabled = match.rank && match.rank !== "-";
          listContainer.innerHTML = "";
        };
        listContainer.appendChild(item);
      });
    });

    // --- 2. TIPE SELECT LOGIC ---
    tipeSelect.onchange = () => {
      const tipe = tipeSelect.value;
      subSelect.innerHTML = '<option value="">-- Pilih --</option>';
      finalContainer.style.display = "none";
      infoDisplay.style.display = "none";
      updateTotalPrice();

      if (tipe === "Bundling") {
        subContainer.style.display = "block";
        document.getElementById("labelSubTipe").innerText =
          "Pilih Paket Bundling";
        ListingPage.state.dbBundles.forEach((pkg) => {
          subSelect.innerHTML += `<option value="${pkg.nama_paket}">${pkg.nama_paket}</option>`;
        });
      } else if (tipe === "Non Bundling") {
        subContainer.style.display = "block";
        document.getElementById("labelSubTipe").innerText =
          "Kategori Non-Bundling";
        ["Vest ammo weapon", "Attachment"].forEach((cat) => {
          subSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
      } else {
        subContainer.style.display = "none";
      }
    };

    // --- 3. SUBTYPE / STOK SYNC LOGIC ---
    subSelect.onchange = async () => {
      const tipe = tipeSelect.value;
      const subTipe = subSelect.value;
      if (!subTipe) return;

      if (tipe === "Bundling") {
        const selected = ListingPage.state.dbBundles.find(
          (p) => p.nama_paket === subTipe
        );
        if (selected) {
          infoDisplay.style.display = "block";
          infoDisplay.innerHTML =
            "<span style='color:#72767d;'>Memvalidasi stok bahan...</span>";
          try {
            const { data: resep } = await supabase
              .from("bundle_items")
              .select("*")
              .eq("nama_paket", subTipe);
            const [resWep, resGen] = await Promise.all([
              supabase
                .from("inventory_weapons")
                .select("weapon_name")
                .ilike("status", "%available%")
                .is("hold_by", null),
              supabase.from("inventory").select("item_name, stock"),
            ]);

            let isSafe = true;
            let detailStatus = "";
            resep?.forEach((item) => {
              const isWeapon =
                ListingPage.state.fullKatalog.find(
                  (k) => k.nama_barang === item.nama_barang_stok
                )?.jenis_barang === "Weapon";
              const punya = isWeapon
                ? resWep.data?.filter(
                    (w) => w.weapon_name === item.nama_barang_stok
                  ).length || 0
                : resGen.data?.find(
                    (g) => g.item_name === item.nama_barang_stok
                  )?.stock || 0;

              if (punya < item.jumlah_potong) {
                isSafe = false;
                detailStatus += `<li style="color:#ed4245;">${
                  item.nama_barang_stok
                }: Kurang ${item.jumlah_potong - punya}</li>`;
              } else {
                detailStatus += `<li style="color:#43b581;">${item.nama_barang_stok}: Aman</li>`;
              }
            });

            infoDisplay.innerHTML = isSafe
              ? `<strong style="color:#43b581;">✓ Stok Tersedia</strong><ul style="font-size:0.75rem;">${detailStatus}</ul>`
              : `<strong style="color:#ed4245;">✗ Stok Kurang</strong><ul style="font-size:0.75rem;">${detailStatus}</ul>`;
            finalContainer.style.display = isSafe ? "block" : "none";
          } catch (e) {
            console.error(e);
          }
        }
      } else if (tipe === "Non Bundling") {
        finalContainer.style.display = "block";
        checkList.innerHTML =
          "<p style='color:#72767d;'>Sinkronisasi gudang...</p>";
        try {
          const [resWep, resGen] = await Promise.all([
            supabase
              .from("inventory_weapons")
              .select("weapon_name")
              .ilike("status", "%available%")
              .is("hold_by", null),
            supabase.from("inventory").select("item_name, stock"),
          ]);

          const filterJenis =
            subTipe === "Vest ammo weapon"
              ? ["Vest", "Ammo", "Weapon"]
              : ["Attachment"];
          const items = ListingPage.state.fullKatalog.filter(
            (k) => filterJenis.includes(k.jenis_barang) && k.status === "Ready"
          );

          checkList.innerHTML = "";
          items.forEach((item) => {
            const actualStock =
              item.jenis_barang === "Weapon"
                ? resWep.data?.filter((w) => w.weapon_name === item.nama_barang)
                    .length || 0
                : resGen.data?.find((g) => g.item_name === item.nama_barang)
                    ?.stock || 0;

            if (actualStock > 0) {
              ListingPage.state.priceMap[item.nama_barang] =
                item.harga_satuan || 0;
              checkList.innerHTML += `
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                  <div>
                    <label style="display:block;">${item.nama_barang}</label>
                    <small style="color:#43b581;">$${item.harga_satuan.toLocaleString()} (Stok: ${actualStock})</small>
                  </div>
                  <div class="qty-control">
                    <button type="button" class="qty-btn minus">−</button>
                    <input type="number" class="item-qty" data-name="${
                      item.nama_barang
                    }" value="0" min="0" max="${actualStock}" readonly style="width:40px; text-align:center; background:transparent; border:none; color:white;">
                    <button type="button" class="qty-btn plus">+</button>
                  </div>
                </div>`;
            }
          });
        } catch (e) {
          console.error(e);
        }
      }
      updateTotalPrice();
    };

    // --- 4. QTY CONTROL ---
    form.onclick = (e) => {
      if (
        e.target.classList.contains("plus") ||
        e.target.classList.contains("minus")
      ) {
        const input = e.target
          .closest(".qty-control")
          .querySelector(".item-qty");
        let current = parseInt(input.value) || 0;
        const maxVal = parseInt(input.getAttribute("max") || 999);
        if (e.target.classList.contains("plus") && current < maxVal) current++;
        else if (e.target.classList.contains("minus") && current > 0) current--;
        input.value = current;
        updateTotalPrice();
      }
    };

    // --- 5. SUBMIT LOGIC ---
    form.onsubmit = async (e) => {
      e.preventDefault();
      if (ListingPage.state.isSubmitting) return;

      const requests = [];
      const namaMember = inputNama.value;
      const tipeLayanan = tipeSelect.value;

      if (tipeLayanan === "Bundling") {
        requests.push({
          requested_by: namaMember,
          item_name: subSelect.value,
          item_type: "Bundling",
          quantity: 1,
          status: "pending",
          total_price: totalDisplay.innerText,
        });
      } else {
        form.querySelectorAll(".item-qty").forEach((el) => {
          const qty = parseInt(el.value);
          if (qty > 0) {
            const match = ListingPage.state.fullKatalog.find(
              (k) => k.nama_barang === el.dataset.name
            );
            requests.push({
              requested_by: namaMember,
              item_name: el.dataset.name,
              item_type: match ? match.jenis_barang : "General",
              quantity: qty,
              status: "pending",
              total_price: `$${(
                ListingPage.state.priceMap[el.dataset.name] * qty
              ).toLocaleString()}`,
            });
          }
        });
      }

      if (requests.length === 0)
        return Swal.fire(
          "Peringatan",
          "Pilih item terlebih dahulu!",
          "warning"
        );

      const { isConfirmed } = await Swal.fire({
        title: "Kirim Laporan?",
        text: `Konfirmasi pesanan untuk ${namaMember}.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#43b581",
        cancelButtonColor: "#ed4245",
        background: "#2f3136",
        color: "#fff",
      });

      if (!isConfirmed) return;

      try {
        ListingPage.state.isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.innerText = "Mengirim...";

        const { error: dbError } = await supabase
          .from("orders")
          .insert(requests);
        if (dbError) throw dbError;

        // Kirim ke Webhook Discord melalui API Proxy
        await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama: namaMember,
            rank: rankSelect.value,
            tipe: tipeLayanan,
            subTipe: subSelect.value,
            itemDetail: requests
              .map((r) => `${r.item_name} x${r.quantity}`)
              .join("\n"),
            totalHarga: totalDisplay.innerText,
          }),
        });

        await Swal.fire("Berhasil!", "Laporan telah terkirim.", "success");
        window.loadPage("home");
      } catch (err) {
        Swal.fire("Error", err.message, "error");
      } finally {
        ListingPage.state.isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.innerText = "Kirim Laporan";
      }
    };
  },
};
