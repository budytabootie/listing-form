/** @param {any} supabase */
export const LogsPage = {
  render: () => `
        <div class="header-container">
            <h2>Activity Logs</h2>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <select id="filterAction" style="background: #2f3136; color: white; border: 1px solid #444; padding: 5px 10px; border-radius: 6px; cursor:pointer;">
                    <option value="ALL">Semua Aksi</option>
                    <option value="APPROVE">APPROVE</option>
                    <option value="REJECT">REJECT</option>
                    <option value="CREATE">CREATE</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="DELETE">DELETE</option>
                    <option value="LOGIN">LOGIN</option>
                    <option value="LOGOUT">LOGOUT</option>
                </select>
                <button id="refreshLogs" style="background: #5865f2; color: white; border: none; padding: 5px 15px; border-radius: 6px; cursor: pointer; font-weight:bold;">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
        </div>
        <div style="background: #2f3136; border-radius: 12px; padding: 20px; border: 1px solid #444; margin-top: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; color: #eee; min-width: 600px;">
                    <thead>
                        <tr style="text-align: left; border-bottom: 2px solid #444; color: #b9bbbe; font-size: 0.8rem; text-transform: uppercase;">
                            <th style="padding: 12px;">Waktu</th>
                            <th style="padding: 12px;">User</th>
                            <th style="padding: 12px;">Aksi</th>
                            <th style="padding: 12px;">Tabel</th>
                            <th style="padding: 12px;">Deskripsi</th>
                        </tr>
                    </thead>
                    <tbody id="logsTableBody"></tbody>
                </table>
            </div>
        </div>
    `,

  init: async (supabase) => {
    const tbody = document.getElementById("logsTableBody");
    const filterAction = document.getElementById("filterAction");
    const refreshBtn = document.getElementById("refreshLogs");

    const loadLogs = async () => {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#b9bbbe;">Memuat data logs...</td></tr>`;

      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filterAction.value !== "ALL") {
        query = query.eq("action", filterAction.value);
      }

      const { data, error } = await query;

      if (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:#ed4245; text-align:center; padding:20px;">Error: ${error.message}</td></tr>`;
        return;
      }

      if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#b9bbbe;">Tidak ada aktivitas ditemukan.</td></tr>`;
        return;
      }

      tbody.innerHTML = data
        .map((log) => {
          const date = new Date(log.created_at).toLocaleString("id-ID");

          // Warna label berdasarkan jenis aksi
          const colors = {
            APPROVE: "#43b581",
            REJECT: "#ed4245",
            CREATE: "#43b581",
            UPDATE: "#5865f2",
            DELETE: "#ff4757",
            LOGIN: "#faa61a",
            LOGOUT: "#747f8d",
          };
          const actionColor = colors[log.action] || "#eee";

          return `
                <tr style="border-bottom: 1px solid #36393f; font-size: 0.85rem; transition: background 0.2s;" onmouseover="this.style.background='#32353b'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 12px; color: #b9bbbe; white-space: nowrap;">${date}</td>
                    <td style="padding: 12px; font-weight: 600; color: #fff;">${
                      log.username || "System"
                    }</td>
                    <td style="padding: 12px;">
                        <span style="background: ${actionColor}22; color: ${actionColor}; padding: 3px 10px; border-radius: 4px; font-weight: bold; font-size: 0.7rem; border: 1px solid ${actionColor}44; display: inline-block;">
                            ${log.action}
                        </span>
                    </td>
                    <td style="padding: 12px; color: #b9bbbe; font-family: monospace;">${
                      log.table_name || "-"
                    }</td>
                    <td style="padding: 12px; color: #dcddde; line-height: 1.4;">${
                      log.description
                    }</td>
                </tr>
            `;
        })
        .join("");
    };

    filterAction.onchange = loadLogs;
    refreshBtn.onclick = loadLogs;
    loadLogs();
  },
};
