export type ParsedLinkValue = {
  uri: string;
  params: Record<string, string[]>;
};

function isTchar(ch: string): boolean {
  // token = 1*tchar (RFC 7230)
  return /^[!#$%&'*+\-.^_`|~0-9A-Za-z]$/.test(ch);
}

function unquoteQuotedString(s: string): string {
  let x = s.trim();
  if (x.startsWith('"') && x.endsWith('"') && x.length >= 2) {
    x = x.slice(1, -1);
  }
  // quoted-pair: backslash escapes the following char
  let out = "";
  for (let i = 0; i < x.length; i++) {
    const c = x[i];
    if (c === "\\" && i + 1 < x.length) {
      out += x[i + 1];
      i += 1;
    } else {
      out += c;
    }
  }
  return out;
}

function splitLinkHeader(value: string): string[] {
  // Split by commas that are not inside quoted-string and not inside <...>
  const parts: string[] = [];
  let buf = "";
  let inQuotes = false;
  let inAngle = false;
  let escape = false;

  for (let i = 0; i < value.length; i++) {
    const c = value[i];

    if (escape) {
      buf += c;
      escape = false;
      continue;
    }

    if (inQuotes && c === "\\") {
      buf += c;
      escape = true;
      continue;
    }

    if (!inAngle && c === '"') {
      inQuotes = !inQuotes;
      buf += c;
      continue;
    }

    if (!inQuotes && c === "<") {
      inAngle = true;
      buf += c;
      continue;
    }
    if (!inQuotes && c === ">") {
      inAngle = false;
      buf += c;
      continue;
    }

    if (!inQuotes && !inAngle && c === ",") {
      const trimmed = buf.trim();
      if (trimmed) parts.push(trimmed);
      buf = "";
      continue;
    }

    buf += c;
  }

  const trimmed = buf.trim();
  if (trimmed) parts.push(trimmed);
  return parts;
}

function parseParams(paramStr: string): Record<string, string[]> {
  const params: Record<string, string[]> = {};
  let i = 0;

  const skipWs = () => {
    while (i < paramStr.length && /\s/.test(paramStr[i])) i++;
  };

  const readToken = (): string => {
    let t = "";
    while (i < paramStr.length && isTchar(paramStr[i])) {
      t += paramStr[i];
      i++;
    }
    return t;
  };

  const readQuotedOrTokenValue = (): string => {
    skipWs();
    if (paramStr[i] === '"') {
      // read quoted-string including escapes
      const start = i;
      i++; // opening quote
      let escaped = false;
      while (i < paramStr.length) {
        const c = paramStr[i];
        if (escaped) {
          escaped = false;
          i++;
          continue;
        }
        if (c === "\\") {
          escaped = true;
          i++;
          continue;
        }
        if (c === '"') {
          i++; // closing quote
          break;
        }
        i++;
      }
      return unquoteQuotedString(paramStr.slice(start, i));
    }

    // token-ish until semicolon or whitespace
    let v = "";
    while (i < paramStr.length && paramStr[i] !== ";") {
      if (/\s/.test(paramStr[i])) break;
      v += paramStr[i];
      i++;
    }
    return v.trim();
  };

  while (i < paramStr.length) {
    skipWs();
    if (paramStr[i] === ";") i++;
    skipWs();
    if (i >= paramStr.length) break;

    const keyStart = i;
    const key = readToken().toLowerCase();
    if (!key) {
      // skip junk until next ;
      while (i < paramStr.length && paramStr[i] !== ";") i++;
      continue;
    }

    skipWs();
    let values: string[] = [];
    if (paramStr[i] === "=") {
      i++;
      const raw = readQuotedOrTokenValue();
      if (key === "rel") {
        // rel can be space-separated tokens/URIs
        values = raw.split(/\s+/).map((x) => x.trim()).filter(Boolean);
      } else {
        values = [raw];
      }
    } else {
      // boolean parameter
      values = [""];
      if (i === keyStart) i++;
    }

    if (!params[key]) params[key] = [];
    params[key].push(...values);

    // move to next ; or end
    while (i < paramStr.length && paramStr[i] !== ";") i++;
  }

  return params;
}

export function parseLinkHeader(headerValue: string): ParsedLinkValue[] {
  const raw = (headerValue || "").trim();
  if (!raw) return [];

  const entries = splitLinkHeader(raw);
  const out: ParsedLinkValue[] = [];

  for (const entry of entries) {
    const s = entry.trim();
    if (!s.startsWith("<")) continue;
    const gt = s.indexOf(">");
    if (gt <= 1) continue;

    const uri = s.slice(1, gt).trim();
    const paramsStr = s.slice(gt + 1).trim();
    const params = parseParams(paramsStr);
    out.push({ uri, params });
  }

  return out;
}

export function findLinkByRel(headerValue: string, rel: string): string | null {
  const wanted = rel.trim();
  if (!wanted) return null;
  const parsed = parseLinkHeader(headerValue);
  for (const link of parsed) {
    const rels = link.params["rel"] || [];
    if (rels.includes(wanted)) return link.uri;
  }
  return null;
}

export function parseRefundContactEmailFromLinkUri(uri: string): string | null {
  const s = (uri || "").trim();
  if (!s) return null;

  // mailto:user@domain?subject=...
  if (s.toLowerCase().startsWith("mailto:")) {
    const addr = s.slice("mailto:".length).split("?")[0].trim();
    if (addr.length < 3 || addr.length > 320) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) return null;
    return addr;
  }

  // bare email inside <...>
  if (s.length < 3 || s.length > 320) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null;
  return s;
}

