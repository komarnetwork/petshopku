import { PenjagaAkses } from "@/components/umum/penjaga-akses"

export default function TataLetakDokterHewan({ children }: { children: React.ReactNode }) {
  return <PenjagaAkses aturan={{ jenis: "peran", peran: "doctor" }}>{children}</PenjagaAkses>
}
