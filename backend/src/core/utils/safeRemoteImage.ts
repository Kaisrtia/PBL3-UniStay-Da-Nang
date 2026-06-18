import { lookup } from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { BlockList, isIP } from 'node:net';

const MAX_REDIRECTS = 3;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 10_000;
const ALLOWED_CONTENT_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const blockedAddresses = new BlockList();

[
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4]
].forEach(([address, prefix]) => {
  blockedAddresses.addSubnet(address as string, prefix as number, 'ipv4');
});

[
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
  ['2001:db8::', 32]
].forEach(([address, prefix]) => {
  blockedAddresses.addSubnet(address as string, prefix as number, 'ipv6');
});

const normalizeHostname = (hostname: string) =>
  hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;

const isBlockedAddress = (address: string, family: number) => {
  if (family === 4) {
    return blockedAddresses.check(address, 'ipv4');
  }

  if (address.toLowerCase().startsWith('::ffff:')) {
    const mappedIpv4 = address.slice(address.lastIndexOf(':') + 1);
    if (isIP(mappedIpv4) === 4) {
      return blockedAddresses.check(mappedIpv4, 'ipv4');
    }
  }

  return blockedAddresses.check(address, 'ipv6');
};

const resolvePublicAddress = async (hostname: string) => {
  const normalizedHostname = normalizeHostname(hostname);
  const addresses = await lookup(normalizedHostname, {
    all: true,
    verbatim: true
  });

  if (
    addresses.length === 0 ||
    addresses.some(({ address, family }) => isBlockedAddress(address, family))
  ) {
    throw new Error('Image URL resolves to a non-public network address');
  }

  return addresses[0];
};

const validateUrl = (value: string) => {
  const url = new URL(value);

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Image URL must use HTTP or HTTPS');
  }

  if (url.username || url.password) {
    throw new Error('Image URL must not contain credentials');
  }

  if (url.port && url.port !== '80' && url.port !== '443') {
    throw new Error('Image URL uses a disallowed port');
  }

  return url;
};

const downloadImage = async (url: URL, redirectsRemaining: number): Promise<Buffer> => {
  const resolvedAddress = await resolvePublicAddress(url.hostname);
  const requestClient = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = requestClient.get(
      url,
      {
        headers: {
          Accept: Array.from(ALLOWED_CONTENT_TYPES).join(', '),
          'User-Agent': 'UniStay-Image-Moderation/1.0'
        },
        lookup: (_hostname, options, callback) => {
          if ((options as { all?: boolean }).all) {
            callback(null, [resolvedAddress]);
            return;
          }

          callback(null, resolvedAddress.address, resolvedAddress.family);
        }
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;
        const location = response.headers.location;

        if (
          [301, 302, 303, 307, 308].includes(statusCode) &&
          location
        ) {
          response.resume();
          if (redirectsRemaining === 0) {
            reject(new Error('Image URL has too many redirects'));
            return;
          }

          let redirectUrl: URL;
          try {
            redirectUrl = validateUrl(new URL(location, url).toString());
          } catch (error) {
            reject(error);
            return;
          }

          downloadImage(redirectUrl, redirectsRemaining - 1).then(resolve, reject);
          return;
        }

        if (statusCode < 200 || statusCode >= 300) {
          response.resume();
          reject(new Error(`Unable to fetch image. HTTP status ${statusCode}`));
          return;
        }

        const contentType = response.headers['content-type']
          ?.split(';')[0]
          .trim()
          .toLowerCase();
        if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) {
          response.resume();
          reject(new Error('Remote resource is not a supported image type'));
          return;
        }

        const contentLength = Number(response.headers['content-length']);
        if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
          response.resume();
          reject(new Error('Image exceeds the maximum allowed size'));
          return;
        }

        const chunks: Buffer[] = [];
        let totalBytes = 0;

        response.on('data', (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_IMAGE_BYTES) {
            response.destroy(new Error('Image exceeds the maximum allowed size'));
            return;
          }
          chunks.push(chunk);
        });
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error('Image download timed out'));
    });
    request.on('error', reject);
  });
};

export const fetchSafeRemoteImage = async (imageUrl: string) => {
  const url = validateUrl(imageUrl);
  return downloadImage(url, MAX_REDIRECTS);
};
