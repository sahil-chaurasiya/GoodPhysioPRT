import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const BRAND = { r: 74, g: 63, b: 224 }; // #4a3fe0 — matches tailwind brand-600
const BRAND_HEX = '4A3FE0';
const BRAND_DARK_HEX = '332B7C'; // brand-900
const BRAND_SOFT_HEX = 'EEF1FF'; // brand-50
const SLATE_HEX = '475569'; // slate-600
const SLATE_LIGHT_HEX = 'F8FAFC'; // slate-50

const safe = (v, fallback = '-') => (v === undefined || v === null || v === '' ? fallback : v);
const fmtDate = (d, pattern = 'd MMM yyyy, h:mm a') => (d ? format(new Date(d), pattern) : '-');

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

function slugify(str) {
  return String(str || 'patient')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ---------------------------------------------------------------------------
// PDF export
// ---------------------------------------------------------------------------

export function exportPatientPdf(patient, sessions = [], medicines = []) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // ---- Header band -------------------------------------------------------
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, pageWidth, 86, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PRT Health', margin, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text('Patient Clinical Report', margin, 54);

  doc.setFontSize(9);
  doc.text(`Generated ${format(new Date(), 'd MMM yyyy, h:mm a')}`, pageWidth - margin, 36, { align: 'right' });
  doc.text(`Patient ID: ${safe(patient.patientId)}`, pageWidth - margin, 50, { align: 'right' });

  let y = 110;

  // ---- Patient name block --------------------------------------------------
  doc.setTextColor(30, 27, 75);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(safe(patient.name), margin, y);
  y += 20;

  // ---- Patient info table --------------------------------------------------
  const infoRows = [
    ['Age', `${safe(patient.age)} Yrs`, 'Gender', safe(patient.gender)],
    ['Doctor', safe(patient.assignedDoctor?.doctorName), 'Doctor Specialty', safe(patient.assignedDoctor?.specialty)],
    ['Primary Diagnosis', safe(patient.lungCondition), 'Secondary Conditions', patient.secondaryConditions?.length ? patient.secondaryConditions.join(', ') : 'None'],
    ['Phone Number', safe(patient.phoneNumber), 'Time Slot', safe(patient.timeSlot)],
    ['Created Date', fmtDate(patient.createdAt), 'Creator Email', safe(patient.addedByPrtEmail)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: { top: 5, bottom: 5, left: 0, right: 8 }, textColor: [51, 65, 85] },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 100 },
      1: { cellWidth: 155 },
      2: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 100 },
      3: { cellWidth: 'auto' },
    },
    body: infoRows,
    didDrawPage: () => {},
  });

  y = doc.lastAutoTable.finalY + 26;

  // ---- Sessions table -------------------------------------------------------
  const checkPageBreak = (needed) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      y = 40;
    }
  };

  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(30, 27, 75);
  doc.text('Session Log', margin, y);
  y += 10;

  if (sessions.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No sessions recorded yet.', margin, y + 14);
    y += 30;
  } else {
    autoTable(doc, {
      startY: y + 8,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.8, cellPadding: 4, valign: 'middle', lineColor: [226, 232, 240], lineWidth: 0.5 },
      headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 7.6 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      bodyStyles: { textColor: [51, 65, 85] },
      head: [
        [
          { content: '#', rowSpan: 2 },
          { content: 'Type / Exercise', rowSpan: 2 },
          { content: 'Status', rowSpan: 2 },
          { content: 'Pre-Session Vitals', colSpan: 3, styles: { halign: 'center' } },
          { content: 'Post-Session Vitals', colSpan: 5, styles: { halign: 'center' } },
          { content: 'Date', rowSpan: 2 },
        ],
        ['SPO2', 'HR', 'BP', 'HR', 'BP', 'Resp.', '6MWT', 'EQ5D3L'],
      ],
      body: sessions.map((s) => [
        s.sessionNumber,
        [s.sessionType, s.exerciseName].filter(Boolean).join('\n'),
        s.status === 'complete' ? 'Complete' : 'Pre-only',
        s.preVitals?.spo2Percent != null ? `${s.preVitals.spo2Percent}%` : '-',
        s.preVitals?.heartRate != null ? `${s.preVitals.heartRate}` : '-',
        safe(s.preVitals?.bpMmhg),
        s.postVitals?.heartRate != null ? `${s.postVitals.heartRate}` : '-',
        safe(s.postVitals?.bpMmhg),
        s.postVitals?.respirationRate != null ? `${s.postVitals.respirationRate}` : '-',
        s.postVitals?.sixMwtMeters != null ? `${s.postVitals.sixMwtMeters}m` : '-',
        safe(s.postVitals?.eq5d3lScore),
        fmtDate(s.createdAt, 'd MMM yyyy'),
      ]),
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        2: { halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          data.cell.styles.textColor = data.cell.raw === 'Complete' ? [5, 150, 105] : [217, 119, 6];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    y = doc.lastAutoTable.finalY + 12;

    // Remarks appendix (kept out of the wide table to keep columns readable)
    const remarkRows = sessions
      .map((s) => [s.sessionNumber, [s.preVitals?.remark, s.postVitals?.remark].filter(Boolean).join(' | ')])
      .filter(([, remark]) => remark);
    if (remarkRows.length) {
      checkPageBreak(20 + remarkRows.length * 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Session Remarks', margin, y + 12);
      autoTable(doc, {
        startY: y + 18,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 4, textColor: [71, 85, 105] },
        head: [['Session #', 'Remark']],
        headStyles: { fillColor: [238, 241, 255], textColor: [74, 63, 224], fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 60, halign: 'center' } },
        body: remarkRows,
      });
      y = doc.lastAutoTable.finalY + 24;
    } else {
      y += 24;
    }
  }

  // ---- Medicines table --------------------------------------------------
  checkPageBreak(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(30, 27, 75);
  doc.text('Medicine Data', margin, y);
  y += 10;

  if (medicines.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No medicine data recorded yet.', margin, y + 14);
  } else {
    autoTable(doc, {
      startY: y + 8,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 5, lineColor: [226, 232, 240], lineWidth: 0.5 },
      headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      bodyStyles: { textColor: [51, 65, 85] },
      head: [['Medicine', 'Dosage', 'Frequency', 'Notes', 'Added On']],
      body: medicines.map((m) => [safe(m.medicineName), safe(m.dosage), safe(m.frequency), safe(m.notes), fmtDate(m.createdAt, 'd MMM yyyy')]),
    });
  }

  // ---- Footer on every page ----------------------------------------------
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    const h = doc.internal.pageSize.getHeight();
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, h - 34, pageWidth - margin, h - 34);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('PRT Health — Confidential Patient Record', margin, h - 20);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, h - 20, { align: 'right' });
  }

  doc.save(`${slugify(patient.name)}-${patient.patientId || 'report'}.pdf`);
}

// ---------------------------------------------------------------------------
// Excel export
// ---------------------------------------------------------------------------

function styleHeaderRow(row, { fill = BRAND_HEX, font = 'FFFFFF' } = {}) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${fill}` } };
    cell.font = { bold: true, color: { argb: `FF${font}` }, size: 10.5 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD9DCF5' } },
      bottom: { style: 'thin', color: { argb: 'FFD9DCF5' } },
      left: { style: 'thin', color: { argb: 'FFD9DCF5' } },
      right: { style: 'thin', color: { argb: 'FFD9DCF5' } },
    };
  });
  row.height = 22;
}

function zebra(ws, startRow, endRow, endCol) {
  for (let r = startRow; r <= endRow; r += 1) {
    if ((r - startRow) % 2 === 1) {
      for (let c = 1; c <= endCol; c += 1) {
        const cell = ws.getRow(r).getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${SLATE_LIGHT_HEX}` } };
      }
    }
  }
}

function thinBorderRange(ws, startRow, endRow, endCol) {
  for (let r = startRow; r <= endRow; r += 1) {
    for (let c = 1; c <= endCol; c += 1) {
      ws.getRow(r).getCell(c).border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    }
  }
}

function addTitleBanner(ws, { title, subtitle, cols }) {
  ws.mergeCells(1, 1, 1, cols);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: `FF${BRAND_DARK_HEX}` } };
  titleCell.alignment = { vertical: 'middle' };
  ws.getRow(1).height = 30;

  ws.mergeCells(2, 1, 2, cols);
  const subCell = ws.getCell(2, 1);
  subCell.value = subtitle;
  subCell.font = { size: 10, color: { argb: 'FF64748B' }, italic: true };
  ws.getRow(2).height = 18;
}

export async function exportPatientExcel(patient, sessions = [], medicines = []) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PRT Health';
  wb.created = new Date();

  // ---- Sheet 1: Patient Info ----------------------------------------------
  const infoSheet = wb.addWorksheet('Patient Info', { views: [{ showGridLines: false }] });
  infoSheet.columns = [{ width: 26 }, { width: 44 }];
  addTitleBanner(infoSheet, { title: patient.name, subtitle: `Patient Report · Generated ${format(new Date(), 'd MMM yyyy, h:mm a')}`, cols: 2 });
  infoSheet.addRow([]);

  const infoFields = [
    ['Patient ID', safe(patient.patientId)],
    ['Age', `${safe(patient.age)} Yrs`],
    ['Gender', safe(patient.gender)],
    ['Phone Number', safe(patient.phoneNumber)],
    ['Doctor', safe(patient.assignedDoctor?.doctorName)],
    ['Doctor Specialty', safe(patient.assignedDoctor?.specialty)],
    ['Primary Diagnosis', safe(patient.lungCondition)],
    ['Secondary Conditions', patient.secondaryConditions?.length ? patient.secondaryConditions.join(', ') : 'None'],
    ['Time Slot', safe(patient.timeSlot)],
    ['Created Date', fmtDate(patient.createdAt)],
    ['Creator Email', safe(patient.addedByPrtEmail)],
  ];
  const infoStartRow = infoSheet.lastRow.number + 1;
  infoFields.forEach(([label, value]) => {
    const row = infoSheet.addRow([label, value]);
    row.getCell(1).font = { bold: true, color: { argb: 'FF64748B' } };
    row.getCell(2).font = { color: { argb: 'FF1E293B' } };
    row.height = 20;
  });
  thinBorderRange(infoSheet, infoStartRow, infoSheet.lastRow.number, 2);
  zebra(infoSheet, infoStartRow, infoSheet.lastRow.number, 2);

  // ---- Sheet 2: Sessions ---------------------------------------------------
  const sessSheet = wb.addWorksheet('Sessions', { views: [{ state: 'frozen', ySplit: 4, showGridLines: false }] });
  const sessHeaders = [
    'Session #', 'Type', 'Exercise', 'Status',
    'SPO2 Pre (%)', 'HR Pre (bpm)', 'BP Pre',
    'HR Post (bpm)', 'BP Post', 'Resp. Post', '6MWT (m)', 'EQ5D3L',
    'Pre Remark', 'Post Remark', 'Recorded On',
  ];
  sessSheet.columns = sessHeaders.map((h) => ({ width: Math.max(12, Math.min(26, h.length + 6)) }));
  addTitleBanner(sessSheet, { title: `${patient.name} — Session Log`, subtitle: `${sessions.length} session${sessions.length === 1 ? '' : 's'} · Generated ${format(new Date(), 'd MMM yyyy, h:mm a')}`, cols: sessHeaders.length });
  sessSheet.addRow([]);
  const sessHeaderRow = sessSheet.addRow(sessHeaders);
  styleHeaderRow(sessHeaderRow);

  const sessBodyStart = sessSheet.lastRow.number + 1;
  sessions.forEach((s) => {
    const row = sessSheet.addRow([
      s.sessionNumber,
      s.sessionType,
      safe(s.exerciseName),
      s.status === 'complete' ? 'Complete' : 'Pre-only',
      s.preVitals?.spo2Percent ?? '-',
      s.preVitals?.heartRate ?? '-',
      safe(s.preVitals?.bpMmhg),
      s.postVitals?.heartRate ?? '-',
      safe(s.postVitals?.bpMmhg),
      s.postVitals?.respirationRate ?? '-',
      s.postVitals?.sixMwtMeters ?? '-',
      safe(s.postVitals?.eq5d3lScore),
      safe(s.preVitals?.remark, ''),
      safe(s.postVitals?.remark, ''),
      fmtDate(s.createdAt),
    ]);
    row.getCell(4).font = { bold: true, color: { argb: s.status === 'complete' ? 'FF059669' : 'FFD97706' } };
    row.alignment = { vertical: 'middle' };
    row.height = 18;
  });
  if (sessions.length) {
    thinBorderRange(sessSheet, sessBodyStart, sessSheet.lastRow.number, sessHeaders.length);
    zebra(sessSheet, sessBodyStart, sessSheet.lastRow.number, sessHeaders.length);
    sessSheet.autoFilter = { from: { row: sessHeaderRow.number, column: 1 }, to: { row: sessHeaderRow.number, column: sessHeaders.length } };
  } else {
    sessSheet.addRow(['No sessions recorded yet.']);
  }

  // ---- Sheet 3: Medicines --------------------------------------------------
  const medSheet = wb.addWorksheet('Medicines', { views: [{ state: 'frozen', ySplit: 4, showGridLines: false }] });
  const medHeaders = ['Medicine', 'Dosage', 'Frequency', 'Notes', 'Added On'];
  medSheet.columns = medHeaders.map((h) => ({ width: Math.max(16, h.length + 10) }));
  addTitleBanner(medSheet, { title: `${patient.name} — Medicine Data`, subtitle: `${medicines.length} record${medicines.length === 1 ? '' : 's'} · Generated ${format(new Date(), 'd MMM yyyy, h:mm a')}`, cols: medHeaders.length });
  medSheet.addRow([]);
  const medHeaderRow = medSheet.addRow(medHeaders);
  styleHeaderRow(medHeaderRow);

  const medBodyStart = medSheet.lastRow.number + 1;
  medicines.forEach((m) => {
    medSheet.addRow([safe(m.medicineName), safe(m.dosage), safe(m.frequency), safe(m.notes, ''), fmtDate(m.createdAt)]).height = 18;
  });
  if (medicines.length) {
    thinBorderRange(medSheet, medBodyStart, medSheet.lastRow.number, medHeaders.length);
    zebra(medSheet, medBodyStart, medSheet.lastRow.number, medHeaders.length);
    medSheet.autoFilter = { from: { row: medHeaderRow.number, column: 1 }, to: { row: medHeaderRow.number, column: medHeaders.length } };
  } else {
    medSheet.addRow(['No medicine data recorded yet.']);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, `${slugify(patient.name)}-${patient.patientId || 'report'}.xlsx`);
}

export { triggerDownload, slugify };