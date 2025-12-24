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
    let dbBundles = []; // Simpan data paket dari DB

    // AMBIL DATA PAKET DARI DB
    const { data: pkgData } = await supabase.from("master_paket").select("*");
    dbBundles = pkgData || [];

    const updateTotalPrice = () => {
      let total = 0;
      if (tipeSelect.value === "Bundling") {
        // AMBIL HARGA DARI DATA DB
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
        // LOOP DARI DATABASE
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
        // AMBIL DETAIL DARI DATA DB
        const selected = dbBundles.find((p) => p.nama_paket === subTipe);
        infoDisplay.innerText = selected
          ? `Isi: ${selected.deskripsi_isi}`
          : "Detail tidak ditemukan";
        infoDisplay.style.display = "block";
        document.getElementById("checkboxList").innerHTML = "";
        document.getElementById("finalOptionsContainer").style.display =
          "block";
        updateTotalPrice();
      } else if (tipe === "Non Bundling" && subTipe) {
        finalContainer.style.display = "block";
        let filterJenis =
          subTipe === "Vest ammo weapon"
            ? ["Vest", "Ammo", "Weapon"]
            : ["Attachment"];

        const { data: items } = await supabase
          .from("katalog_barang")
          .select("nama_barang, harga_satuan")
          .in("jenis_barang", filterJenis)
          .eq("status", "Ready");

        checkList.innerHTML = "";
        if (items && items.length > 0) {
          items.forEach((item) => {
            priceMap[item.nama_barang] = item.harga_satuan || 0;
            checkList.innerHTML += `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <div>
                            <label style="margin:0; display:block;">${
                              item.nama_barang
                            }</label>
                            <small style="color:#43b581;">$${Number(
                              item.harga_satuan
                            ).toLocaleString()}</small>
                        </div>
                        <input type="number" class="item-qty" data-name="${
                          item.nama_barang
                        }" value="0" min="0" style="width:70px;">
                    </div>`;
          });

          document.querySelectorAll(".item-qty").forEach((input) => {
            input.oninput = updateTotalPrice;
          });
        } else {
          checkList.innerHTML =
            "<p style='font-size:0.8rem; color:#ed4245;'>Maaf, tidak ada item yang tersedia saat ini.</p>";
        }
        updateTotalPrice();
      }
    };

    // 4. Submit Form (Pembaruan: Simpan ke DB & Kirim Discord)
    document.getElementById("myForm").onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById("submitBtn");
      btn.disabled = true;
      btn.innerText = "Mengirim...";

      const itemElements = document.querySelectorAll(".item-qty");
      let rincianItem = [];
      itemElements.forEach((el) => {
        const qty = parseInt(el.value);
        if (qty > 0) rincianItem.push(`${el.dataset.name}: ${qty}`);
      });

      const bodyData = {
        nama: inputNama.value,
        rank: rankSelect.value,
        tipe: tipeSelect.value,
        subTipe: subSelect.value,
        itemDetail: rincianItem.join("\n") || "-",
        totalHarga: totalDisplay.innerText, // Gunakan variabel yang sudah di-init
      };

      try {
        // LANGKAH 1: Simpan ke Database
        const { error: dbError } = await supabase
          .from("history_listing")
          .insert([
            {
              nama_member: bodyData.nama,
              rank_member: bodyData.rank,
              tipe_layanan: `${bodyData.tipe} - ${bodyData.subTipe}`,
              item_detail: bodyData.itemDetail,
              total_harga: bodyData.totalHarga,
              status: "Pending",
            },
          ]);

        if (dbError) throw dbError;

        // LANGKAH 2: Kirim ke API Discord
        const res = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData),
        });

        // CEK APAKAH RESPONSE OK SEBELUM JSON.PARSE
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Server Error: ${res.status}`);
        }

        const data = await res.json();

        if (data.success) {
          Swal.fire({
            title: "Berhasil!",
            text: "Laporan telah disimpan dan diteruskan ke Admin.",
            icon: "success",
            background: "#1e1e1e",
            color: "#fff",
          });

          document.getElementById("myForm").reset();
          subContainer.style.display = "none";
          finalContainer.style.display = "none";
          totalDisplay.innerText = "$0";
        }
      } catch (err) {
        console.error("Submit Error:", err);
        Swal.fire({
          title: "Error",
          text: err.message || "Terjadi kesalahan saat mengirim data.",
          icon: "error",
        });
      } finally {
        btn.disabled = false;
        btn.innerText = "Kirim Laporan";
      }
    };
  },
};
