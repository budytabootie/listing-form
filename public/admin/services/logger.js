/**
 * @param {any} supabase - Instance Supabase
 */
export const Logger = {
  /**
   * @param {string} action - Contoh: 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'
   * @param {string} tableName - Nama tabel yang diubah (stok, members, dll)
   * @param {string} details - Deskripsi detail perubahannya
   * @param {object} userData - Objek user dari session (id, nama_lengkap)
   */
  log: async (supabase, action, tableName, details, userData) => {
    try {
      const { error } = await supabase.from("audit_logs").insert([
        {
          action_type: action,
          target_table: tableName,
          description: details,
          admin_id: userData.id,
          admin_name: userData.nama_lengkap,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      console.log(`[AuditLog] ${action} on ${tableName} recorded.`);
    } catch (err) {
      console.error("Gagal mencatat Audit Log:", err.message);
    }
  },
};
