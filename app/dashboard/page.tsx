
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase-lama";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/masuk");
        return;
      }

      setUser(currentUser);
      setChecking(false);
    });

    return unsubscribe;
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.error("Logout gagal:", error);
      setLoggingOut(false);
    }
  }

  if (checking || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        Memuat dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-teal-700">PETSHOPKU</p>
            <h1 className="mt-2 text-3xl font-bold">Dashboard Pengguna</h1>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 hover:bg-slate-100 disabled:opacity-60"
          >
            {loggingOut ? "Keluar..." : "Logout"}
          </button>
        </header>

        <section className="mt-8 rounded-2xl bg-teal-800 p-8 text-white">
          <p className="text-teal-100">Selamat datang kembali!</p>
          <h2 className="mt-2 text-2xl font-bold">
            {user.displayName || user.email}
          </h2>
          <p className="mt-3 text-teal-50">
            Kelola informasi hewan peliharaanmu dengan mudah melalui Petshopku.
          </p>

          <button
            onClick={() => router.push("/hewan")}
            className="mt-6 rounded-lg bg-white px-5 py-3 font-semibold text-teal-800 hover:bg-teal-50"
          >
            Kelola Hewan Peliharaan →
          </button>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold">Data Hewan</h3>

            <article className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-bold">Janji Temu</h3>
              <p className="mt-2 text-sm text-slate-600">
                Lihat dan kelola permintaan jadwal konsultasi, pemeriksaan, atau
                vaksinasi.
              </p>
              <button
                onClick={() => router.push("/janji-temu")}
                className="mt-4 font-semibold text-teal-700 hover:underline"
              >
                Buka Janji Temu →
              </button>
            </article>

            <p className="mt-2 text-sm text-slate-600">
              Tambahkan, lihat, edit, dan hapus data hewan peliharaanmu.
            </p>
            <button
              onClick={() => router.push("/hewan")}
              className="mt-4 font-semibold text-teal-700 hover:underline"
            >
              Buka Data Hewan →
            </button>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold">Akun Saya</h3>
            <p className="mt-2 break-all text-sm text-slate-600">
              {user.email}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Akun terhubung dengan Firebase Authentication.
            </p>
          </article>
        </section>

        <button
          onClick={() => router.push("/")}
          className="mt-6 text-sm text-teal-700 hover:underline"
        >
          ← Kembali ke Beranda
        </button>
      </div>
    </main>
  );
}
