/** @param {any} supabase */
export const HistoryPage = {
  render: () => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
            <h2>Riwayat & Persetujuan Listing</h2>
            <div id="statBox" style="background:#2f3136; padding:10px 20px; border-radius:8px; border-left:4px solid #43b581;">
                <small style="color:#b9bbbe;">Total Omzet (Approved)</small>
                <div id="totalRevenue" style="color:#43b581; font-weight:bold; font-size:1.2rem;">$0</div>
            </div>
        </div>

        <div style="background: #2f3136; border-radius: 8px; overflow: hidden; border: 1px solid #40444b;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #202225; text-align: left;">
                        <th style="padding: 15px; font-size:0.8rem; color:#b9bbbe;">WAKTU</th>
                        <th style="padding: 15px; font-size:0.8rem; color:#b9bbbe;">MEMBER</th>
                        <th style="padding: 15px; font-size:0.8rem; color:#b9bbbe;">ITEM DETAIL</th>
                        <th style="padding: 15px; font-size:0.8rem; color:#b9bbbe;">TOTAL</th>
                        <th style="padding: 15px; font-size:0.8rem; color:#b9bbbe;">STATUS</th>
                        <th style="padding: 15px; font-size:0.8rem; color:#b9bbbe; text-align: center;">AKSI</th>
                    </tr>
                </thead>
                <tbody id="historyTableBody"></tbody>
            </table>
        </div>
    `,
  init: async (supabase) => {
    const tableBody = document.getElementById("historyTableBody");
    const totalRevEl = document.getElementById("totalRevenue");

    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("history_listing")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) return console.error(error);

      // Hitung Omzet Approved
      const revenue = data
        .filter((h) => h.status === "Approved")
        .reduce(
          (sum, h) =>
            sum + (parseInt(h.total_harga.replace(/[^0-9]/g, "")) || 0),
          0
        );
      totalRevEl.innerText = `$${revenue.toLocaleString()}`;

      tableBody.innerHTML = data
        .map((h) => {
          // Logika Warna Status
          let statusColor = "#faa61a"; // Pending
          if (h.status === "Approved") statusColor = "#43b581";
          if (h.status === "Rejected") statusColor = "#ed4245";

          return `
            <tr style="border-bottom: 1px solid #40444b; transition: 0.2s;" onmouseover="this.style.background='#36393f'" onmouseout="this.style.background='transparent'">
                <td style="padding: 15px; font-size: 0.8rem; color: #b9bbbe;">
                    ${new Date(h.created_at).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </td>
                <td style="padding: 15px;">
                    <div style="font-weight:bold; color:#fff;">${
                      h.nama_member
                    }</div>
                    <div style="font-size:0.75rem; color:#b9bbbe;">${
                      h.rank_member
                    }</div>
                </td>
                <td style="padding: 15px;">
                    <div style="background:#202225; padding:8px; border-radius:4px; font-size:0.8rem; font-family:monospace; color:#dcddde; white-space:pre-line;">${
                      h.item_detail
                    }</div>
                </td>
                <td style="padding: 15px; color: #43b581; font-weight: bold;">${
                  h.total_harga
                }</td>
                <td style="padding: 15px;">
                    <span style="color:${statusColor}; font-weight:bold; font-size:0.75rem; text-transform:uppercase; border:1px solid ${statusColor}44; padding:2px 6px; border-radius:4px; background:${statusColor}11;">
                        ${h.status}
                    </span>
                </td>
                <td style="padding: 15px; text-align: center;">
                    ${
                      h.status === "Pending"
                        ? `
                        <div style="display:flex; gap:5px; justify-content:center;">
                            <button class="btn-approve" data-id="${h.id}" style="background:#43b581; padding:5px 10px; width:auto; font-size:0.75rem;">Approve</button>
                            <button class="btn-reject" data-id="${h.id}" style="background:#ed4245; padding:5px 10px; width:auto; font-size:0.75rem;">Reject</button>
                        </div>
                    `
                        : `<small style="color:#72767d;">SELESAI</small>`
                    }
                </td>
            </tr>
        `;
        })
        .join("");

      // Listener Button Approve
      document.querySelectorAll(".btn-approve").forEach((btn) => {
        btn.onclick = () => updateStatus(btn.dataset.id, "Approved");
      });

      // Listener Button Reject
      document.querySelectorAll(".btn-reject").forEach((btn) => {
        btn.onclick = () => updateStatus(btn.dataset.id, "Rejected");
      });
    };

    const updateStatus = async (id, status) => {
      const color = status === "Approved" ? "#43b581" : "#ed4245";
      const text =
        status === "Approved"
          ? "Stok akan otomatis terpotong!"
          : "Laporan ini akan dibatalkan.";

      const { isConfirmed } = await Swal.fire({
        title: `Konfirmasi ${status}?`,
        text: text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: color,
        background: "#2f3136",
        color: "#fff",
      });

      if (isConfirmed) {
        const { error } = await supabase
          .from("history_listing")
          .update({ status: status })
          .eq("id", id);

        if (!error) {
          Swal.fire({
            icon: "success",
            title: `Status: ${status}`,
            timer: 1000,
            showConfirmButton: false,
          });
          loadHistory();
        }
      }
    };

    loadHistory();
  },
};
