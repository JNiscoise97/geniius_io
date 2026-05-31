import { AlertTriangleIcon } from "lucide-react";
import { useState, useEffect } from "react";

export function ImageAvatar({ src, alt, sizeClass }: { src: string; alt: string; sizeClass: string }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => { setBroken(false) }, [src])

  if (broken) {
    return (
      <div className={['flex shrink-0 items-center justify-center rounded-[10px] font-semibold tracking-wide', sizeClass, 'bg-red-100 text-red-500'].join(' ')}>
        <AlertTriangleIcon size={18} />
      </div>
    )
  }

  return (
    <div className={['shrink-0 overflow-hidden rounded-[10px]', sizeClass].join(' ')}>
      <img src={src} alt={alt} className="h-full w-full object-cover" onError={() => setBroken(true)} />
    </div>
  )
}