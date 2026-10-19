"use client"

import { FlaskConical, Syringe } from "lucide-react"
import { Lencana } from "@/components/ui/lencana"
import { Tombol } from "@/components/ui/tombol"
import { PanelKartu } from "@/components/ui/kartu"
import { KeadaanKosong } from "@/components/ui/status"
import { KeputusanDokter } from "@/components/dokter/keputusan-dokter"
import { gunakanAksi } from "@/hooks/gunakan-aksi"
import { gunakanAuth } from "@/context/auth-context"
import { setujuiPemeriksaan, tolakPemeriksaan } from "@/lib/data/pemeriksaan"
import { setujuiVaksinasi, tandaiSudahDisuntik, tolakVaksinasi } from "@/lib/data/vaksinasi"
import { formatJam, formatRupiah, formatTanggal } from "@/lib/format"
import {
  labelKategoriPemeriksaan,
  labelStatusPemeriksaan,
  labelStatusVaksinasi,
  nadaStatusPemeriksaan,
  nadaStatusVaksinasi,
  namaPemeriksaan,
} from "@/lib/label"
import type { Pemeriksaan, Vaksinasi } from "@/lib/tipe"

/** Tambahan pesan bila persetujuan ikut menyelesaikan sebuah janji temu. */
function pesanJanjiSelesai(hasil: unknown) {
  return (hasil as { janjiSelesai?: boolean } | undefined)?.janjiSelesai ? " Janji temu terkait otomatis selesai." : ""
}

export function DaftarVaksinasiDokter({ daftarVaksinasi, onBerubah }: { daftarVaksinasi: Vaksinasi[]; onBerubah: () => void }) {
  const { klien } = gunakanAuth()
  const jalankan = gunakanAksi()

  /** Menjalankan aksi lalu memuat ulang daftar; mengembalikan true bila berhasil. */
  async function putuskan(kerja: () => Promise<unknown>, pesan: string | ((hasil: unknown) => string)) {
    const berhasil = await jalankan(kerja, pesan)
    if (berhasil) onBerubah()
    return berhasil
  }

  async function tandaiDisuntik(vaksin: Vaksinasi) {
    const berhasil = await jalankan(
      () => tandaiSudahDisuntik(klien, vaksin.id, vaksin.next_dose_date),
      `${vaksin.vaccine_name} untuk ${vaksin.pet?.name ?? "hewan"} ditandai sudah disuntik.`,
    )
    if (berhasil) onBerubah()
  }

  return (
    <PanelKartu judul="Vaksinasi yang Saya Usulkan" ikon={Syringe}>
      {daftarVaksinasi.length === 0 ? (
        <KeadaanKosong teks="Belum ada vaksinasi." />
      ) : (
        <div className="space-y-3">
          {daftarVaksinasi.map((vaksin) => (
            <div key={vaksin.id} className="rounded-lg border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {vaksin.pet?.name ?? "Hewan"} - {vaksin.vaccine_name}
                  </p>
                  <p className="text-sm text-muted-foreground">Pemilik: {vaksin.owner?.full_name ?? "-"}</p>
                  <p className="text-sm text-muted-foreground">
                    Usulan: {formatTanggal(vaksin.scheduled_date)} {formatJam(vaksin.scheduled_time)} · {formatRupiah(vaksin.fee)}
                  </p>
                  {vaksin.injected_date && (
                    <p className="text-sm text-muted-foreground">Disuntik: {formatTanggal(vaksin.injected_date)}</p>
                  )}
                  {vaksin.cancellation_reason && (
                    <p className="text-sm text-muted-foreground">Alasan penolakan: {vaksin.cancellation_reason}</p>
                  )}
                </div>
                <Lencana nada={nadaStatusVaksinasi[vaksin.status]}>{labelStatusVaksinasi[vaksin.status]}</Lencana>
              </div>

              {vaksin.status === "dijadwalkan" && (
                <div className="mt-3">
                  <KeputusanDokter
                    layanan="vaksinasi"
                    onSetuju={() =>
                      putuskan(
                        () => setujuiVaksinasi(klien, vaksin.id),
                        (hasil) => `Vaksinasi ${vaksin.vaccine_name} disetujui.${pesanJanjiSelesai(hasil)}`,
                      )
                    }
                    onTolak={(alasan) => putuskan(() => tolakVaksinasi(klien, vaksin.id, alasan), "Vaksinasi ditolak.")}
                  />
                </div>
              )}

              {vaksin.status === "dikonfirmasi" && (
                <Tombol className="mt-3" ukuran="kecil" onClick={() => tandaiDisuntik(vaksin)}>
                  Tandai sudah disuntik
                </Tombol>
              )}
            </div>
          ))}
        </div>
      )}
    </PanelKartu>
  )
}

export function DaftarPemeriksaanDokter({ daftarPemeriksaan, onBerubah }: { daftarPemeriksaan: Pemeriksaan[]; onBerubah: () => void }) {
  const { klien } = gunakanAuth()
  const jalankan = gunakanAksi()

  /** Menjalankan aksi lalu memuat ulang daftar; mengembalikan true bila berhasil. */
  async function putuskan(kerja: () => Promise<unknown>, pesan: string | ((hasil: unknown) => string)) {
    const berhasil = await jalankan(kerja, pesan)
    if (berhasil) onBerubah()
    return berhasil
  }

  return (
    <PanelKartu judul="Pemeriksaan yang Saya Sarankan" ikon={FlaskConical}>
      {daftarPemeriksaan.length === 0 ? (
        <KeadaanKosong teks="Belum ada pemeriksaan." />
      ) : (
        <div className="space-y-3">
          {daftarPemeriksaan.map((pemeriksaan) => (
            <div key={pemeriksaan.id} className="rounded-lg border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {pemeriksaan.pet?.name ?? "Hewan"} - {namaPemeriksaan(pemeriksaan)}
                  </p>
                  <p className="text-sm text-muted-foreground">{labelKategoriPemeriksaan[pemeriksaan.category]}</p>
                  <p className="text-sm text-muted-foreground">Pemilik: {pemeriksaan.owner?.full_name ?? "-"}</p>
                  <p className="text-sm text-muted-foreground">
                    Usulan: {formatTanggal(pemeriksaan.scheduled_date)} {formatJam(pemeriksaan.scheduled_time)} ·{" "}
                    {formatRupiah(pemeriksaan.fee)}
                  </p>
                  {pemeriksaan.cancellation_reason && (
                    <p className="text-sm text-muted-foreground">Alasan penolakan: {pemeriksaan.cancellation_reason}</p>
                  )}
                </div>
                <Lencana nada={nadaStatusPemeriksaan[pemeriksaan.status]}>
                  {labelStatusPemeriksaan[pemeriksaan.status]}
                </Lencana>
              </div>

              {pemeriksaan.status === "dijadwalkan" && (
                <div className="mt-3">
                  <KeputusanDokter
                    layanan="pemeriksaan"
                    onSetuju={() =>
                      putuskan(
                        () => setujuiPemeriksaan(klien, pemeriksaan.id),
                        (hasil) => `Pemeriksaan disetujui.${pesanJanjiSelesai(hasil)}`,
                      )
                    }
                    onTolak={(alasan) => putuskan(() => tolakPemeriksaan(klien, pemeriksaan.id, alasan), "Pemeriksaan ditolak.")}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PanelKartu>
  )
}
