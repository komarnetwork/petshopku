import { ClipboardList, Stethoscope, Syringe, FlaskConical } from "lucide-react"
import { KeadaanKosong } from "@/components/ui/status"
import { formatTanggal } from "@/lib/format"
import type { RiwayatMedis, TipeRiwayat } from "@/lib/tipe"

const ikonRiwayat = {
  konsultasi: Stethoscope,
  vaksinasi: Syringe,
  pemeriksaan: FlaskConical,
} satisfies Record<TipeRiwayat, unknown>

/** Daftar riwayat medis gabungan (konsultasi, vaksinasi, pemeriksaan). */
export function DaftarRiwayatMedis({ riwayat }: { riwayat: RiwayatMedis[] }) {
  if (riwayat.length === 0) {
    return <KeadaanKosong ikon={ClipboardList} teks="Belum ada riwayat medis." />
  }

  return (
    <ul className="space-y-3">
      {riwayat.map((item) => {
        const Ikon = ikonRiwayat[item.record_type]
        return (
          <li key={item.id} className="flex gap-3 rounded-lg border border-border bg-background p-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Ikon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {item.pet_name} - {item.title}
              </p>
              {item.description && <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{item.description}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatTanggal(item.date)}
                {item.doctor_name ? ` · ${item.doctor_name}` : ""}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
