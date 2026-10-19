
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  equalTo,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  remove,
  set,
  update,
} from "firebase/database";
import { auth, db } from "@/lib/firebase-lama";

type Appointment = {
  id: string;
  ownerId: string;
  petName: string;
  service: string;
  date: string;
  time: string;
  notes: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

const initialForm = {
  petName: "",
  service: "Konsultasi",
  date: "",
  time: "",
  notes: "",
};

export default function JanjiTemuPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let unsubscribeData: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      // Hentikan listener sebelumnya agar tidak menumpuk.
      if (unsubscribeData) {
        unsubscribeData();
        unsubscribeData = undefined;
      }

      setUser(currentUser);
      setMessage("");

      if (!currentUser) {
        setAppointments([]);
        setChecking(false);
        router.replace("/masuk");
        return;
      }

      setChecking(true);

      const appointmentsQuery = query(
        ref(db, "appointments"),
        orderByChild("ownerId"),
        equalTo(currentUser.uid)
      );

      unsubscribeData = onValue(
        appointmentsQuery,
        (snapshot) => {
          const data = snapshot.val();

          const list: Appointment[] = data
            ? Object.entries(data)
                .map(([id, value]) => ({
                  id,
                  ...(value as Omit<Appointment, "id">),
                }))
                .filter(
                  (appointment) =>
                    appointment.ownerId === currentUser.uid
                )
                .sort((a, b) =>
                  `${a.date} ${a.time}`.localeCompare(
                    `${b.date} ${b.time}`
                  )
                )
            : [];

          setAppointments(list);
          setChecking(false);
        },
        (error) => {
          console.error("Gagal membaca janji temu:", error);
          setMessage(
            `Gagal memuat janji temu: ${error.message}`
          );
          setAppointments([]);
          setChecking(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeData?.();
    };
  }, [router]);

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setMessage("Silakan login terlebih dahulu.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const existing = editingId
        ? appointments.find((item) => item.id === editingId)
        : undefined;

      if (editingId && (!existing || existing.ownerId !== user.uid)) {
        throw new Error(
          "Janji temu tidak ditemukan atau bukan milik akun ini."
        );
      }

      const now = new Date().toISOString();

      const appointmentData = {
        ownerId: user.uid,
        petName: form.petName.trim(),
        service: form.service,
        date: form.date,
        time: form.time,
        notes: form.notes.trim(),
        status: existing?.status ?? "pending",
        updatedAt: now,
      };

      if (editingId) {
        await update(ref(db, `appointments/${editingId}`), {
          ...appointmentData,
        });

        setMessage("Janji temu berhasil diperbarui.");
      } else {
        const newAppointmentRef = push(ref(db, "appointments"));

        await set(newAppointmentRef, {
          ...appointmentData,
          createdAt: now,
        });

        setMessage("Janji temu berhasil ditambahkan.");
      }

      resetForm();
    } catch (error) {
      console.error("Gagal menyimpan janji temu:", error);

      const errorCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(error.code)
          : "";

      if (errorCode === "PERMISSION_DENIED") {
        setMessage(
          "Akses ditolak Firebase. Periksa Security Rules dan UID pemilik janji temu."
        );
      } else {
        setMessage(
          error instanceof Error
            ? `Gagal menyimpan janji temu: ${error.message}`
            : "Gagal menyimpan janji temu. Periksa koneksi dan aturan Firebase."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(appointment: Appointment) {
    if (!user || appointment.ownerId !== user.uid) {
      setMessage("Kamu tidak memiliki akses untuk mengedit data ini.");
      return;
    }

    setEditingId(appointment.id);

    setForm({
      petName: appointment.petName ?? "",
      service: appointment.service ?? "Konsultasi",
      date: appointment.date ?? "",
      time: appointment.time ?? "",
      notes: appointment.notes ?? "",
    });

    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(appointment: Appointment) {
    if (!user || appointment.ownerId !== user.uid) {
      setMessage("Kamu tidak memiliki akses untuk menghapus data ini.");
      return;
    }

    const confirmed = window.confirm(
      `Hapus janji temu untuk ${appointment.petName}?`
    );

    if (!confirmed) return;

    setMessage("");

    try {
      await remove(ref(db, `appointments/${appointment.id}`));

      if (editingId === appointment.id) {
        resetForm();
      }

      setMessage("Janji temu berhasil dihapus.");
    } catch (error) {
      console.error("Gagal menghapus janji temu:", error);

      const errorCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(error.code)
          : "";

      setMessage(
        errorCode === "PERMISSION_DENIED"
          ? "Firebase menolak penghapusan. Periksa kepemilikan data dan Security Rules."
          : error instanceof Error
            ? `Gagal menghapus janji temu: ${error.message}`
            : "Gagal menghapus janji temu. Periksa aturan Firebase."
      );
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        Memuat janji temu...
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-teal-700">PETSHOPKU</p>
            <h1 className="mt-2 text-3xl font-bold">Janji Temu</h1>
            <p className="mt-2 text-sm text-slate-600">
              Kelola permintaan jadwal layanan hewan peliharaanmu.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 hover:bg-slate-100"
          >
            ← Dashboard
          </button>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            {editingId ? "Edit Janji Temu" : "Tambah Janji Temu"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Formulir ini untuk pengujian awal. Pengajuan oleh pemilik nantinya
            akan diintegrasikan dengan chatbot AI.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-5 grid gap-4 sm:grid-cols-2"
          >
            <label className="text-sm font-medium">
              Nama Hewan
              <input
                required
                maxLength={100}
                value={form.petName}
                onChange={(event) =>
                  setForm({ ...form, petName: event.target.value })
                }
                placeholder="Contoh: Mochi"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
              />
            </label>

            <label className="text-sm font-medium">
              Jenis Layanan
              <select
                value={form.service}
                onChange={(event) =>
                  setForm({ ...form, service: event.target.value })
                }
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
              >
                <option>Konsultasi</option>
                <option>Pemeriksaan</option>
                <option>Vaksinasi</option>
              </select>
            </label>

            <label className="text-sm font-medium">
              Tanggal
              <input
                required
                type="date"
                min={new Date().toLocaleDateString("en-CA")}
                value={form.date}
                onChange={(event) =>
                  setForm({ ...form, date: event.target.value })
                }
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
              />
            </label>

            <label className="text-sm font-medium">
              Waktu
              <input
                required
                type="time"
                value={form.time}
                onChange={(event) =>
                  setForm({ ...form, time: event.target.value })
                }
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
              />
            </label>

            <label className="text-sm font-medium sm:col-span-2">
              Keluhan atau Catatan
              <textarea
                maxLength={1000}
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
                placeholder="Ceritakan kebutuhan atau keluhan hewan..."
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
              />
            </label>

            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {saving
                  ? "Menyimpan..."
                  : editingId
                    ? "Simpan Perubahan"
                    : "Tambah Janji Temu"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-300 px-5 py-3 hover:bg-slate-100"
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>

          {message && (
            <p
              role="status"
              className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-900"
            >
              {message}
            </p>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">
            Daftar Janji Temu ({appointments.length})
          </h2>

          {appointments.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              Belum ada janji temu. Tambahkan satu untuk menguji fitur ini.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {appointments.map((appointment) => (
                <article
                  key={appointment.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">
                        {appointment.petName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {appointment.service}
                      </p>
                    </div>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      {appointment.status}
                    </span>
                  </div>

                  <p className="mt-4 text-sm">
                    <strong>Tanggal:</strong> {appointment.date}
                  </p>
                  <p className="mt-1 text-sm">
                    <strong>Waktu:</strong> {appointment.time}
                  </p>

                  {appointment.notes && (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                      {appointment.notes}
                    </p>
                  )}

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => handleEdit(appointment)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(appointment)}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
