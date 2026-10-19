import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** Menggabungkan class Tailwind; class yang bentrok diambil yang terakhir. */
export function cn(...masukan: ClassValue[]) {
  return twMerge(clsx(masukan))
}
