// public/admin/js/core/ui.js

// PERBAIKAN: Naik 3 tingkat (../../../) untuk mencapai folder public/js/core/
import { API } from "../../../js/core/api.js";

export const UI = {
  setupPasswordFeatures(supabase, userData) {
    window.changePassword = async () => {
      const { value: formValues } = await Swal.fire({
        title: '<span style="color: #fff;">Update Password</span>',
        background: "#2f3136",
        html: `
            <input type="password" id="swal-new-1" class="swal2-input" placeholder="Password Baru" style="background:#202225; color:white;">
            <input type="password" id="swal-new-2" class="swal2-input" placeholder="Konfirmasi" style="background:#202225; color:white;">
        `,
        confirmButtonText: "SIMPAN",
        showCancelButton: true,
        preConfirm: () => {
          const p1 = document.getElementById("swal-new-1").value;
          const p2 = document.getElementById("swal-new-2").value;
          if (p1.length < 6)
            return Swal.showValidationMessage("Minimal 6 karakter!");
          if (p1 !== p2)
            return Swal.showValidationMessage("Password tidak cocok!");
          return p1;
        },
      });

      if (formValues) {
        Swal.fire({
          title: "Memproses...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });
        const hashed = CryptoJS.SHA256(formValues).toString();

        // Memanggil API yang sudah di-init di script.js
        const result = await API.updatePassword(userData.id, hashed);

        if (result.success) {
          Swal.fire({
            icon: "success",
            title: "Berhasil",
            background: "#2f3136",
          });
        } else {
          Swal.fire("Gagal", result.message || "Terjadi kesalahan", "error");
        }
      }
    };
  },

  async forceChangePassword(userData) {
    const { value: newPass } = await Swal.fire({
      title: '<span style="color: #faa61a;">VERIFIKASI KEAMANAN</span>',
      background: "#2f3136",
      html: `
        <div style="text-align: center; margin-bottom: 20px;">
          <p style="color: #b9bbbe;">Password Anda masih default.<br>Wajib diganti sebelum mengakses Admin.</p>
        </div>
        <input type="password" id="p-force-admin" class="swal2-input" placeholder="Password Baru" 
          style="background:#202225; color:white; border-radius: 8px; width: 80%;">
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: "SIMPAN & MASUK",
      confirmButtonColor: "#faa61a",
      preConfirm: () => {
        const v = document.getElementById("p-force-admin").value;
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
      const result = await API.updatePassword(userData.id, hashed);

      if (result.success) {
        await Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Akses Admin diberikan.",
          background: "#2f3136",
          timer: 1500,
          showConfirmButton: false,
        });
        location.reload();
      } else {
        Swal.fire("Gagal", result.message, "error").then(() =>
          this.forceChangePassword(userData)
        );
      }
    }
  },

  setupGlobalEvents(logoutFn) {
    window.logout = logoutFn;

    const sidebar = document.getElementById("sidebar");
    const mainWrapper = document.getElementById("mainWrapper");
    const toggleBtn = document.getElementById("toggleBtn"); // Desktop
    const mobileTrigger = document.getElementById("mobileTrigger"); // Mobile

    // 1. Handler Desktop (Collapse)
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        sidebar.classList.toggle("collapsed");
        mainWrapper.classList.toggle("expanded");
      };
    }

    // 2. Handler Mobile (Slide Open)
    if (mobileTrigger) {
      mobileTrigger.onclick = (e) => {
        e.stopPropagation(); // Mencegah bubbling
        sidebar.classList.toggle("open");
      };
    }

    // 3. Auto-Close & Click Outside (Mobile)
    document.addEventListener("click", (e) => {
      if (window.innerWidth <= 768) {
        const isClickInsideSidebar = sidebar.contains(e.target);
        const isClickOnTrigger =
          mobileTrigger && mobileTrigger.contains(e.target);

        // Tutup jika klik menu-item ATAU klik di luar sidebar saat terbuka
        if (
          e.target.closest(".menu-item") ||
          (!isClickInsideSidebar && !isClickOnTrigger)
        ) {
          sidebar.classList.remove("open");
        }
      }
    });
  },
};
