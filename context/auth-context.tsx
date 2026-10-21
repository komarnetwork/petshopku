
"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth"
import { buatKlienFirebase, type KlienData } from "@/lib/firebase"
import { bacaProfil, buatProfilBaru } from "@/lib/data/profil"
import { pesanGalat } from "@/lib/galat"
import { adalahPeran } from "@/lib/peran"
import type { Profil } from "@/lib/tipe"

export interface Pengguna {
  id: string
  email: string | null
  nama: string | null
  emailTerverifikasi: boolean
}

export interface GalatAuth {
  code?: string
  message?: string
}

interface NilaiAuth {
  klien: KlienData
  pengguna: Pengguna | null
  profil: Profil | null
  memuat: boolean
  galatProfil: string | null
  baruKeluar: boolean
  masuk: (
    email: string,
    kataSandi: string,
  ) => Promise<{ galat: GalatAuth | null; profil: Profil | null }>
  daftar: (data: {
    email: string
    kataSandi: string
    namaLengkap: string
    noTelepon: string
  }) => Promise<{ galat: GalatAuth | null }>
  keluar: () => Promise<void>
  muatUlangProfil: () => Promise<Profil | null>
  perbaruiStatusEmail: () => Promise<boolean>
  kirimUlangVerifikasi: () => Promise<GalatAuth | null>
}

const KonteksAuth = createContext<NilaiAuth | null>(null)

function bentukPengguna(user: User): Pengguna {
  return {
    id: user.uid,
    email: user.email,
    nama: user.displayName,
    emailTerverifikasi: user.emailVerified,
  }
}

export function PenyediaAuth({ children }: { children: ReactNode }) {
  const { auth, db } = useMemo(() => buatKlienFirebase(), [])
  const [pengguna, setPengguna] = useState<Pengguna | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [memuatSesi, setMemuatSesi] = useState(true)
  const [profilUntuk, setProfilUntuk] = useState<string | null>(null)
  const [baruKeluar, setBaruKeluar] = useState(false)
  const [galatProfil, setGalatProfil] = useState<string | null>(null)

  const sedangMendaftar = useRef(false)
  const permintaanProfil = useRef(
    new Map<string, Promise<Profil | null>>(),
  )

  const ambilProfil = useCallback(
    (akun: Pengguna) => {
      const berjalan = permintaanProfil.current.get(akun.id)
      if (berjalan) return berjalan

      const permintaan = (async () => {
        const ada = await bacaProfil(db, akun.id)
        if (ada) return ada

        return buatProfilBaru(db, {
          id: akun.id,
          email: akun.email,
          namaLengkap: akun.nama,
          noTelepon: null,
        })
      })().finally(() => {
        permintaanProfil.current.delete(akun.id)
      })

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

  useEffect(() => {
    return onAuthStateChanged(auth, (akun) => {
      setPengguna(akun ? bentukPengguna(akun) : null)
      setMemuatSesi(false)
    })
  }, [auth])

  const idPengguna = pengguna?.id

  useEffect(() => {
    if (!pengguna) {
      setProfil(null)
      setProfilUntuk(null)
      setGalatProfil(null)
      return
    }

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

  // Login tidak lagi mewajibkan email terverifikasi.
  const masuk: NilaiAuth["masuk"] = async (email, kataSandi) => {
    setBaruKeluar(false)

    try {
      const { user } = await signInWithEmailAndPassword(
        auth,
        email,
        kataSandi,
      )

      const akun = bentukPengguna(user)
      setPengguna(akun)

      const hasil = await muatProfilPengguna(akun)

      return { galat: null, profil: hasil }
    } catch (galat) {
      return { galat: galat as GalatAuth, profil: null }
    }
  }

  // Verifikasi email tetap dikirim saat registrasi.
  const daftar: NilaiAuth["daftar"] = async ({
    email,
    kataSandi,
    namaLengkap,
    noTelepon,
  }) => {
    setBaruKeluar(false)
    sedangMendaftar.current = true

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        kataSandi,
      )

      try {
        await sendEmailVerification(user)

        const baru = await buatProfilBaru(db, {
          id: user.uid,
          email: user.email,
          namaLengkap,
          noTelepon,
        })

        setPengguna(bentukPengguna(user))
        setProfil(baru)
        setProfilUntuk(user.uid)

        return { galat: null }
      } catch (galatProses) {
        await deleteUser(user).catch(() => undefined)
        return { galat: galatProses as GalatAuth }
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

  const muatUlangProfil = async () => {
    if (!auth.currentUser) return null

    await reload(auth.currentUser)
    setPengguna(bentukPengguna(auth.currentUser))

    return muatProfilPengguna(bentukPengguna(auth.currentUser))
  }

  const perbaruiStatusEmail = async () => {
    const user = auth.currentUser
    if (!user) return false

    await reload(user)
    const terverifikasi = user.emailVerified

    setPengguna(bentukPengguna(user))
    return terverifikasi
  }

  const kirimUlangVerifikasi = async () => {
    const user = auth.currentUser

    if (!user) {
      return {
        code: "auth/no-current-user",
        message: "Silakan masuk kembali untuk meminta email verifikasi.",
      }
    }

    try {
      await reload(user)

      if (user.emailVerified) {
        setPengguna(bentukPengguna(user))
        return null
      }

      await sendEmailVerification(user)
      return null
    } catch (galat) {
      return galat as GalatAuth
    }
  }

  const peran =
    profil &&
    adalahPeran(profil.role) &&
    profil.approval_status === "disetujui"
      ? profil.role
      : null

  const klien = useMemo<KlienData>(
    () => ({ db, uid: pengguna?.id ?? null, peran }),
    [db, pengguna?.id, peran],
  )

  const nilai: NilaiAuth = {
    klien,
    pengguna,
    profil,
    memuat:
      memuatSesi ||
      (pengguna !== null && profilUntuk !== pengguna.id),
    galatProfil,
    baruKeluar,
    masuk,
    daftar,
    keluar,
    muatUlangProfil,
    perbaruiStatusEmail,
    kirimUlangVerifikasi,
  }

  return (
    <KonteksAuth.Provider value={nilai}>
      {children}
    </KonteksAuth.Provider>
  )
}

export function gunakanAuth() {
  const nilai = useContext(KonteksAuth)

  if (!nilai) {
    throw new Error("gunakanAuth harus dipakai di dalam PenyediaAuth.")
  }

  return nilai
}
