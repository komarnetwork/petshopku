
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
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

type Pet = {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  notes: string;
};

const emptyForm = {
  name: "",
  species: "Kucing",
  breed: "",
  age: "",
  gender: "Jantan",
  notes: "",
};

export default function HewanPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setPets([]);
        setLoading(false);
        router.replace("/masuk");
      } else {
        setLoading(true);
      }
    });

    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const petsQuery = query(
      ref(db, "pets"),
      orderByChild("ownerId"),
      equalTo(user.uid)
    );

    const unsubscribe = onValue(
      petsQuery,
      (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setPets([]);
        } else {
          const petList: Pet[] = Object.entries(data).map(
            ([id, value]) => ({
              id,
              ...(value as Omit<Pet, "id">),
            })
          );

          setPets(petList);
        }

        setLoading(false);
      },
      (err) => {
        setError("Gagal memuat data hewan: " + err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setError("Silakan login terlebih dahulu.");
      return;
    }

    if (!form.name.trim()) {
      setError("Nama hewan wajib diisi.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const petData = {
      ownerId: user.uid,
      name: form.name.trim(),
      species: form.species,
      breed: form.breed.trim(),
      age: form.age.trim(),
      gender: form.gender,
      notes: form.notes.trim(),
    };

    try {
      if (editingId) {
        await update(ref(db, `pets/${editingId}`), petData);
        setMessage("Data hewan berhasil diperbarui!");
      } else {
        const newPetRef = push(ref(db, "pets"));
        await set(newPetRef, petData);
        setMessage("Data hewan berhasil ditambahkan!");
      }

      setForm({ ...emptyForm });
      setEditingId(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan data."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(pet: Pet) {
    setEditingId(pet.id);
    setForm({
      name: pet.name ?? "",
      species: pet.species ?? "Kucing",
      breed: pet.breed ?? "",
      age: pet.age ?? "",
      gender: pet.gender ?? "Jantan",
      notes: pet.notes ?? "",
    });
    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(pet: Pet) {
    const confirmed = window.confirm(
      `Yakin ingin menghapus data ${pet.name}?`
    );

    if (!confirmed || !user) return;

    setError("");
    setMessage("");

    try {
      await remove(ref(db, `pets/${pet.id}`));

      if (editingId === pet.id) {
        setEditingId(null);
        setForm({ ...emptyForm });
      }

      setMessage("Data hewan berhasil dihapus.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus data hewan."
      );
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setMessage("");
    setError("");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-center text-slate-600">
        Memuat data hewan...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-teal-700">
              PETSHOPKU
            </p>
            <h1 className="text-3xl font-bold">Data Hewan Peliharaan</h1>
            <p className="mt-2 text-slate-600">
              Kelola informasi hewan kesayanganmu di sini.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium hover:bg-slate-100"
          >
            Kembali ke Beranda
          </button>
        </header>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">
            {editingId ? "Edit Data Hewan" : "Tambah Hewan Baru"}
          </h2>

          {message && (
            <p
              role="status"
              className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700"
            >
              {message}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium">
                  Nama Hewan *
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Mochi"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label htmlFor="species" className="mb-1 block text-sm font-medium">
                  Jenis Hewan
                </label>
                <select
                  id="species"
                  name="species"
                  value={form.species}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option>Kucing</option>
                  <option>Anjing</option>
                  <option>Kelinci</option>
                  <option>Burung</option>
                  <option>Hamster</option>
                  <option>Lainnya</option>
                </select>
              </div>

              <div>
                <label htmlFor="breed" className="mb-1 block text-sm font-medium">
                  Ras
                </label>
                <input
                  id="breed"
                  name="breed"
                  value={form.breed}
                  onChange={handleChange}
                  placeholder="Contoh: Persia"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="age" className="mb-1 block text-sm font-medium">
                  Usia
                </label>
                <input
                  id="age"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Contoh: 2 tahun"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="gender" className="mb-1 block text-sm font-medium">
                  Jenis Kelamin
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option>Jantan</option>
                  <option>Betina</option>
                  <option>Tidak diketahui</option>
                </select>
              </div>

              <div>
                <label htmlFor="notes" className="mb-1 block text-sm font-medium">
                  Catatan
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Alergi, kebiasaan, atau catatan lain"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-teal-700 px-5 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {saving
                  ? "Menyimpan..."
                  : editingId
                    ? "Simpan Perubahan"
                    : "Tambah Hewan"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 hover:bg-slate-100"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold">
            Hewan Peliharaanku ({pets.length})
          </h2>

          {pets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-lg font-semibold">Belum ada data hewan</p>
              <p className="mt-2 text-slate-500">
                Tambahkan hewan peliharaan pertamamu melalui formulir di atas.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet) => (
                <article
                  key={pet.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">{pet.name}</h3>
                      <p className="text-sm text-teal-700">{pet.species}</p>
                    </div>
                    <span className="text-3xl" aria-hidden="true">
                      {pet.species === "Kucing"
                        ? "🐱"
                        : pet.species === "Anjing"
                          ? "🐶"
                          : pet.species === "Burung"
                            ? "🐦"
                            : "🐾"}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-slate-600">
                    <p>Ras: {pet.breed || "-"}</p>
                    <p>Usia: {pet.age || "-"}</p>
                    <p>Jenis kelamin: {pet.gender || "-"}</p>
                    <p>Catatan: {pet.notes || "-"}</p>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(pet)}
                      className="flex-1 rounded-lg border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(pet)}
                      className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
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
