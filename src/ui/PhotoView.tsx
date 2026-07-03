import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../data/db'

// Renders a stored photo blob via a managed object URL.
// kind 'thumb' for grids/lists, 'full' for the item card (step 6).
export function PhotoView({
  photoId,
  kind = 'thumb',
  alt,
  className,
  placeholder = '👕',
}: {
  photoId: string | null
  kind?: 'thumb' | 'full'
  alt: string
  className?: string
  placeholder?: string
}) {
  const photo = useLiveQuery(() => (photoId ? db.photos.get(photoId) : undefined), [photoId])
  const blob = photo ? photo[kind] : undefined
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    if (!blob) {
      setUrl(undefined)
      return
    }
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])

  if (!photoId || !url) {
    return <div className={`flex items-center justify-center ${className ?? ''}`}>{placeholder}</div>
  }
  return <img src={url} alt={alt} className={className} />
}
