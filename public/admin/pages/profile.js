/** @param {any} supabase */
export const AdminProfile = {
  render: () => `
        <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: white; margin-bottom: 25px;"><i class="fas fa-user-circle"></i> My Profile</h2>
            
            <div style="background: #2f3136; padding: 25px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #40444b;">
                <h4 style="color: #fff; margin-top: 0;">Informasi Akun</h4>
                <div style="margin-top: 20px; display: grid; gap: 15px;">
                    <div>
                        <label style="color: #b9bbbe; display: block; margin-bottom: 8px; font-size: 0.75rem; font-weight: bold;">NAMA LENGKAP</label>
                        <input type="text" id="profileDisplayName" style="width: 100%; padding: 12px; background: #202225; border: 1px solid #202225; color: #8e9297; border-radius: 6px;" readonly placeholder="Loading...">
                    </div>
                    <div>
                        <label style="color: #b9bbbe; display: block; margin-bottom: 8px; font-size: 0.75rem; font-weight: bold;">USERNAME</label>
                        <input type="text" id="profileUsername" style="width: 100%; padding: 12px; background: #202225; border: 1px solid #4f545c; color: white; border-radius: 6px;" placeholder="Loading...">
                    </div>
                    <button id="btnUpdateUsername" style="background: #5865f2; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                        Update Username
                    </button>
                </div>
            </div>

            <div style="background: #2f3136; padding: 25px; border-radius: 12px; border: 1px solid #40444b;">
                <h4 style="color: #fff; margin-top: 0;">Ganti Password</h4>
                <div style="margin-top: 20px;">
                    <input type="password" id="profileNewPassword" style="width: 100%; padding: 12px; background: #202225; border: 1px solid #4f545c; color: white; border-radius: 6px; margin-bottom: 15px;" placeholder="Password baru">
                    <input type="password" id="profileConfirmPassword" style="width: 100%; padding: 12px; background: #202225; border: 1px solid #4f545c; color: white; border-radius: 6px;" placeholder="Konfirmasi password baru">
                    
                    <button id="btnUpdatePassword" style="margin-top: 20px; background: #faa61a; color: #000; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%;">
                        Update Password Sekarang
                    </button>
                </div>
            </div>
        </div>
    `,

  init: async (supabase) => {
    try {
      let sessionData = JSON.parse(localStorage.getItem("nmc_session"));
      const token = localStorage.getItem("sessionToken");

      // Jika nmc_session hilang tapi token ada, ambil ulang dari DB
      if (!sessionData && token) {
        const { data: sess } = await supabase
          .from("user_sessions")
          .select("user_id, users_login(username, role_id)")
          .eq("token", token)
          .single();

        if (sess) {
          sessionData = {
            id: sess.user_id,
            username: sess.users_login.username,
          };
          localStorage.setItem("nmc_session", JSON.stringify(sessionData));
        }
      }

      if (!sessionData || !sessionData.id) {
        return Swal.fire("Session Missing", "Silakan login ulang", "error");
      }

      const userId = sessionData.id;

      // 1. Load Data User
      const { data: user, error: fetchError } = await supabase
        .from("users_login")
        .select("nama_lengkap, username")
        .eq("id", userId)
        .maybeSingle();

      if (user) {
        document.getElementById("profileDisplayName").value =
          user.nama_lengkap || "No Name";
        document.getElementById("profileUsername").value = user.username || "";
      }

      // 2. Event Update Username
      document.getElementById("btnUpdateUsername").onclick = async () => {
        const newUsername = document
          .getElementById("profileUsername")
          .value.trim();
        if (!newUsername)
          return Swal.fire("Error", "Username wajib diisi", "error");

        const { error } = await supabase
          .from("users_login")
          .update({ username: newUsername })
          .eq("id", userId);

        if (error) {
          Swal.fire("Gagal", "Username sudah digunakan", "error");
        } else {
          // Update session lokal agar tetap sinkron
          sessionData.username = newUsername;
          localStorage.setItem("nmc_session", JSON.stringify(sessionData));
          Swal.fire("Berhasil", "Username diperbarui", "success");
        }
      };

      // 3. Event Update Password
      // Cari bagian document.getElementById("btnUpdatePassword").onclick dan ganti isinya:

      document.getElementById("btnUpdatePassword").onclick = async () => {
        const newPass = document.getElementById("profileNewPassword").value;
        const confirmPass = document.getElementById(
          "profileConfirmPassword"
        ).value;

        if (!newPass || newPass.length < 6)
          return Swal.fire("Error", "Minimal 6 karakter", "error");
        if (newPass !== confirmPass)
          return Swal.fire("Error", "Password tidak cocok", "error");

        Swal.fire({
          title: "Memproses...",
          background: "#2f3136",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // GUNAKAN FUNGSI API (Satu pintu ke admin-actions)
        // Pastikan file API sudah di-import di atas (import { API } from '../api.js')
        const result = await API.updatePassword(userId, newPass);

        // PROSES ENKRIPSI SHA256
        const hashedNewPass = CryptoJS.SHA256(newPass).toString();

        const { error: updateError } = await supabase
          .from("users_login")
          .update({
            password: hashedNewPass,
            is_encrypted: true, // Sekarang diubah ke true
          })
          .eq("id", userId);

        if (updateError) {
          Swal.fire("Gagal", updateError.message, "error");
        } else {
          await Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "Password diperbarui. Silakan login kembali.",
            background: "#2f3136",
            color: "#fff",
          });
          localStorage.clear();
          window.location.href = "/login.html";
        }
      };
    } catch (err) {
      console.error("Profile Error:", err);
    }
  },
};
