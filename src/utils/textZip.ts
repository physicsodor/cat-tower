// Lightweight text compression helpers using lz-string
// - Stores compressed text as an encoded URI component string prefixed with a marker
// - Backward compatible: if no marker, treat as plain text

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

const MARK = "~z~"; // identifies compressed payloads
const MIN_LENGTH = 48; // avoid overhead for very short strings

export const zipText = (s: string): string => {
  if (!s) return s;
  if (s.startsWith(MARK)) return s; // avoid double-compress
  if (s.length < MIN_LENGTH) return s; // tiny strings often get larger
  try {
    const out = compressToEncodedURIComponent(s);
    return MARK + out;
  } catch {
    return s; // fail open
  }
};

export const unzipText = (s: string): string => {
  if (!s || !s.startsWith(MARK)) return s;
  try {
    return decompressFromEncodedURIComponent(s.slice(MARK.length)) ?? "";
  } catch {
    return s; // fail open
  }
};
