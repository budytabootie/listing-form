/** @param {any} supabase */
export const AdminProfile = {
  render: () => `
        <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: white; margin-bottom: 25px;"><i class="fas fa-user-cog"></i> Account Settings</h2>
            
            <div style="background: #2f3136; padding: 25px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #40444b;">
                <h4 style="color: #fff; margin-top: 0;">Update Display Name</h4>
                <div style="margin-top: 15px;">
                    <label style="color: #b9bbbe; display: block; margin-bottom: 8px; font-size: 0.85rem;">DISPLAY NAME</label>
                    <input type="text" id="profileDisplayName" style="width: 100%; padding: 10px; background: #202225; border: 1px solid #202225; color: white; border-radius: 4px;" placeholder="Masukkan Nama Baru">
                    <button id="btnUpdateName" style="margin-top: 15px; background: #5865f2; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%;">
                        Save Changes
                    </button>
                </div>
            </div>

            <div style="background: #2f3136; padding: 25px; border-radius: 12px; border: 1px solid #40444b;">
                <h4 style="color: #fff; margin-top: 0;">Security Settings</h4>
                <div style="margin-top: 15px;">
                    <label style="color: #b9bbbe; display: block; margin-bottom: 8px; font-size: 0.85rem;">NEW PASSWORD</label>
                    <input type="password" id="profileNewPassword" style="width: 100%; padding: 10px; background: #202225; border: 1px solid #202225; color: white; border-radius: 4px;" placeholder="Minimal 6 karakter">
                    
                    <label style="color: #b9bbbe; display: block; margin: 15px 0 8px 0; font-size: 0.85rem;">CONFIRM NEW PASSWORD</label>
                    <input type="password" id="profileConfirmPassword" style="width: 100%; padding: 10px; background: #202225; border: 1px solid #202225; color: white; border-radius: 4px;" placeholder="Ulangi password">
                    
                    <button id="btnUpdatePassword" style="margin-top: 20px; background: #faa61a; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%;">
                        Update Password
                    </button>
                </div>
            </div>
        </div>
    `,

  init: async (supabase) => {
    // Ambil data user yang sedang login
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const nameInput = document.getElementById("profileDisplayName");
      if (nameInput)
        nameInput.value =
          user.user_metadata?.full_name || user.email.split("@")[0];
    }

    // Event Update Nama
    document.getElementById("btnUpdateName").onclick = async () => {
      const newName = document.getElementById("profileDisplayName").value;
      if (!newName)
        return Swal.fire("Error", "Nama tidak boleh kosong", "error");

      const { error } = await supabase.auth.updateUser({
        data: { full_name: newName },
      });

      if (error) Swal.fire("Gagal", error.message, "error");
      else Swal.fire("Berhasil", "Nama profil diperbarui", "success");
    };

    // Event Update Password
    document.getElementById("btnUpdatePassword").onclick = async () => {
      const newPass = document.getElementById("profileNewPassword").value;
      const confirmPass = document.getElementById(
        "profileConfirmPassword"
      ).value;

      if (newPass.length < 6)
        return Swal.fire("Error", "Password minimal 6 karakter", "error");
      if (newPass !== confirmPass)
        return Swal.fire("Error", "Konfirmasi password tidak cocok", "error");

      const { error } = await supabase.auth.updateUser({
        password: newPass,
      });

      if (error) {
        Swal.fire("Gagal", error.message, "error");
      } else {
        Swal.fire("Berhasil", "Password telah diperbarui", "success");
        document.getElementById("profileNewPassword").value = "";
        document.getElementById("profileConfirmPassword").value = "";
      }
    };
  },
};
