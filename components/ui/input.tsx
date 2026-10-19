"use client"

import { useLayoutEffect, useRef, type ChangeEvent, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

const kelasKontrol =
  "w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"

export function Input({ className, ...sisa }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(kelasKontrol, "h-10", className)} {...sisa} />
}

const BATAS_DIGIT_RUPIAH = 12

interface PropsInputRupiah extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  /** Hanya angka, mis. "1500000". */
  nilai: string
  onUbah: (angka: string) => void
}

/**
 * Kolom jumlah uang: tampilannya langsung berformat ribuan ("1.500.000") saat diketik,
 * sedangkan nilai yang disimpan di `nilai` hanya berisi angka.
 */
export function InputRupiah({ nilai, onUbah, className, ...sisa }: PropsInputRupiah) {
  const kolom = useRef<HTMLInputElement>(null)
  // Jumlah angka di kiri kursor setelah mengetik, supaya kursor tidak melompat ke ujung saat titik ribuan bertambah.
  const angkaDiKiriKursor = useRef<number | null>(null)

  const tampilan = nilai ? Number(nilai).toLocaleString("id-ID") : ""

  useLayoutEffect(() => {
    const posisiAngka = angkaDiKiriKursor.current
    if (posisiAngka === null || !kolom.current) return
    angkaDiKiriKursor.current = null

    let angkaTerlewati = 0
    let posisi = 0
    while (posisi < tampilan.length && angkaTerlewati < posisiAngka) {
      if (/\d/.test(tampilan[posisi])) angkaTerlewati += 1
      posisi += 1
    }
    kolom.current.setSelectionRange(posisi, posisi)
  }, [tampilan])

  function tanganiUbah(kejadian: ChangeEvent<HTMLInputElement>) {
    const { value, selectionStart } = kejadian.target
    angkaDiKiriKursor.current = value.slice(0, selectionStart ?? value.length).replace(/\D/g, "").length

    // Nol di depan dibuang agar "0500" menjadi "500".
    onUbah(value.replace(/\D/g, "").slice(0, BATAS_DIGIT_RUPIAH).replace(/^0+(?=\d)/, ""))
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
      <input
        ref={kolom}
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        className={cn(kelasKontrol, "h-10 pl-10", className)}
        value={tampilan}
        onChange={tanganiUbah}
        {...sisa}
      />
    </div>
  )
}

export function Textarea({ className, ...sisa }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(kelasKontrol, "min-h-20 py-2", className)} {...sisa} />
}

/** Kotak pilihan (dropdown). Isi dengan elemen <option>. */
export function Pilihan({ className, children, ...sisa }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(kelasKontrol, "h-10", className)} {...sisa}>
      {children}
    </select>
  )
}

interface PropsKolomFormulir {
  label: string
  /** Teks bantuan kecil di bawah kolom. */
  petunjuk?: string
  className?: string
  children: ReactNode
}

/** Label + kolom isian. Label terhubung otomatis ke kolom di dalamnya. */
export function KolomFormulir({ label, petunjuk, className, children }: PropsKolomFormulir) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {petunjuk && <span className="block text-xs text-muted-foreground">{petunjuk}</span>}
    </label>
  )
}
