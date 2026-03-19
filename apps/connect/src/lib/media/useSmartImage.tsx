import { useState } from "react";

export function SmartImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [fit, setFit] = useState<"cover" | "contain">("cover");

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;

    // seuil à ajuster (ici ~carré entre 0.8 et 1.25)
    if (ratio > 0.8 && ratio < 1.25) {
      setFit("cover");
    } else {
      setFit("contain");
    }
  }

  return (
    <img
      src={src}
      alt={alt}
      onLoad={handleLoad}
      className={`h-full w-full ${
        fit === "cover" ? "object-cover" : "object-contain"
      }`}
    />
  );
}