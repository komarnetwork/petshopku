"use client"

import { useState, type FormEvent } from "react"
import { Check, X } from "lucide-react"
import { Tombol } from "@/components/ui/tombol"
import { KolomFormulir, Textarea } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"

interface PropsKeputusanDokter {
  /** Nama layanan untuk judul jendela, mis. "vaksinasi". */
  layanan: string
  onSetuju: () => Promise<boolean>
  onTolak: (alasan: string) => Promise<boolean>
}

/**
 * Dokter memutuskan sendiri usulannya: setujui atau tolak. Tidak ada jawaban pemilik yang ditunggu.
 * Penolakan wajib disertai alasan.
 */
export function KeputusanDokter({ layanan, onSetuju, onTolak }: PropsKeputusanDokter) {
  const [formTerbuka, setFormTerbuka] = useState(false)
  const [alasan, setAlasan] = useState("")
  const [memproses, setMemproses] = useState<"setuju" | "tolak" | null>(null)

  async function setuju() {
    setMemproses("setuju")
    await onSetuju()
    setMemproses(null)
  }

  async function kirimPenolakan(kejadian: FormEvent) {
    kejadian.preventDefault()
    setMemproses("tolak")
    const berhasil = await onTolak(alasan)
    setMemproses(null)

    if (berhasil) {
      setFormTerbuka(false)
      setAlasan("")
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Tombol ukuran="kecil" onClick={setuju} memuat={memproses === "setuju"}>
          <Check className="h-3.5 w-3.5" />
          Setujui
        </Tombol>
        <Tombol varian="garis" ukuran="kecil" onClick={() => setFormTerbuka(true)}>
          <X className="h-3.5 w-3.5" />
          Tolak
        </Tombol>
      </div>

      <Modal terbuka={formTerbuka} onTutup={() => setFormTerbuka(false)} judul={`Tolak ${layanan}`}>
        <form onSubmit={kirimPenolakan} className="space-y-4">
          <KolomFormulir label="Alasan penolakan">
            <Textarea required value={alasan} onChange={(kejadian) => setAlasan(kejadian.target.value)} />
          </KolomFormulir>
          <Tombol type="submit" varian="bahaya" className="w-full" memuat={memproses === "tolak"} disabled={!alasan.trim()}>
            Simpan penolakan
          </Tombol>
        </form>
      </Modal>
    </>
  )
}
