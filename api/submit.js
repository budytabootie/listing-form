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

  // Menangkap 'items' (Array) yang dikirim dari CartPage baru
  const { nama, userId, items, totalHarga } = req.body;

  if (!nama || !userId || !items || !Array.isArray(items)) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Data pesanan tidak lengkap atau format salah!",
      });
  }

  try {
    // 1. Ambil data Rank & Discord ID dari tabel members
    const { data: member } = await supabase
      .from("members")
      .select("rank, discord_id")
      .eq("nama", nama)
      .maybeSingle();

    const finalRank = member?.rank || "Member";
    const mentionUser = member?.discord_id ? `<@${member.discord_id}>` : nama;

    // 2. INSERT KE TABEL UTAMA (orders) - Sebagai Kepala Pesanan
    const { data: newOrder, error: dbError } = await supabase
      .from("orders")
      .insert([
        {
          requested_by: nama,
          total_price: totalHarga,
          status: "pending",
          rank: finalRank,
          notes: "", // Sekarang notes dikosongkan karena rincian pindah ke tabel item
          created_at: new Date().toISOString(),
          // item_name & item_type diisi summary singkat saja untuk fallback database lama
          item_name: items.map((i) => i.nama).join(", "),
          item_type: "Multi Items",
          quantity: items.reduce((sum, i) => sum + (i.qty || 1), 0),
        },
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    // 3. INSERT KE TABEL RINCIAN (order_items) - Memasukkan tiap barang secara terpisah
    const itemInserts = items.map((item) => ({
      order_id: newOrder.id, // Menghubungkan ke ID di tabel orders
      item_name: item.nama,
      item_type: item.kategori,
      quantity: item.qty || 1,
      price: `$${(item.harga * (item.qty || 1)).toLocaleString()}`,
      status: "pending",
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemInserts);

    if (itemsError) throw itemsError;

    // 4. GENERATE CUSTOM ORDER ID (Untuk Discord)
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, "0");
    const customOrderId = `NMC-${yy}${mm}-${now.getSeconds()}${now
      .getMilliseconds()
      .toString()
      .slice(0, 2)}`;

    // 5. LOGIKA WEBHOOK DISCORD
    const discordItemsDetail = items
      .map((i) => `- ${i.nama} (${i.qty}x)`)
      .join("\n");
    let targetWebhook = process.env.DISCORD_WEBHOOK_URL;
    let embedColor = 0x2ecc71; // Default Hijau

    // Kirim ke Discord
    await fetch(targetWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `🔔 Pesanan baru dari ${mentionUser}!`,
        embeds: [
          {
            title: "🛒 New Listing Order (Relational)",
            color: embedColor,
            fields: [
              {
                name: "🆔 Order ID",
                value: `**${customOrderId}**`,
                inline: true,
              },
              { name: "👤 Nama", value: nama, inline: true },
              { name: "🎖️ Rank", value: finalRank, inline: true },
              {
                name: "📝 Items Detail",
                value: `\`\`\`${discordItemsDetail}\`\`\``,
                inline: false,
              },
              {
                name: "💰 Total Tagihan",
                value: `**${totalHarga || "$0"}**`,
                inline: false,
              },
            ],
            footer: { text: `Nakama System | Status: PENDING` },
            timestamp: new Date(),
          },
        ],
      }),
    });

    return res.status(200).json({ success: true, orderId: customOrderId });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
