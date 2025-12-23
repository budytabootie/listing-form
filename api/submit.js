module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Metode tidak diizinkan" });
  }

  const { nama, rank, tipe, subTipe, itemDetail, jumlah } = req.body;

  // 1. Validasi Input Dasar
  if (!nama || !rank || !tipe) {
    return res.status(400).json({ success: false, message: "Lengkapi data Nama, Rank, dan Tipe!" });
  }

  // 2. Tentukan Webhook URL berdasarkan subTipe
  let targetWebhook = process.env.DISCORD_WEBHOOK_URL; // Default/Bundling

  if (subTipe === "Vest ammo weapon") {
    targetWebhook = process.env.WEBHOOK_VEST_AMMO;
  } else if (subTipe === "Attachment") {
    targetWebhook = process.env.WEBHOOK_ATTACHMENT;
  }

  // Cek apakah webhook tersedia
  if (!targetWebhook) {
    return res.status(500).json({ success: false, message: "Konfigurasi Webhook server belum diatur." });
  }

  try {
    const response = await fetch(targetWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "🛒 New Listing Order",
            color: subTipe === "Attachment" ? 0x3498db : 0xe74c3c, // Biru untuk Attachment, Merah untuk Vest
            fields: [
              { name: "Nama", value: nama, inline: true },
              { name: "Rank", value: rank, inline: true },
              { name: "Category", value: `${tipe} > ${subTipe}`, inline: true },
              { name: "Items Detail", value: `\`\`\`${itemDetail}\`\`\``, inline: false },
              { name: "Quantity", value: String(jumlah), inline: true },
            ],
            footer: { text: `Sent via Listing Form | Category: ${subTipe}` },
            timestamp: new Date(),
          },
        ],
      }),
    });

    if (response.ok) {
      return res.status(200).json({ success: true, message: "Berhasil dikirim ke Channel Discord!" });
    } else {
      return res.status(response.status).json({ success: false, message: "Gagal mengirim ke Discord." });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error Server.", error: error.message });
  }
};