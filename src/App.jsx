import React, { useEffect, useMemo, useState } from "react";
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

const halaman = {
  dashboard: { judul: "Dashboard Admin", deskripsi: "Ringkasan sistem CBT SMKN 34 Jakarta." },
  pengguna: { judul: "Data Pengguna", deskripsi: "Daftar dan pengelolaan profil admin, guru, dan siswa." },
  soal: { judul: "Bank Soal", deskripsi: "Pengelolaan dan impor soal dari file." },
  ujian: { judul: "Data Ujian", deskripsi: "Pengaturan paket, jadwal, dan token ujian." },
  hasil: { judul: "Hasil Ujian", deskripsi: "Nilai dan rekapitulasi hasil ujian siswa." },
  pengaturan: { judul: "Pengaturan", deskripsi: "Pengaturan sistem CBT sekolah." }
};

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);
  const [profil, setProfil] = useState(null);
  const [cekSesi, setCekSesi] = useState(true);
  const [menuAktif, setMenuAktif] = useState("dashboard");

  const [pengguna, setPengguna] = useState([]);
  const [muatPengguna, setMuatPengguna] = useState(false);
  const [errorPengguna, setErrorPengguna] = useState("");
  const [kataKunci, setKataKunci] = useState("");
  const [filterRole, setFilterRole] = useState("semua");
  const [filterKelas, setFilterKelas] = useState("semua");
  const [editUser, setEditUser] = useState(null);
  const [simpanEdit, setSimpanEdit] = useState(false);
  const [pesanEdit, setPesanEdit] = useState("");

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
      if (data.session?.user) await muatProfil(data.session.user);
      setCekSesi(false);
    }
    cekLogin();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setProfil(null);
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
    setPengguna([]);
    setPesan("");
  }

  async function ambilPengguna() {
    setMuatPengguna(true);
    setErrorPengguna("");
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nama, username, nisn, nip, kelas, role, created_at")
      .order("nama", { ascending: true });

    if (error) {
      setErrorPengguna("Gagal memuat data pengguna: " + error.message);
      setPengguna([]);
    } else {
      setPengguna(data || []);
    }
    setMuatPengguna(false);
  }

  useEffect(() => {
    if (profil?.role?.toLowerCase() === "admin" && menuAktif === "pengguna") {
      ambilPengguna();
    }
  }, [profil, menuAktif]);

  const daftarKelas = useMemo(() => {
    return [...new Set(pengguna.map(u => u.kelas).filter(Boolean))].sort();
  }, [pengguna]);

  const penggunaTampil = useMemo(() => {
    const q = kataKunci.trim().toLowerCase();
    return pengguna.filter(u => {
      const cocokKata = !q || [u.nama, u.username, u.nisn, u.nip, u.kelas, u.role]
        .some(v => String(v || "").toLowerCase().includes(q));
      const cocokRole = filterRole === "semua" || (u.role || "").toLowerCase() === filterRole;
      const cocokKelas = filterKelas === "semua" || u.kelas === filterKelas;
      return cocokKata && cocokRole && cocokKelas;
    });
  }, [pengguna, kataKunci, filterRole, filterKelas]);

  function bukaEdit(u) {
    setEditUser({
      id: u.id,
      nama: u.nama || "",
      username: u.username || "",
      nisn: u.nisn || "",
      nip: u.nip || "",
      kelas: u.kelas || "",
      role: (u.role || "siswa").toLowerCase()
    });
    setPesanEdit("");
  }

  async function simpanProfil(e) {
    e.preventDefault();
    if (!editUser) return;
    setSimpanEdit(true);
    setPesanEdit("");
    const perubahan = {
      nama: editUser.nama.trim(),
      username: editUser.username.trim(),
      nisn: editUser.nisn.trim() || null,
      nip: editUser.nip.trim() || null,
      kelas: editUser.kelas.trim() || null,
      role: editUser.role
    };
    const { error } = await supabase
      .from("profiles")
      .update(perubahan)
      .eq("id", editUser.id);

    if (error) {
      setPesanEdit("Gagal menyimpan: " + error.message);
    } else {
      setPesanEdit("Profil berhasil diperbarui.");
      await ambilPengguna();
      setEditUser(null);
    }
    setSimpanEdit(false);
  }

  if (cekSesi) {
    return <div style={styles.loading}>Memeriksa sesi login...</div>;
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
          <p style={styles.muted}>Silakan masuk menggunakan akun yang telah diberikan sekolah.</p>
          <form onSubmit={login}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" placeholder="Masukkan email"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" placeholder="Masukkan password"
              value={password} onChange={e => setPassword(e.target.value)} required />
            <button style={styles.loginButton} disabled={loading}>
              {loading ? "Memproses..." : "MASUK"}
            </button>
          </form>
          {pesan && <p style={styles.error}>{pesan}</p>}
          <footer style={styles.footer}>SMKN 34 JAKARTA<br />Sistem Ujian Berbasis Komputer</footer>
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
          <button style={styles.loginButton} onClick={logout}>KELUAR</button>
        </section>
      </main>
    );
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logoSmall}>CBT</div>
          <div><strong>CBT SMKN 34 JAKARTA</strong><div style={styles.headerSub}>Computer Based Test Online</div></div>
        </div>
        <div style={styles.account}>
          <div style={styles.avatar}>A</div>
          <div><strong>{profil.nama || profil.username}</strong><div style={styles.headerSub}>Administrator</div></div>
        </div>
      </header>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.sideTitle}>MENU UTAMA</div>
          {menuAdmin.map(menu => (
            <button key={menu.id} onClick={() => setMenuAktif(menu.id)}
              style={{ ...styles.menuButton, ...(menuAktif === menu.id ? styles.menuActive : {}) }}>
              <span>{menu.icon}</span>{menu.nama}
            </button>
          ))}
          <button onClick={logout} disabled={loading} style={styles.logoutButton}>🚪 KELUAR</button>
        </aside>

        <main style={styles.content}>
          <div style={styles.breadcrumb}>CBT / {halaman[menuAktif].judul}</div>
          <h1 style={styles.pageTitle}>{halaman[menuAktif].judul}</h1>
          <p style={styles.muted}>{halaman[menuAktif].deskripsi}</p>

          {menuAktif === "dashboard" ? (
            <>
              <div style={styles.welcome}>
                <div><h2>Selamat Datang, {profil.nama || profil.username}!</h2>
                  <p>Anda masuk sebagai Administrator CBT SMKN 34 Jakarta.</p></div>
                <div style={styles.welcomeIcon}>🎓</div>
              </div>
              <h3 style={styles.sectionTitle}>Menu Pengelolaan Sistem</h3>
              <div style={styles.cards}>
                {menuAdmin.filter(m => m.id !== "dashboard").map(menu => (
                  <button key={menu.id} style={styles.card} onClick={() => setMenuAktif(menu.id)}>
                    <div style={styles.cardIcon}>{menu.icon}</div><strong>{menu.nama}</strong>
                    <span style={styles.cardArrow}>Buka menu →</span>
                  </button>
                ))}
              </div>
              <div style={styles.info}><strong>Informasi Sistem</strong>
                <p>Sistem CBT SMKN 34 Jakarta telah terhubung dengan Supabase. Silakan gunakan menu di samping untuk mengelola sistem.</p>
              </div>
            </>
          ) : menuAktif === "pengguna" ? (
            <section style={styles.panel}>
              <div style={styles.toolbar}>
                <div><h2 style={{ margin: 0 }}>Daftar Pengguna</h2>
                  <p style={styles.muted}>Total {pengguna.length} profil terdaftar</p></div>
                <button style={styles.secondaryButton} onClick={ambilPengguna} disabled={muatPengguna}>
                  {muatPengguna ? "Memuat..." : "↻ Muat ulang"}
                </button>
              </div>
              <div style={styles.filters}>
                <input style={styles.searchInput} placeholder="Cari nama, username, NISN, NIP..."
                  value={kataKunci} onChange={e => setKataKunci(e.target.value)} />
                <select style={styles.select} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                  <option value="semua">Semua role</option>
                  <option value="admin">Admin</option><option value="guru">Guru</option><option value="siswa">Siswa</option>
                </select>
                <select style={styles.select} value={filterKelas} onChange={e => setFilterKelas(e.target.value)}>
                  <option value="semua">Semua kelas</option>
                  {daftarKelas.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              {errorPengguna && <div style={styles.errorBox}>{errorPengguna}</div>}
              {muatPengguna ? <p>Memuat data pengguna dari Supabase...</p> :
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead><tr>
                      <th style={styles.th}>No.</th><th style={styles.th}>Nama</th>
                      <th style={styles.th}>Username</th><th style={styles.th}>NISN</th>
                      <th style={styles.th}>NIP</th><th style={styles.th}>Kelas</th>
                      <th style={styles.th}>Role</th><th style={styles.th}>Aksi</th>
                    </tr></thead>
                    <tbody>
                      {penggunaTampil.map((u, i) => (
                        <tr key={u.id}>
                          <td style={styles.td}>{i + 1}</td><td style={styles.td}>{u.nama || "-"}</td>
                          <td style={styles.td}>{u.username || "-"}</td><td style={styles.td}>{u.nisn || "-"}</td>
                          <td style={styles.td}>{u.nip || "-"}</td><td style={styles.td}>{u.kelas || "-"}</td>
                          <td style={styles.td}><span style={styles.roleBadge}>{(u.role || "-").toUpperCase()}</span></td>
                          <td style={styles.td}><button style={styles.editButton} onClick={() => bukaEdit(u)}>Edit profil</button></td>
                        </tr>
                      ))}
                      {penggunaTampil.length === 0 && <tr><td style={styles.td} colSpan="8">Tidak ada data yang cocok.</td></tr>}
                    </tbody>
                  </table>
                </div>}
              <p style={styles.note}>Catatan: menu ini saat ini mengelola data profil. Pembuatan dan penghapusan akun login akan dibuat melalui fungsi server-side agar akun Supabase Auth dan profil tetap sinkron.</p>
            </section>
          ) : (
            <div style={styles.placeholder}>
              <div style={styles.placeholderIcon}>{menuAdmin.find(m => m.id === menuAktif)?.icon}</div>
              <h2>{halaman[menuAktif].judul}</h2><p>{halaman[menuAktif].deskripsi}</p>
              <p style={styles.muted}>Fitur ini akan kita bangun pada tahap berikutnya.</p>
              <button style={styles.backButton} onClick={() => setMenuAktif("dashboard")}>← Kembali ke Dashboard</button>
            </div>
          )}
          <footer style={styles.pageFooter}>© 2026 SMKN 34 JAKARTA | Sistem CBT Sekolah</footer>
        </main>
      </div>

      {editUser && (
        <div style={styles.modalBackdrop}>
          <form style={styles.modal} onSubmit={simpanProfil}>
            <div style={styles.toolbar}><h2 style={{ margin: 0 }}>Edit Profil Pengguna</h2>
              <button type="button" style={styles.closeButton} onClick={() => setEditUser(null)}>✕</button></div>
            {["nama", "username", "nisn", "nip", "kelas"].map(field => (
              <label key={field} style={styles.modalLabel}>{field.toUpperCase()}
                <input style={styles.input} value={editUser[field]}
                  onChange={e => setEditUser({ ...editUser, [field]: e.target.value })}
                  required={field === "nama" || field === "username"} />
              </label>
            ))}
            <label style={styles.modalLabel}>ROLE
              <select style={styles.input} value={editUser.role}
                onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
                <option value="admin">Admin</option><option value="guru">Guru</option><option value="siswa">Siswa</option>
              </select>
            </label>
            {pesanEdit && <p style={styles.error}>{pesanEdit}</p>}
            <div style={styles.modalActions}>
              <button type="button" style={styles.secondaryButton} onClick={() => setEditUser(null)}>Batal</button>
              <button type="submit" style={styles.saveButton} disabled={simpanEdit}>{simpanEdit ? "Menyimpan..." : "Simpan perubahan"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  app: { minHeight: "100vh", background: "#f1f5f9", color: "#172b4d", fontFamily: "Arial, sans-serif" },
  header: { background: "#12345a", color: "white", minHeight: "75px", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
  brand: { display: "flex", alignItems: "center", gap: "12px" },
  logoSmall: { background: "white", color: "#12345a", borderRadius: "10px", padding: "12px", fontWeight: "bold", fontSize: "18px" },
  headerSub: { fontSize: "12px", opacity: 0.8, marginTop: "4px" },
  account: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { background: "#f0b429", color: "#12345a", borderRadius: "50%", width: "38px", height: "38px", display: "grid", placeItems: "center", fontWeight: "bold" },
  layout: { display: "flex", minHeight: "calc(100vh - 75px)" },
  sidebar: { width: "235px", flexShrink: 0, background: "#fff", padding: "22px 14px", boxShadow: "2px 0 8px rgba(0,0,0,0.04)" },
  sideTitle: { fontSize: "11px", fontWeight: "bold", color: "#94a3b8", margin: "4px 10px 15px" },
  menuButton: { width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "13px 12px", border: "none", background: "transparent", borderRadius: "8px", textAlign: "left", fontSize: "14px", cursor: "pointer", color: "#475569", marginBottom: "5px" },
  menuActive: { background: "#e8f0fb", color: "#12345a", fontWeight: "bold" },
  logoutButton: { width: "100%", padding: "13px", marginTop: "35px", background: "#fff1f2", color: "#be123c", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  content: { flex: 1, minWidth: 0, padding: "28px", overflow: "auto" },
  breadcrumb: { color: "#94a3b8", fontSize: "12px", marginBottom: "12px" },
  pageTitle: { fontSize: "25px", margin: "0 0 8px" },
  muted: { color: "#64748b", lineHeight: 1.6 },
  welcome: { background: "#12345a", color: "white", borderRadius: "14px", padding: "25px", marginTop: "25px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px" },
  welcomeIcon: { fontSize: "45px" },
  sectionTitle: { marginTop: "30px", marginBottom: "15px" },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "15px" },
  card: { background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "22px", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: "12px", color: "#172b4d", minHeight: "145px" },
  cardIcon: { fontSize: "30px" }, cardArrow: { color: "#2563eb", fontSize: "12px", marginTop: "auto" },
  info: { background: "#e8f0fb", borderRadius: "10px", padding: "18px", marginTop: "25px", lineHeight: 1.6 },
  placeholder: { background: "white", borderRadius: "14px", padding: "40px 20px", textAlign: "center", marginTop: "25px", border: "1px solid #e2e8f0" },
  placeholderIcon: { fontSize: "45px" }, backButton: { padding: "11px 18px", background: "#12345a", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "12px" },
  pageFooter: { marginTop: "45px", padding: "18px 0", borderTop: "1px solid #e2e8f0", color: "#94a3b8", fontSize: "12px" },
  loginPage: { minHeight: "100vh", background: "#eef3f9", display: "grid", placeItems: "center", padding: "20px", fontFamily: "Arial, sans-serif" },
  loginCard: { background: "white", padding: "30px", borderRadius: "14px", width: "100%", maxWidth: "420px", boxSizing: "border-box", boxShadow: "0 8px 30px rgba(0,0,0,0.08)" },
  logo: { background: "#12345a", color: "white", borderRadius: "10px", width: "65px", padding: "14px 5px", textAlign: "center", fontWeight: "bold", margin: "0 auto 15px" },
  loginTitle: { textAlign: "center", fontSize: "21px" }, line: { border: 0, borderTop: "1px solid #e2e8f0", margin: "22px 0" },
  label: { display: "block", fontWeight: "bold", fontSize: "13px", marginTop: "15px", marginBottom: "7px" },
  input: { width: "100%", boxSizing: "border-box", padding: "11px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" },
  loginButton: { width: "100%", background: "#12345a", color: "white", border: "none", borderRadius: "8px", padding: "13px", marginTop: "22px", fontWeight: "bold", cursor: "pointer" },
  error: { color: "#be123c", fontSize: "13px", marginTop: "15px" }, footer: { textAlign: "center", fontSize: "11px", color: "#94a3b8", marginTop: "30px", lineHeight: 1.7 },
  loading: { padding: "50px", textAlign: "center", fontFamily: "Arial, sans-serif" },
  panel: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "22px", marginTop: "24px" },
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" },
  secondaryButton: { border: "1px solid #cbd5e1", background: "#fff", borderRadius: "8px", padding: "10px 14px", cursor: "pointer" },
  filters: { display: "flex", gap: "10px", margin: "18px 0", flexWrap: "wrap" },
  searchInput: { flex: "1 1 240px", minWidth: "180px", padding: "11px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px" },
  select: { padding: "11px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#fff", minWidth: "140px" },
  tableWrap: { overflowX: "auto", width: "100%" }, table: { width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "850px" },
  th: { textAlign: "left", padding: "12px 9px", background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", whiteSpace: "nowrap" },
  td: { padding: "11px 9px", borderBottom: "1px solid #e2e8f0", verticalAlign: "top" },
  roleBadge: { display: "inline-block", background: "#e8f0fb", color: "#12345a", padding: "4px 7px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" },
  editButton: { background: "#12345a", color: "#fff", border: 0, borderRadius: "6px", padding: "7px 10px", cursor: "pointer", whiteSpace: "nowrap" },
  note: { color: "#64748b", fontSize: "12px", lineHeight: 1.6, marginTop: "18px" },
  errorBox: { color: "#9f1239", background: "#fff1f2", padding: "12px", borderRadius: "8px", marginBottom: "12px" },
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", display: "grid", placeItems: "center", padding: "16px", zIndex: 10, overflowY: "auto" },
  modal: { width: "100%", maxWidth: "480px", background: "#fff", borderRadius: "14px", padding: "22px", boxSizing: "border-box", maxHeight: "90vh", overflowY: "auto" },
  closeButton: { border: 0, background: "#f1f5f9", borderRadius: "7px", padding: "8px 10px", cursor: "pointer" },
  modalLabel: { display: "block", fontSize: "12px", fontWeight: "bold", marginTop: "13px" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", flexWrap: "wrap" },
  saveButton: { border: 0, background: "#12345a", color: "#fff", borderRadius: "8px", padding: "10px 15px", cursor: "pointer" }
};
