import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, X, Camera, Trash2, Tag, Shirt, ChevronLeft } from "lucide-react";

// ─── Конфігурація ────────────────────────────────────────────
const CHILDREN = {
  son: { label: "Син", age: "8 р.", emoji: "🧒", accent: "#2456C7", soft: "#E9EFFB" },
  daughter: { label: "Донька", age: "3 р.", emoji: "👧", accent: "#D8447C", soft: "#FBE9F1" },
};

const SECTIONS = {
  clothes: { label: "Одяг" },
  shoes: { label: "Взуття" },
  accessories: { label: "Аксесуари" },
};

const CATEGORIES = {
  clothes: ["Футболки", "Лонгсліви", "Світшоти й светри", "Штани", "Шорти", "Сукні та спідниці", "Верхній одяг", "Піжами"],
  shoes: [],
  accessories: ["Шапки", "Рукавиці", "Шарфи", "Інше"],
};

const SIZES = {
  clothes: ["86", "92", "98", "104", "110", "116", "122", "128", "134", "140", "146", "152"],
  shoes: ["22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38"],
  accessories: ["1–3 р.", "4–7 р.", "8+ р.", "Один розмір"],
};

const SEASONS = ["Літо", "Демі", "Зима", "Всесезон"];

const INK = "#2A2622";
const MUTED = "#8B8478";
const PAGE_BG = "#FAF9F6";
const CHIP_BG = "#EFECE5";

// ─── Стиснення фото ──────────────────────────────────────────
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 700;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("read failed")); };
    img.src = url;
  });
}

// ─── Чіп-бірочка (фішка дизайну) ─────────────────────────────
function TagChip({ active, accent, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="relative shrink-0 text-sm font-medium transition-transform active:scale-95"
      style={{
        clipPath: "polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)",
        background: active ? accent : CHIP_BG,
        color: active ? "#fff" : INK,
        padding: "7px 14px 7px 22px",
        borderRadius: "6px",
      }}
    >
      <span
        className="absolute rounded-full"
        style={{ width: 6, height: 6, left: 10, top: "50%", transform: "translateY(-50%)", background: PAGE_BG }}
      />
      {children}
    </button>
  );
}

function PillChip({ active, accent, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-full text-sm font-medium px-3.5 py-1.5 transition-transform active:scale-95"
      style={{ background: active ? accent : CHIP_BG, color: active ? "#fff" : INK }}
    >
      {children}
    </button>
  );
}

// ─── Головний компонент ──────────────────────────────────────
export default function Shafka() {
  const [items, setItems] = useState([]);
  const [photos, setPhotos] = useState({});
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState("daughter");
  const [section, setSection] = useState("clothes");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState("");

  const accent = CHILDREN[child].accent;

  // ── Завантаження при старті ──
  useEffect(() => {
    (async () => {
      let meta = [];
      try {
        const r = await window.storage.get("meta");
        if (r && r.value) meta = JSON.parse(r.value);
      } catch (e) { /* ще нічого не збережено */ }
      setItems(meta);
      setLoading(false);
      meta.forEach(async (it) => {
        if (!it.hasPhoto) return;
        try {
          const p = await window.storage.get("photo:" + it.id);
          if (p && p.value) setPhotos((prev) => ({ ...prev, [it.id]: p.value }));
        } catch (e) { /* фото не знайдено */ }
      });
    })();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const persistMeta = async (newItems) => {
    setItems(newItems);
    try {
      await window.storage.set("meta", JSON.stringify(newItems));
    } catch (e) {
      showToast("Не вдалося зберегти 😞 Спробуй ще раз");
    }
  };

  const addItem = async (draft, photoData) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    if (photoData) {
      try {
        await window.storage.set("photo:" + id, photoData);
        setPhotos((prev) => ({ ...prev, [id]: photoData }));
      } catch (e) {
        showToast("Фото завелике, збережено без нього");
        photoData = null;
      }
    }
    const item = { ...draft, id, hasPhoto: !!photoData, createdAt: Date.now() };
    await persistMeta([...items, item]);
    showToast("Додано в шафку ✓");
  };

  const updateItem = async (id, patch) => {
    await persistMeta(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const deleteItem = async (id) => {
    await persistMeta(items.filter((it) => it.id !== id));
    try { await window.storage.delete("photo:" + id); } catch (e) { /* ok */ }
    setDetail(null);
    showToast("Видалено");
  };

  // ── Фільтрація ──
  const scoped = useMemo(
    () => items.filter((it) => it.child === child && it.section === section),
    [items, child, section]
  );

  const sizesPresent = useMemo(() => {
    const counts = {};
    scoped.forEach((it) => { counts[it.size] = (counts[it.size] || 0) + 1; });
    return SIZES[section].filter((s) => counts[s]).map((s) => ({ size: s, count: counts[s] }));
  }, [scoped, section]);

  const afterSize = useMemo(
    () => (sizeFilter === "all" ? scoped : scoped.filter((it) => it.size === sizeFilter)),
    [scoped, sizeFilter]
  );

  const catsPresent = useMemo(() => {
    const counts = {};
    afterSize.forEach((it) => { counts[it.category] = (counts[it.category] || 0) + 1; });
    return Object.entries(counts).map(([c, n]) => ({ cat: c, count: n }));
  }, [afterSize]);

  const visible = useMemo(
    () => (catFilter === "all" ? afterSize : afterSize.filter((it) => it.category === catFilter)),
    [afterSize, catFilter]
  );

  const switchChild = (c) => { setChild(c); setSizeFilter("all"); setCatFilter("all"); };
  const switchSection = (s) => { setSection(s); setSizeFilter("all"); setCatFilter("all"); };

  return (
    <div className="min-h-screen pb-28" style={{ background: PAGE_BG, color: INK, fontFamily: "'Rubik', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600&family=Rubik:wght@400;500;600&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; }
      `}</style>

      {/* ── Шапка ── */}
      <header className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Shirt size={22} strokeWidth={2.2} style={{ color: accent }} />
          <h1 style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 600, fontSize: 20, letterSpacing: "-0.02em" }}>
            Шафка
          </h1>
        </div>

        {/* Перемикач дітей */}
        <div className="flex gap-2 mt-4">
          {Object.entries(CHILDREN).map(([key, c]) => {
            const active = child === key;
            return (
              <button
                key={key}
                onClick={() => switchChild(key)}
                className="flex-1 flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 transition-transform active:scale-[0.97]"
                style={{
                  background: active ? c.soft : "#fff",
                  border: `2px solid ${active ? c.accent : "#EAE6DE"}`,
                }}
              >
                <span className="text-2xl">{c.emoji}</span>
                <span className="text-left leading-tight">
                  <span className="block font-semibold text-[15px]" style={{ color: active ? c.accent : INK }}>{c.label}</span>
                  <span className="block text-xs" style={{ color: MUTED }}>{c.age}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Секції */}
        <div className="flex gap-2 mt-3">
          {Object.entries(SECTIONS).map(([key, s]) => (
            <PillChip key={key} active={section === key} accent={accent} onClick={() => switchSection(key)}>
              {s.label}
            </PillChip>
          ))}
        </div>
      </header>

      {/* ── Розміри-бірочки ── */}
      {sizesPresent.length > 0 && (
        <div className="flex gap-2 px-4 py-1 overflow-x-auto no-scrollbar">
          <TagChip active={sizeFilter === "all"} accent={accent} onClick={() => { setSizeFilter("all"); setCatFilter("all"); }}>
            Всі · {scoped.length}
          </TagChip>
          {sizesPresent.map(({ size, count }) => (
            <TagChip key={size} active={sizeFilter === size} accent={accent} onClick={() => { setSizeFilter(size); setCatFilter("all"); }}>
              {size} · {count}
            </TagChip>
          ))}
        </div>
      )}

      {/* ── Категорії ── */}
      {catsPresent.length > 1 && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
          <PillChip active={catFilter === "all"} accent={accent} onClick={() => setCatFilter("all")}>Всі</PillChip>
          {catsPresent.map(({ cat, count }) => (
            <PillChip key={cat} active={catFilter === cat} accent={accent} onClick={() => setCatFilter(cat)}>
              {cat} · {count}
            </PillChip>
          ))}
        </div>
      )}

      {/* ── Сітка ── */}
      <main className="px-4 pt-2">
        {loading ? (
          <p className="text-center py-16 text-sm" style={{ color: MUTED }}>Відкриваю шафку…</p>
        ) : visible.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">👕</div>
            <p className="font-medium">Тут поки порожньо</p>
            <p className="text-sm mt-1" style={{ color: MUTED }}>Натисни «+», щоб додати першу річ</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {visible.map((it) => (
              <button key={it.id} onClick={() => setDetail(it)} className="text-left transition-transform active:scale-[0.97]">
                <div className="relative aspect-square rounded-xl overflow-hidden" style={{ background: "#fff", border: "1px solid #EAE6DE" }}>
                  {photos[it.id] ? (
                    <img src={photos[it.id]} alt={it.category} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">👕</div>
                  )}
                  {it.status === "new" && (
                    <span className="absolute top-1.5 right-1.5 rounded-full p-1" style={{ background: "#FFF6DE" }}>
                      <Tag size={12} style={{ color: "#B8860B" }} />
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs font-medium truncate">{it.size} · {it.category}</p>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* ── FAB ── */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90"
        style={{ background: accent, color: "#fff" }}
        aria-label="Додати річ"
      >
        <Plus size={28} />
      </button>

      {/* ── Тост ── */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm text-white shadow-lg" style={{ background: INK }}>
          {toast}
        </div>
      )}

      {showAdd && (
        <AddSheet
          defaultChild={child}
          defaultSection={section}
          onClose={() => setShowAdd(false)}
          onSave={async (draft, photo) => { setShowAdd(false); await addItem(draft, photo); }}
        />
      )}

      {detail && (
        <DetailSheet
          item={items.find((i) => i.id === detail.id) || detail}
          photo={photos[detail.id]}
          onClose={() => setDetail(null)}
          onToggleStatus={(it) => updateItem(it.id, { status: it.status === "new" ? "worn" : "new" })}
          onDelete={(it) => deleteItem(it.id)}
        />
      )}
    </div>
  );
}

// ─── Форма додавання ─────────────────────────────────────────
function AddSheet({ defaultChild, defaultSection, onClose, onSave }) {
  const [draft, setDraft] = useState({
    child: defaultChild,
    section: defaultSection,
    category: defaultSection === "shoes" ? "Взуття" : "",
    size: "",
    season: "",
    color: "",
    note: "",
    status: "new",
  });
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const accent = CHILDREN[draft.child].accent;

  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const pickSection = (s) => {
    setDraft((d) => ({ ...d, section: s, category: s === "shoes" ? "Взуття" : "", size: "" }));
  };

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    try {
      const data = await compressImage(file);
      setPhoto(data);
    } catch (err) {
      /* не вдалося прочитати файл */
    }
    setBusy(false);
  };

  const canSave = draft.size && (draft.section === "shoes" || draft.category);

  return (
    <Sheet onClose={onClose} title="Нова річ" accent={accent}>
      {/* Фото */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        onClick={() => fileRef.current && fileRef.current.click()}
        className="w-full rounded-2xl overflow-hidden flex items-center justify-center"
        style={{ border: "2px dashed #D8D2C6", background: "#fff", height: photo ? "auto" : 120 }}
      >
        {photo ? (
          <img src={photo} alt="Фото речі" className="w-full max-h-64 object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-sm" style={{ color: MUTED }}>
            <Camera size={26} />
            {busy ? "Стискаю фото…" : "Додати фото або скріншот"}
          </span>
        )}
      </button>

      <Field label="Чия річ">
        <div className="flex gap-2">
          {Object.entries(CHILDREN).map(([key, c]) => (
            <PillChip key={key} active={draft.child === key} accent={c.accent} onClick={() => setField("child", key)}>
              {c.emoji} {c.label}
            </PillChip>
          ))}
        </div>
      </Field>

      <Field label="Секція">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(SECTIONS).map(([key, s]) => (
            <PillChip key={key} active={draft.section === key} accent={accent} onClick={() => pickSection(key)}>
              {s.label}
            </PillChip>
          ))}
        </div>
      </Field>

      {CATEGORIES[draft.section].length > 0 && (
        <Field label="Категорія">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES[draft.section].map((c) => (
              <PillChip key={c} active={draft.category === c} accent={accent} onClick={() => setField("category", c)}>
                {c}
              </PillChip>
            ))}
          </div>
        </Field>
      )}

      <Field label="Розмір">
        <div className="flex gap-2 flex-wrap">
          {SIZES[draft.section].map((s) => (
            <TagChip key={s} active={draft.size === s} accent={accent} onClick={() => setField("size", s)}>
              {s}
            </TagChip>
          ))}
        </div>
      </Field>

      <Field label="Сезон (необовʼязково)">
        <div className="flex gap-2 flex-wrap">
          {SEASONS.map((s) => (
            <PillChip key={s} active={draft.season === s} accent={accent} onClick={() => setField("season", draft.season === s ? "" : s)}>
              {s}
            </PillChip>
          ))}
        </div>
      </Field>

      <Field label="Колір (необовʼязково)">
        <input
          value={draft.color}
          onChange={(e) => setField("color", e.target.value)}
          placeholder="напр. рожевий з квіточками"
          className="w-full rounded-xl px-3.5 py-2.5 text-[15px] outline-none"
          style={{ background: "#fff", border: "1.5px solid #EAE6DE" }}
        />
      </Field>

      <Field label="Статус">
        <div className="flex gap-2">
          <PillChip active={draft.status === "new"} accent={accent} onClick={() => setField("status", "new")}>🏷️ Нове з етикеткою</PillChip>
          <PillChip active={draft.status === "worn"} accent={accent} onClick={() => setField("status", "worn")}>Вже носить</PillChip>
        </div>
      </Field>

      <button
        disabled={!canSave || busy}
        onClick={() => onSave(draft, photo)}
        className="w-full rounded-2xl py-3.5 font-semibold text-white text-[15px] mt-1 transition-transform active:scale-[0.98]"
        style={{ background: canSave ? accent : "#CFC9BD" }}
      >
        Зберегти в шафку
      </button>
      {!canSave && (
        <p className="text-xs text-center -mt-1" style={{ color: MUTED }}>
          Обери {draft.section !== "shoes" && !draft.category ? "категорію і " : ""}розмір
        </p>
      )}
    </Sheet>
  );
}

// ─── Перегляд речі ───────────────────────────────────────────
function DetailSheet({ item, photo, onClose, onToggleStatus, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const c = CHILDREN[item.child];

  return (
    <Sheet onClose={onClose} title={item.category} accent={c.accent}>
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #EAE6DE" }}>
        {photo ? (
          <img src={photo} alt={item.category} className="w-full max-h-80 object-contain" />
        ) : (
          <div className="h-40 flex items-center justify-center text-5xl">👕</div>
        )}
      </div>

      <div className="rounded-2xl p-4 space-y-2 text-[15px]" style={{ background: "#fff", border: "1px solid #EAE6DE" }}>
        <Row k="Дитина" v={`${c.emoji} ${c.label} (${c.age})`} />
        <Row k="Розмір" v={item.size} />
        {item.season && <Row k="Сезон" v={item.season} />}
        {item.color && <Row k="Колір" v={item.color} />}
        <Row k="Статус" v={item.status === "new" ? "🏷️ Нове з етикеткою" : "Вже носить"} />
        {item.note && <Row k="Нотатка" v={item.note} />}
      </div>

      <button
        onClick={() => onToggleStatus(item)}
        className="w-full rounded-2xl py-3 font-medium text-[15px]"
        style={{ background: c.soft, color: c.accent }}
      >
        {item.status === "new" ? "Позначити «вже носить»" : "Повернути «нове з етикеткою»"}
      </button>

      {confirmDel ? (
        <div className="flex gap-2">
          <button onClick={() => onDelete(item)} className="flex-1 rounded-2xl py-3 font-medium text-white" style={{ background: "#C0392B" }}>
            Так, видалити
          </button>
          <button onClick={() => setConfirmDel(false)} className="flex-1 rounded-2xl py-3 font-medium" style={{ background: CHIP_BG }}>
            Скасувати
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirmDel(true)} className="w-full rounded-2xl py-3 font-medium flex items-center justify-center gap-2" style={{ background: CHIP_BG, color: "#8A3A30" }}>
          <Trash2 size={17} /> Видалити річ
        </button>
      )}
    </Sheet>
  );
}

// ─── Спільні дрібнички ───────────────────────────────────────
function Sheet({ title, accent, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "rgba(30,26,20,0.45)" }} onClick={onClose}>
      <div
        className="w-full rounded-t-3xl px-4 pt-3 pb-6 space-y-4 overflow-y-auto"
        style={{ background: PAGE_BG, maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: "#D8D2C6" }} />
        <div className="flex items-center justify-between">
          <h2 style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 500, fontSize: 17, color: accent }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: CHIP_BG }} aria-label="Закрити">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: MUTED }}>{label}</p>
      {children}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-3">
      <span style={{ color: MUTED }}>{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}
