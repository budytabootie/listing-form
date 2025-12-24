export const KatalogPage = {
    render: () => `
        <h2>Katalog Barang Master</h2>
        <p style="color: #b9bbbe; margin-bottom: 20px;">Daftarkan nama barang agar muncul di pilihan Stok & Listing.</p>
        
        <div style="background: #2f3136; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; align-items: end;">
                <div>
                    <label style="margin-top:0">Nama Barang</label>
                    <input type="text" id="katNama" placeholder="Contoh: Vest Merah">
                </div>
                <div>
                    <label style="margin-top:0">Jenis / Kategori</label>
                    <select id="katJenis">
                        <option value="Vest">Vest</option>
                        <option value="Ammo">Ammo</option>
                        <option value="Weapon">Weapon</option>
                        <option value="Attachment">Attachment</option>
                    </select>
                </div>
                <button id="btnSaveKatalog" style="width: auto; margin: 0; padding: 10px 20px;">Tambah Katalog</button>
            </div>
        </div>

        <div style="background: #2f3136; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #202225; text-align: left;">
                        <th style="padding: 15px;">Nama Barang</th>
                        <th style="padding: 15px;">Jenis</th>
                        <th style="padding: 15px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="katalogTableBody"></tbody>
            </table>
        </div>
    `,
    init: async (supabase) => {
        const loadKatalog = async () => {
            const { data } = await supabase.from('katalog_barang').select('*').order('jenis_barang');
            document.getElementById('katalogTableBody').innerHTML = data.map(item => `
                <tr style="border-bottom: 1px solid #23272a;">
                    <td style="padding: 15px;">${item.nama_barang}</td>
                    <td style="padding: 15px;"><span class="badge user">${item.jenis_barang}</span></td>
                    <td style="padding: 15px; text-align: center;">
                        <button onclick="deleteKatalog('${item.id}')" style="background:#ed4245; padding:5px 10px; width:auto;">Hapus</button>
                    </td>
                </tr>
            `).join('');
        };

        document.getElementById('btnSaveKatalog').onclick = async () => {
            const nama = document.getElementById('katNama').value;
            const jenis = document.getElementById('katJenis').value;
            if(!nama) return;
            
            const { error } = await supabase.from('katalog_barang').insert([{ nama_barang: nama, jenis_barang: jenis }]);
            if(error) return Swal.fire('Error', 'Barang sudah ada!', 'error');
            
            document.getElementById('katNama').value = '';
            loadKatalog();
        };

        window.deleteKatalog = async (id) => {
            await supabase.from('katalog_barang').delete().eq('id', id);
            loadKatalog();
        };

        loadKatalog();
    }
};