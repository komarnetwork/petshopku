
"use client";

import { useState } from "react";
import ChatPetshopku from "@/components/chatbot/chat-petshopku";

export function ChatbotMengambang() {
  const [terbuka, setTerbuka] = useState(false);

  return (
    <>
      {terbuka && (
        <div className="fixed bottom-24 right-4 z-50 h-[min(600px,70vh)] min-h-[350px] w-[calc(100vw-2rem)] max-w-[400px]">
          <ChatPetshopku
            mode="panel"
            onClose={() => setTerbuka(false)}
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setTerbuka((sebelumnya) => !sebelumnya)}
        aria-label={terbuka ? "Tutup chatbot" : "Buka chatbot Petshopku"}
        aria-expanded={terbuka}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-teal-700 px-5 py-4 font-semibold text-white shadow-xl transition hover:bg-teal-800"
      >
        <span aria-hidden="true">{terbuka ? "×" : "🐾"}</span>
        <span>{terbuka ? "Tutup Chat" : "Tanya AI"}</span>
      </button>
    </>
  );
}
