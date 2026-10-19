"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { X } from "lucide-react"

interface PropsModal {
  terbuka: boolean
  onTutup: () => void
  judul: string
  children: ReactNode
}

/** Jendela dialog memakai elemen <dialog> bawaan browser. */
export function Modal({ terbuka, onTutup, judul, children }: PropsModal) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (terbuka && !dialog.open) dialog.showModal()
    if (!terbuka && dialog.open) dialog.close()
  }, [terbuka])

  return (
    <dialog
      ref={dialogRef}
      onClose={onTutup}
      // Klik pada latar gelap (di luar kotak) menutup dialog.
      onClick={(kejadian) => {
        if (kejadian.target === dialogRef.current) onTutup()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/50"
    >
      {terbuka && (
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{judul}</h2>
            <button
              type="button"
              onClick={onTutup}
              aria-label="Tutup"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
