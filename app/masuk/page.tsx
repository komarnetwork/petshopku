
"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function MasukPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleMasuk(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPesan("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      window.location.href = "/dashboard";
    } catch (error: unknown) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(error.code)
          : "";

      if (
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found" ||
        code === "auth/wrong-password"
      ) {
        setPesan("Email atau password salah. Silakan periksa kembali.");
      } else if (code === "auth/invalid-email") {
        setPesan("Format email tidak valid.");
      } else {
        setPesan("Login gagal. Periksa koneksi internet dan coba lagi.");
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
            Masuk ke Petshopku
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Masuk untuk melanjutkan ke layanan klinik hewan kami.
          </p>
        </div>

        <form onSubmit={handleMasuk} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
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
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {pesan && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {pesan}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Belum punya akun?{" "}
          <Link
            href="/daftar"
            className="font-semibold text-teal-700 hover:underline"
          >
            Daftar di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
