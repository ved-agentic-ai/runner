// Pure client-and-server safe environment variable sanitizer
export function sanitizeEnvContent(rawContent: string): { sanitized: string; redactedKeys: string[] } {
  const redactedKeys: string[] = [];

  const sensitiveKeywords = [
    'KEY', 'SECRET', 'PASSWORD', 'PASS', 'TOKEN', 'CREDENTIAL', 
    'PRIVATE', 'AUTH', 'PWD', 'SALT', 'CERT', 'API_KEY', 'DATABASE_URL',
    'APP-KEY', 'APP_KEY', 'APPKEY', 'CLIENT_SECRET', 'ACCESS_TOKEN', 'JWT', 'BEARER'
  ];

  // Handle Postman Environment JSON format
  const trimmed = rawContent.trim();
  if (trimmed.startsWith('{')) {
    try {
      const json = JSON.parse(trimmed);
      let modified = false;

      if (json.values && Array.isArray(json.values)) {
        json.values = json.values.map((item: any) => {
          if (item && item.key) {
            const upperKey = item.key.toUpperCase();
            const isSensitive = sensitiveKeywords.some((k) => upperKey.includes(k));
            if (isSensitive) {
              redactedKeys.push(item.key);
              modified = true;
              return { ...item, value: '[REDACTED_SECRET]' };
            }
          }
          return item;
        });
      }

      if (modified) {
        return {
          sanitized: JSON.stringify(json, null, 2),
          redactedKeys
        };
      }
    } catch {}
  }

  // Handle raw line-by-line .env format
  const lines = rawContent.split('\n');
  const sanitizedLines = lines.map((line) => {
    const lineTrimmed = line.trim();
    if (!lineTrimmed || lineTrimmed.startsWith('#')) return line;

    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) return line;

    const key = line.substring(0, eqIdx).trim();
    const value = line.substring(eqIdx + 1).trim();

    const upperKey = key.toUpperCase();
    const isSensitive = sensitiveKeywords.some((keyword) => upperKey.includes(keyword));

    if (isSensitive && value && !value.includes('[REDACTED_SECRET]')) {
      redactedKeys.push(key);
      return `${key}=[REDACTED_SECRET]`;
    }

    return line;
  });

  return {
    sanitized: sanitizedLines.join('\n'),
    redactedKeys
  };
}
