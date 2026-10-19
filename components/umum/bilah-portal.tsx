"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Logo } from "@/components/umum/logo"
import { Tombol } from "@/components/ui/tombol"
import { gunakanAuth } from "@/context/auth-context"

/** Bilah atas untuk portal dokter hewan. */
export function BilahPortal() {
  const { keluar } = gunakanAuth()
  const router = useRouter()

  async function tanganiKeluar() {
    await keluar()
    router.replace("/")
  }

  return (
    <header className="border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Petshopku - beranda">
          <Logo />
        </Link>
        <Tombol varian="garis" onClick={tanganiKeluar}>
          <LogOut className="h-4 w-4" />
          Keluar
        </Tombol>
      </div>
    </header>
  )
}

interface PropsSapaan {
  label: string
  nama: string
  deskripsi: string
}

/** Kartu sambutan di bagian atas portal. */
export function SapaanPortal({ label, nama, deskripsi }: PropsSapaan) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">{label}</p>
      <h1 className="mt-2 text-3xl font-extrabold">Halo, {nama}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{deskripsi}</p>
    </section>
  )
}
