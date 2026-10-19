import Link from "next/link"
import { Logo } from "@/components/umum/logo"

export function FooterBeranda() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <Logo tinggi={30} />
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/masuk" className="hover:text-primary">
            Masuk
          </Link>
          <Link href="/daftar" className="hover:text-primary">
            Daftar
          </Link>
        </nav>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Petshopku. Sistem informasi klinik hewan.</p>
      </div>
    </footer>
  )
}
