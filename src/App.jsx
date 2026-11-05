
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bwezdrfboqqoaxzheqoy.supabase.co";
const SUPABASE_KEY = "sb_publishable_SU1EQuU1pyx8KiFxQ3XEOA_rrvfpMtF";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const menuAdmin = [
  { id: "dashboard", icon: "🏠", nama: "Dashboard" },
  { id: "pengguna", icon: "👥", nama: "Data Pengguna" },
  { id: "soal", icon: "📝", nama: "Bank Soal" },
  { id: "ujian", icon: "📋", nama: "Data Ujian" },
  { id: "hasil", icon: "📊", nama: "Hasil Ujian" },
  { id: "pengaturan", icon: "⚙️", nama: "Pengaturan" }
];

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);
  const [profil, setProfil] = useState(null);
  const [cekSesi, setCekSesi] = useState(true);
  const [menuAktif, setMenuAktif] = useState("dashboard");

  async function muatProfil(user) {
    if (!user) {
      setProfil(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, nama, username, role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      setPesan("Gagal membaca profil: " + error.message);
      setProfil(null);
      return;
    }

    if (!data) {
      setPesan("Profil pengguna belum ditemukan.");
      setProfil(null);
      return;
    }

    setProfil(data);
    setPesan("");
  }

  useEffect(() => {
    async function cekLogin() {
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        await muatProfil(data.session.user);
      }

      setCekSesi(false);
    }

    cekLogin();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setProfil(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setPesan("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      setPesan("Login gagal: " + error.message);
      setLoading(false);
      return;
    }

    await muatProfil(data.user);
    setLoading(false);
  }

  async function logout() {
    setLoading(true);

    const { error } = await supabase.auth.signOut();

    setLoading(false);

    if (error) {
      setPesan("Gagal keluar: " + error.message);
      return;
    }

    setProfil(null);
    setEmail("");
    setPassword("");
    setMenuAktif("dashboard");
    setPesan("");
  }

  const halaman = {
    dashboard: {
      judul: "Dashboard Admin",
      deskripsi: "Ringkasan sistem CBT SMKN 34 Jakarta."
    },
    pengguna: {
      judul: "Data Pengguna",
      deskripsi: "Pengelolaan akun admin, guru, dan siswa."
    },
    soal: {
      judul: "Bank Soal",
      deskripsi: "Pengelolaan dan impor soal dari file."
    },
    ujian: {
      judul: "Data Ujian",
      deskripsi: "Pengaturan paket, jadwal, dan token ujian."
    },
    hasil: {
      judul: "Hasil Ujian",
      deskripsi: "Nilai dan rekapitulasi hasil ujian siswa."
    },
    pengaturan: {
      judul: "Pengaturan",
      deskripsi: "Pengaturan sistem CBT sekolah."
    }
  };

  if (cekSesi) {
    return (
      <div style={styles.loading}>
        Memeriksa sesi login...
      </div>
    );
  }

  if (!profil) {
    return (
      <main style={styles.loginPage}>
        <section style={styles.loginCard}>
          <div style={styles.logo}>CBT</div>
          <h1 style={styles.loginTitle}>CBT SMKN 34 JAKARTA</h1>
          <p style={styles.muted}>Computer Based Test Online</p>
          <hr style={styles.line} />

          <h2>Selamat Datang</h2>
          <p style={styles.muted}>
            Silakan masuk menggunakan akun yang telah diberikan sekolah.
          </p>

          <form onSubmit={login}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button style={styles.loginButton} disabled={loading}>
              {loading ? "Memproses..." : "MASUK"}
            </button>
          </form>

          {pesan && <p style={styles.error}>{pesan}</p>}

          <footer style={styles.footer}>
            SMKN 34 JAKARTA<br />
            Sistem Ujian Berbasis Komputer
          </footer>
        </section>
      </main>
    );
  }

  const role = String(profil.role || "").toLowerCase();

  if (role !== "admin") {
    return (
      <main style={styles.loginPage}>
        <section style={styles.loginCard}>
          <h2>Selamat Datang</h2>
          <h3>{profil.nama || profil.username}</h3>
          <p>Hak akses: {role.toUpperCase()}</p>
          <p>Dashboard khusus pengguna akan dikembangkan.</p>
          <button style={styles.loginButton} onClick={logout}>
            KELUAR
          </button>
        </section>
      </main>
    );
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logoSmall}>CBT</div>
          <div>
            <strong>CBT SMKN 34 JAKARTA</strong>
            <div style={styles.headerSub}>Computer Based Test Online</div>
          </div>
        </div>

        <div style={styles.account}>
          <div style={styles.avatar}>A</div>
          <div>
            <strong>{profil.nama || profil.username}</strong>
            <div style={styles.headerSub}>Administrator</div>
          </div>
        </div>
      </header>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.sideTitle}>MENU UTAMA</div>

          {menuAdmin.map((menu) => (
            <button
              key={menu.id}
              onClick={() => setMenuAktif(menu.id)}
              style={{
                ...styles.menuButton,
                ...(menuAktif === menu.id ? styles.menuActive : {})
              }}
            >
              <span>{menu.icon}</span>
              {menu.nama}
            </button>
          ))}

          <button
            onClick={logout}
            disabled={loading}
            style={styles.logoutButton}
          >
            🚪 KELUAR
          </button>
        </aside>

        <main style={styles.content}>
          <div style={styles.breadcrumb}>
            CBT / {halaman[menuAktif].judul}
          </div>

          <h1 style={styles.pageTitle}>
            {halaman[menuAktif].judul}
          </h1>

          <p style={styles.muted}>
            {halaman[menuAktif].deskripsi}
          </p>

          {menuAktif === "dashboard" ? (
            <>
              <div style={styles.welcome}>
                <div>
                  <h2>Selamat Datang, {profil.nama || profil.username}!</h2>
                  <p>
                    Anda masuk sebagai Administrator CBT SMKN 34 Jakarta.
                  </p>
                </div>
                <div style={styles.welcomeIcon}>🎓</div>
              </div>

              <h3 style={styles.sectionTitle}>Menu Pengelolaan Sistem</h3>

              <div style={styles.cards}>
                {menuAdmin.filter(m => m.id !== "dashboard").map((menu) => (
                  <button
                    key={menu.id}
                    style={styles.card}
                    onClick={() => setMenuAktif(menu.id)}
                  >
                    <div style={styles.cardIcon}>{menu.icon}</div>
                    <strong>{menu.nama}</strong>
                    <span style={styles.cardArrow}>Buka menu →</span>
                  </button>
                ))}
              </div>

              <div style={styles.info}>
                <strong>Informasi Sistem</strong>
                <p>
                  Sistem CBT SMKN 34 Jakarta telah terhubung dengan
                  Supabase. Silakan gunakan menu di samping untuk
                  mengelola sistem.
                </p>
              </div>
            </>
          ) : (
            <div style={styles.placeholder}>
              <div style={styles.placeholderIcon}>
                {menuAdmin.find(m => m.id === menuAktif)?.icon}
              </div>
              <h2>{halaman[menuAktif].judul}</h2>
              <p>{halaman[menuAktif].deskripsi}</p>
              <p style={styles.muted}>
                Fitur ini akan kita bangun pada tahap berikutnya.
              </p>
              <button
                style={styles.backButton}
                onClick={() => setMenuAktif("dashboard")}
              >
                ← Kembali ke Dashboard
              </button>
            </div>
          )}

          <footer style={styles.pageFooter}>
            © 2026 SMKN 34 JAKARTA | Sistem CBT Sekolah
          </footer>
        </main>
      </div>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f1f5f9",
    color: "#172b4d",
    fontFamily: "Arial, sans-serif"
  },
  header: {
    background: "#12345a",
    color: "white",
    minHeight: "75px",
    padding: "12px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px"
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  logoSmall: {
    background: "white",
    color: "#12345a",
    borderRadius: "10px",
    padding: "12px",
    fontWeight: "bold",
    fontSize: "18px"
  },
  headerSub: {
    fontSize: "12px",
    opacity: 0.8,
    marginTop: "4px"
  },
  account: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  avatar: {
    background: "#f0b429",
    color: "#12345a",
    borderRadius: "50%",
    width: "38px",
    height: "38px",
    display: "grid",
    placeItems: "center",
    fontWeight: "bold"
  },
  layout: {
    display: "flex",
    minHeight: "calc(100vh - 75px)"
  },
  sidebar: {
    width: "235px",
    flexShrink: 0,
    background: "#ffffff",
    padding: "22px 14px",
    boxShadow: "2px 0 8px rgba(0,0,0,0.04)"
  },
  sideTitle: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#94a3b8",
    margin: "4px 10px 15px"
  },
  menuButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "13px 12px",
    border: "none",
    background: "transparent",
    borderRadius: "8px",
    textAlign: "left",
    fontSize: "14px",
    cursor: "pointer",
    color: "#475569",
    marginBottom: "5px"
  },
  menuActive: {
    background: "#e8f0fb",
    color: "#12345a",
    fontWeight: "bold"
  },
  logoutButton: {
    width: "100%",
    padding: "13px",
    marginTop: "35px",
    background: "#fff1f2",
    color: "#be123c",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  content: {
    flex: 1,
    minWidth: 0,
    padding: "28px",
    overflow: "auto"
  },
  breadcrumb: {
    color: "#94a3b8",
    fontSize: "12px",
    marginBottom: "12px"
  },
  pageTitle: {
    fontSize: "25px",
    margin: "0 0 8px"
  },
  muted: {
    color: "#64748b",
    lineHeight: 1.6
  },
  welcome: {
    background: "#12345a",
    color: "white",
    borderRadius: "14px",
    padding: "25px",
    marginTop: "25px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px"
  },
  welcomeIcon: {
    fontSize: "45px"
  },
  sectionTitle: {
    marginTop: "30px",
    marginBottom: "15px"
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "15px"
  },
  card: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "22px",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    color: "#172b4d",
    minHeight: "145px"
  },
  cardIcon: {
    fontSize: "30px"
  },
  cardArrow: {
    color: "#2563eb",
    fontSize: "12px",
    marginTop: "auto"
  },
  info: {
    background: "#e8f0fb",
    borderRadius: "10px",
    padding: "18px",
    marginTop: "25px",
    lineHeight: 1.6
  },
  placeholder: {
    background: "white",
    borderRadius: "14px",
    padding: "40px 20px",
    textAlign: "center",
    marginTop: "25px",
    border: "1px solid #e2e8f0"
  },
  placeholderIcon: {
    fontSize: "45px"
  },
  backButton: {
    padding: "11px 18px",
    background: "#12345a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "12px"
  },
  pageFooter: {
    marginTop: "45px",
    padding: "18px 0",
    borderTop: "1px solid #e2e8f0",
    color: "#94a3b8",
    fontSize: "12px"
  },
  loginPage: {
    minHeight: "100vh",
    background: "#eef3f9",
    display: "grid",
    placeItems: "center",
    padding: "20px",
    fontFamily: "Arial, sans-serif"
  },
  loginCard: {
    background: "white",
    padding: "30px",
    borderRadius: "14px",
    width: "100%",
    maxWidth: "420px",
    boxSizing: "border-box",
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)"
  },
  logo: {
    background: "#12345a",
    color: "white",
    borderRadius: "10px",
    width: "65px",
    padding: "14px 5px",
    textAlign: "center",
    fontWeight: "bold",
    margin: "0 auto 15px"
  },
  loginTitle: {
    textAlign: "center",
    fontSize: "21px"
  },
  line: {
    border: 0,
    borderTop: "1px solid #e2e8f0",
    margin: "22px 0"
  },
  label: {
    display: "block",
    fontWeight: "bold",
    fontSize: "13px",
    marginTop: "15px",
    marginBottom: "7px"
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px"
  },
  loginButton: {
    width: "100%",
    background: "#12345a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "13px",
    marginTop: "22px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  error: {
    color: "#be123c",
    fontSize: "13px",
    marginTop: "15px"
  },
  footer: {
    textAlign: "center",
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "30px",
    lineHeight: 1.7
  },
  loading: {
    padding: "50px",
    textAlign: "center",
    fontFamily: "Arial, sans-serif"
  }
};
