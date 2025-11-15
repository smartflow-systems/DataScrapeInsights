import * as XLSX from 'xlsx';
import { stringify } from 'csv-stringify/sync';
import { promises as fs } from 'fs';
import path from 'path';
import { db } from './db';
import { queries, exports, activities } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { broadcastEvent, WebSocketEvents } from './websocket';

const EXPORTS_DIR = path.join(process.cwd(), 'exports');

// Ensure exports directory exists
async function ensureExportsDir() {
  try {
    await fs.access(EXPORTS_DIR);
  } catch {
    await fs.mkdir(EXPORTS_DIR, { recursive: true });
  }
}

interface ExportOptions {
  queryId: number;
  type: 'csv' | 'json' | 'excel';
  name: string;
}

// Generate CSV export
async function generateCSV(data: any[]): Promise<string> {
  if (data.length === 0) {
    return '';
  }

  const csv = stringify(data, {
    header: true,
    columns: Object.keys(data[0])
  });

  return csv;
}

// Generate Excel export
async function generateExcel(data: any[]): Promise<Buffer> {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  // Add formatting
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!worksheet[address]) continue;
    worksheet[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'FFD700' } }
    };
  }

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

// Generate JSON export
async function generateJSON(data: any[]): Promise<string> {
  return JSON.stringify({
    exportDate: new Date().toISOString(),
    recordCount: data.length,
    data: data
  }, null, 2);
}

// Main export function
export async function createExport(options: ExportOptions): Promise<string> {
  await ensureExportsDir();

  try {
    // Broadcast export started
    broadcastEvent(WebSocketEvents.EXPORT_STARTED, {
      queryId: options.queryId,
      type: options.type,
      name: options.name
    });

    // Get query and its results
    const [query] = await db
      .select()
      .from(queries)
      .where(eq(queries.id, options.queryId))
      .limit(1);

    if (!query) {
      throw new Error(`Query ${options.queryId} not found`);
    }

    const results = typeof query.results === 'string'
      ? JSON.parse(query.results)
      : query.results;

    if (!Array.isArray(results) || results.length === 0) {
      throw new Error('No data to export');
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedName = options.name.replace(/[^a-z0-9]/gi, '_');
    const extension = options.type === 'excel' ? 'xlsx' : options.type;
    const filename = `${sanitizedName}_${timestamp}.${extension}`;
    const filePath = path.join(EXPORTS_DIR, filename);

    // Generate export based on type
    let content: string | Buffer;
    switch (options.type) {
      case 'csv':
        content = await generateCSV(results);
        await fs.writeFile(filePath, content, 'utf-8');
        break;

      case 'excel':
        content = await generateExcel(results);
        await fs.writeFile(filePath, content);
        break;

      case 'json':
        content = await generateJSON(results);
        await fs.writeFile(filePath, content, 'utf-8');
        break;

      default:
        throw new Error(`Unsupported export type: ${options.type}`);
    }

    // Update export record in database
    const [exportRecord] = await db
      .insert(exports)
      .values({
        name: options.name,
        type: options.type,
        queryId: options.queryId,
        filePath: filename,
        status: 'completed',
        completedAt: new Date()
      })
      .returning();

    // Log activity
    await db.insert(activities).values({
      type: 'export',
      message: `Export "${options.name}" created successfully (${results.length} records)`,
      status: 'success',
      metadata: JSON.stringify({
        exportId: exportRecord.id,
        type: options.type,
        recordCount: results.length,
        filename
      })
    });

    // Broadcast completion
    broadcastEvent(WebSocketEvents.EXPORT_COMPLETED, {
      exportId: exportRecord.id,
      filename,
      recordCount: results.length,
      type: options.type
    });

    return filename;
  } catch (error) {
    console.error('[Export] Error creating export:', error);

    // Log failure
    await db.insert(activities).values({
      type: 'export',
      message: `Export "${options.name}" failed`,
      status: 'error',
      metadata: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        queryId: options.queryId
      })
    });

    // Broadcast failure
    broadcastEvent(WebSocketEvents.EXPORT_FAILED, {
      queryId: options.queryId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}

// Get export file
export async function getExportFile(filename: string): Promise<Buffer> {
  const filePath = path.join(EXPORTS_DIR, filename);

  try {
    await fs.access(filePath);
    return await fs.readFile(filePath);
  } catch {
    throw new Error(`Export file not found: ${filename}`);
  }
}

// Delete old exports (cleanup job)
export async function cleanupOldExports(daysOld: number = 30) {
  try {
    const files = await fs.readdir(EXPORTS_DIR);
    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(EXPORTS_DIR, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath);
        console.log(`[Export] Deleted old export: ${file}`);
      }
    }
  } catch (error) {
    console.error('[Export] Error cleaning up old exports:', error);
  }
}
