import { PenjagaAkses } from "@/components/umum/penjaga-akses"

export default function TataLetakMenungguPersetujuan({ children }: { children: React.ReactNode }) {
  return <PenjagaAkses aturan={{ jenis: "menunggu" }}>{children}</PenjagaAkses>
}
