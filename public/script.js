import { ListingPage } from './pages/listing.js';

let _supabase;

async function init() {
    // 1. Proteksi Halaman
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Tampilkan Nama & Setup Logout
    document.getElementById('userNameDisplay').innerText = userData.nama_lengkap;
    window.logout = () => {
        sessionStorage.clear();
        window.location.href = 'login.html';
    };

    // 3. Setup Supabase
    try {
        const res = await fetch('/api/get-config');
        const config = await res.json();
        _supabase = supabase.createClient(config.supabaseUrl, config.supabaseKey);
        
        // 4. Load Default Page (Listing)
        const area = document.getElementById('content-area');
        area.innerHTML = ListingPage.render();
        ListingPage.init(_supabase);

    } catch (err) {
        console.error("Gagal inisialisasi:", err);
    }
}

init();