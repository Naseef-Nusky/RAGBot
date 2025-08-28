export function chunkText(text, chunkSize = 1200, overlap = 200) {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + chunkSize, clean.length);
    chunks.push(clean.slice(i, end));
    if (end === clean.length) break;
    i = end - overlap;
  }
  return chunks;
}
