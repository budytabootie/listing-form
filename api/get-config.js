// api/get-config.js
module.exports = async (req, res) => {
  if (req.method !== "GET") return res.status(405).end();

  res.status(200).json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    adminToken: process.env.ADMIN_SECRET_TOKEN,
  });
};
