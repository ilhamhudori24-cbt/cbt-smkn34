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
