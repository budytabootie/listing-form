module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Metode tidak diizinkan" });
  }

  const { nama, rank, tipe, subTipe, itemDetail, jumlah } = req.body;

  if (!nama || !rank || !tipe) {
    return res.status(400).json({ success: false, message: "Lengkapi data Nama, Rank, dan Tipe!" });
  }

  // 1. Tentukan Webhook URL & Warna
  let targetWebhook = process.env.DISCORD_WEBHOOK_URL;
  let embedColor = 0x00ff00; // Default Hijau (Bundling)
  let finalDetail = itemDetail;

  if (tipe === "Non Bundling") {
    if (subTipe === "Vest ammo weapon") {
      targetWebhook = process.env.WEBHOOK_VEST_AMMO;
      embedColor = 0xe74c3c; // Merah
    } else if (subTipe === "Attachment") {
      targetWebhook = process.env.WEBHOOK_ATTACHMENT;
      embedColor = 0x3498db; // Biru
    }
  } else if (tipe === "Bundling") {
    // 2. Isi Detail Statis berdasarkan Paket
    const infoPaket = {
      "Paket A": "Isi: Vest Merah x5 , Ammo 9mm x5 BOX | PRICE : $21.000",
      "Paket B": "Isi: Vest Merah x10, Ammo 9mm x10 BOX | PRICE : $40.000",
      "Paket C": "Isi: Vest Merah x15, Ammo 9mm x15 BOX | PRICE : $58.000",
      "Paket D": "Isi: Vest Merah x20, Ammo 9mm x20 BOX | PRICE : $74.000"
    };
    finalDetail = infoPaket[subTipe] || "Detail paket tidak ditemukan";
  }

  if (!targetWebhook) {
    return res.status(500).json({ success: false, message: "Konfigurasi Webhook belum diatur." });
  }

  // 3. Susun Field (Quantity hanya muncul jika bukan Non Bundling)
  const fields = [
    { name: "Nama", value: nama, inline: true },
    { name: "Rank", value: rank, inline: true },
    { name: "Category", value: `${tipe} > ${subTipe}`, inline: true },
    { name: "Items Detail", value: `\`\`\`${finalDetail}\`\`\``, inline: false },
  ];

  // Tambahkan Quantity hanya jika Bundling
  if (tipe === "Bundling") {
    fields.push({ name: "Quantity", value: String(jumlah), inline: true });
  }

  try {
    const response = await fetch(targetWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "🛒 New Listing Order",
            color: embedColor,
            fields: fields,
            footer: { text: `Sent via Listing Form | Category: ${subTipe}` },
            timestamp: new Date(),
          },
        ],
      }),
    });

    if (response.ok) {
      return res.status(200).json({ success: true, message: "Berhasil dikirim ke Discord!" });
    } else {
      return res.status(response.status).json({ success: false, message: "Gagal mengirim ke Discord." });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error Server.", error: error.message });
  }
};