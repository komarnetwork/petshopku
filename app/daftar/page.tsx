"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserPlus } from "lucide-react"
import { KerangkaAuth } from "@/components/umum/kerangka-auth"
import { Tombol } from "@/components/ui/tombol"
import { Input, KolomFormulir } from "@/components/ui/input"
import { PesanGalat } from "@/components/ui/status"
import { gunakanAuth } from "@/context/auth-context"
import { pesanGalat } from "@/lib/galat"

const KATA_SANDI_MINIMAL = 6

export default function HalamanDaftar() {
  const router = useRouter()
  const { daftar } = gunakanAuth()

  const [isian, setIsian] = useState({
    namaLengkap: "",
    email: "",
    noTelepon: "",
    kataSandi: "",
    ulangiKataSandi: "",
  })
  const [galat, setGalat] = useState<string | null>(null)
  const [memuat, setMemuat] = useState(false)

  function ubahIsian(nama: keyof typeof isian, nilai: string) {
    setIsian((saatIni) => ({ ...saatIni, [nama]: nilai }))
  }

  async function tanganiKirim(kejadian: FormEvent) {
    kejadian.preventDefault()
    setGalat(null)

    if (isian.kataSandi.length < KATA_SANDI_MINIMAL) {
      setGalat(`Kata sandi minimal ${KATA_SANDI_MINIMAL} karakter.`)
      return
    }
    if (isian.kataSandi !== isian.ulangiKataSandi) {
      setGalat("Kata sandi dan konfirmasinya tidak sama.")
      return
    }

    setMemuat(true)
    const { galat: galatDaftar } = await daftar({
      email: isian.email.trim(),
      kataSandi: isian.kataSandi,
      namaLengkap: isian.namaLengkap.trim(),
      noTelepon: isian.noTelepon.trim(),
    })
    setMemuat(false)

    if (galatDaftar) {
      setGalat(pesanGalat(galatDaftar))
      return
    }

    // Akun langsung dibuat: lanjut ke halaman menunggu persetujuan admin.
    router.push("/menunggu-persetujuan")
    router.refresh()
  }

  return (
    <KerangkaAuth judul="Buat akun baru" deskripsi="Daftar sebagai dokter hewan atau admin klinik. Akun aktif setelah disetujui admin.">
      <form onSubmit={tanganiKirim} className="space-y-4">
        {galat && <PesanGalat>{galat}</PesanGalat>}

        <KolomFormulir label="Nama lengkap">
          <Input
            required
            autoComplete="name"
            placeholder="Nama Anda"
            value={isian.namaLengkap}
            onChange={(kejadian) => ubahIsian("namaLengkap", kejadian.target.value)}
          />
        </KolomFormulir>

        <KolomFormulir label="Email">
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="nama@email.com"
            value={isian.email}
            onChange={(kejadian) => ubahIsian("email", kejadian.target.value)}
          />
        </KolomFormulir>

        <KolomFormulir label="Nomor telepon (opsional)">
          <Input
            type="tel"
            autoComplete="tel"
            placeholder="08123456789"
            value={isian.noTelepon}
            onChange={(kejadian) => ubahIsian("noTelepon", kejadian.target.value)}
          />
        </KolomFormulir>

        <KolomFormulir label="Kata sandi" petunjuk={`Minimal ${KATA_SANDI_MINIMAL} karakter.`}>
          <Input
            type="password"
            required
            autoComplete="new-password"
            value={isian.kataSandi}
            onChange={(kejadian) => ubahIsian("kataSandi", kejadian.target.value)}
          />
        </KolomFormulir>

        <KolomFormulir label="Ulangi kata sandi">
          <Input
            type="password"
            required
            autoComplete="new-password"
            value={isian.ulangiKataSandi}
            onChange={(kejadian) => ubahIsian("ulangiKataSandi", kejadian.target.value)}
          />
        </KolomFormulir>

        <Tombol type="submit" ukuran="besar" className="w-full" memuat={memuat}>
          {!memuat && <UserPlus className="h-5 w-5" />}
          {memuat ? "Mendaftarkan..." : "Daftar"}
        </Tombol>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-bold text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </KerangkaAuth>
  )
}
