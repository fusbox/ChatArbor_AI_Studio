import fs from 'fs/promises';

export const writeCsv = async (results: any[], outPath: string) => {
  // Flatten results into CSV rows
  if (!results || results.length === 0) {
    await fs.writeFile(outPath, '', 'utf8');
    return;
  }

  const headers = new Set<string>();
  results.forEach(r => Object.keys(r).forEach(k => headers.add(k)));
  const headerList = Array.from(headers);

  const rows = [headerList.join(',')];
  for (const r of results) {
    const row = headerList.map(h => {
      const v = r[h];
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      // wrap in quotes if contains comma or newline
      if (s.includes(',') || s.includes('\n')) return `"${s}"`;
      return s;
    }).join(',');
    rows.push(row);
  }

  await fs.writeFile(outPath, rows.join('\n'), 'utf8');
};
