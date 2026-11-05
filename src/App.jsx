
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bwezdrfboqqoaxzheqoy.supabase.co";
const SUPABASE_KEY = "sb_publishable_SU1EQuU1pyx8KiFxQ3XEOA_rrvfpMtF";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);
  const [profil, setProfil] = useState(null);
  const [cekSesi, setCekSesi] = useState(true);

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
      setPesan("Profil pengguna belum ditemukan. Hubungi administrator.");
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
    } = supabase.auth.onAuthStateChange((event, session) => {
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
    setPesan("Kamu sudah keluar dari sistem.");
  }

  if (cekSesi) {
    return <main className="halaman"><section className="panel">
      Memeriksa sesi login...
    </section></main>;
  }

  if (profil) {
    const role = String(profil.role || "").toLowerCase();

    return (
      <main className="halaman">
        <section className="panel">
          <div className="logo">CBT</div>
          <h1>CBT SMKN 34 JAKARTA</h1>
          <p className="subjudul">Computer Based Test Online</p>
          <div className="garis"></div>

          <h2>Selamat Datang</h2>
          <h3>{profil.nama || profil.username}</h3>
          <p>Username: {profil.username}</p>
          <p>Hak akses: {role.toUpperCase()}</p>

          {role === "admin" && (
            <div>
              <h2>Dashboard Admin</h2>
              <p>Selamat datang di panel administrator CBT.</p>
              <p>Menu pengelolaan sistem akan dikembangkan di sini.</p>
            </div>
          )}

          {role === "guru" && (
            <div>
              <h2>Dashboard Guru</h2>
              <p>Selamat datang di panel guru.</p>
              <p>Menu ujian dan pengelolaan soal akan dikembangkan di sini.</p>
            </div>
          )}

          {role === "siswa" && (
            <div>
              <h2>Dashboard Siswa</h2>
              <p>Selamat datang di CBT SMKN 34 Jakarta.</p>
              <p>Daftar ujian akan ditampilkan di sini.</p>
            </div>
          )}

          {!["admin", "guru", "siswa"].includes(role) && (
            <p>Role akun tidak dikenali. Hubungi administrator.</p>
          )}

          <button onClick={logout} disabled={loading}>
            {loading ? "Memproses..." : "KELUAR"}
          </button>

          <footer>
            SMKN 34 JAKARTA<br />
            Sistem Ujian Berbasis Komputer
          </footer>
        </section>
      </main>
    );
  }

  return (
    <main className="halaman">
      <section className="panel">
        <div className="logo">CBT</div>
        <h1>CBT SMKN 34 JAKARTA</h1>
        <p className="subjudul">Computer Based Test Online</p>

        <div className="garis"></div>

        <h2>Selamat Datang</h2>
        <p>Silakan masuk menggunakan akun yang telah diberikan sekolah.</p>

        <form onSubmit={login}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Masukkan email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button disabled={loading}>
            {loading ? "Memproses..." : "MASUK"}
          </button>
        </form>

        {pesan && <div className="pesan">{pesan}</div>}

        <footer>
          SMKN 34 JAKARTA<br />
          Sistem Ujian Berbasis Komputer
        </footer>
      </section>
    </main>
  );
}
