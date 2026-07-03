import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Download, Upload } from 'lucide-react'
import { db } from '../../data/db'
import { CARD_BORDER, CHIP_BG, MUTED } from '../../app/theme'
import { Field, Sheet } from '../../ui/Sheet'
import { BackupError, exportBackup, importBackup } from './backup'

export function itemsWord(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'річ'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'речі'
  return 'речей'
}

export function BackupSheet({
  accent,
  onClose,
  onDone,
}: {
  accent: string
  onClose: () => void
  onDone: (message: string) => void
}) {
  const [busy, setBusy] = useState<'export' | 'import' | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const itemCount = useLiveQuery(() => db.items.count(), [])
  const photoCount = useLiveQuery(() => db.photos.count(), [])
  const lastExport = useLiveQuery(async () => (await db.settings.get('lastExportAt'))?.value as string | undefined, [])

  const doExport = async () => {
    setBusy('export')
    setError('')
    try {
      const { blob, fileName } = await exportBackup()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      onDone('Архів збережено 📦')
    } catch {
      setError('Не вдалося створити архів — спробуй ще раз')
    } finally {
      setBusy(null)
    }
  }

  const doImport = async (file: File | undefined) => {
    if (!file) return
    setBusy('import')
    setError('')
    try {
      const r = await importBackup(file)
      onDone(
        r.items || r.photos || r.children
          ? `Відновлено: ${r.items} ${itemsWord(r.items)}, ${r.photos} фото${r.skippedItems ? ` · пропущено ${r.skippedItems} дублікатів` : ''}`
          : 'Все вже на місці — нових записів немає',
      )
    } catch (e) {
      setError(e instanceof BackupError ? e.message : 'Не вдалося прочитати архів')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Sheet onClose={onClose} title="Резервна копія" accent={accent}>
      <div className="rounded-2xl p-4 text-[15px] space-y-1" style={{ background: '#fff', border: `1px solid ${CARD_BORDER}` }}>
        <p>
          У шафці: <b>{itemCount ?? '…'}</b> {itemsWord(itemCount ?? 0)}, <b>{photoCount ?? '…'}</b> фото
        </p>
        <p className="text-sm" style={{ color: MUTED }}>
          {lastExport
            ? `Остання копія: ${new Date(lastExport).toLocaleDateString('uk-UA')}`
            : 'Резервна копія ще не створювалась'}
        </p>
      </div>

      <Field label="Зберегти копію">
        <button
          onClick={() => void doExport()}
          disabled={busy !== null}
          className="w-full rounded-2xl py-3.5 font-semibold text-white text-[15px] flex items-center justify-center gap-2"
          style={{ background: accent }}
        >
          <Download size={18} />
          {busy === 'export' ? 'Пакую…' : 'Експортувати архів'}
        </button>
        <p className="text-xs mt-1.5" style={{ color: MUTED }}>
          Zip-файл з усіма речами та фото. Зберігай його в хмару (Google Drive тощо) — це твій захист від втрати даних.
        </p>
      </Field>

      <Field label="Відновити з копії">
        <input
          ref={fileRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(e) => {
            void doImport(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy !== null}
          className="w-full rounded-2xl py-3.5 font-medium text-[15px] flex items-center justify-center gap-2"
          style={{ background: CHIP_BG }}
        >
          <Upload size={18} />
          {busy === 'import' ? 'Відновлюю…' : 'Імпортувати архів'}
        </button>
        <p className="text-xs mt-1.5" style={{ color: MUTED }}>
          Додаються лише відсутні записи — дублікатів не буде.
        </p>
      </Field>

      {error && (
        <p className="text-sm text-center font-medium" style={{ color: '#C0392B' }}>
          {error}
        </p>
      )}
    </Sheet>
  )
}
