"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Logo } from "@/components/umum/logo"
import { kelasTombol } from "@/components/ui/tombol"
import { gunakanAuth } from "@/context/auth-context"
import { halamanUtamaPeran } from "@/lib/peran"

const tautanMenu = [
  { href: "#fitur", label: "Fitur" },
  { href: "#layanan", label: "Layanan" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#peran", label: "Untuk Siapa" },
]

export function HeaderBeranda() {
  const { profil } = gunakanAuth()
  const [menuTerbuka, setMenuTerbuka] = useState(false)

  const sudahMasuk = profil?.approval_status === "disetujui"

  const tombolAkun = sudahMasuk ? (
    <Link href={halamanUtamaPeran(profil.role)} className={kelasTombol()}>
      Buka portal
    </Link>
  ) : (
    <>
      <Link href="/masuk" className={kelasTombol({ varian: "garis" })}>
        Masuk
      </Link>
      <Link href="/daftar" className={kelasTombol()}>
        Daftar
      </Link>
    </>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Petshopku - beranda">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {tautanMenu.map((tautan) => (
            <a key={tautan.href} href={tautan.href} className="text-sm font-medium text-muted-foreground hover:text-primary">
              {tautan.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">{tombolAkun}</div>

        <button
          type="button"
          className="p-2 md:hidden"
          onClick={() => setMenuTerbuka(!menuTerbuka)}
          aria-label={menuTerbuka ? "Tutup menu" : "Buka menu"}
        >
          {menuTerbuka ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuTerbuka && (
        <div className="space-y-1 border-t border-border bg-background px-4 py-4 md:hidden">
          {tautanMenu.map((tautan) => (
            <a
              key={tautan.href}
              href={tautan.href}
              onClick={() => setMenuTerbuka(false)}
              className="block rounded-lg px-3 py-2 font-medium hover:bg-muted"
            >
              {tautan.label}
            </a>
          ))}
          <div className="flex gap-2 pt-3">{tombolAkun}</div>
        </div>
      )}
    </header>
  )
}
