export const ListingPage = {
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

    let priceMap = {};
    let dbBundles = [];
    let fullKatalog = [];

    const { data: pkgData } = await supabase.from("master_paket").select("*");
    const { data: katData, error: katError } = await supabase
      .from("katalog_barang")
      .select("nama_barang, jenis_barang, harga_satuan, status"); // SUDAH DIPERBAIKI

    if (katError) console.error("Error load katalog:", katError);
    fullKatalog = katData || [];
    const updateTotalPrice = () => {
      let total = 0;
      if (tipeSelect.value === "Bundling") {
        const selected = dbBundles.find(
          (p) => p.nama_paket === subSelect.value
        );
        total = selected ? selected.total_harga : 0;
      } else {
        document.querySelectorAll(".item-qty").forEach((input) => {
          const qty = parseInt(input.value) || 0;
          const price = priceMap[input.dataset.name] || 0;
          total += qty * price;
        });
      }
      totalDisplay.innerText = `$${total.toLocaleString()}`;
    };

    const { data: members } = await supabase
      .from("members")
      .select("nama, rank");

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
        dbBundles.forEach((pkg) => {
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

    subSelect.onchange = async () => {
      const tipe = tipeSelect.value;
      const subTipe = subSelect.value;

      if (tipe === "Bundling" && subTipe) {
        const selected = dbBundles.find((p) => p.nama_paket === subTipe);
        infoDisplay.innerText = selected
          ? `Isi: ${selected.deskripsi_isi}`
          : "Detail tidak ditemukan";
        infoDisplay.style.display = "block";
        checkList.innerHTML = "";
        finalContainer.style.display = "block";
        updateTotalPrice();
      } else if (tipe === "Non Bundling" && subTipe) {
        finalContainer.style.display = "block";
        checkList.innerHTML =
          "<p style='color:#72767d; font-size:0.8rem;'>Sinkronisasi gudang...</p>";

        let filterJenis =
          subTipe === "Vest ammo weapon"
            ? ["Vest", "Ammo", "Weapon"]
            : ["Attachment"];

        try {
          // 1. Ambil data dari semua tabel secara paralel
          const [resWep, resGen] = await Promise.all([
            supabase
              .from("inventory_weapons")
              .select("weapon_name")
              .ilike("status", "%available%")
              .is("hold_by", null),
            supabase.from("inventory").select("item_name, stock"),
          ]);

          console.log("Data Senjata di Gudang:", resWep.data);
          console.log("Data Barang di Gudang:", resGen.data);
          console.log("Isi Katalog Saat Ini:", fullKatalog);

          // 2. Filter katalog yang statusnya Ready
          const items = fullKatalog.filter(
            (k) => filterJenis.includes(k.jenis_barang) && k.status === "Ready"
          );

          checkList.innerHTML = "";

          const availableItems = items
            .map((item) => {
              let actualStock = 0;
              if (item.jenis_barang === "Weapon") {
                // Pastikan nama_barang di katalog SAMA PERSIS dengan weapon_name di inventory_weapons
                actualStock = resWep.data
                  ? resWep.data.filter(
                      (w) => w.weapon_name === item.nama_barang
                    ).length
                  : 0;
              } else {
                // Pastikan nama_barang di katalog SAMA PERSIS dengan item_name di inventory
                const invRecord = resGen.data
                  ? resGen.data.find((g) => g.item_name === item.nama_barang)
                  : null;
                actualStock = invRecord ? invRecord.stock || 0 : 0;
              }
              return { ...item, actualStock };
            })
            .filter((item) => item.actualStock > 0);

          console.log("Item yang lolos filter stok:", availableItems);

          if (availableItems.length > 0) {
            availableItems.forEach((item) => {
              priceMap[item.nama_barang] = item.harga_satuan || 0;
              checkList.innerHTML += `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <div>
                                <label style="margin:0; display:block;">${
                                  item.nama_barang
                                }</label>
                                <small style="color:#43b581;">$${Number(
                                  item.harga_satuan
                                ).toLocaleString()} <span style="color:#72767d;">(Tersedia: ${
                item.actualStock
              })</span></small>
                            </div>
                            <div class="qty-control">
                                <button type="button" class="qty-btn minus">−</button>
                                <input type="number" class="item-qty" data-name="${
                                  item.nama_barang
                                }" value="0" min="0" max="${
                item.actualStock
              }" readonly style="width:60px; background:transparent; border:none; color:white; text-align:center;">
                                <button type="button" class="qty-btn plus">+</button>
                            </div>
                        </div>`;
            });
            document
              .querySelectorAll(".item-qty")
              .forEach((input) => (input.oninput = updateTotalPrice));
          } else {
            checkList.innerHTML =
              "<p style='font-size:0.8rem; color:#ed4245;'>Maaf, stok item di kategori ini tidak ditemukan atau kosong di gudang.</p>";
          }
        } catch (err) {
          console.error("Error Detail:", err);
          checkList.innerHTML =
            "<p style='font-size:0.8rem; color:#ed4245;'>Gagal memuat data stok.</p>";
        }
        updateTotalPrice();
      }
    };

    document.getElementById("myForm").onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById("submitBtn");
      btn.disabled = true;
      btn.innerText = "Mengirim...";

      const requests = [];
      const namaMember = document.getElementById("nama").value;
      const tipeLayanan = document.getElementById("tipe").value;
      const subTipe = document.getElementById("subTipe").value;

      if (tipeLayanan === "Bundling") {
        requests.push({
          requested_by: namaMember,
          item_name: subTipe,
          item_type: "Bundling",
          quantity: 1,
          status: "pending",
          total_price: totalDisplay.innerText,
        });
      } else {
        const itemElements = document.querySelectorAll(".item-qty");
        itemElements.forEach((el) => {
          const qty = parseInt(el.value);
          if (qty > 0) {
            const matchKatalog = fullKatalog.find(
              (k) => k.nama_barang === el.dataset.name
            );
            const type = matchKatalog ? matchKatalog.jenis_barang : "General";

            requests.push({
              requested_by: namaMember,
              item_name: el.dataset.name,
              item_type: type,
              quantity: qty,
              status: "pending",
              total_price: `$${(
                priceMap[el.dataset.name] * qty
              ).toLocaleString()}`,
            });
          }
        });
      }

      try {
        if (requests.length === 0)
          throw new Error("Pilih setidaknya satu item!");
        const { error: dbError } = await supabase
          .from("orders")
          .insert(requests);
        if (dbError) throw dbError;

        await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama: namaMember,
            rank: document.getElementById("rank").value,
            tipe: tipeLayanan,
            subTipe: subTipe,
            itemDetail: requests
              .map((r) => `${r.item_name} x${r.quantity}`)
              .join("\n"),
            totalHarga: totalDisplay.innerText,
          }),
        });

        Swal.fire("Berhasil!", "Pesanan dikirim ke Admin.", "success");
        document.getElementById("myForm").reset();
        subContainer.style.display = "none";
        finalContainer.style.display = "none";
        totalDisplay.innerText = "$0";
      } catch (err) {
        Swal.fire("Error", err.message, "error");
      } finally {
        btn.disabled = false;
        btn.innerText = "Kirim Laporan";
      }
    };

    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("plus")) {
        const input = e.target
          .closest(".qty-control")
          .querySelector(".item-qty");
        const maxVal = parseInt(input.getAttribute("max") || 999);
        if (Number(input.value) < maxVal) {
          input.value = Number(input.value || 0) + 1;
          input.dispatchEvent(new Event("input"));
        } else {
          Swal.fire({
            toast: true,
            position: "top-end",
            title: "Stok terbatas!",
            icon: "warning",
            timer: 1000,
            showConfirmButton: false,
          });
        }
      }
      if (e.target.classList.contains("minus")) {
        const input = e.target
          .closest(".qty-control")
          .querySelector(".item-qty");
        const current = Number(input.value || 0);
        if (current > Number(input.min || 0)) {
          input.value = current - 1;
          input.dispatchEvent(new Event("input"));
        }
      }
    });
  },
};
