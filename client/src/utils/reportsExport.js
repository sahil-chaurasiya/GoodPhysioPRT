import ExcelJS from 'exceljs';
import { format } from 'date-fns';

const BRAND_HEX = '4A3FE0';
const BRAND_DARK_HEX = '332B7C';
const SLATE_LIGHT_HEX = 'F8FAFC';

const safe = (v, fallback = '-') => (v === undefined || v === null || v === '' ? fallback : v);

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_HEX}` } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10.5 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD9DCF5' } },
      bottom: { style: 'thin', color: { argb: 'FFD9DCF5' } },
      left: { style: 'thin', color: { argb: 'FFD9DCF5' } },
      right: { style: 'thin', color: { argb: 'FFD9DCF5' } },
    };
  });
  row.height = 24;
}

function zebraAndBorders(ws, startRow, endRow, endCol) {
  for (let r = startRow; r <= endRow; r += 1) {
    for (let c = 1; c <= endCol; c += 1) {
      const cell = ws.getRow(r).getCell(c);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      if ((r - startRow) % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${SLATE_LIGHT_HEX}` } };
      }
    }
  }
}

/**
 * Builds a polished, single-sheet workbook for the admin-wide "All Session
 * Data" / "All Prescription Data" report and triggers a download.
 * Kept as a single spreadsheet export (no PDF alternative) per product
 * requirements for this screen — just made to look professional.
 */
export async function exportReportsExcel(rows, tab, searchTerm = '') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PRT Health';
  wb.created = new Date();

  const isSessions = tab === 'sessions';
  const sheetTitle = isSessions ? 'All Session Data' : 'All Prescription Data';
  const ws = wb.addWorksheet(sheetTitle.slice(0, 31), { views: [{ state: 'frozen', ySplit: 4, showGridLines: false }] });

  const headers = isSessions
    ? ['Patient', 'PRT', 'Session #', 'Session Type', 'Status', 'Remark', 'Date']
    : ['Patient', 'PRT', 'Medicine', 'Dosage', 'Frequency', 'Date'];

  ws.columns = headers.map((h) => ({ width: Math.max(16, h.length + 8) }));

  // Title banner
  ws.mergeCells(1, 1, 1, headers.length);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = `PRT Health — ${sheetTitle}`;
  titleCell.font = { bold: true, size: 16, color: { argb: `FF${BRAND_DARK_HEX}` } };
  ws.getRow(1).height = 30;

  ws.mergeCells(2, 1, 2, headers.length);
  const subCell = ws.getCell(2, 1);
  const parts = [`${rows.length} record${rows.length === 1 ? '' : 's'}`, `Generated ${format(new Date(), 'd MMM yyyy, h:mm a')}`];
  if (searchTerm) parts.push(`Filtered by "${searchTerm}"`);
  subCell.value = parts.join(' · ');
  subCell.font = { size: 10, italic: true, color: { argb: 'FF64748B' } };
  ws.getRow(2).height = 18;

  ws.addRow([]);
  const headerRow = ws.addRow(headers);
  styleHeaderRow(headerRow);

  const bodyStart = ws.lastRow.number + 1;
  rows.forEach((r) => {
    const row = isSessions
      ? ws.addRow([
          r.patientName,
          r.prtName,
          r.sessionNumber,
          r.sessionType,
          r.status === 'complete' ? 'Complete' : 'Pre-only',
          safe(r.remark, ''),
          format(new Date(r.date), 'd MMM yyyy, h:mm a'),
        ])
      : ws.addRow([r.patientName, r.prtName, r.medicineName, safe(r.dosage, ''), safe(r.frequency, ''), format(new Date(r.date), 'd MMM yyyy, h:mm a')]);
    row.height = 18;
    row.alignment = { vertical: 'middle' };
    if (isSessions) {
      const statusCell = row.getCell(5);
      statusCell.font = { bold: true, color: { argb: r.status === 'complete' ? 'FF059669' : 'FFD97706' } };
      statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  });

  if (rows.length) {
    zebraAndBorders(ws, bodyStart, ws.lastRow.number, headers.length);
    ws.autoFilter = { from: { row: headerRow.number, column: 1 }, to: { row: headerRow.number, column: headers.length } };
  } else {
    ws.addRow(['No data available.']);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, `${tab}-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}