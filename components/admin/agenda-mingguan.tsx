import { Lencana } from "@/components/ui/lencana"
import { formatJam, keTanggalInput } from "@/lib/format"
import { labelStatusJanjiTemu, nadaStatusJanjiTemu } from "@/lib/label"
import { cn } from "@/lib/utils"
import type { JanjiTemu, StatusJanjiTemu } from "@/lib/tipe"

const namaHariSingkat = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

/** Tujuh tanggal dalam satu minggu (Senin sampai Minggu) yang memuat tanggal acuan. */
export function ambilHariDalamMinggu(acuan: Date): Date[] {
  const awal = new Date(acuan)
  const selisihKeSenin = (awal.getDay() + 6) % 7
  awal.setDate(awal.getDate() - selisihKeSenin)

  return Array.from({ length: 7 }, (_, urutan) => {
    const hari = new Date(awal)
    hari.setDate(awal.getDate() + urutan)
    return hari
  })
}

const kelasGarisStatus: Record<StatusJanjiTemu, string> = {
  dijadwalkan: "border-l-amber-500",
  selesai: "border-l-emerald-500",
  dibatalkan: "border-l-red-400 opacity-60",
}

interface PropsAgendaMingguan {
  hari: Date[]
  daftarJanjiTemu: JanjiTemu[]
  onPilih: (janji: JanjiTemu) => void
}

/** Kalender mingguan: satu kolom per hari berisi janji temu pada hari itu. */
export function AgendaMingguan({ hari, daftarJanjiTemu, onPilih }: PropsAgendaMingguan) {
  const hariIni = keTanggalInput(new Date())

  return (
    <div className="grid gap-3 md:grid-cols-7">
      {hari.map((tanggal) => {
        const kunci = keTanggalInput(tanggal)
        const janjiHariIni = daftarJanjiTemu.filter((janji) => janji.date === kunci)

        return (
          <div key={kunci} className="rounded-xl border border-border bg-card">
            <div
              className={cn(
                "rounded-t-xl border-b border-border px-3 py-2 text-center",
                kunci === hariIni ? "bg-primary text-primary-foreground" : "bg-muted/60",
              )}
            >
              <p className="text-xs font-medium">{namaHariSingkat[tanggal.getDay()]}</p>
              <p className="text-lg font-bold">{tanggal.getDate()}</p>
            </div>

            <div className="min-h-24 space-y-2 p-2">
              {janjiHariIni.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">Kosong</p>}
              {janjiHariIni.map((janji) => (
                <button
                  key={janji.id}
                  type="button"
                  onClick={() => onPilih(janji)}
                  className={cn(
                    "w-full rounded-md border border-l-4 border-border bg-background p-2 text-left text-xs transition-colors hover:bg-muted",
                    kelasGarisStatus[janji.status],
                  )}
                >
                  <p className="font-bold">{formatJam(janji.start_time)}</p>
                  <p className="truncate font-medium">{janji.pet?.name ?? "Hewan"}</p>
                  <p className="truncate text-muted-foreground">{janji.doctor?.full_name ?? "Tanpa dokter"}</p>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Keterangan warna status untuk ditampilkan di bawah agenda. */
export function LegendaStatus() {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(labelStatusJanjiTemu) as StatusJanjiTemu[]).map((status) => (
        <Lencana key={status} nada={nadaStatusJanjiTemu[status]}>
          {labelStatusJanjiTemu[status]}
        </Lencana>
      ))}
    </div>
  )
}
