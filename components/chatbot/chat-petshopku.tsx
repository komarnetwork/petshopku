
"use client";

import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { buatChatPetshopku } from "@/lib/ai";

type Pesan = {
  role: "user" | "assistant";
  text: string;
};

type Props = {
  mode?: "halaman" | "panel";
  onClose?: () => void;
};

export default function ChatPetshopku({
  mode = "halaman",
  onClose,
}: Props) {
  const [pesan, setPesan] = useState<Pesan[]>([
    {
      role: "assistant",
      text: "Halo! 👋 Aku asisten virtual Petshopku. Ada yang ingin kamu tanyakan tentang perawatan hewan, pemeriksaan, atau vaksinasi?",
    },
  ]);

  const [input, setInput] = useState("");
  const [memuat, setMemuat] = useState(false);
  const [waktuTunggu, setWaktuTunggu] = useState(0);
  const [error, setError] = useState("");

  const chatRef = useRef<ReturnType<typeof buatChatPetshopku> | null>(null);
  const bawahRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      chatRef.current = buatChatPetshopku();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Chatbot belum dapat diinisialisasi.",
      );
    }
  }, []);

  useEffect(() => {
    if (!memuat) {
      setWaktuTunggu(0);
      return;
    }

    const mulai = Date.now();
    setWaktuTunggu(0);

    const interval = setInterval(() => {
      setWaktuTunggu(Math.floor((Date.now() - mulai) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [memuat]);

  useEffect(() => {
    bawahRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pesan, memuat]);

  async function kirimPesan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const teks = input.trim();
    if (!teks || memuat) return;

    if (!chatRef.current) {
      setError("Koneksi chatbot belum siap. Periksa konfigurasi Firebase.");
      return;
    }

    setInput("");
    setError("");
    setMemuat(true);
    setPesan((sebelumnya) => [
      ...sebelumnya,
      { role: "user", text: teks },
    ]);

    const mulai = Date.now();

    try {
      const hasil = await chatRef.current.sendMessage(teks);
      const respons = hasil.response;
      const jawaban = respons.text();

      console.log(
        "Waktu respons AI:",
        ((Date.now() - mulai) / 1000).toFixed(2),
        "detik",
      );
      console.log(
        "Chatbot finish reason:",
        respons.candidates?.[0]?.finishReason,
      );

      setPesan((sebelumnya) => [
        ...sebelumnya,
        {
          role: "assistant",
          text: jawaban || "Maaf, aku belum bisa memberikan jawaban.",
        },
      ]);
    } catch (err) {
      console.error("Chatbot error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Pesan gagal dikirim. Silakan coba lagi.",
      );
    } finally {
      setMemuat(false);
    }
  }

  const isiChat = (
    <>
      <header className="flex shrink-0 items-center justify-between gap-3 bg-teal-700 p-4 text-white">
        <div>
          <h2 className="font-bold">Petshopku AI 🐾</h2>
          <p className="mt-1 text-xs text-teal-100">
            Asisten virtual perawatan hewan
          </p>
        </div>

        {mode === "halaman" ? (
          <Link
            href="/"
            className="rounded-lg border border-white/40 px-3 py-2 text-sm hover:bg-white/10"
          >
            Beranda
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup chatbot"
            className="rounded-lg px-3 py-2 text-xl hover:bg-white/10"
          >
            ×
          </button>
        )}
      </header>

      <section
        aria-live="polite"
        className={`flex flex-1 flex-col gap-4 overflow-y-auto p-4 ${
          mode === "panel" ? "min-h-0" : "min-h-[400px] max-h-[60vh] sm:p-6"
        }`}
      >
        {pesan.map((item, index) => (
          <div
            key={`${index}-${item.role}`}
            className={`max-w-[90%] break-words rounded-2xl px-4 py-3 text-sm leading-6 ${
              item.role === "user"
                ? "self-end rounded-br-sm bg-teal-700 text-white"
                : "self-start rounded-bl-sm bg-slate-100 text-slate-800"
            }`}
          >
            {item.role === "assistant" ? (
              <ReactMarkdown
                components={{
                  strong: ({ children }) => (
                    <strong className="font-bold">{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="my-2 list-disc space-y-1 pl-5">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-2 list-decimal space-y-1 pl-5">
                      {children}
                    </ol>
                  ),
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                  ),
                }}
              >
                {item.text}
              </ReactMarkdown>
            ) : (
              item.text
            )}
          </div>
        ))}

        {memuat && (
          <div
            className="self-start rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600"
            role="status"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-teal-600" />
              <span>Petshopku AI sedang menyusun jawaban...</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Waktu tunggu: {waktuTunggu} detik
            </p>
          </div>
        )}

        <div ref={bawahRef} />
      </section>

      {error && (
        <div
          role="alert"
          className="mx-3 mb-2 shrink-0 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={kirimPesan}
        className="flex shrink-0 gap-2 border-t border-slate-200 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanyakan sesuatu tentang hewan..."
          aria-label="Pesan untuk chatbot"
          disabled={memuat}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
        />

        <button
          type="submit"
          disabled={memuat || !input.trim()}
          className="rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {memuat ? "..." : "Kirim"}
        </button>
      </form>

      <p className="shrink-0 px-3 pb-3 text-center text-xs text-slate-500">
        Informasi AI bukan pengganti pemeriksaan dokter hewan.
      </p>
    </>
  );

  if (mode === "panel") {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {isiChat}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800">
      <div className="mx-auto flex max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isiChat}
      </div>
    </main>
  );
}
