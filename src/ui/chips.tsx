import type { ReactNode } from 'react'
import { CHIP_BG, INK, PAGE_BG } from '../app/theme'

interface ChipProps {
  active: boolean
  accent: string
  onClick: () => void
  children: ReactNode
}

/** Signature detail: size chip shaped like a clothing swing tag (clipped corner + punched hole) */
export function TagChip({ active, accent, onClick, children }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className="relative shrink-0 text-sm font-medium transition-transform active:scale-95"
      style={{
        clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)',
        background: active ? accent : CHIP_BG,
        color: active ? '#fff' : INK,
        padding: '7px 14px 7px 22px',
        borderRadius: '6px',
      }}
    >
      <span
        className="absolute rounded-full"
        style={{ width: 6, height: 6, left: 10, top: '50%', transform: 'translateY(-50%)', background: PAGE_BG }}
      />
      {children}
    </button>
  )
}

export function PillChip({ active, accent, onClick, children }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-full text-sm font-medium px-3.5 py-1.5 transition-transform active:scale-95"
      style={{ background: active ? accent : CHIP_BG, color: active ? '#fff' : INK }}
    >
      {children}
    </button>
  )
}
