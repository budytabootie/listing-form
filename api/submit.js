require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Metode tidak diizinkan" });
  }

  const { nama, rank, tipe, subTipe, itemDetail, totalHarga } = req.body;

  if (!nama || !rank || !tipe) {
    return res.status(400).json({ success: false, message: "Lengkapi data!" });
  }

  let mentionUser = nama; // Ini untuk notifikasi ping

  try {
    const { data: member } = await supabase
      .from("members")
      .select("discord_id")
      .eq("nama", nama)
      .maybeSingle();

    if (member && member.discord_id) {
      mentionUser = `<@${member.discord_id}>`;
    }

    let targetWebhook = process.env.DISCORD_WEBHOOK_URL;
    let embedColor = 0x2ecc71;
    let finalDetail = itemDetail;

    if (tipe === "Non Bundling") {
      if (subTipe === "Vest ammo weapon") {
        targetWebhook = process.env.WEBHOOK_VEST_AMMO;
        embedColor = 0xe74c3c;
      } else if (subTipe === "Attachment") {
        targetWebhook = process.env.WEBHOOK_ATTACHMENT;
        embedColor = 0x3498db;
      }
    } else if (tipe === "Bundling") {
      // Ambil deskripsi terbaru dari database
      const { data: paket } = await supabase
        .from("master_paket")
        .select("deskripsi_isi")
        .eq("nama_paket", subTipe)
        .maybeSingle();

      finalDetail = paket
        ? paket.deskripsi_isi
        : "Detail paket tidak ditemukan";
    }

    if (!targetWebhook) {
      return res
        .status(500)
        .json({ success: false, message: "Webhook URL missing." });
    }

    const response = await fetch(targetWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Bagian Luar: Tetap pakai mentionUser agar ada bunyi notif/ping
        content: `🔔 Laporan baru dari ${mentionUser}!`,
        embeds: [
          {
            title: "🛒 New Listing Order",
            description: `Laporan masuk untuk member: **${nama}**`,
            color: embedColor,
            fields: [
              // Bagian Dalam: Pakai 'nama' (teks asli) agar tampilan rapi
              { name: "👤 Nama", value: nama, inline: true },
              { name: "🎖️ Rank", value: rank, inline: true },
              {
                name: "📦 Category",
                value: `${tipe} > ${subTipe}`,
                inline: true,
              },
              {
                name: "📝 Items Detail",
                value: `\`\`\`${finalDetail}\`\`\``,
                inline: false,
              },
              {
                name: "💰 Total Tagihan",
                value: `**${totalHarga || "$0"}**`,
                inline: false,
              },
            ],
            footer: { text: `Nakama MC | Category: ${subTipe}` },
            timestamp: new Date(),
          },
        ],
      }),
    });

    if (response.ok) {
      return res
        .status(200)
        .json({ success: true, message: "Berhasil dikirim!" });
    } else {
      const errText = await response.text();
      return res
        .status(response.status)
        .json({ success: false, message: "Discord Error", detail: errText });
    }
  } catch (error) {
    console.error("Server Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
