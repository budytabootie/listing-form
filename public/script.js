// 1. Proteksi Halaman & Inisialisasi
let _supabase;
const isLoggedIn = sessionStorage.getItem("isLoggedIn");

if (!isLoggedIn) {
  window.location.href = "login.html";
}

// 2. Elemen DOM
const inputNama = document.getElementById("nama");
const listContainer = document.getElementById("autocomplete-list");
const rankSelect = document.getElementById("rank");
let members = [];

// 3. Fungsi Ambil Config & Data Member
async function initApp() {
  try {
    // Ambil config untuk Supabase
    const resConfig = await fetch("/api/get-config");
    const config = await resConfig.json();
    _supabase = supabase.createClient(config.supabaseUrl, config.supabaseKey);

    // Ambil data member dari Tabel Supabase
    const { data, error } = await _supabase
      .from("members")
      .select("nama, rank")
      .order("nama", { ascending: true });

    if (error) throw error;
    members = data; // Simpan ke array global untuk autocomplete
  } catch (err) {
    console.error("Gagal inisialisasi App:", err);
  }
}

initApp();

// 4. Update Tahun di Footer
const yearElement = document.getElementById("year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// 5. Logic Autocomplete (Sudah dioptimasi untuk data dari Supabase)
inputNama.addEventListener("input", function () {
  const val = this.value;
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
    item.innerHTML = match.nama;

    item.addEventListener("click", function () {
      inputNama.value = match.nama;
      listContainer.innerHTML = "";

      // Set Rank otomatis berdasarkan database
      if (match.rank && match.rank !== "-") {
        rankSelect.value = match.rank;
        rankSelect.disabled = true;
      } else {
        rankSelect.value = "-";
        rankSelect.disabled = false;
      }
    });
    listContainer.appendChild(item);
  });
});

document.addEventListener("click", (e) => {
  if (e.target !== inputNama) listContainer.innerHTML = "";
});

// --- Fungsi Global (Window) untuk Dropdown Tipe Tetap Sama ---

window.updateSubTipe = function () {
  const tipe = document.getElementById("tipe").value;
  const subContainer = document.getElementById("subTipeContainer");
  const subSelect = document.getElementById("subTipe");
  const finalContainer = document.getElementById("finalOptionsContainer");

  subSelect.innerHTML = '<option value="">-- Pilih --</option>';
  finalContainer.style.display = "none";

  if (tipe === "Bundling") {
    subContainer.style.display = "block";
    document.getElementById("labelSubTipe").innerText = "Pilih Paket Bundling";
    const list = ["Paket A", "Paket B", "Paket C", "Paket D"];
    list.forEach(
      (item) =>
        (subSelect.innerHTML += `<option value="${item}">${item}</option>`)
    );
  } else if (tipe === "Non Bundling") {
    subContainer.style.display = "block";
    document.getElementById("labelSubTipe").innerText = "Kategori Non-Bundling";
    const list = ["Vest ammo weapon", "Attachment"];
    list.forEach(
      (item) =>
        (subSelect.innerHTML += `<option value="${item}">${item}</option>`)
    );
  } else {
    subContainer.style.display = "none";
  }
};

window.updateFinalOptions = function () {
  const tipe = document.getElementById("tipe").value;
  const subTipe = document.getElementById("subTipe").value;
  const finalContainer = document.getElementById("finalOptionsContainer");
  const checkList = document.getElementById("checkboxList");
  const infoDisplay = document.getElementById("infoPaketDisplay");

  infoDisplay.style.display = "none";
  checkList.innerHTML = "";
  finalContainer.style.display = "none";

  if (tipe === "Bundling" && subTipe !== "") {
    const infoPaket = {
      "Paket A": "Isi: Vest Merah x5 , Ammo 9mm x5 BOX | PRICE : $21.000",
      "Paket B": "Isi: Vest Merah x10, Ammo 9mm x10 BOX | PRICE : $40.000",
      "Paket C": "Isi: Vest Merah x15, Ammo 9mm x15 BOX | PRICE : $58.000",
      "Paket D": "Isi: Vest Merah x20, Ammo 9mm x20 BOX | PRICE : $74.000",
    };
    if (infoPaket[subTipe]) {
      infoDisplay.style.display = "block";
      infoDisplay.innerText = infoPaket[subTipe];
    }
  } else if (tipe === "Non Bundling") {
    let items = [];
    if (subTipe === "Vest ammo weapon") {
      items = [
        "Vest Merah",
        "Ammo 9mm",
        "Ammo .50",
        "Ammo .44",
        "Ammo .45",
        "Weapon - Ceramic",
        "Weapon - Pistol .50",
        "Weapon - Micro SMG",
        "Weapon - Navy Revolver",
        "Weapon - KVR(Vector)",
      ];
    } else if (subTipe === "Attachment") {
      items = [
        "Suppressor",
        "Tactical suppressor",
        "Grip",
        "Extd",
        "Extd drum",
        "Extd smg",
        "Macro skop",
      ];
    }
    if (items.length > 0) {
      finalContainer.style.display = "block";
      items.forEach((item) => {
        checkList.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <label style="margin:0;">${item}</label>
                    <input type="number" class="item-qty" data-name="${item}" placeholder="0" min="0" value="0" style="width:70px; margin:0; padding:5px;">
                </div>`;
      });
    }
  }
};

document.getElementById("myForm").onsubmit = async (e) => {
  e.preventDefault();
  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.innerText = "Mengirim...";

  const itemElements = document.querySelectorAll(".item-qty");
  let rincianItem = [];
  itemElements.forEach((input) => {
    const qty = parseInt(input.value);
    if (qty > 0) rincianItem.push(`${input.getAttribute("data-name")}: ${qty}`);
  });

  const body = {
    nama: document.getElementById("nama").value,
    rank: document.getElementById("rank").value,
    tipe: document.getElementById("tipe").value,
    subTipe: document.getElementById("subTipe").value,
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
      rankSelect.disabled = false;
    } else {
      Swal.fire({
        title: "Gagal",
        text: data.message,
        icon: "error",
        background: "#1e1e1e",
        color: "#fff",
      });
    }
  } catch (err) {
    Swal.fire({
      title: "Error",
      text: "Gagal terhubung ke server",
      icon: "warning",
      background: "#1e1e1e",
      color: "#fff",
    });
  } finally {
    btn.disabled = false;
    btn.innerText = "Kirim";
  }
};
