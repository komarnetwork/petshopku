import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

/** Tabel yang bisa digulir ke samping di layar kecil. */
export function Tabel({ className, ...sisa }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className={cn("w-full text-left text-sm", className)} {...sisa} />
    </div>
  )
}

export function KepalaTabel(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="border-b border-border bg-muted/60" {...props} />
}

export function BadanTabel(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-border" {...props} />
}

export function SelKepala({ className, ...sisa }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("whitespace-nowrap px-4 py-3 font-semibold text-muted-foreground", className)} {...sisa} />
}

export function Sel({ className, ...sisa }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-top", className)} {...sisa} />
}
