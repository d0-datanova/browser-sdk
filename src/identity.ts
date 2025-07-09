export function generateAnonymousId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);

  return `anon-${timestamp}-${random}`;
}

export function generateFingerprint(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);

  return `fp-${timestamp}-${random}`;
}
