"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { CheckCircle2, X, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type JenisToast = "sukses" | "galat"

interface Toast {
  id: number
  pesan: string
  jenis: JenisToast
}

interface NilaiToast {
  /** Menampilkan notifikasi singkat di pojok layar. */
  tampilkanToast: (pesan: string, jenis?: JenisToast) => void
}

const KonteksToast = createContext<NilaiToast | null>(null)
const DURASI_MS = 4000

export function PenyediaToast({ children }: { children: ReactNode }) {
  const [daftarToast, setDaftarToast] = useState<Toast[]>([])

  const tutupToast = useCallback((id: number) => {
    setDaftarToast((saatIni) => saatIni.filter((toast) => toast.id !== id))
  }, [])

  const tampilkanToast = useCallback(
    (pesan: string, jenis: JenisToast = "sukses") => {
      const id = Date.now() + Math.random()
      setDaftarToast((saatIni) => [...saatIni, { id, pesan, jenis }])
      setTimeout(() => tutupToast(id), DURASI_MS)
    },
    [tutupToast],
  )

  const nilai = useMemo(() => ({ tampilkanToast }), [tampilkanToast])

  return (
    <KonteksToast.Provider value={nilai}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {daftarToast.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border bg-card p-4 shadow-lg",
              toast.jenis === "sukses" ? "border-emerald-300" : "border-red-300",
            )}
          >
            {toast.jenis === "sukses" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            )}
            <p className="flex-1 text-sm text-card-foreground">{toast.pesan}</p>
            <button
              type="button"
              onClick={() => tutupToast(toast.id)}
              aria-label="Tutup notifikasi"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </KonteksToast.Provider>
  )
}

export function gunakanToast() {
  const nilai = useContext(KonteksToast)
  if (!nilai) throw new Error("gunakanToast harus dipakai di dalam PenyediaToast.")
  return nilai
}
