import { SidebarAdmin } from "@/components/admin/sidebar-admin"
import { PenjagaAkses } from "@/components/umum/penjaga-akses"

export default function TataLetakAdmin({ children }: { children: React.ReactNode }) {
  return (
    <PenjagaAkses aturan={{ jenis: "peran", peran: "admin" }}>
      <div className="min-h-dvh">
        <SidebarAdmin />
        <main className="min-w-0 pt-16 lg:ml-64 lg:pt-0">
          <div className="mx-auto max-w-7xl p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </PenjagaAkses>
  )
}
