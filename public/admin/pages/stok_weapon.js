/** @param {any} supabase */
export const StokWeaponPage = {
    render: () => `
        <h2>Weapon Warehouse (Serialized)</h2>
        <p style="color: #b9bbbe; margin-bottom: 20px;">Input senjata berdasarkan Serial Number unik.</p>
        
        <div style="background: #2f3136; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; align-items: end;">
                <div>
                    <label style="margin-top:0">Pilih Senjata</label>
                    <select id="weapNameSelect"></select>
                </div>
                <div>
                    <label style="margin-top:0">Serial Number (SN)</label>
                    <input type="text" id="weapSN" placeholder="Contoh: SN-12345">
                </div>
                <button id="btnSaveWeapon" style="width: auto; margin: 0; padding: 10px 20px;">Tambah Senjata</button>
            </div>
        </div>

        <div id="weaponSummary" style="display:flex; gap:10px; margin-bottom:20px;"></div>

        <div style="background: #2f3136; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #202225; text-align: left;">
                        <th style="padding: 15px;">Nama Senjata</th>
                        <th style="padding: 15px;">Serial Number</th>
                        <th style="padding: 15px;">Status</th>
                        <th style="padding: 15px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody id="weaponTableBody"></tbody>
            </table>
        </div>
    `,
    init: async (supabase) => {
        const loadKatalog = async () => {
            const { data } = await supabase.from('katalog_barang').select('nama_barang').eq('jenis_barang', 'Weapon');
            const select = document.getElementById('weapNameSelect');
            if (select) {
                if (data && data.length > 0) {
                    select.innerHTML = data.map((/** @type {{ nama_barang: any; }} */ w) => `<option value="${w.nama_barang}">${w.nama_barang}</option>`).join('');
                } else {
                    select.innerHTML = `<option value="">Tambah senjata di Katalog dulu!</option>`;
                }
            }
        };

        const loadWeapons = async () => {
            const { data } = await supabase.from('inventory_weapons').select('*').order('created_at', { ascending: false });
            const tableBody = document.getElementById('weaponTableBody');
            const summaryDiv = document.getElementById('weaponSummary');

            if (data) {
                // Memberitahu VS Code bahwa summary adalah objek yang kuncinya string dan nilainya angka
                /** @type {Record<string, number>} */
                const summary = {};
                
                data.forEach((/** @type {any} */ w) => {
                    if (w.status === 'Tersedia') {
                        // Sekarang VS Code tahu ini aman
                        summary[w.weapon_name] = (summary[w.weapon_name] || 0) + 1;
                    }
                });

                if (summaryDiv) {
                    summaryDiv.innerHTML = Object.entries(summary).map(([name, qty]) => `
                        <div style="background:#5865F2; padding:10px 15px; border-radius:5px; font-size:0.8rem;">
                            <b>${name}</b>: ${qty} Unit
                        </div>
                    `).join('');
                }

                if (tableBody) {
                    tableBody.innerHTML = data.map((/** @type {any} */ w) => `
                        <tr style="border-bottom: 1px solid #23272a;">
                            <td style="padding: 15px;">${w.weapon_name}</td>
                            <td style="padding: 15px;"><code>${w.serial_number}</code></td>
                            <td style="padding: 15px;"><span class="badge ${w.status === 'Tersedia' ? 'user' : 'admin'}">${w.status}</span></td>
                            <td style="padding: 15px; text-align: center;">
                                <button class="btn-del-weapon" data-id="${w.id}" style="background:#ed4245; padding:5px 10px; width:auto;">Hapus</button>
                            </td>
                        </tr>
                    `).join('');

                    // Event listener tetap sama
                    document.querySelectorAll('.btn-del-weapon').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const id = btn.getAttribute('data-id');
                            const { isConfirmed } = await Swal.fire({
                                title: 'Hapus Senjata?',
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#ed4245',
                                background: '#1e1e1e', color: '#fff'
                            });
                            if (isConfirmed && id) {
                                await supabase.from('inventory_weapons').delete().eq('id', id);
                                loadWeapons();
                            }
                        });
                    });
                }
            }
        };

        const saveBtn = document.getElementById('btnSaveWeapon');
        if (saveBtn) {
            saveBtn.onclick = async () => {
                const nameEl = /** @type {HTMLSelectElement} */ (document.getElementById('weapNameSelect'));
                const snEl = /** @type {HTMLInputElement} */ (document.getElementById('weapSN'));
                
                if (!nameEl || !snEl || !snEl.value) return;

                const { error } = await supabase.from('inventory_weapons').insert([{ 
                    weapon_name: nameEl.value, 
                    serial_number: snEl.value 
                }]);

                if (error) return Swal.fire('Error', 'SN sudah terdaftar!', 'error');

                snEl.value = '';
                loadWeapons();
            };
        }

        await loadKatalog();
        await loadWeapons();
    }
};