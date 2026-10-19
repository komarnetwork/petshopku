"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { createUserWithEmailAndPassword, deleteUser, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { buatKlienFirebase, type KlienData } from "@/lib/firebase"
import { bacaProfil, buatProfilBaru } from "@/lib/data/profil"
import { pesanGalat } from "@/lib/galat"
import { adalahPeran } from "@/lib/peran"
import type { Profil } from "@/lib/tipe"

/** Akun yang sedang login menurut Firebase Authentication. */
export interface Pengguna {
  id: string
  email: string | null
  nama: string | null
}

/** Galat dari Firebase; yang dipakai hanya kode dan pesannya. */
export interface GalatAuth {
  code?: string
  message?: string
}

interface NilaiAuth {
  /** Koneksi Realtime Database beserta pengguna yang login, dipakai semua fungsi di lib/data. */
  klien: KlienData
  pengguna: Pengguna | null
  profil: Profil | null
  /** true selama sesi login dan profil masih dimuat. */
  memuat: boolean
  /** Pesan galat bila profil tidak dapat dibaca (mis. aturan database belum dipublikasikan). */
  galatProfil: string | null
  /** true setelah pengguna menekan Keluar, supaya penjaga akses tidak mengalihkan ke halaman masuk. */
  baruKeluar: boolean
  masuk: (email: string, kataSandi: string) => Promise<{ galat: GalatAuth | null; profil: Profil | null }>
  daftar: (data: {
    email: string
    kataSandi: string
    namaLengkap: string
    noTelepon: string
  }) => Promise<{ galat: GalatAuth | null }>
  keluar: () => Promise<void>
  muatUlangProfil: () => Promise<Profil | null>
}

const KonteksAuth = createContext<NilaiAuth | null>(null)

export function PenyediaAuth({ children }: { children: ReactNode }) {
  const { auth, db } = useMemo(() => buatKlienFirebase(), [])
  const [pengguna, setPengguna] = useState<Pengguna | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [memuatSesi, setMemuatSesi] = useState(true)
  // Id akun yang profilnya sudah selesai dimuat (berhasil atau tidak).
  const [profilUntuk, setProfilUntuk] = useState<string | null>(null)
  const [baruKeluar, setBaruKeluar] = useState(false)
  const [galatProfil, setGalatProfil] = useState<string | null>(null)

  const sedangMendaftar = useRef(false)
  const permintaanProfil = useRef(new Map<string, Promise<Profil | null>>())

  // Permintaan yang sama (mis. dari halaman masuk dan dari efek di bawah) berbagi satu pembacaan.
  const ambilProfil = useCallback(
    (akun: Pengguna) => {
      const berjalan = permintaanProfil.current.get(akun.id)
      if (berjalan) return berjalan

      const permintaan = (async () => {
        const ada = await bacaProfil(db, akun.id)
        if (ada) return ada
        // Akun belum punya profil (mis. dibuat lewat Firebase Console): buatkan yang berstatus menunggu.
        return buatProfilBaru(db, { id: akun.id, email: akun.email, namaLengkap: akun.nama, noTelepon: null })
      })().finally(() => permintaanProfil.current.delete(akun.id))

      permintaanProfil.current.set(akun.id, permintaan)
      return permintaan
    },
    [db],
  )

  const muatProfilPengguna = useCallback(
    async (akun: Pengguna) => {
      let hasil: Profil | null = null
      try {
        hasil = await ambilProfil(akun)
        setGalatProfil(null)
      } catch (galat) {
        setGalatProfil(pesanGalat(galat))
      }
      setProfil(hasil)
      setProfilUntuk(akun.id)
      return hasil
    },
    [ambilProfil],
  )

  // Langkah 1: ikuti perubahan sesi login (hanya menyimpan pengguna).
  useEffect(() => {
    return onAuthStateChanged(auth, (akun) => {
      setPengguna(akun ? { id: akun.uid, email: akun.email, nama: akun.displayName } : null)
      setMemuatSesi(false)
    })
  }, [auth])

  // Langkah 2: setiap pengguna berganti, muat profilnya.
  const idPengguna = pengguna?.id
  useEffect(() => {
    if (!pengguna) {
      setProfil(null)
      setProfilUntuk(null)
      setGalatProfil(null)
      return
    }
    // Saat mendaftar, profil ditulis oleh fungsi daftar di bawah.
    if (sedangMendaftar.current) return

    let dibatalkan = false
    ambilProfil(pengguna)
      .then((hasil) => {
        if (dibatalkan) return
        setGalatProfil(null)
        setProfil(hasil)
        setProfilUntuk(pengguna.id)
      })
      .catch((galat) => {
        if (dibatalkan) return
        setGalatProfil(pesanGalat(galat))
        setProfil(null)
        setProfilUntuk(pengguna.id)
      })
    return () => {
      dibatalkan = true
    }
  }, [idPengguna, ambilProfil])

  const masuk: NilaiAuth["masuk"] = async (email, kataSandi) => {
    setBaruKeluar(false)
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, kataSandi)
      const akun = { id: user.uid, email: user.email, nama: user.displayName }
      return { galat: null, profil: await muatProfilPengguna(akun) }
    } catch (galat) {
      return { galat: galat as GalatAuth, profil: null }
    }
  }

  const daftar: NilaiAuth["daftar"] = async ({ email, kataSandi, namaLengkap, noTelepon }) => {
    setBaruKeluar(false)
    sedangMendaftar.current = true
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, kataSandi)

      try {
        const baru = await buatProfilBaru(db, { id: user.uid, email: user.email, namaLengkap, noTelepon })
        setProfil(baru)
        setProfilUntuk(user.uid)
        return { galat: null }
      } catch (galatProfil) {
        // Jangan meninggalkan akun login yang tidak punya profil.
        await deleteUser(user).catch(() => undefined)
        return { galat: galatProfil as GalatAuth }
      }
    } catch (galat) {
      return { galat: galat as GalatAuth }
    } finally {
      sedangMendaftar.current = false
    }
  }

  const keluar = async () => {
    setBaruKeluar(true)
    await signOut(auth)
    setPengguna(null)
    setProfil(null)
    setProfilUntuk(null)
    setGalatProfil(null)
  }

  const muatUlangProfil = async () => (pengguna ? muatProfilPengguna(pengguna) : null)

  // Peran hanya berlaku untuk akun yang sudah disetujui, sama seperti aturan akses di database.rules.json.
  const peran = profil && adalahPeran(profil.role) && profil.approval_status === "disetujui" ? profil.role : null
  const klien = useMemo<KlienData>(() => ({ db, uid: pengguna?.id ?? null, peran }), [db, pengguna?.id, peran])

  const nilai: NilaiAuth = {
    klien,
    pengguna,
    profil,
    memuat: memuatSesi || (pengguna !== null && profilUntuk !== pengguna.id),
    galatProfil,
    baruKeluar,
    masuk,
    daftar,
    keluar,
    muatUlangProfil,
  }

  return <KonteksAuth.Provider value={nilai}>{children}</KonteksAuth.Provider>
}

export function gunakanAuth() {
  const nilai = useContext(KonteksAuth)
  if (!nilai) throw new Error("gunakanAuth harus dipakai di dalam PenyediaAuth.")
  return nilai
}
