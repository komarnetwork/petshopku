
"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Memuat } from "@/components/ui/status"
import { gunakanAuth, type Pengguna } from "@/context/auth-context"
import {
  adalahPeran,
  adalahStatusPersetujuan,
  halamanUtamaPeran,
} from "@/lib/peran"
import type { Peran, Profil } from "@/lib/tipe"

export type AturanAkses =
  | { jenis: "peran"; peran: Peran }
  | { jenis: "tamu" }
  | { jenis: "menunggu" }
  | { jenis: "verifikasi" }

type Keputusan =
  | { aksi: "izinkan" }
  | { aksi: "tolak" }
  | { aksi: "alihkan"; tujuan: string }

const izinkan: Keputusan = { aksi: "izinkan" }

function alihkan(tujuan: string): Keputusan {
  return { aksi: "alihkan", tujuan }
}

function tentukanKeputusan(
  aturan: AturanAkses,
  pengguna: Pengguna | null,
  profil: Profil | null,
  jalur: string,
): Keputusan {
  if (!pengguna) {
    return aturan.jenis === "tamu"
      ? izinkan
      : alihkan(`/masuk?${new URLSearchParams({ lanjut: jalur })}`)
  }

  // Login tidak dibatasi oleh status verifikasi email.
  // Halaman verifikasi tetap tersedia bagi pengguna yang sudah login.
  if (aturan.jenis === "verifikasi") {
    return izinkan
  }

  const status = adalahStatusPersetujuan(profil?.approval_status)
    ? profil.approval_status
    : "menunggu"

  const peran = adalahPeran(profil?.role) ? profil.role : null

  if (status === "ditolak") {
    return aturan.jenis === "tamu"
      ? izinkan
      : { aksi: "tolak" }
  }

  if (status === "menunggu" || !peran) {
    return aturan.jenis === "menunggu"
      ? izinkan
      : alihkan("/menunggu-persetujuan")
  }

  if (aturan.jenis === "menunggu" || aturan.jenis === "tamu") {
    return alihkan(halamanUtamaPeran(peran))
  }

  return peran === aturan.peran
    ? izinkan
    : alihkan(halamanUtamaPeran(peran))
}

export function PenjagaAkses({
  aturan,
  children,
}: {
  aturan: AturanAkses
  children: ReactNode
}) {
  const router = useRouter();
  const jalur = usePathname();
  const { pengguna, profil, memuat, baruKeluar, keluar } = gunakanAuth();
  const sudahDiperiksa = useRef(false);

  const keputusan = memuat
    ? null
    : tentukanKeputusan(aturan, pengguna, profil, jalur);

  const kunci = !keputusan
    ? "memuat"
    : keputusan.aksi === "alihkan"
      ? `alihkan:${keputusan.tujuan}`
      : keputusan.aksi;

  useEffect(() => {
    if (!keputusan || keputusan.aksi === "izinkan") return;

    if (aturan.jenis === "tamu") {
      if (sudahDiperiksa.current) return;
      sudahDiperiksa.current = true;
    }

    if (!pengguna && baruKeluar) return;

    if (keputusan.aksi === "tolak") {
      void keluar().then(() => {
        router.replace("/masuk?ditolak=1");
      });
      return;
    }

    router.replace(keputusan.tujuan);
  }, [kunci, aturan.jenis, pengguna, baruKeluar, keluar, router, keputusan]);

  // Halaman publik tetap dapat dibuka tanpa login.
  if (aturan.jenis === "tamu") {
    return <>{children}</>;
  }

  return keputusan?.aksi === "izinkan" ? (
    <>{children}</>
  ) : (
    <Memuat layarPenuh />
  );
}
