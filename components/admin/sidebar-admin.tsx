"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Archive,
  CalendarDays,
  FlaskConical,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  PawPrint,
  Stethoscope,
  Syringe,
  UserCheck,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react"
import { Logo } from "@/components/umum/logo"
import { gunakanAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"

interface MenuAdmin {
  href: string
  label: string
  ikon: LucideIcon
}

const daftarMenu: MenuAdmin[] = [
  { href: "/admin", label: "Dasbor", ikon: LayoutDashboard },
  { href: "/admin/persetujuan", label: "Persetujuan Akun", ikon: UserCheck },
  { href: "/admin/pasien", label: "Pasien", ikon: PawPrint },
  { href: "/admin/janji-temu", label: "Janji Temu", ikon: CalendarDays },
  { href: "/admin/konsultasi", label: "Konsultasi", ikon: Stethoscope },
  { href: "/admin/vaksinasi", label: "Vaksinasi", ikon: Syringe },
  { href: "/admin/pemeriksaan", label: "Pemeriksaan", ikon: FlaskConical },
  { href: "/admin/keuangan", label: "Keuangan", ikon: Wallet },
  { href: "/admin/arsip", label: "Arsip", ikon: Archive },
]

const kelasMenu = "flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition-colors"

export function SidebarAdmin() {
  const jalur = usePathname()
  const router = useRouter()
  const { keluar, profil } = gunakanAuth()
  const [menuTerbuka, setMenuTerbuka] = useState(false)

  async function tanganiKeluar() {
    await keluar()
    router.replace("/")
  }

  // "/admin" hanya aktif untuk halaman dasbor; menu lain aktif juga untuk sub-halamannya.
  function menuAktif(href: string) {
    return href === "/admin" ? jalur === href : jalur === href || jalur.startsWith(`${href}/`)
  }

  const isiMenu = (
    <>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pb-4">
        <Link
          href="/"
          onClick={() => setMenuTerbuka(false)}
          className={cn(kelasMenu, "text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground")}
        >
          <Home className="h-5 w-5" />
          Kembali ke beranda
        </Link>
        {daftarMenu.map(({ href, label, ikon: Ikon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMenuTerbuka(false)}
            className={cn(
              kelasMenu,
              menuAktif(href)
                ? "bg-sidebar-aktif text-white"
                : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground",
            )}
          >
            <Ikon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="mb-2 px-4">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">{profil?.full_name || "Admin"}</p>
          <p className="text-xs text-sidebar-foreground/60">Pengelola klinik</p>
        </div>
        <button
          type="button"
          onClick={tanganiKeluar}
          className={cn(kelasMenu, "text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground")}
        >
          <LogOut className="h-5 w-5" />
          Keluar
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Bilah atas untuk layar kecil */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between bg-sidebar px-4 lg:hidden">
        <Link href="/admin" aria-label="Dasbor Petshopku">
          <Logo terang tinggi={34} />
        </Link>
        <button
          type="button"
          onClick={() => setMenuTerbuka(!menuTerbuka)}
          aria-label={menuTerbuka ? "Tutup menu" : "Buka menu"}
          className="p-2 text-sidebar-foreground"
        >
          {menuTerbuka ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Menu geser untuk layar kecil */}
      {menuTerbuka && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMenuTerbuka(false)} />}
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-16 z-40 flex w-64 flex-col bg-sidebar pt-4 transition-transform duration-300 lg:hidden",
          menuTerbuka ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {isiMenu}
      </aside>

      {/* Sidebar tetap untuk layar lebar */}
      <aside className="fixed left-0 top-0 z-50 hidden h-dvh w-64 flex-col bg-sidebar lg:flex">
        <div className="shrink-0 p-6">
          <Link href="/admin" aria-label="Dasbor Petshopku">
            <Logo terang />
          </Link>
        </div>
        {isiMenu}
      </aside>
    </>
  )
}
