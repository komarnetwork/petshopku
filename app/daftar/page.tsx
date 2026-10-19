
"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase-lama";

export default function DaftarPage() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDaftar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPesan("");

    if (password !== konfirmasiPassword) {
      setPesan("Konfirmasi password tidak sama.");
      return;
    }

    if (password.length < 6) {
      setPesan("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await updateProfile(credential.user, {
        displayName: nama.trim(),
      });

      setPesan("Akun berhasil dibuat! Silakan masuk.");
      setNama("");
      setEmail("");
      setPassword("");
      setKonfirmasiPassword("");
    } catch (error: unknown) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(error.code)
          : "";

      if (code === "auth/email-already-in-use") {
        setPesan("Email sudah terdaftar. Silakan gunakan email lain.");
      } else if (code === "auth/invalid-email") {
        setPesan("Format email tidak valid.");
      } else if (code === "auth/weak-password") {
        setPesan("Password terlalu lemah. Gunakan minimal 6 karakter.");
      } else {
        setPesan("Registrasi gagal. Periksa koneksi dan konfigurasi Firebase.");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <Link href="/" className="text-sm text-teal-700 hover:underline">
          ← Kembali ke Beranda
        </Link>

        <div className="mb-8 mt-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Buat Akun Petshopku
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Daftar untuk menikmati layanan klinik hewan kami.
          </p>
        </div>

        <form onSubmit={handleDaftar} className="space-y-5">
          <div>
            <label htmlFor="nama" className="mb-1 block text-sm font-medium text-slate-700">
              Nama Lengkap
            </label>
            <input
              id="nama"
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Masukkan nama lengkap"
              required
              autoComplete="name"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label htmlFor="konfirmasiPassword" className="mb-1 block text-sm font-medium text-slate-700">
              Konfirmasi Password
            </label>
            <input
              id="konfirmasiPassword"
              type="password"
              value={konfirmasiPassword}
              onChange={(e) => setKonfirmasiPassword(e.target.value)}
              placeholder="Ulangi password"
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {pesan && (
            <p role="status" className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800">
              {pesan}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Daftar Sekarang"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="font-semibold text-teal-700 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
