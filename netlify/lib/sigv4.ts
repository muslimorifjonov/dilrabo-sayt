/**
 * AWS Signature V4 — presigned URL (query-string auth). Cloudflare R2 S3-mos API’si uchun.
 * Tashqi kutubxonasiz: faqat node:crypto. AWS hujjatidagi rasmiy test vektori bilan tekshirilgan.
 */
import { createHash, createHmac } from 'node:crypto';

export interface PresignOptions {
  method: 'GET' | 'HEAD' | 'PUT' | 'DELETE';
  /** Masalan `abc123.r2.cloudflarestorage.com` */
  host: string;
  /** Kodlanmagan segmentlar: ['bucket', 'certificates', '2026', 'x-lg.webp'] */
  pathSegments: string[];
  accessKeyId: string;
  secretAccessKey: string;
  /** R2 uchun doim 'auto' */
  region: string;
  service?: string;
  /** Amal qilish muddati, soniya (1…604800) */
  expires: number;
  /** Imzoga kiradigan qo‘shimcha sarlavhalar — so‘rovda aynan shu qiymat bilan yuborilishi shart */
  headers?: Record<string, string>;
  date?: Date;
}

/** RFC 3986 bo‘yicha kodlash (AWS talabi) */
export function uriEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

const sha256Hex = (data: string): string => createHash('sha256').update(data, 'utf8').digest('hex');
const hmac = (key: string | Buffer, data: string): Buffer =>
  createHmac('sha256', key).update(data, 'utf8').digest();

export function presignUrl(o: PresignOptions): string {
  const service = o.service ?? 's3';
  const now = o.date ?? new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // 20130524T000000Z
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/${o.region}/${service}/aws4_request`;

  const headers: Record<string, string> = { host: o.host };
  for (const [k, v] of Object.entries(o.headers ?? {})) headers[k.toLowerCase()] = v;
  const headerNames = Object.keys(headers).sort();
  const signedHeaders = headerNames.join(';');
  const canonicalHeaders = headerNames
    .map((k) => `${k}:${(headers[k] ?? '').trim().replace(/\s+/g, ' ')}\n`)
    .join('');

  const canonicalPath = `/${o.pathSegments.map(uriEncode).join('/')}`;

  const query: [string, string][] = [
    ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', `${o.accessKeyId}/${scope}`],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', String(o.expires)],
    ['X-Amz-SignedHeaders', signedHeaders],
  ];
  const canonicalQuery = query
    .map(([k, v]) => [uriEncode(k), uriEncode(v)] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const canonicalRequest = [
    o.method,
    canonicalPath,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest)].join('\n');

  const kDate = hmac(`AWS4${o.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, o.region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

  return `https://${o.host}${canonicalPath}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
