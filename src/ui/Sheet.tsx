import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { CHIP_BG, MUTED, PAGE_BG } from '../app/theme'

export function Sheet({
  title,
  accent,
  onClose,
  children,
}: {
  title: string
  accent: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(30,26,20,0.45)' }} onClick={onClose}>
      <div
        className="w-full rounded-t-3xl px-4 pt-3 pb-6 space-y-4 overflow-y-auto"
        style={{ background: PAGE_BG, maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: '#D8D2C6' }} />
        <div className="flex items-center justify-between">
          <h2 className="font-display" style={{ fontWeight: 500, fontSize: 17, color: accent }}>
            {title}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: CHIP_BG }} aria-label="Закрити">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: MUTED }}>
        {label}
      </p>
      {children}
    </div>
  )
}
