import { API } from "./api.js";
import { Auth } from "./auth.js"; // <--- TAMBAHKAN BARIS INI

export const PortalUI = {
  setupPasswordFeatures(userData) {
    window.changePassword = async () => {
      const { value: newPass } = await Swal.fire({
        title:
          '<i class="fas fa-shield-alt" style="color: #43b581; margin-bottom: 10px;"></i><br><span style="color: #fff; font-size: 1.5rem; font-weight: 600;">Update Keamanan</span>',
        background: "#2f3136",
        html: `
          <div style="margin-top: 15px; padding: 0 10px;">
            <p style="color: #b9bbbe; font-size: 0.9rem; margin-bottom: 20px;">Silakan masukkan password baru Anda. Pastikan kombinasi sulit ditebak.</p>
            
            <div style="position: relative; margin-bottom: 15px;">
              <i class="fas fa-lock" style="position: absolute; left: 15px; top: 15px; color: #72767d;"></i>
              <input type="password" id="p-1" class="swal2-input" placeholder="Password Baru" 
                style="background:#202225; color:white; border: 1px solid #4f545c; width: 100%; border-radius: 8px; padding-left: 45px; margin: 0; box-sizing: border-box; font-size: 0.95rem;">
            </div>

            <div style="position: relative;">
              <i class="fas fa-check-circle" style="position: absolute; left: 15px; top: 15px; color: #72767d;"></i>
              <input type="password" id="p-2" class="swal2-input" placeholder="Konfirmasi Password" 
                style="background:#202225; color:white; border: 1px solid #4f545c; width: 100%; border-radius: 8px; padding-left: 45px; margin: 0; box-sizing: border-box; font-size: 0.95rem;">
            </div>
          </div>
        `,
        confirmButtonText: "SIMPAN PERUBAHAN",
        confirmButtonColor: "#43b581",
        showCancelButton: true,
        cancelButtonText: "BATAL",
        cancelButtonColor: "#f04747",
        reverseButtons: true,
        focusConfirm: false,
        preConfirm: () => {
          const p1 = document.getElementById("p-1").value;
          const p2 = document.getElementById("p-2").value;
          if (!p1 || p1.length < 6)
            return Swal.showValidationMessage("Minimal 6 karakter!");
          if (p1 !== p2)
            return Swal.showValidationMessage(
              "Konfirmasi password tidak cocok!"
            );
          return p1;
        },
        customClass: {
          popup: "animated fadeInDown fast",
        },
      });

      if (newPass) {
        Swal.fire({
          title: "Memproses...",
          background: "#2f3136",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // Cukup kirim ID dan Password Baru
        const result = await API.updatePassword(userData.id, newPass);
        if (result.success) {
          Swal.fire({
            icon: "success",
            title: "Berhasil Diperbarui",
            text: "Data keamanan Anda telah diperbarui.",
            background: "#2f3136",
            color: "#fff",
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Gagal Update",
            text: result.message,
            background: "#2f3136",
            color: "#fff",
            confirmButtonColor: "#5865F2",
          });
        }
      }
    };
  },

  async forceChangePassword(userData) {
    const { value: newPass } = await Swal.fire({
      title: `
        <div style="margin-top: 10px;">
          <i class="fas fa-user-shield" style="font-size: 3.5rem; color: #faa61a; filter: drop-shadow(0 0 10px rgba(250, 166, 26, 0.3));"></i>
          <br>
          <span style="color: #fff; font-size: 1.5rem; font-weight: 800; letter-spacing: 1px; display: block; margin-top: 15px;">
            VERIFIKASI KEAMANAN
          </span>
        </div>
      `,
      background: "#2f3136",
      html: `
        <div style="padding: 0 10px;">
          <p style="color: #b9bbbe; font-size: 0.95rem; line-height: 1.5; margin-bottom: 25px;">
            Akun Anda terdeteksi menggunakan <strong style="color: #faa61a;">password default</strong>. 
            Demi keamanan aset digital Anda, wajib membuat password baru sebelum melanjutkan.
          </p>
          
          <div style="position: relative; margin-bottom: 10px;">
            <i class="fas fa-key" style="position: absolute; left: 15px; top: 15px; color: #faa61a;"></i>
            <input type="password" id="p-portal-force" class="swal2-input" placeholder="Buat Password Baru" 
              style="background:#202225; color:white; border: 1px solid #4f545c; width: 100%; border-radius: 8px; padding-left: 45px; margin: 0; box-sizing: border-box; font-size: 1rem; height: 50px;">
          </div>
          <p style="color: #72767d; font-size: 0.75rem; text-align: left; margin-top: 8px; margin-left: 5px;">
            *Minimal 6 karakter, gunakan kombinasi angka dan huruf.
          </p>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: "AKTIVASI AKUN SEKARANG",
      confirmButtonColor: "#faa61a",
      width: "450px",
      padding: "2em",
      preConfirm: () => {
        const v = document.getElementById("p-portal-force").value;
        if (!v || v.length < 6)
          return Swal.showValidationMessage(
            "Password terlalu pendek (Min. 6 karakter)!"
          );
        return v;
      },
      customClass: {
        confirmButton: "portal-force-confirm-btn",
      },
    });

    if (newPass) {
      Swal.fire({
        title: "Mengamankan Akun...",
        background: "#2f3136",
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const result = await API.updatePassword(userData.id, newPass);

      if (result.success) {
        await Swal.fire({
          icon: "success",
          title: "Akses Diberikan",
          text: "Password telah diperbarui. Silakan login kembali.",
          background: "#2f3136",
          color: "#fff",
          confirmButtonColor: "#43b581",
        });

        // Gunakan await untuk memastikan session di DB terhapus sebelum redirect
        await Auth.logout(localStorage.getItem("sessionToken"));
        window.location.href = "/login.html"; // Paksa pindah halaman
      } else {
        Swal.fire({
          icon: "error",
          title: "Terjadi Kesalahan",
          text: result.message,
          background: "#2f3136",
          confirmButtonColor: "#f04747",
        });
      }
    }
  },

  setupAdminButton(userData) {
    // Role yang diperbolehkan masuk admin: 1 (Super Admin), 2 (Treasurer), 3 (Staff), 5 (BNN)
    const allowedAdminRoles = [1, 2, 3, 5];

    if (allowedAdminRoles.includes(userData.role_id)) {
      document.querySelectorAll(".portal-nav-actions").forEach((container) => {
        if (!container.querySelector(".btn-go-admin")) {
          const btnAdmin = document.createElement("button");
          btnAdmin.className = "portal-logout-btn btn-go-admin";
          btnAdmin.style.background = "#5865F2";
          btnAdmin.style.marginRight = "10px";
          btnAdmin.innerHTML = `<i class="fas fa-user-shield"></i> KE ADMIN`;
          btnAdmin.onclick = () => (window.location.href = "admin/index.html");
          container.prepend(btnAdmin);
        }
      });
    }
  },
};
