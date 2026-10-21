
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MailCheck, RefreshCw, CheckCircle2 } from "lucide-react"
import { KerangkaAuth } from "@/components/umum/kerangka-auth"
import { Tombol } from "@/components/ui/tombol"
import { PesanGalat } from "@/components/ui/status"
import { gunakanAuth } from "@/context/auth-context"
import { pesanGalatAuth } from "@/lib/galat"

export default function HalamanVerifikasiEmail() {
  const router = useRouter()
  const {
    pengguna,
    perbaruiStatusEmail,
    kirimUlangVerifikasi,
    keluar,
  } = gunakanAuth()

  const [memeriksa, setMemeriksa] = useState(false)
  const [mengirim, setMengirim] = useState(false)
  const [pesan, setPesan] = useState<string | null>(null)
  const [galat, setGalat] = useState<string | null>(null)

  async function periksaVerifikasi() {
    setMemeriksa(true)
    setPesan(null)
    setGalat(null)

    try {
      const terverifikasi = await perbaruiStatusEmail()

      if (terverifikasi) {
        setPesan("Email berhasil diverifikasi! Memeriksa status akun...")
        router.replace("/menunggu-persetujuan")
        router.refresh()
      } else {
        setGalat(
          "Email belum terverifikasi. Buka tautan verifikasi di email Anda, lalu coba lagi.",
        )
      }
    } catch {
      setGalat("Status verifikasi gagal diperiksa. Silakan coba lagi.")
    } finally {
      setMemeriksa(false)
    }
  }

  async function kirimUlang() {
    setMengirim(true)
    setPesan(null)
    setGalat(null)

    const hasil = await kirimUlangVerifikasi()

    if (hasil) {
      setGalat(pesanGalatAuth(hasil))
    } else {
      setPesan(
        "Email verifikasi telah dikirim ulang. Periksa kotak masuk atau folder spam.",
      )
    }

    setMengirim(false)
  }

  async function tanganiKeluar() {
    await keluar()
    router.replace("/masuk")
  }

  return (
    <KerangkaAuth
      judul="Verifikasi email Anda"
      deskripsi="Satu langkah lagi sebelum akun Anda dapat diajukan untuk persetujuan."
    >
      <div className="space-y-6 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
          <MailCheck className="h-9 w-9 text-primary" />
        </span>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Kami telah mengirim tautan verifikasi ke alamat email Anda.</p>
          <p className="break-all font-semibold text-foreground">
            {pengguna?.email ?? "Email akun Anda"}
          </p>
          <p>
            Buka email tersebut dan klik tautan verifikasi. Jika tidak terlihat,
            periksa folder spam.
          </p>
        </div>

        {pesan && (
          <p className="text-sm text-green-700" role="status">
            <CheckCircle2 className="mr-1 inline h-4 w-4" />
            {pesan}
          </p>
        )}

        {galat && <PesanGalat>{galat}</PesanGalat>}

        <div className="space-y-3">
          <Tombol
            onClick={periksaVerifikasi}
            memuat={memeriksa}
            className="w-full"
          >
            {!memeriksa && <CheckCircle2 className="h-4 w-4" />}
            {memeriksa ? "Memeriksa..." : "Saya sudah verifikasi"}
          </Tombol>

          <Tombol
            onClick={kirimUlang}
            varian="garis"
            memuat={mengirim}
            className="w-full"
          >
            {!mengirim && <RefreshCw className="h-4 w-4" />}
            {mengirim ? "Mengirim..." : "Kirim ulang email"}
          </Tombol>
        </div>

        <button
          type="button"
          onClick={tanganiKeluar}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Keluar dari akun
        </button>
      </div>
    </KerangkaAuth>
  )
}
