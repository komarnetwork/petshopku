import { KolomFormulir, Pilihan } from "@/components/ui/input"

interface PropsFilterPilihan {
  label: string
  nilai: string
  /** Pasangan [nilai, teks yang ditampilkan]. */
  pilihan: [string, string][]
  onUbah: (nilai: string) => void
}

/** Kotak pilihan kecil dengan label, untuk menyaring daftar. */
export function FilterPilihan({ label, nilai, pilihan, onUbah }: PropsFilterPilihan) {
  return (
    <KolomFormulir label={label}>
      <Pilihan value={nilai} onChange={(kejadian) => onUbah(kejadian.target.value)}>
        {pilihan.map(([nilaiPilihan, teks]) => (
          <option key={nilaiPilihan} value={nilaiPilihan}>
            {teks}
          </option>
        ))}
      </Pilihan>
    </KolomFormulir>
  )
}
