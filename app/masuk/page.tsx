"use client"

import { Suspense, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { KerangkaAuth } from "@/components/umum/kerangka-auth"
import { Tombol } from "@/components/ui/tombol"
import { Input, KolomFormulir } from "@/components/ui/input"
import { PesanGalat } from "@/components/ui/status"
import { gunakanAuth } from "@/context/auth-context"
import { jalurAmanAtauNull, pesanGalatAuth } from "@/lib/galat"
import { halamanUtamaPeran } from "@/lib/peran"

const PESAN_DITOLAK = "Pendaftaran Anda tidak disetujui. Hubungi pengelola klinik untuk informasi lebih lanjut."

function FormMasuk() {
  const router = useRouter()
  const parameter = useSearchParams()
  const { masuk, keluar } = gunakanAuth()

  const [email, setEmail] = useState("")
  const [kataSandi, setKataSandi] = useState("")
  const [tampilkanKataSandi, setTampilkanKataSandi] = useState(false)
  const [galat, setGalat] = useState<string | null>(parameter.get("ditolak") ? PESAN_DITOLAK : null)
  const [memuat, setMemuat] = useState(false)

  async function tanganiKirim(kejadian: FormEvent) {
    kejadian.preventDefault()
    setGalat(null)
    setMemuat(true)

    try {
      const { galat: galatMasuk, profil } = await masuk(
        email.trim(),
        kataSandi,
      );

      if (galatMasuk) {
        if (galatMasuk.code === "auth/email-not-verified") {
          router.push("/verifikasi-email");
          router.refresh();
          return;
        }

        setGalat(pesanGalatAuth(galatMasuk));
        return;
      }

      if (!profil || profil.approval_status === "menunggu") {
        router.push("/menunggu-persetujuan");
        router.refresh();
        return;
      }

      if (profil.approval_status === "ditolak") {
        await keluar();
        setGalat(PESAN_DITOLAK);
        return;
      }

      router.push(
        jalurAmanAtauNull(parameter.get("lanjut")) ??
          halamanUtamaPeran(profil.role),
      );
      router.refresh();
    } catch {
      setGalat("Terjadi kesalahan tak terduga. Silakan coba lagi.");
    } finally {
      setMemuat(false);
    }
  }

  return (
    <KerangkaAuth judul="Selamat datang kembali" deskripsi="Masuk untuk mengelola klinik: hewan, janji temu, dan layanan">
      <form onSubmit={tanganiKirim} className="space-y-5">
        {galat && <PesanGalat>{galat}</PesanGalat>}

        <KolomFormulir label="Email">
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(kejadian) => setEmail(kejadian.target.value)}
          />
        </KolomFormulir>

        <KolomFormulir label="Kata sandi">
          <div className="relative">
            <Input
              type={tampilkanKataSandi ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="pr-11"
              value={kataSandi}
              onChange={(kejadian) => setKataSandi(kejadian.target.value)}
            />
            <button
              type="button"
              onClick={() => setTampilkanKataSandi(!tampilkanKataSandi)}
              aria-label={tampilkanKataSandi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
            >
              {tampilkanKataSandi ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </KolomFormulir>

        <Tombol type="submit" ukuran="besar" className="w-full" memuat={memuat}>
          {!memuat && <LogIn className="h-5 w-5" />}
          {memuat ? "Memproses..." : "Masuk"}
        </Tombol>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-bold text-primary hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </KerangkaAuth>
  )
}

export default function HalamanMasuk() {
  // useSearchParams wajib dibungkus Suspense pada Next.js.
  return (
    <Suspense>
      <FormMasuk />
    </Suspense>
  )
}
