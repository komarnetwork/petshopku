"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Clock, Home, RefreshCw } from "lucide-react"
import { KerangkaAuth } from "@/components/umum/kerangka-auth"
import { Tombol, kelasTombol } from "@/components/ui/tombol"
import { PesanGalat } from "@/components/ui/status"
import { gunakanAuth } from "@/context/auth-context"
import { gunakanToast } from "@/context/toast-context"
import { halamanUtamaPeran } from "@/lib/peran"

export default function HalamanMenungguPersetujuan() {
  const router = useRouter()
  const { muatUlangProfil, keluar, galatProfil } = gunakanAuth()
  const { tampilkanToast } = gunakanToast()
  const [memeriksa, setMemeriksa] = useState(false)

  async function periksaStatus() {
    setMemeriksa(true)
    const profil = await muatUlangProfil()
    setMemeriksa(false)

    if (profil?.approval_status === "disetujui") {
      router.push(halamanUtamaPeran(profil.role))
      router.refresh()
    } else if (profil?.approval_status === "ditolak") {
      await keluar()
      router.push("/masuk?ditolak=1")
    } else {
      tampilkanToast("Akun Anda masih menunggu persetujuan.", "galat")
    }
  }

  async function tanganiKeluar() {
    await keluar()
    router.replace("/masuk")
  }

  return (
    <KerangkaAuth judul="Akun berhasil dibuat">
      <div className="space-y-6 text-center">
        {galatProfil && (
          <PesanGalat>
            Profil akun tidak dapat dimuat: {galatProfil} Bila aplikasi baru disiapkan, pastikan aturan database
            (database.rules.json) sudah dipublikasikan di Firebase Console.
          </PesanGalat>
        )}
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
          <Clock className="h-9 w-9 text-primary" />
        </span>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Akun Anda sedang menunggu persetujuan pengelola klinik.</p>
          <p>Setelah disetujui, Anda dapat masuk sebagai admin atau dokter hewan sesuai peran yang ditentukan.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Tombol onClick={periksaStatus} memuat={memeriksa}>
            {!memeriksa && <RefreshCw className="h-4 w-4" />}
            Periksa status
          </Tombol>
          <Link href="/" className={kelasTombol({ varian: "garis" })}>
            <Home className="h-4 w-4" />
            Beranda
          </Link>
        </div>

        <button type="button" onClick={tanganiKeluar} className="text-sm text-muted-foreground hover:text-primary">
          Keluar dari akun
        </button>
      </div>
    </KerangkaAuth>
  )
}
