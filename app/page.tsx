import { HeaderBeranda } from "@/components/beranda/header-beranda"
import {
  BagianAjakan,
  BagianCaraKerja,
  BagianFitur,
  BagianLayanan,
  BagianPeran,
  BagianUtama,
} from "@/components/beranda/bagian-beranda"
import { FooterBeranda } from "@/components/beranda/footer-beranda"

export default function Beranda() {
  return (
    <>
      <HeaderBeranda />
      <main>
        <BagianUtama />
        <BagianFitur />
        <BagianLayanan />
        <BagianCaraKerja />
        <BagianPeran />
        <BagianAjakan />
      </main>
      <FooterBeranda />
    </>
  )
}
