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

    // 1. Load Data Member untuk Autocomplete
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

    // 2. Logic Dropdown Tipe
    tipeSelect.onchange = () => {
      const tipe = tipeSelect.value;
      subSelect.innerHTML = '<option value="">-- Pilih --</option>';
      finalContainer.style.display = "none";
      infoDisplay.style.display = "none";

      if (tipe === "Bundling") {
        subContainer.style.display = "block";
        document.getElementById("labelSubTipe").innerText =
          "Pilih Paket Bundling";
        ["Paket A", "Paket B", "Paket C", "Paket D"].forEach((pkg) => {
          subSelect.innerHTML += `<option value="${pkg}">${pkg}</option>`;
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

    // 3. Logic Sub-Tipe & Final Options
    subSelect.onchange = async () => {
      // Tambahkan async di sini
      const tipe = tipeSelect.value;
      const subTipe = subSelect.value;
      checkList.innerHTML = "Memuat item...";
      finalContainer.style.display = "none";
      infoDisplay.style.display = "none";

      if (tipe === "Bundling" && subTipe) {
        // ... (Kode Bundling tetap sama) ...
        const infoPaket = {
          "Paket A": "Isi: Vest Merah x5 , Ammo 9mm x5 BOX | PRICE : $21.000",
          "Paket B": "Isi: Vest Merah x10, Ammo 9mm x10 BOX | PRICE : $40.000",
          "Paket C": "Isi: Vest Merah x15, Ammo 9mm x15 BOX | PRICE : $58.000",
          "Paket D": "Isi: Vest Merah x20, Ammo 9mm x20 BOX | PRICE : $74.000",
        };
        infoDisplay.innerText = infoPaket[subTipe];
        infoDisplay.style.display = "block";
        checkList.innerHTML = "";
      } else if (tipe === "Non Bundling" && subTipe) {
        finalContainer.style.display = "block";

        // AMBIL DARI KATALOG BERDASARKAN JENIS
        let filterJenis =
          subTipe === "Vest ammo weapon"
            ? ["Vest", "Ammo", "Weapon"]
            : ["Attachment"];
        const { data: items } = await supabase
          .from("katalog_barang")
          .select("nama_barang")
          .in("jenis_barang", filterJenis);

        checkList.innerHTML = "";
        if (items && items.length > 0) {
          items.forEach((item) => {
            checkList.innerHTML += `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <label style="margin:0;">${item.nama_barang}</label>
                        <input type="number" class="item-qty" data-name="${item.nama_barang}" value="0" min="0" style="width:70px;">
                    </div>`;
          });
        } else {
          checkList.innerHTML =
            "<p style='font-size:0.8rem; color:gray;'>Tidak ada item di kategori ini.</p>";
        }
      }
    };

    // 4. Submit Form
    document.getElementById("myForm").onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById("submitBtn");
      btn.disabled = true;
      btn.innerText = "Mengirim...";

      const itemElements = document.querySelectorAll(".item-qty");
      let rincianItem = [];
      itemElements.forEach((el) => {
        if (parseInt(el.value) > 0)
          rincianItem.push(`${el.dataset.name}: ${el.value}`);
      });

      const body = {
        nama: inputNama.value,
        rank: rankSelect.value,
        tipe: tipeSelect.value,
        subTipe: subSelect.value,
        itemDetail: rincianItem.join("\n") || "-",
      };

      try {
        const res = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire({
            title: "Berhasil!",
            text: data.message,
            icon: "success",
            background: "#1e1e1e",
            color: "#fff",
          });
          document.getElementById("myForm").reset();
          subContainer.style.display = "none";
        }
      } catch (err) {
        Swal.fire({ title: "Error", text: "Gagal terhubung", icon: "error" });
      } finally {
        btn.disabled = false;
        btn.innerText = "Kirim Laporan";
      }
    };
  },
};
