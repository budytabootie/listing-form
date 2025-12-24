export const UsersPage = {
    render: () => `
        <h2>User Management</h2>
        <p style="color: #b9bbbe; margin-bottom: 20px;">Kelola akun login untuk akses Portal Nakama.</p>
        
        <div style="background: #2f3136; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4>Tambah Akun Baru</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; gap: 10px; margin-top: 10px; align-items: end;">
                <div>
                    <label style="margin-top:0">Nama Lengkap</label>
                    <input type="text" id="addFullName" placeholder="Contoh: Budi Santoso">
                </div>
                <div>
                    <label style="margin-top:0">Username</label>
                    <input type="text" id="addUsername" placeholder="budi_nakama">
                </div>
                <div>
                    <label style="margin-top:0">Password</label>
                    <input type="password" id="addPassword" placeholder="******">
                </div>
                <div>
                    <label style="margin-top:0">Role</label>
                    <select id="addRole">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <button id="btnCreateUser" style="width: auto; margin: 0; padding: 10px 20px;">Buat Akun</button>
            </div>
        </div>

        <div style="background: #2f3136; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #202225; text-align: left;">
                        <th style="padding: 15px;">Nama Lengkap</th>
                        <th style="padding: 15px;">Username</th>
                        <th style="padding: 15px;">Role</th>
                        <th style="padding: 15px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="userTableBody"></tbody>
            </table>
        </div>
    `,
    init: async (supabase) => {
        const tableBody = document.getElementById('userTableBody');

        const loadUsers = async () => {
            const { data, error } = await supabase
                .from('users_login')
                .select('*')
                .order('nama_lengkap');
            
            if (error) return console.error(error);

            tableBody.innerHTML = data.map(user => `
                <tr style="border-bottom: 1px solid #23272a;">
                    <td style="padding: 15px;">${user.nama_lengkap}</td>
                    <td style="padding: 15px;"><code>${user.username}</code></td>
                    <td style="padding: 15px;"><span class="badge ${user.role}">${user.role}</span></td>
                    <td style="padding: 15px; text-align: center;">
                        <button class="btn-delete-user" data-id="${user.id}" style="background:#ed4245; padding:5px 10px; width:auto;">Hapus</button>
                    </td>
                </tr>
            `).join('');

            // Event Hapus
            document.querySelectorAll('.btn-delete-user').forEach(btn => {
                btn.onclick = async () => {
                    const id = btn.dataset.id;
                    const { isConfirmed } = await Swal.fire({
                        title: 'Hapus Akun?',
                        text: "User ini tidak akan bisa login lagi!",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#ed4245',
                        background: '#1e1e1e', color: '#fff'
                    });

                    if (isConfirmed) {
                        await supabase.from('users_login').delete().eq('id', id);
                        loadUsers();
                    }
                };
            });
        };

        // Event Tambah
        document.getElementById('btnCreateUser').onclick = async () => {
            const nama_lengkap = document.getElementById('addFullName').value;
            const username = document.getElementById('addUsername').value;
            const password = document.getElementById('addPassword').value;
            const role = document.getElementById('addRole').value;

            if (!nama_lengkap || !username || !password) {
                return Swal.fire({ icon: 'error', title: 'Oops...', text: 'Isi semua field!' });
            }

            const { error } = await supabase
                .from('users_login')
                .insert([{ nama_lengkap, username, password, role }]);

            if (error) {
                Swal.fire({ icon: 'error', title: 'Gagal', text: error.message });
            } else {
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Akun telah dibuat!' });
                loadUsers();
                // Reset form
                document.getElementById('addFullName').value = '';
                document.getElementById('addUsername').value = '';
                document.getElementById('addPassword').value = '';
            }
        };

        loadUsers();
    }
};