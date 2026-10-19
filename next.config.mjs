import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Menetapkan folder proyek ini sebagai akar, supaya Next.js tidak salah
  // memilih berkas package-lock.json lain di folder induk.
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
}

export default nextConfig
