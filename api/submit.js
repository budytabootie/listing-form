module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Metode tidak diizinkan" });
  }

  const { nama, rank, tipe, subTipe, itemDetail, jumlah } = req.body;

  // Validasi Input: jumlah boleh absen jika tipe adalah Non Bundling
  if (!nama || !rank || !tipe) {
    return res
      .status(400)
      .json({ success: false, message: "Lengkapi data Nama, Rank, dan Tipe!" });
  }

  // Tambahan validasi: Jika Bundling, jumlah harus diisi
  if (tipe === "Bundling" && (!jumlah || jumlah === "0")) {
    return res
      .status(400)
      .json({ success: false, message: "Masukkan jumlah paket bundling!" });
  }

  try {
    const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "🛒 New Listing Order",
            color: 0x00ff00,
            fields: [
              { name: "Nama", value: nama, inline: true },
              { name: "Rank", value: rank, inline: true },
              { name: "Category", value: `${tipe} > ${subTipe}`, inline: true },
              { name: "Items", value: itemDetail, inline: false }, // Menampilkan hasil checkbox
              { name: "Quantity", value: String(jumlah), inline: true },
            ],
            footer: { text: "Sent via Listing Form Web" },
            timestamp: new Date(),
          },
        ],
      }),
    });

    if (response.ok) {
      // 2. Respon Sukses
      return res.status(200).json({
        success: true,
        message: "Data berhasil dikirim ke server Discord!",
      });
    } else {
      // 3. Respon Gagal dari Discord (misal 404 atau 401)
      return res.status(response.status).json({
        success: false,
        message: "Gagal mengirim ke Discord. Cek Webhook URL kamu.",
      });
    }
  } catch (error) {
    // 4. Respon Error Server
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
      error: error.message,
    });
  }
};
