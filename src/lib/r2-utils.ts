export async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  data: ArrayBuffer | ReadableStream | string,
  contentType?: string
): Promise<R2Object> {
  return await bucket.put(key, data, {
    httpMetadata: contentType ? { contentType } : undefined,
  });
}

export async function downloadFromR2(
  bucket: R2Bucket,
  key: string
): Promise<R2ObjectBody | null> {
  return await bucket.get(key);
}

export async function uploadJson(
  bucket: R2Bucket,
  key: string,
  data: unknown
): Promise<R2Object> {
  return await bucket.put(key, JSON.stringify(data), {
    httpMetadata: { contentType: 'application/json' },
  });
}

export async function downloadJson<T>(
  bucket: R2Bucket,
  key: string
): Promise<T | null> {
  const obj = await bucket.get(key);
  if (!obj) return null;
  return JSON.parse(await obj.text()) as T;
}

export function buildAssetR2Key(date: string, type: string, filename: string): string {
  return `${date}/${type}/${filename}`;
}

export function buildRenderR2Key(date: string, filename: string): string {
  return `${date}/${filename}`;
}
