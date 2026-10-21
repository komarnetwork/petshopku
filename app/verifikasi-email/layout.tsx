
import { PenjagaAkses } from "@/components/umum/penjaga-akses"

export default function TataLetakVerifikasiEmail({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PenjagaAkses aturan={{ jenis: "verifikasi" }}>
      {children}
    </PenjagaAkses>
  )
}
