// Professional Excel styling themes for variety in document generation
import XLSX from "xlsx-js-style";

export interface ExcelTheme {
  id: string;
  name: string;
  description: string;
  headerStyle: XLSX.CellStyle;
  evenRowStyle: XLSX.CellStyle;
  oddRowStyle: XLSX.CellStyle;
  numberFormat: string;
  currencyFormat: string;
  accentColor: string;
}

// Theme definitions with professional color palettes
export const excelThemes: ExcelTheme[] = [
  {
    id: "corporate-blue",
    name: "🔵 Corporativo Azul",
    description: "Diseño profesional con tonos azules",
    accentColor: "#1E40AF",
    headerStyle: {
      fill: { fgColor: { rgb: "1E40AF" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "medium", color: { rgb: "1E3A8A" } },
        bottom: { style: "medium", color: { rgb: "1E3A8A" } },
        left: { style: "thin", color: { rgb: "1E3A8A" } },
        right: { style: "thin", color: { rgb: "1E3A8A" } }
      }
    },
    evenRowStyle: {
      fill: { fgColor: { rgb: "DBEAFE" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "BFDBFE" } },
        bottom: { style: "thin", color: { rgb: "BFDBFE" } },
        left: { style: "thin", color: { rgb: "BFDBFE" } },
        right: { style: "thin", color: { rgb: "BFDBFE" } }
      }
    },
    oddRowStyle: {
      fill: { fgColor: { rgb: "FFFFFF" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "E5E7EB" } },
        bottom: { style: "thin", color: { rgb: "E5E7EB" } },
        left: { style: "thin", color: { rgb: "E5E7EB" } },
        right: { style: "thin", color: { rgb: "E5E7EB" } }
      }
    },
    numberFormat: "#,##0.00",
    currencyFormat: '"$"#,##0.00'
  },
  {
    id: "emerald-green",
    name: "🟢 Esmeralda Verde",
    description: "Elegante con tonos verdes",
    accentColor: "#047857",
    headerStyle: {
      fill: { fgColor: { rgb: "047857" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "medium", color: { rgb: "065F46" } },
        bottom: { style: "medium", color: { rgb: "065F46" } },
        left: { style: "thin", color: { rgb: "065F46" } },
        right: { style: "thin", color: { rgb: "065F46" } }
      }
    },
    evenRowStyle: {
      fill: { fgColor: { rgb: "D1FAE5" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "A7F3D0" } },
        bottom: { style: "thin", color: { rgb: "A7F3D0" } },
        left: { style: "thin", color: { rgb: "A7F3D0" } },
        right: { style: "thin", color: { rgb: "A7F3D0" } }
      }
    },
    oddRowStyle: {
      fill: { fgColor: { rgb: "FFFFFF" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "E5E7EB" } },
        bottom: { style: "thin", color: { rgb: "E5E7EB" } },
        left: { style: "thin", color: { rgb: "E5E7EB" } },
        right: { style: "thin", color: { rgb: "E5E7EB" } }
      }
    },
    numberFormat: "#,##0.00",
    currencyFormat: '"$"#,##0.00'
  },
  {
    id: "royal-purple",
    name: "🟣 Púrpura Real",
    description: "Sofisticado con tonos púrpura",
    accentColor: "#7C3AED",
    headerStyle: {
      fill: { fgColor: { rgb: "7C3AED" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "medium", color: { rgb: "6D28D9" } },
        bottom: { style: "medium", color: { rgb: "6D28D9" } },
        left: { style: "thin", color: { rgb: "6D28D9" } },
        right: { style: "thin", color: { rgb: "6D28D9" } }
      }
    },
    evenRowStyle: {
      fill: { fgColor: { rgb: "EDE9FE" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "DDD6FE" } },
        bottom: { style: "thin", color: { rgb: "DDD6FE" } },
        left: { style: "thin", color: { rgb: "DDD6FE" } },
        right: { style: "thin", color: { rgb: "DDD6FE" } }
      }
    },
    oddRowStyle: {
      fill: { fgColor: { rgb: "FFFFFF" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "E5E7EB" } },
        bottom: { style: "thin", color: { rgb: "E5E7EB" } },
        left: { style: "thin", color: { rgb: "E5E7EB" } },
        right: { style: "thin", color: { rgb: "E5E7EB" } }
      }
    },
    numberFormat: "#,##0.00",
    currencyFormat: '"$"#,##0.00'
  },
  {
    id: "sunset-orange",
    name: "🟠 Atardecer Naranja",
    description: "Cálido con tonos naranjas",
    accentColor: "#EA580C",
    headerStyle: {
      fill: { fgColor: { rgb: "EA580C" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "medium", color: { rgb: "C2410C" } },
        bottom: { style: "medium", color: { rgb: "C2410C" } },
        left: { style: "thin", color: { rgb: "C2410C" } },
        right: { style: "thin", color: { rgb: "C2410C" } }
      }
    },
    evenRowStyle: {
      fill: { fgColor: { rgb: "FED7AA" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "FDBA74" } },
        bottom: { style: "thin", color: { rgb: "FDBA74" } },
        left: { style: "thin", color: { rgb: "FDBA74" } },
        right: { style: "thin", color: { rgb: "FDBA74" } }
      }
    },
    oddRowStyle: {
      fill: { fgColor: { rgb: "FFFFFF" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "E5E7EB" } },
        bottom: { style: "thin", color: { rgb: "E5E7EB" } },
        left: { style: "thin", color: { rgb: "E5E7EB" } },
        right: { style: "thin", color: { rgb: "E5E7EB" } }
      }
    },
    numberFormat: "#,##0.00",
    currencyFormat: '"$"#,##0.00'
  },
  {
    id: "crimson-red",
    name: "🔴 Carmesí Rojo",
    description: "Impactante con tonos rojos",
    accentColor: "#DC2626",
    headerStyle: {
      fill: { fgColor: { rgb: "DC2626" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "medium", color: { rgb: "B91C1C" } },
        bottom: { style: "medium", color: { rgb: "B91C1C" } },
        left: { style: "thin", color: { rgb: "B91C1C" } },
        right: { style: "thin", color: { rgb: "B91C1C" } }
      }
    },
    evenRowStyle: {
      fill: { fgColor: { rgb: "FECACA" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "FCA5A5" } },
        bottom: { style: "thin", color: { rgb: "FCA5A5" } },
        left: { style: "thin", color: { rgb: "FCA5A5" } },
        right: { style: "thin", color: { rgb: "FCA5A5" } }
      }
    },
    oddRowStyle: {
      fill: { fgColor: { rgb: "FFFFFF" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "E5E7EB" } },
        bottom: { style: "thin", color: { rgb: "E5E7EB" } },
        left: { style: "thin", color: { rgb: "E5E7EB" } },
        right: { style: "thin", color: { rgb: "E5E7EB" } }
      }
    },
    numberFormat: "#,##0.00",
    currencyFormat: '"$"#,##0.00'
  },
  {
    id: "ocean-teal",
    name: "🌊 Océano Turquesa",
    description: "Refrescante con tonos turquesa",
    accentColor: "#0891B2",
    headerStyle: {
      fill: { fgColor: { rgb: "0891B2" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "medium", color: { rgb: "0E7490" } },
        bottom: { style: "medium", color: { rgb: "0E7490" } },
        left: { style: "thin", color: { rgb: "0E7490" } },
        right: { style: "thin", color: { rgb: "0E7490" } }
      }
    },
    evenRowStyle: {
      fill: { fgColor: { rgb: "CFFAFE" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "A5F3FC" } },
        bottom: { style: "thin", color: { rgb: "A5F3FC" } },
        left: { style: "thin", color: { rgb: "A5F3FC" } },
        right: { style: "thin", color: { rgb: "A5F3FC" } }
      }
    },
    oddRowStyle: {
      fill: { fgColor: { rgb: "FFFFFF" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "E5E7EB" } },
        bottom: { style: "thin", color: { rgb: "E5E7EB" } },
        left: { style: "thin", color: { rgb: "E5E7EB" } },
        right: { style: "thin", color: { rgb: "E5E7EB" } }
      }
    },
    numberFormat: "#,##0.00",
    currencyFormat: '"$"#,##0.00'
  },
  {
    id: "golden-amber",
    name: "🟡 Dorado Ámbar",
    description: "Lujoso con tonos dorados",
    accentColor: "#D97706",
    headerStyle: {
      fill: { fgColor: { rgb: "D97706" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "medium", color: { rgb: "B45309" } },
        bottom: { style: "medium", color: { rgb: "B45309" } },
        left: { style: "thin", color: { rgb: "B45309" } },
        right: { style: "thin", color: { rgb: "B45309" } }
      }
    },
    evenRowStyle: {
      fill: { fgColor: { rgb: "FEF3C7" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "FDE68A" } },
        bottom: { style: "thin", color: { rgb: "FDE68A" } },
        left: { style: "thin", color: { rgb: "FDE68A" } },
        right: { style: "thin", color: { rgb: "FDE68A" } }
      }
    },
    oddRowStyle: {
      fill: { fgColor: { rgb: "FFFFFF" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "E5E7EB" } },
        bottom: { style: "thin", color: { rgb: "E5E7EB" } },
        left: { style: "thin", color: { rgb: "E5E7EB" } },
        right: { style: "thin", color: { rgb: "E5E7EB" } }
      }
    },
    numberFormat: "#,##0.00",
    currencyFormat: '"$"#,##0.00'
  },
  {
    id: "slate-modern",
    name: "⚫ Moderno Gris",
    description: "Minimalista y moderno",
    accentColor: "#475569",
    headerStyle: {
      fill: { fgColor: { rgb: "475569" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "medium", color: { rgb: "334155" } },
        bottom: { style: "medium", color: { rgb: "334155" } },
        left: { style: "thin", color: { rgb: "334155" } },
        right: { style: "thin", color: { rgb: "334155" } }
      }
    },
    evenRowStyle: {
      fill: { fgColor: { rgb: "F1F5F9" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "E2E8F0" } },
        bottom: { style: "thin", color: { rgb: "E2E8F0" } },
        left: { style: "thin", color: { rgb: "E2E8F0" } },
        right: { style: "thin", color: { rgb: "E2E8F0" } }
      }
    },
    oddRowStyle: {
      fill: { fgColor: { rgb: "FFFFFF" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "E5E7EB" } },
        bottom: { style: "thin", color: { rgb: "E5E7EB" } },
        left: { style: "thin", color: { rgb: "E5E7EB" } },
        right: { style: "thin", color: { rgb: "E5E7EB" } }
      }
    },
    numberFormat: "#,##0.00",
    currencyFormat: '"$"#,##0.00'
  },
  {
    id: "rose-pink",
    name: "🩷 Rosa Elegante",
    description: "Delicado con tonos rosados",
    accentColor: "#DB2777",
    headerStyle: {
      fill: { fgColor: { rgb: "DB2777" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "medium", color: { rgb: "BE185D" } },
        bottom: { style: "medium", color: { rgb: "BE185D" } },
        left: { style: "thin", color: { rgb: "BE185D" } },
        right: { style: "thin", color: { rgb: "BE185D" } }
      }
    },
    evenRowStyle: {
      fill: { fgColor: { rgb: "FCE7F3" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "FBCFE8" } },
        bottom: { style: "thin", color: { rgb: "FBCFE8" } },
        left: { style: "thin", color: { rgb: "FBCFE8" } },
        right: { style: "thin", color: { rgb: "FBCFE8" } }
      }
    },
    oddRowStyle: {
      fill: { fgColor: { rgb: "FFFFFF" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "E5E7EB" } },
        bottom: { style: "thin", color: { rgb: "E5E7EB" } },
        left: { style: "thin", color: { rgb: "E5E7EB" } },
        right: { style: "thin", color: { rgb: "E5E7EB" } }
      }
    },
    numberFormat: "#,##0.00",
    currencyFormat: '"$"#,##0.00'
  },
  {
    id: "indigo-professional",
    name: "💜 Índigo Profesional",
    description: "Clásico y ejecutivo",
    accentColor: "#4F46E5",
    headerStyle: {
      fill: { fgColor: { rgb: "4F46E5" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "medium", color: { rgb: "4338CA" } },
        bottom: { style: "medium", color: { rgb: "4338CA" } },
        left: { style: "thin", color: { rgb: "4338CA" } },
        right: { style: "thin", color: { rgb: "4338CA" } }
      }
    },
    evenRowStyle: {
      fill: { fgColor: { rgb: "E0E7FF" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "C7D2FE" } },
        bottom: { style: "thin", color: { rgb: "C7D2FE" } },
        left: { style: "thin", color: { rgb: "C7D2FE" } },
        right: { style: "thin", color: { rgb: "C7D2FE" } }
      }
    },
    oddRowStyle: {
      fill: { fgColor: { rgb: "FFFFFF" } },
      font: { sz: 11, name: "Calibri" },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "E5E7EB" } },
        bottom: { style: "thin", color: { rgb: "E5E7EB" } },
        left: { style: "thin", color: { rgb: "E5E7EB" } },
        right: { style: "thin", color: { rgb: "E5E7EB" } }
      }
    },
    numberFormat: "#,##0.00",
    currencyFormat: '"$"#,##0.00'
  }
];

// Get a random theme
export const getRandomTheme = (): ExcelTheme => {
  const randomIndex = Math.floor(Math.random() * excelThemes.length);
  return excelThemes[randomIndex];
};

// Get theme by ID
export const getThemeById = (id: string): ExcelTheme => {
  return excelThemes.find(theme => theme.id === id) || excelThemes[0];
};

// Apply theme to worksheet
export const applyThemeToSheet = (
  worksheet: XLSX.WorkSheet, 
  data: unknown[][], 
  theme: ExcelTheme
): XLSX.WorkSheet => {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Calculate column widths based on content
  const colWidths: { wch: number }[] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    let maxWidth = 12;
    for (let r = range.s.r; r <= range.e.r; r++) {
      const cellValue = data[r]?.[c];
      if (cellValue !== undefined && cellValue !== null) {
        const cellLength = String(cellValue).length;
        maxWidth = Math.max(maxWidth, Math.min(cellLength + 4, 45));
      }
    }
    colWidths.push({ wch: maxWidth });
  }
  worksheet['!cols'] = colWidths;

  // Apply styles to each cell
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[cellAddress];
      
      if (cell) {
        if (r === 0) {
          // Header row
          cell.s = theme.headerStyle;
        } else {
          // Data rows with alternating colors
          const baseStyle = r % 2 === 0 ? theme.evenRowStyle : theme.oddRowStyle;
          
          // Check if cell is a number for special formatting
          if (typeof cell.v === 'number') {
            const headerValue = String(data[0]?.[c] || '').toLowerCase();
            
            // Detect currency columns
            const isCurrency = headerValue.includes('precio') || 
                              headerValue.includes('total') || 
                              headerValue.includes('monto') || 
                              headerValue.includes('salario') ||
                              headerValue.includes('ingreso') || 
                              headerValue.includes('gasto') ||
                              headerValue.includes('costo') || 
                              headerValue.includes('valor') ||
                              headerValue.includes('neto') || 
                              headerValue.includes('balance') ||
                              headerValue.includes('pago') ||
                              headerValue.includes('deuda') ||
                              headerValue.includes('credito') ||
                              headerValue.includes('debito');
            
            cell.s = {
              ...baseStyle,
              numFmt: isCurrency ? theme.currencyFormat : theme.numberFormat,
              alignment: { horizontal: "right", vertical: "center" }
            };
          } else {
            cell.s = baseStyle;
          }
        }
      }
    }
  }

  // Add row heights
  const rowHeights: { hpt: number }[] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    rowHeights.push({ hpt: r === 0 ? 28 : 22 });
  }
  worksheet['!rows'] = rowHeights;

  return worksheet;
};
