import ExcelJS from 'exceljs';

export interface ExportSheet {
  name: string;
  columns: { header: string; key: string }[];
  rows: Record<string, unknown>[];
}

/**
 * Genera un workbook con una hoja por cada entrada de `sheets` y dispara
 * la descarga en el navegador. Generaliza el patrón que ya usaba
 * ReportsFeature (ExcelJS inline, un solo sheet).
 */
export async function exportWorkbook(sheets: ExportSheet[], filename: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  sheets.forEach(sheet => {
    const worksheet = workbook.addWorksheet(sheet.name);
    worksheet.columns = sheet.columns;
    sheet.rows.forEach(row => worksheet.addRow(row));
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
