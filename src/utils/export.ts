export const exportToCSV = <T extends Record<string, string | number | boolean | string[] | undefined | null>>(responses: T[], fileNamePrefix = 'survey_responses') => {
  if (responses.length === 0) return;

  // Get all unique keys from all responses for headers
  const allKeys = Array.from(new Set(responses.flatMap(r => Object.keys(r))));
  
  const csvContent = [
    allKeys.join(','),
    ...responses.map(row => {
      return allKeys.map(key => {
        const val = row[key];
        if (Array.isArray(val)) return `"${val.join('; ')}"`;
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return val ?? '';
      }).join(',');
    })
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileNamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = <T extends Record<string, string | number | boolean | string[] | undefined | null>>(rows: T[], fileNamePrefix = 'survey_responses') => {
  if (rows.length === 0) return;
  const allKeys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const tsv = [
    allKeys.join('\t'),
    ...rows.map((row) =>
      allKeys
        .map((key) => {
          const val = row[key];
          if (Array.isArray(val)) return val.join('; ');
          if (val === null || val === undefined) return '';
          return String(val).replace(/\t/g, ' ').replace(/\n/g, ' ');
        })
        .join('\t')
    ),
  ].join('\n');

  const blob = new Blob([tsv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileNamePrefix}_${new Date().toISOString().split('T')[0]}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportReportToPDF = (title: string, sections: Array<{ label: string; value: string | number }>) => {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;
  const content = `
    <html>
      <head><title>${title}</title></head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <h1 style="margin-bottom: 16px;">${title}</h1>
        <table style="width: 100%; border-collapse: collapse;">
          ${sections
            .map(
              (item) =>
                `<tr><td style="border:1px solid #ddd;padding:8px;"><strong>${item.label}</strong></td><td style="border:1px solid #ddd;padding:8px;">${item.value}</td></tr>`
            )
            .join('')}
        </table>
      </body>
    </html>
  `;
  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
