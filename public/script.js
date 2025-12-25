import { ListingPage } from "./pages/listing.js";

let _supabase;

// Fungsi Navigasi Halaman User
window.loadPage = (page) => {
  const area = document.getElementById("content-area");
  if (!area) return;

  // Reset class active di navbar
  document
    .querySelectorAll(".nav-link")
    .forEach((el) => el.classList.remove("active"));

  if (page === "listing") {
    area.innerHTML = ListingPage.render();
    ListingPage.init(_supabase);
    document.getElementById("nav-listing").classList.add("active");
  } else if (page === "home") {
    area.innerHTML = `
            <div style="text-align: center; margin-top: 50px;">
                <h2 style="color: #5865F2;">Welcome back!</h2>
                <p style="color: #b9bbbe;">Gunakan menu di atas untuk mulai bekerja.</p>
            </div>`;
    document.getElementById("nav-home").classList.add("active");
  } else if (page === "setoran") {
    area.innerHTML = `
            <div style="text-align: center; margin-top: 50px;">
                <h2 style="color: #faa61a;">Fitur Setoran</h2>
                <p style="color: #b9bbbe;">Fitur ini sedang dalam pengembangan.</p>
            </div>`;
    document.getElementById("nav-setoran").classList.add("active");
  }
};

async function init() {
  try {
    const res = await fetch("/api/get-config");
    const config = await res.json();
    _supabase = supabase.createClient(config.supabaseUrl, config.supabaseKey);

    const token = localStorage.getItem("sessionToken");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const { data: sessionData, error } = await _supabase
      .from("user_sessions")
      .select("*, users_login(*)")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !sessionData || !sessionData.users_login) {
      localStorage.removeItem("sessionToken");
      window.location.href = "login.html";
      return;
    }

    const userData = sessionData.users_login;
    document.getElementById("userNameDisplay").innerText =
      userData.nama_lengkap;

    // Setup Logout
    window.logout = async () => {
      if (token && _supabase) {
        await _supabase.from("user_sessions").delete().eq("token", token);
      }
      localStorage.removeItem("sessionToken");
      window.location.href = "login.html";
    };

    // Setup Ganti Password
    window.changePassword = async () => {
      const { value: newPass } = await Swal.fire({
        title: "Ganti Password",
        input: "text",
        inputLabel: "Masukkan Password Baru",
        showCancelButton: true,
        background: "#2f3136",
        color: "#fff",
        confirmButtonColor: "#5865F2",
      });

      if (newPass && newPass.length >= 6) {
        const { error } = await _supabase.rpc("update_user_password_secure", {
          u_id: userData.id,
          new_pass: newPass,
        });
        if (error) Swal.fire("Gagal", error.message, "error");
        else Swal.fire("Sukses", "Password berhasil diupdate!", "success");
      }
    };

    // Load halaman default (Home)
    window.loadPage("home");
  } catch (err) {
    console.error("Gagal inisialisasi:", err);
    window.location.href = "login.html";
  }
}

init();
