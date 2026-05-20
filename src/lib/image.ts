const SUPABASE_STORAGE = "supabase.co/storage/v1/object/public/";
const SUPABASE_TRANSFORM = "supabase.co/storage/v1/render/image/public/";

function isSupabaseStorageUrl(url: string): boolean {
  return url.includes(SUPABASE_STORAGE);
}

function toTransformUrl(url: string, width: number, height?: number, quality = 80): string {
  const transformUrl = url.replace(SUPABASE_STORAGE, SUPABASE_TRANSFORM);
  const params = new URLSearchParams({
    width: String(width),
    format: "webp",
    quality: String(quality),
    resize: "cover",
  });
  if (height) params.set("height", String(height));
  return `${transformUrl}?${params}`;
}

export function optimizeImage(url: string | null | undefined, width: number, height?: number): string {
  if (!url) return "/og-default.jpg";
  if (!isSupabaseStorageUrl(url)) return url;
  return toTransformUrl(url, width, height);
}

export function imageSrcSet(url: string | null | undefined, widths = [400, 800, 1200]): string {
  if (!url || !isSupabaseStorageUrl(url)) return "";
  return widths.map((w) => `${toTransformUrl(url, w)} ${w}w`).join(", ");
}
