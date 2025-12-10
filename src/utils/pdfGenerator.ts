import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface PDFGeneratorOptions {
  title: string;
  content: string;
  templateType: string;
}

export async function generatePDF({ title, content, templateType }: PDFGeneratorOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  const pageWidth = 612; // Letter size
  const pageHeight = 792;
  const margin = 50;
  const lineHeight = 16;
  const maxWidth = pageWidth - (margin * 2);
  
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - margin;
  
  // Helper function to add a new page
  const addNewPage = () => {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    yPosition = pageHeight - margin;
    return currentPage;
  };
  
  // Helper function to draw text with word wrap
  const drawText = (text: string, fontSize: number, font = timesRomanFont, color = rgb(0, 0, 0)) => {
    const words = text.split(' ');
    let line = '';
    
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (textWidth > maxWidth && line) {
        if (yPosition < margin + lineHeight) {
          addNewPage();
        }
        currentPage.drawText(line, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font,
          color,
        });
        yPosition -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    
    if (line) {
      if (yPosition < margin + lineHeight) {
        addNewPage();
      }
      currentPage.drawText(line, {
        x: margin,
        y: yPosition,
        size: fontSize,
        font,
        color,
      });
      yPosition -= lineHeight;
    }
  };
  
  // Draw title
  const titleFontSize = 18;
  const titleWidth = timesRomanBoldFont.widthOfTextAtSize(title.toUpperCase(), titleFontSize);
  currentPage.drawText(title.toUpperCase(), {
    x: (pageWidth - titleWidth) / 2,
    y: yPosition,
    size: titleFontSize,
    font: timesRomanBoldFont,
    color: rgb(0.1, 0.1, 0.4),
  });
  yPosition -= 30;
  
  // Draw a line under the title
  currentPage.drawLine({
    start: { x: margin, y: yPosition + 10 },
    end: { x: pageWidth - margin, y: yPosition + 10 },
    thickness: 1,
    color: rgb(0.3, 0.3, 0.6),
  });
  yPosition -= 20;
  
  // Add date
  const date = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  drawText(`Fecha: ${date}`, 10, timesRomanFont, rgb(0.4, 0.4, 0.4));
  yPosition -= 20;
  
  // Process content - split by lines and handle sections
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      yPosition -= 10; // Empty line spacing
      continue;
    }
    
    // Check if it's a section header (starts with # or is all caps or ends with :)
    const isHeader = trimmedLine.startsWith('#') || 
                     trimmedLine.startsWith('**') ||
                     (trimmedLine.length < 50 && trimmedLine.endsWith(':')) ||
                     /^[A-ZÁÉÍÓÚÑ\s]+:?$/.test(trimmedLine);
    
    if (isHeader) {
      yPosition -= 10; // Extra spacing before headers
      const headerText = trimmedLine.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/:$/, '');
      if (yPosition < margin + lineHeight * 2) {
        addNewPage();
      }
      drawText(headerText, 12, timesRomanBoldFont, rgb(0.2, 0.2, 0.5));
      yPosition -= 5;
    } else {
      // Regular text - clean up markdown
      const cleanText = trimmedLine
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`/g, '')
        .replace(/^-\s*/, '• ')
        .replace(/^\d+\.\s*/, (match) => match);
      
      drawText(cleanText, 11, timesRomanFont);
    }
  }
  
  // Add footer on all pages
  const pages = pdfDoc.getPages();
  pages.forEach((page, index) => {
    const footerText = `Página ${index + 1} de ${pages.length} - Generado por Medussa IA`;
    const footerWidth = timesRomanFont.widthOfTextAtSize(footerText, 8);
    page.drawText(footerText, {
      x: (pageWidth - footerWidth) / 2,
      y: 25,
      size: 8,
      font: timesRomanFont,
      color: rgb(0.5, 0.5, 0.5),
    });
  });
  
  return pdfDoc.save();
}

export function downloadPDF(pdfBytes: Uint8Array, filename: string) {
  // Convert to ArrayBuffer to ensure compatibility
  const arrayBuffer = pdfBytes.slice().buffer;
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
