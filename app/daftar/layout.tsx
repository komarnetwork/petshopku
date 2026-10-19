import { PenjagaAkses } from "@/components/umum/penjaga-akses"

export default function TataLetakDaftar({ children }: { children: React.ReactNode }) {
  return <PenjagaAkses aturan={{ jenis: "tamu" }}>{children}</PenjagaAkses>
}
