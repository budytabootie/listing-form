require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Metode tidak diizinkan" });
  }

  const { nama, userId, items, totalHarga } = req.body;

  if (!nama || !userId || !items || !Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      message: "Data pesanan tidak lengkap atau format salah!",
    });
  }

  try {
    const { data: member } = await supabase
      .from("members")
      .select("rank, discord_id")
      .eq("nama", nama)
      .maybeSingle();

    const finalRank = member?.rank || "Member";
    const mentionUser = member?.discord_id ? `<@${member.discord_id}>` : nama;

    // 2. INSERT KE TABEL UTAMA (orders)
    const { data: newOrder, error: dbError } = await supabase
      .from("orders")
      .insert([
        {
          requested_by: nama,
          total_price: parseInt(totalHarga.replace(/[^\d]/g, "")) || 0,
          status: "pending",
          rank: finalRank,
          created_at: new Date().toISOString(),
          item_name:
            items.length > 1
              ? `${items[0].nama} (+${items.length - 1} lainnya)`
              : items[0].nama,
          item_type:
            items.length > 1
              ? "MULTI ITEMS"
              : items[0].kategori === "Bundling"
                ? "Bundling"
                : items[0].kategori || "General",
          quantity: items.reduce((sum, i) => sum + (i.qty || 1), 0),
        },
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    // 3. INSERT KE TABEL RINCIAN (order_items)
    const itemInserts = items.map((item) => {
      // Pastikan harga adalah angka murni
      const hargaSatuan =
        typeof item.harga === "string"
          ? parseInt(item.harga.replace(/[^\d]/g, "")) || 0
          : item.harga || 0;

      return {
        order_id: newOrder.id,
        item_name: item.nama,
        item_type:
          item.kategori === "Bundling"
            ? "Bundling"
            : item.kategori || "General",
        quantity: item.qty || 1,
        price: hargaSatuan, // SIMPAN ANGKA SATUAN SAJA (1800)
        status: "pending",
      };
    });

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemInserts);

    if (itemsError) throw itemsError;

    // 4. GENERATE CUSTOM ORDER ID
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, "0");
    const customOrderId = `NMC-${yy}${mm}-${now.getSeconds()}${now
      .getMilliseconds()
      .toString()
      .slice(0, 2)}`;

    // 5. LOGIKA WEBHOOK DISCORD
    const discordItemsDetail = items
      .map(
        (i) =>
          `- ${i.nama} (${i.qty}x) ${
            i.kategori === "Bundling" ? "[PAKET]" : ""
          }`,
      )
      .join("\n");
    let targetWebhook = process.env.DISCORD_WEBHOOK_URL;
    let embedColor = 0x2ecc71;

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
                // MENGUBAH ANGKA MENJADI FORMAT BERKOMA DI DISCORD
                value: `**$ ${(parseInt(totalHarga.replace(/[^\d]/g, "")) || 0).toLocaleString()}**`,
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
