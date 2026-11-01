import JSZip from 'jszip';

/**
 * Escape a single cell value for CSV output according to RFC 4180
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str: string;
  if (typeof value === 'object') {
    str = JSON.stringify(value);
  } else {
    str = String(value);
  }

  // If the cell contains commas, quotes, or newlines, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Serialize an array of row objects into RFC 4180 compliant CSV string
 */
export function serializeToCsv(rows: Record<string, unknown>[]): string {
  if (!Array.isArray(rows) || rows.length === 0) {
    return '';
  }

  // Collect all unique column headers across all rows
  const headersSet = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((k) => headersSet.add(k));
  });
  const headers = Array.from(headersSet);

  const headerLine = headers.map(escapeCsvCell).join(',');
  const rowLines = rows.map((row) => {
    return headers.map((header) => escapeCsvCell(row[header])).join(',');
  });

  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Parse an RFC 4180 compliant CSV string into an array of objects
 */
export function parseCsv(csvText: string): Record<string, unknown>[] {
  const cleanText = csvText.trim();
  if (!cleanText) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;

  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentCell += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentCell);
        currentCell = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
        continue;
      } else {
        currentCell += char;
        i++;
        continue;
      }
    }
  }

  // Push last remaining cell and row
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map((h) => h.trim());
  const parsedRows: Record<string, unknown>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    // Skip empty lines
    if (cells.length === 1 && cells[0].trim() === '') continue;

    const rowObj: Record<string, unknown> = {};
    headers.forEach((header, colIndex) => {
      const rawVal = cells[colIndex] ?? '';
      rowObj[header] = tryParseValue(rawVal);
    });
    parsedRows.push(rowObj);
  }

  return parsedRows;
}

/**
 * Helper to parse boolean, number, or JSON structures if detected
 */
function tryParseValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  if (trimmed.toLowerCase() === 'true') return true;
  if (trimmed.toLowerCase() === 'false') return false;

  // Try JSON (arrays or objects)
  if (
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('{') && trimmed.endsWith('}'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // not valid JSON, leave as string
    }
  }

  // Check if pure integer or float
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const num = Number(trimmed);
    if (!Number.isNaN(num)) return num;
  }

  return raw;
}

/**
 * Create a ZIP archive containing all database tables as CSV files + manifest.json
 */
export async function createDatabaseZip(
  tablesData: Record<string, Record<string, unknown>[]>
): Promise<Buffer> {
  const zip = new JSZip();

  const manifest = {
    exportedAt: new Date().toISOString(),
    generator: 'FolioFrame CMS Relational Backup',
    version: '2.0.0',
    tables: {} as Record<string, number>,
  };

  for (const [tableName, rows] of Object.entries(tablesData)) {
    manifest.tables[tableName] = rows.length;
    const csvContent = serializeToCsv(rows);
    zip.file(`${tableName}.csv`, csvContent);
  }

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return zipBuffer;
}

/**
 * Extract all table CSVs from a ZIP archive
 */
export async function extractDatabaseZip(
  zipBuffer: Buffer | ArrayBuffer
): Promise<Record<string, Record<string, unknown>[]>> {
  const zip = await JSZip.loadAsync(zipBuffer);
  const result: Record<string, Record<string, unknown>[]> = {};

  const fileNames = Object.keys(zip.files);
  for (const fileName of fileNames) {
    if (fileName.endsWith('.csv') && !fileName.startsWith('__MACOSX/')) {
      const tableName = fileName.replace(/\.csv$/i, '').split('/').pop() || fileName;
      const csvText = await zip.files[fileName].async('text');
      result[tableName] = parseCsv(csvText);
    }
  }

  return result;
}
