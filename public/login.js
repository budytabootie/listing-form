let _supabase;
const loginForm = document.getElementById("loginForm");

async function initSupabase() {
  try {
    const response = await fetch("/api/get-config");
    const config = await response.json();
    _supabase = supabase.createClient(config.supabaseUrl, config.supabaseKey);

    // Cek Session Token yang sudah ada
    const token = localStorage.getItem("sessionToken");
    if (token) {
      const { data, error } = await _supabase
        .from("user_sessions")
        .select("*, users_login(role)")
        .eq("token", token)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (data && !error) {
        redirectUser(data.users_login.role);
      } else {
        localStorage.removeItem("sessionToken");
      }
    }
  } catch (err) {
    console.error("Gagal koneksi server:", err);
  }
}

function redirectUser(role) {
  const userRole = (role || "user").toLowerCase();
  if (userRole === "admin" || userRole === "superadmin") {
    window.location.href = "/admin/";
  } else {
    window.location.href = "/";
  }
}

// Ganti bagian loginForm.onsubmit di login.js:
loginForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!_supabase) return;

  const usernameInput = document.getElementById("username").value.trim();
  const passwordInput = document.getElementById("password").value;
  const btn = document.getElementById("loginBtn");

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memverifikasi...';

  try {
    // 1. Ambil data user dulu
    const { data: user, error } = await _supabase
      .from("users_login")
      .select("*")
      .eq("username", usernameInput)
      .single();

    if (error || !user) throw new Error("Username atau password salah.");

    // 2. Cek Password (Hybrid: Plain vs Bcrypt)
    let isMatch = false;
    if (user.is_encrypted) {
      const { data: isValid } = await _supabase.rpc("check_password_v2", {
        u_id: user.id,
        pass_input: passwordInput,
      });
      isMatch = isValid;
    } else {
      isMatch = user.password === passwordInput;
    }

    if (!isMatch) throw new Error("Username atau password salah.");

    // 3. Buat Session Token
    const sessionToken = crypto.randomUUID();
    const { error: sessErr } = await _supabase.from("user_sessions").insert([
      {
        user_id: user.id,
        token: sessionToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);

    if (sessErr) throw new Error("Gagal membuat session.");

    localStorage.setItem("sessionToken", sessionToken);
    redirectUser(user.role);
  } catch (err) {
    Swal.fire({
      title: "Gagal Login",
      text: err.message,
      icon: "error",
      background: "#1e1e1e",
      color: "#fff",
    });
    btn.disabled = false;
    btn.innerText = "Masuk";
  }
};

initSupabase();
