export const MembersPage = {
    render: () => `
        <h2>Member Management</h2>
        <div style="background: #2f3136; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4>Tambah Member Baru</h4>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <input type="text" id="newMemberName" placeholder="Nama Member">
                <select id="newMemberRank" style="width: 200px;">
                    <option value="Prospect">Prospect</option>
                    <option value="Tail Gunner">Tail Gunner</option>
                    <option value="Life Member">Life Member</option>
                    <option value="High Rank">High Rank</option>
                </select>
                <button id="btnAddMember" style="width: auto; margin-top: 8px;">Tambah</button>
            </div>
        </div>
        <div style="background: #2f3136; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #202225; text-align: left;">
                        <th style="padding: 15px;">Nama Member</th>
                        <th style="padding: 15px;">Rank</th>
                        <th style="padding: 15px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="memberTableBody"></tbody>
            </table>
        </div>
    `,
    init: async (supabase) => {
        const loadMembers = async () => {
            const { data } = await supabase.from('members').select('*').order('nama');
            document.getElementById('memberTableBody').innerHTML = data.map(m => `
                <tr style="border-bottom: 1px solid #23272a;">
                    <td style="padding: 15px;">${m.nama}</td>
                    <td style="padding: 15px;">${m.rank}</td>
                    <td style="padding: 15px; text-align: center;">
                        <button class="btn-delete" data-id="${m.id}" style="background:#ed4245; padding:5px 10px; width:auto;">Hapus</button>
                    </td>
                </tr>
            `).join('');
            
            // Re-bind delete events
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.onclick = async () => {
                    const id = btn.dataset.id;
                    const { isConfirmed } = await Swal.fire({ title: 'Hapus?', icon: 'warning', showCancelButton: true });
                    if (isConfirmed) {
                        await supabase.from('members').delete().eq('id', id);
                        loadMembers();
                    }
                };
            });
        };

        document.getElementById('btnAddMember').onclick = async () => {
            const nama = document.getElementById('newMemberName').value;
            const rank = document.getElementById('newMemberRank').value;
            await supabase.from('members').insert([{ nama, rank }]);
            loadMembers();
        };

        loadMembers();
    }
};