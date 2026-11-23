/**
 * Lecture d'un fichier CSV (RFC 4180) : guillemets, retours à la ligne dans une cellule, séparateur virgule,
 * point-virgule (Excel en français) ou tabulation, détecté sur la première ligne ; BOM ignoré.
 */
export function parseCsv(input: string): { headers: string[]; rows: string[][] } {
  const text = input.replace(/^﻿/, "");
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const count = (c: string) => first.split(c).length - 1;
  const sep = [";", "\t", ","].sort((a, b) => count(b) - count(a))[0];
  const delimiter = count(sep) > 0 ? sep : ",";

  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === "") quoted = true;
    else if (c === delimiter) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      records.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    records.push(row);
  }
  const lines = records.filter((r) => r.some((v) => v.trim() !== ""));
  const [headers = [], ...rows] = lines;
  return { headers: headers.map((h) => h.trim()), rows };
}
