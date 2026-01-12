//imageCompress.ts

export type CompressOptions = {
  maxSize: number;     // ex 1600 px
  quality: number;     // 0.6–0.85
  mimeType: "image/jpeg" | "image/webp";
};

export async function compressImageFile(file: File, opts: CompressOptions): Promise<Blob> {
  const img = await loadImage(file);
  const { width, height } = fitInside(img.width, img.height, opts.maxSize);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Compression failed"))),
      opts.mimeType,
      opts.quality
    );
  });

  return blob;
}

function fitInside(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w / h;
  if (ratio >= 1) {
    return { width: max, height: Math.round(max / ratio) };
  }
  return { width: Math.round(max * ratio), height: max };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image"));
    };
    img.src = url;
  });
}
