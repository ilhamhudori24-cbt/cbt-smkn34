import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bwezdrfboqqoaxzheqoy.supabase.co";
const SUPABASE_KEY = "sb_publishable_SU1EQuU1pyx8KiFxQ3XEOA_rrvfpMtF";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setPesan("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (error) {
      setPesan("Login gagal: " + error.message);
    } else {
      setPesan("Login berhasil. Memuat profil pengguna...");
    }
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
