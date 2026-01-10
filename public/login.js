let _supabase;
const loginForm = document.getElementById("loginForm");

async function initSupabase() {
  try {
    const response = await fetch("/api/get-config");
    const config = await response.json();
    _supabase = supabase.createClient(config.supabaseUrl, config.supabaseKey);

    const token = localStorage.getItem("sessionToken");
    if (token) {
      const { data, error } = await _supabase
        .from("user_sessions")
        .select("token, users_login!user_id(role_id, has_changed_password)")
        .eq("token", token)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (data && data.users_login && !error) {
        redirectUser(
          data.users_login.role_id,
          data.users_login.has_changed_password
        );
      } else {
        localStorage.removeItem("sessionToken");
      }
    }
  } catch (err) {
    console.error("Gagal koneksi server:", err);
  }
}

function redirectUser(roleId, hasChangedPassword) {
  // JIKA BELUM GANTI PASSWORD, PAKSA KE HALAMAN CHANGE PASSWORD
  if (hasChangedPassword === false) {
    // Note: Jika Anda menggunakan modal Swal di frontpage untuk force change,
    // arahkan saja ke "/" karena init() di frontpage akan mendeteksinya.
    window.location.href = "/";
    return;
  }

  // JIKA ROLE BUKAN MEMBER (Role 1, 2, 3, 5, dll)
  // Arahkan ke frontpage (/) agar script.js frontpage bisa memunculkan MODAL PILIHAN
  if (roleId !== 4) {
    window.location.href = "/";
  } else {
    window.location.href = "/";
  }
}

loginForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!_supabase) return;

  const usernameInput = document.getElementById("username").value.trim();
  const passwordInput = document.getElementById("password").value;
  const btn = document.getElementById("loginBtn");

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memverifikasi...';

  try {
    const { data: user, error } = await _supabase
      .from("users_login")
      .select("*")
      .eq("username", usernameInput)
      .single();

    if (error || !user) throw new Error("Username atau password salah.");

    let isMatch = false;
    const hashedInput = CryptoJS.SHA256(passwordInput).toString();

    if (user.is_encrypted) {
      isMatch = user.password === hashedInput;
    } else {
      isMatch = user.password === passwordInput;
      if (isMatch) {
        await _supabase
          .from("users_login")
          .update({ password: hashedInput, is_encrypted: true })
          .eq("id", user.id);
      }
    }

    if (!isMatch) throw new Error("Username atau password salah.");

    const sessionToken = crypto.randomUUID();
    const { error: sessErr } = await _supabase.from("user_sessions").insert([
      {
        user_id: user.id,
        token: sessionToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);

    if (sessErr) throw new Error("Gagal membuat session.");

    // SET SESSION DATA
    localStorage.setItem("sessionToken", sessionToken);
    localStorage.setItem(
      "nmc_session",
      JSON.stringify({
        id: user.id,
        username: user.username,
        role_id: user.role_id,
      })
    );

    // TIKET UNTUK MEMUNCULKAN PILIHAN MENU DI FRONTPAGE
    sessionStorage.setItem("justLoggedIn", "true");

    redirectUser(user.role_id, user.has_changed_password);
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
