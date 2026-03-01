import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { DateTime } from 'luxon';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { exportMeasurementsPdfQuerySchema } from '../schemas/export.schemas.js';
import { monthRangeInUtc } from '../utils/date.js';
import { asyncHandler } from '../utils/async-handler.js';

type InhalationTiming = 'before_inhalation' | 'after_inhalation';

type ExportMeasurement = {
  measuredAt: Date;
  peakFlowLpm: number;
  inhalationTiming: InhalationTiming;
  note: string | null;
};

type DailyMeasurement = {
  measuredAt: Date;
  peakFlowLpm: number;
  note: string | null;
};

type DailyRow = {
  dateKey: string;
  date: DateTime;
  before: DailyMeasurement | null;
  after: DailyMeasurement | null;
};

type ChartPoint = {
  date: DateTime;
  beforeValue: number | null;
  afterValue: number | null;
};

const TABLE_COLS = {
  dateTime: 120,
  beforeLpm: 70,
  afterLpm: 70,
  beforeNote: 117,
  afterNote: 118
};

const createExportFilename = (): string => {
  const suffix = DateTime.now().toUTC().toFormat("yyyyLLdd-HHmmss'Z'");
  return `peak-flow-export-${suffix}.pdf`;
};

const formatMonthLabel = (month: string): string =>
  DateTime.fromFormat(month, 'yyyy-MM').setLocale('de').toFormat('LLLL yyyy');

const ensureSpace = (doc: PDFKit.PDFDocument, height: number) => {
  const bottomBoundary = doc.page.height - doc.page.margins.bottom;
  if (doc.y + height > bottomBoundary) {
    doc.addPage();
  }
};

const drawDivider = (doc: PDFKit.PDFDocument) => {
  const startX = doc.page.margins.left;
  const endX = doc.page.width - doc.page.margins.right;
  const y = doc.y;
  doc.moveTo(startX, y).lineTo(endX, y).strokeColor('#cbd5e1').lineWidth(1).stroke();
  doc.moveDown(0.6);
};

const normalizeMeasurement = (entry: {
  measuredAt: Date;
  peakFlowLpm: number;
  inhalationTiming: string;
  note: string | null;
}): ExportMeasurement => ({
  measuredAt: entry.measuredAt,
  peakFlowLpm: entry.peakFlowLpm,
  inhalationTiming: entry.inhalationTiming === 'after_inhalation' ? 'after_inhalation' : 'before_inhalation',
  note: entry.note
});

const buildDailyRows = (entries: ExportMeasurement[], timezone: string): DailyRow[] => {
  const dayMap = new Map<string, DailyRow>();

  for (const entry of entries) {
    const local = DateTime.fromJSDate(entry.measuredAt, { zone: 'utc' }).setZone(timezone);
    const dateKey = local.toISODate();
    if (!dateKey) {
      continue;
    }

    const existing = dayMap.get(dateKey) ?? {
      dateKey,
      date: local.startOf('day'),
      before: null,
      after: null
    };

    const dailyMeasurement: DailyMeasurement = {
      measuredAt: entry.measuredAt,
      peakFlowLpm: entry.peakFlowLpm,
      note: entry.note
    };

    if (entry.inhalationTiming === 'before_inhalation') {
      if (!existing.before || entry.measuredAt.getTime() > existing.before.measuredAt.getTime()) {
        existing.before = dailyMeasurement;
      }
    } else if (!existing.after || entry.measuredAt.getTime() > existing.after.measuredAt.getTime()) {
      existing.after = dailyMeasurement;
    }

    dayMap.set(dateKey, existing);
  }

  return [...dayMap.values()].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
};

const drawDailyTableHeader = (doc: PDFKit.PDFDocument) => {
  ensureSpace(doc, 24);
  const left = doc.page.margins.left;
  const y = doc.y;

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#334155')
    .text('Datum / Zeit', left, y, { width: TABLE_COLS.dateTime })
    .text('L/min (vor Inhal.)', left + TABLE_COLS.dateTime, y, { width: TABLE_COLS.beforeLpm, align: 'center' })
    .text('L/min (nach Inhal.)', left + TABLE_COLS.dateTime + TABLE_COLS.beforeLpm, y, {
      width: TABLE_COLS.afterLpm,
      align: 'center'
    })
    .text(
      'Notiz (vor Inhal.)',
      left + TABLE_COLS.dateTime + TABLE_COLS.beforeLpm + TABLE_COLS.afterLpm,
      y,
      { width: TABLE_COLS.beforeNote }
    )
    .text(
      'Notiz (nach Inhal.)',
      left + TABLE_COLS.dateTime + TABLE_COLS.beforeLpm + TABLE_COLS.afterLpm + TABLE_COLS.beforeNote,
      y,
      { width: TABLE_COLS.afterNote }
    );

  doc.moveDown(0.8);
  drawDivider(doc);
};

const formatDateTimeCell = (row: DailyRow, timezone: string): string => {
  const beforeTime = row.before
    ? DateTime.fromJSDate(row.before.measuredAt, { zone: 'utc' }).setZone(timezone).toFormat('HH:mm')
    : '-';
  const afterTime = row.after
    ? DateTime.fromJSDate(row.after.measuredAt, { zone: 'utc' }).setZone(timezone).toFormat('HH:mm')
    : '-';
  return `${row.date.toFormat('dd.LL.yyyy')}\nV: ${beforeTime} | N: ${afterTime}`;
};

const drawDailyRow = (doc: PDFKit.PDFDocument, row: DailyRow, timezone: string) => {
  const left = doc.page.margins.left;
  const y = doc.y;

  const colDateTime = formatDateTimeCell(row, timezone);
  const colBeforeLpm = row.before ? String(row.before.peakFlowLpm) : '-';
  const colAfterLpm = row.after ? String(row.after.peakFlowLpm) : '-';
  const colBeforeNote = row.before?.note?.trim() || '-';
  const colAfterNote = row.after?.note?.trim() || '-';

  const lineHeight = 10;
  const padding = 4;
  const rowHeight = Math.max(
    doc.heightOfString(colDateTime, { width: TABLE_COLS.dateTime, lineGap: 1 }),
    doc.heightOfString(colBeforeLpm, { width: TABLE_COLS.beforeLpm, align: 'center', lineGap: 1 }),
    doc.heightOfString(colAfterLpm, { width: TABLE_COLS.afterLpm, align: 'center', lineGap: 1 }),
    doc.heightOfString(colBeforeNote, { width: TABLE_COLS.beforeNote, lineGap: 1 }),
    doc.heightOfString(colAfterNote, { width: TABLE_COLS.afterNote, lineGap: 1 }),
    lineHeight
  ) + padding * 2;

  ensureSpace(doc, rowHeight + 6);

  const top = doc.y;
  const tableWidth =
    TABLE_COLS.dateTime + TABLE_COLS.beforeLpm + TABLE_COLS.afterLpm + TABLE_COLS.beforeNote + TABLE_COLS.afterNote;

  doc
    .rect(left, top, tableWidth, rowHeight)
    .fillAndStroke('#ffffff', '#dbe3ec')
    .fillColor('#0f172a')
    .font('Helvetica')
    .fontSize(9);

  doc.text(colDateTime, left + 3, top + padding, { width: TABLE_COLS.dateTime - 6, lineGap: 1 });
  doc.text(colBeforeLpm, left + TABLE_COLS.dateTime, top + padding, {
    width: TABLE_COLS.beforeLpm,
    align: 'center',
    lineGap: 1
  });
  doc.text(colAfterLpm, left + TABLE_COLS.dateTime + TABLE_COLS.beforeLpm, top + padding, {
    width: TABLE_COLS.afterLpm,
    align: 'center',
    lineGap: 1
  });
  doc.text(colBeforeNote, left + TABLE_COLS.dateTime + TABLE_COLS.beforeLpm + TABLE_COLS.afterLpm + 3, top + padding, {
    width: TABLE_COLS.beforeNote - 6,
    lineGap: 1
  });
  doc.text(
    colAfterNote,
    left + TABLE_COLS.dateTime + TABLE_COLS.beforeLpm + TABLE_COLS.afterLpm + TABLE_COLS.beforeNote + 3,
    top + padding,
    {
      width: TABLE_COLS.afterNote - 6,
      lineGap: 1
    }
  );

  // Vertical separators
  const v1 = left + TABLE_COLS.dateTime;
  const v2 = v1 + TABLE_COLS.beforeLpm;
  const v3 = v2 + TABLE_COLS.afterLpm;
  const v4 = v3 + TABLE_COLS.beforeNote;
  doc.moveTo(v1, top).lineTo(v1, top + rowHeight).strokeColor('#dbe3ec').lineWidth(1).stroke();
  doc.moveTo(v2, top).lineTo(v2, top + rowHeight).stroke();
  doc.moveTo(v3, top).lineTo(v3, top + rowHeight).stroke();
  doc.moveTo(v4, top).lineTo(v4, top + rowHeight).stroke();

  doc.y = top + rowHeight + 4;
};

const mapRowsToChartPoints = (rows: DailyRow[]): ChartPoint[] =>
  rows.map((row) => ({
    date: row.date,
    beforeValue: row.before?.peakFlowLpm ?? null,
    afterValue: row.after?.peakFlowLpm ?? null
  }));

const drawChart = (doc: PDFKit.PDFDocument, points: ChartPoint[]) => {
  doc.addPage();
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text('Diagramm (alle exportierten Tage)');
  doc.moveDown(0.4);

  if (points.length === 0) {
    doc.font('Helvetica').fontSize(10).fillColor('#475569').text('Keine Messwerte fuer das Diagramm vorhanden.');
    return;
  }

  const allValues = points.flatMap((point) => [point.beforeValue, point.afterValue]).filter((value): value is number => value !== null);
  if (allValues.length === 0) {
    doc.font('Helvetica').fontSize(10).fillColor('#475569').text('Keine Messwerte fuer das Diagramm vorhanden.');
    return;
  }

  const chartX = doc.page.margins.left;
  const chartY = doc.y + 8;
  const chartWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const chartHeight = 280;
  const padLeft = 42;
  const padRight = 14;
  const padTop = 16;
  const padBottom = 32;
  const plotX = chartX + padLeft;
  const plotY = chartY + padTop;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const range = rawMax - rawMin;
  const padding = range === 0 ? 10 : Math.max(6, range * 0.12);
  const paddedMin = rawMin - padding;
  const paddedMax = rawMax + padding;
  const minValue = Math.max(0, Math.floor(paddedMin / 10) * 10);
  const tickStep = Math.max(10, Math.ceil((paddedMax - minValue) / 5 / 10) * 10);
  const maxValue = minValue + tickStep * 5;
  const valueRange = Math.max(10, maxValue - minValue);

  const toY = (value: number) => plotY + plotHeight - ((value - minValue) / valueRange) * plotHeight;
  const toX = (index: number) => {
    if (points.length === 1) {
      return plotX + plotWidth / 2;
    }
    return plotX + (index / (points.length - 1)) * plotWidth;
  };

  // Border and grid
  doc.rect(chartX, chartY, chartWidth, chartHeight).strokeColor('#dbe3ec').lineWidth(1).stroke();
  for (let i = 0; i <= 5; i += 1) {
    const y = plotY + (i / 5) * plotHeight;
    const tickValue = maxValue - i * tickStep;
    doc.moveTo(plotX, y).lineTo(plotX + plotWidth, y).strokeColor('#edf2f7').lineWidth(1).stroke();
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#475569')
      .text(String(tickValue), chartX + 2, y - 4, { width: padLeft - 8, align: 'right' });
  }

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#475569')
    .text('L/min', chartX + 3, plotY - 10, { width: padLeft - 8, align: 'right' });

  const drawSeries = (color: string, selector: (point: ChartPoint) => number | null) => {
    let openSegment = false;
    let lastX = 0;
    let lastY = 0;

    points.forEach((point, index) => {
      const value = selector(point);
      if (value === null) {
        openSegment = false;
        return;
      }

      const x = toX(index);
      const y = toY(value);
      if (!openSegment) {
        openSegment = true;
        lastX = x;
        lastY = y;
      } else {
        doc.moveTo(lastX, lastY).lineTo(x, y).strokeColor(color).lineWidth(1.8).stroke();
        lastX = x;
        lastY = y;
      }
      doc.circle(x, y, 2.2).fillColor(color).fill();
    });
  };

  drawSeries('#1d4ed8', (point) => point.beforeValue);
  drawSeries('#dc2626', (point) => point.afterValue);

  // X labels (reduced amount if many points)
  const maxLabels = 8;
  const step = points.length <= maxLabels ? 1 : Math.ceil(points.length / maxLabels);
  for (let i = 0; i < points.length; i += step) {
    const x = toX(i);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#64748b')
      .text(points[i].date.toFormat('dd.LL.'), x - 16, plotY + plotHeight + 8, { width: 32, align: 'center' });
  }

  // Legend
  const legendY = chartY + chartHeight - 16;
  doc.rect(plotX + 8, legendY, 9, 3).fill('#1d4ed8');
  doc.font('Helvetica').fontSize(8).fillColor('#334155').text('Vor Inhalation', plotX + 22, legendY - 4);
  doc.rect(plotX + 120, legendY, 9, 3).fill('#dc2626');
  doc.font('Helvetica').fontSize(8).fillColor('#334155').text('Nach Inhalation', plotX + 134, legendY - 4);
};

export const exportsRouter = Router();

exportsRouter.use(requireAuth);

exportsRouter.get(
  '/available-months',
  asyncHandler(async (req, res) => {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.user!.id },
      select: { timezone: true }
    });
    const timezone = settings?.timezone ?? 'Europe/Berlin';

    const measurements = await prisma.measurement.findMany({
      where: { userId: req.user!.id },
      select: { measuredAt: true },
      orderBy: { measuredAt: 'desc' }
    });

    const months: string[] = [];
    const seen = new Set<string>();

    for (const measurement of measurements) {
      const month = DateTime.fromJSDate(measurement.measuredAt, { zone: 'utc' }).setZone(timezone).toFormat('yyyy-MM');
      if (seen.has(month)) {
        continue;
      }
      seen.add(month);
      months.push(month);
    }

    res.json({ months });
  })
);

exportsRouter.get(
  '/measurements.pdf',
  asyncHandler(async (req, res) => {
    const { months } = exportMeasurementsPdfQuerySchema.parse(req.query);

    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.user!.id },
      select: { timezone: true }
    });
    const timezone = settings?.timezone ?? 'Europe/Berlin';

    const filename = createExportFilename();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 48, right: 50, bottom: 48, left: 50 }
    });

    doc.pipe(res);

    doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f172a').text('Peak-Flow Export');
    doc.moveDown(0.3);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#334155')
      .text(`Erstellt am: ${DateTime.now().setZone(timezone).toFormat('dd.LL.yyyy HH:mm')} (${timezone})`);
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10).fillColor('#334155').text(`Ausgewaehlte Monate: ${months.join(', ')}`);

    const chartPoints: ChartPoint[] = [];

    for (const month of months) {
      ensureSpace(doc, 100);
      doc.moveDown(1);
      drawDivider(doc);
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#0f172a')
        .text(`Monat: ${formatMonthLabel(month)} (${month})`);

      const { startUtc, endUtc } = monthRangeInUtc(month, timezone);
      const entries = await prisma.measurement.findMany({
        where: {
          userId: req.user!.id,
          measuredAt: {
            gte: startUtc,
            lt: endUtc
          }
        },
        orderBy: {
          measuredAt: 'asc'
        },
        select: {
          measuredAt: true,
          peakFlowLpm: true,
          inhalationTiming: true,
          note: true
        }
      });

      const normalized = entries.map(normalizeMeasurement);
      const dailyRows = buildDailyRows(normalized, timezone);
      chartPoints.push(...mapRowsToChartPoints(dailyRows));

      if (dailyRows.length === 0) {
        doc.moveDown(0.4);
        doc.font('Helvetica').fontSize(10).fillColor('#475569').text('Keine Messdaten fuer diesen Monat vorhanden.');
        continue;
      }

      const allValues = normalized.map((entry) => entry.peakFlowLpm);
      const beforeValues = normalized
        .filter((entry) => entry.inhalationTiming === 'before_inhalation')
        .map((entry) => entry.peakFlowLpm);
      const afterValues = normalized
        .filter((entry) => entry.inhalationTiming === 'after_inhalation')
        .map((entry) => entry.peakFlowLpm);

      const avg = Number((allValues.reduce((sum, value) => sum + value, 0) / allValues.length).toFixed(1));
      const avgBefore = beforeValues.length
        ? Number((beforeValues.reduce((sum, value) => sum + value, 0) / beforeValues.length).toFixed(1))
        : null;
      const avgAfter = afterValues.length
        ? Number((afterValues.reduce((sum, value) => sum + value, 0) / afterValues.length).toFixed(1))
        : null;

      doc.moveDown(0.4);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#1e293b')
        .text(
          `Tage mit Messungen: ${dailyRows.length}   Messungen gesamt: ${normalized.length}   Durchschnitt: ${avg}`
        );
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#1e293b')
        .text(`Durchschnitt vor Inhalation: ${avgBefore ?? '-'}   Durchschnitt nach Inhalation: ${avgAfter ?? '-'}`);

      doc.moveDown(0.4);
      drawDailyTableHeader(doc);
      for (const row of dailyRows) {
        drawDailyRow(doc, row, timezone);
      }
    }

    drawChart(doc, chartPoints);

    doc.end();
  })
);
