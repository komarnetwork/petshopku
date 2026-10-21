
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
} from "firebase/ai";

import { buatKlienFirebase, memakaiEmulator } from "@/lib/firebase";

export function buatChatPetshopku() {
  if (memakaiEmulator()) {
    throw new Error(
      "Chatbot AI memerlukan project Firebase asli, bukan emulator lokal.",
    );
  }

  const { aplikasi } = buatKlienFirebase();

  const ai = getAI(aplikasi, {
    backend: new GoogleAIBackend(),
  });

  const model = getGenerativeModel(ai, {
    model: "gemini-3.5-flash-lite",

    systemInstruction: `
Kamu adalah Petshopku AI, asisten virtual untuk aplikasi klinik hewan dan pet shop.

- Jawab dalam bahasa Indonesia yang ramah, jelas, dan langsung ke inti.
- Untuk pertanyaan umum, gunakan 3–5 poin praktis.
- Sesuaikan panjang jawaban dengan pertanyaan; hindari pengulangan.
- Pahami pertanyaan lanjutan berdasarkan konteks percakapan.
- Untuk gejala serius atau darurat, sarankan segera menghubungi dokter hewan.
- Jangan memberikan diagnosis pasti atau meresepkan obat.
- Jangan mengaku telah membuat janji temu atau mengubah data jika tindakan tersebut belum dilakukan.
`,
  });

  return model.startChat({
    generationConfig: {
      maxOutputTokens: 800,
      thinkingConfig: {
        thinkingLevel: "minimal",
      },
    },
  });
}
