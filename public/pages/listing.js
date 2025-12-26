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

    // --- LOAD DATA AWAL ---
    const { data: pkgData, error: pkgError } = await supabase
      .from("master_paket")
      .select("*");
    const { data: katData, error: katError } = await supabase
      .from("katalog_barang")
      .select("nama_barang, jenis_barang, harga_satuan, status");

    if (pkgError) console.error("Error load paket:", pkgError);
    if (katError) console.error("Error load katalog:", katError);

    dbBundles = pkgData || []; // Mengisi list paket agar tidak kosong
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
        if (selected) {
          infoDisplay.style.display = "block";
          infoDisplay.innerHTML =
            "<span style='color:#72767d;'>Memvalidasi stok bahan paket...</span>";

          try {
            const { data: resep } = await supabase
              .from("bundle_items")
              .select("nama_barang_stok, jumlah_potong")
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

            if (resep && resep.length > 0) {
              resep.forEach((item) => {
                const target = item.nama_barang_stok;
                const butuh = item.jumlah_potong;
                let punya = 0;

                const isWeapon =
                  fullKatalog.find((k) => k.nama_barang === target)
                    ?.jenis_barang === "Weapon";
                if (isWeapon) {
                  punya = resWep.data
                    ? resWep.data.filter((w) => w.weapon_name === target).length
                    : 0;
                } else {
                  punya = resGen.data
                    ? resGen.data.find((g) => g.item_name === target)?.stock ||
                      0
                    : 0;
                }

                if (punya < butuh) {
                  isSafe = false;
                  detailStatus += `<li style="color:#ed4245;">${target}: Kurang ${
                    butuh - punya
                  } (Stok: ${punya}/${butuh})</li>`;
                } else {
                  detailStatus += `<li style="color:#43b581;">${target}: Aman (${punya}/${butuh})</li>`;
                }
              });

              if (isSafe) {
                infoDisplay.innerHTML = `<strong style="color:#43b581;">✓ Stok Tersedia</strong><ul style="margin:5px 0; padding-left:15px; font-size:0.75rem;">${detailStatus}</ul><p style="font-size:0.7rem;">Isi: ${selected.deskripsi_isi}</p>`;
                finalContainer.style.display = "block";
              } else {
                infoDisplay.innerHTML = `<strong style="color:#ed4245;">✗ Stok Bahan Tidak Cukup</strong><ul style="margin:5px 0; padding-left:15px; font-size:0.75rem;">${detailStatus}</ul>`;
                finalContainer.style.display = "none";
              }
            }
          } catch (err) {
            console.error(err);
          }
        }
        checkList.innerHTML = "";
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
          const [resWep, resGen] = await Promise.all([
            supabase
              .from("inventory_weapons")
              .select("weapon_name")
              .ilike("status", "%available%")
              .is("hold_by", null),
            supabase.from("inventory").select("item_name, stock"),
          ]);

          const items = fullKatalog.filter(
            (k) => filterJenis.includes(k.jenis_barang) && k.status === "Ready"
          );
          checkList.innerHTML = "";

          const availableItems = items
            .map((item) => {
              let actualStock = 0;
              if (item.jenis_barang === "Weapon") {
                actualStock = resWep.data
                  ? resWep.data.filter(
                      (w) => w.weapon_name === item.nama_barang
                    ).length
                  : 0;
              } else {
                const invRecord = resGen.data
                  ? resGen.data.find((g) => g.item_name === item.nama_barang)
                  : null;
                actualStock = invRecord ? invRecord.stock || 0 : 0;
              }
              return { ...item, actualStock };
            })
            .filter((item) => item.actualStock > 0);

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
              "<p style='font-size:0.8rem; color:#ed4245;'>Stok kosong di gudang.</p>";
          }
        } catch (err) {
          console.error(err);
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
        document.querySelectorAll(".item-qty").forEach((el) => {
          const qty = parseInt(el.value);
          if (qty > 0) {
            const matchKatalog = fullKatalog.find(
              (k) => k.nama_barang === el.dataset.name
            );
            requests.push({
              requested_by: namaMember,
              item_name: el.dataset.name,
              item_type: matchKatalog ? matchKatalog.jenis_barang : "General",
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
      if (
        e.target.classList.contains("plus") ||
        e.target.classList.contains("minus")
      ) {
        const input = e.target
          .closest(".qty-control")
          .querySelector(".item-qty");
        const current = Number(input.value || 0);
        if (e.target.classList.contains("plus")) {
          const maxVal = parseInt(input.getAttribute("max") || 999);
          if (current < maxVal) {
            input.value = current + 1;
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
        } else if (current > 0) {
          input.value = current - 1;
          input.dispatchEvent(new Event("input"));
        }
      }
    });
  },
};
