// public/js/core/ui.js
import { API } from "./api.js";

export const PortalUI = {
  /**
   * Mengatur fitur ganti password (Normal & Force)
   */
  /**
   * Mengatur fitur ganti password (Normal)
   */
  setupPasswordFeatures(userData) {
    window.changePassword = async () => {
      const { value: formValues } = await Swal.fire({
        title:
          '<span style="color: #fff; font-size: 1.4rem;">Pengaturan Password</span>',
        background: "#2f3136",
        html: `
          <div style="margin-top: 20px; text-align: left;">
            <div style="margin-bottom: 15px;">
                <label style="color: #8e9297; font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">Password Sekarang</label>
                <input type="password" id="p-old" class="swal2-input" placeholder="••••••••" style="background:#202225; color:white; border: 1px solid #4f545c; width: 100%; margin: 5px 0; border-radius: 5px;">
            </div>
            <hr style="border: 0; border-top: 1px solid #4f545c; margin: 20px 0;">
            <div style="margin-bottom: 15px;">
                <label style="color: #8e9297; font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">Password Baru</label>
                <input type="password" id="p-1" class="swal2-input" placeholder="••••••••" style="background:#202225; color:white; border: 1px solid #4f545c; width: 100%; margin: 5px 0; border-radius: 5px;">
            </div>
            <div>
                <label style="color: #8e9297; font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">Ulangi Password Baru</label>
                <input type="password" id="p-2" class="swal2-input" placeholder="••••••••" style="background:#202225; color:white; border: 1px solid #4f545c; width: 100%; margin: 5px 0; border-radius: 5px;">
            </div>
          </div>
        `,
        confirmButtonText: "UPDATE PASSWORD",
        confirmButtonColor: "#43b581",
        showCancelButton: true,
        padding: "2em",
        preConfirm: () => {
          const oldP = document.getElementById("p-old").value;
          const p1 = document.getElementById("p-1").value;
          const p2 = document.getElementById("p-2").value;

          if (!oldP)
            return Swal.showValidationMessage("Password lama wajib diisi!");
          if (!p1 || p1.length < 6)
            return Swal.showValidationMessage(
              "Password baru minimal 6 karakter!"
            );
          if (p1 !== p2)
            return Swal.showValidationMessage(
              "Konfirmasi password baru tidak cocok!"
            );

          return { oldP, p1 };
        },
      });

      if (formValues) {
        Swal.fire({
          title: "Memproses...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        // Hashing keduanya
        const oldHashed = CryptoJS.SHA256(formValues.oldP).toString();
        const newHashed = CryptoJS.SHA256(formValues.p1).toString();

        // Memanggil API dengan 3 parameter sesuai api.js terbaru
        const result = await API.updatePassword(
          userData.id,
          oldHashed,
          newHashed
        );

        if (result.success) {
          await Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "Password Anda telah diperbarui.",
            background: "#2f3136",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          Swal.fire(
            "Gagal",
            result.message || "Gagal memperbarui password",
            "error"
          );
        }
      }
    };
  },

  /**
   * Logika ganti password paksa untuk user baru
   */
  async forceChangePassword(userData) {
    const { value: newPass } = await Swal.fire({
      title:
        '<span style="color: #faa61a; font-weight: bold; letter-spacing: 1px;">VERIFIKASI KEAMANAN</span>',
      background: "#2f3136",
      html: `
        <div style="text-align: center; margin-bottom: 20px;">
          <i class="fas fa-user-lock" style="font-size: 3.5rem; color: #faa61a; margin-bottom: 15px; display: block;"></i>
          <p style="color: #b9bbbe; font-size: 0.95rem; line-height: 1.5;">Password Anda masih default.<br>Wajib diganti sebelum mengakses portal.</p>
        </div>
        <input type="password" id="p-portal-force" class="swal2-input" placeholder="Buat Password Baru" 
          style="background:#202225; color:white; border: 1px solid #4f545c; border-radius: 8px; width: 85%; margin: 0 auto; display: block;">
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: "SIMPAN & MASUK",
      confirmButtonColor: "#faa61a",
      padding: "2em",
      preConfirm: () => {
        const v = document.getElementById("p-portal-force").value;
        if (!v || v.length < 6)
          return Swal.showValidationMessage("Minimal 6 karakter!");
        return v;
      },
    });

    if (newPass) {
      Swal.fire({
        title: "Menyimpan...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const hashed = CryptoJS.SHA256(newPass).toString();
      // Memanggil API yang sudah terhubung ke Edge Function
      const result = await API.updatePassword(
        userData.id,
        userData.password, // Ini password lama (default)
        hashed // Ini password baru
      );

      if (result.success) {
        await Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Akses diberikan. Mengalihkan...",
          background: "#2f3136",
          color: "#fff",
          timer: 1500,
          showConfirmButton: false,
        });
        location.reload();
      } else {
        Swal.fire(
          "Gagal",
          result.message || "Terjadi kesalahan sistem",
          "error"
        );
      }
    }
  },

  /**
   * Munculkan tombol admin jika role bukan member biasa
   */
  setupAdminButton(userData) {
    if (userData.role_id !== 4) {
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
