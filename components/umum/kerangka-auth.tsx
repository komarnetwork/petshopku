import Link from "next/link"
import type { ReactNode } from "react"
import { Logo } from "@/components/umum/logo"

interface PropsKerangkaAuth {
  judul: string
  deskripsi?: string
  children: ReactNode
}

/** Tata letak halaman masuk / daftar / menunggu persetujuan: logo + kartu di tengah. */
export function KerangkaAuth({ judul, deskripsi, children }: PropsKerangkaAuth) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -right-40 -top-40 h-80 w-80 rounded-full bg-accent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-sorot/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="Petshopku - beranda">
            <Logo tinggi={48} />
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold">{judul}</h1>
            {deskripsi && <p className="mt-2 text-sm text-muted-foreground">{deskripsi}</p>}
          </div>
          {children}
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary">
            ← Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
