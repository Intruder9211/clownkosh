import { extractBookMetadataAndCover } from './pdfUtils';

/**
 * Detect file type category, extension, and formatting details
 */
export function detectFileTypeAndExtension(file) {
  const fileName = file.name || '';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const mime = file.type || '';

  if (ext === 'pdf' || mime === 'application/pdf') {
    return { fileType: 'pdf', fileExtension: 'PDF', mimeType: mime || 'application/pdf', label: 'PDF Document', color: '#ef4444' };
  }

  if (['doc', 'docx', 'rtf', 'odt'].includes(ext) || mime.includes('word') || mime.includes('officedocument.wordprocessingml')) {
    return { fileType: 'doc', fileExtension: ext.toUpperCase(), mimeType: mime || 'application/msword', label: 'Word Document', color: '#3b82f6' };
  }

  if (['xls', 'xlsx', 'csv', 'tsv', 'ods'].includes(ext) || mime.includes('excel') || mime.includes('spreadsheetml') || mime.includes('csv')) {
    return { fileType: 'sheet', fileExtension: ext.toUpperCase(), mimeType: mime || 'text/csv', label: 'Spreadsheet', color: '#10b981' };
  }

  if (['mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac'].includes(ext) || mime.startsWith('audio/')) {
    return { fileType: 'audio', fileExtension: ext.toUpperCase(), mimeType: mime || 'audio/mpeg', label: 'Audio Lecture', color: '#8b5cf6' };
  }

  if (['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(ext) || mime.startsWith('video/')) {
    return { fileType: 'video', fileExtension: ext.toUpperCase(), mimeType: mime || 'video/mp4', label: 'Video Tutorial', color: '#f59e0b' };
  }

  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext) || mime.startsWith('image/')) {
    return { fileType: 'image', fileExtension: ext.toUpperCase(), mimeType: mime || 'image/png', label: 'Image Diagram', color: '#ec4899' };
  }

  if (['txt', 'md', 'json', 'js', 'py', 'html', 'css'].includes(ext) || mime.startsWith('text/')) {
    return { fileType: 'text', fileExtension: ext.toUpperCase(), mimeType: mime || 'text/plain', label: 'Text Note', color: '#06b6d4' };
  }

  return { fileType: 'other', fileExtension: ext.toUpperCase() || 'FILE', mimeType: mime || 'application/octet-stream', label: 'File Resource', color: '#6b7280' };
}

/**
 * Generate a visual cover image (Data URL) for non-PDF media/documents
 */
export async function generateCoverForFile(file) {
  const { fileType, fileExtension, label, color } = detectFileTypeAndExtension(file);
  const cleanTitle = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Untitled Resource';

  // 1. PDF - Use pdfUtils
  if (fileType === 'pdf') {
    try {
      const pdfMeta = await extractBookMetadataAndCover(file);
      return {
        title: pdfMeta.title || cleanTitle,
        author: pdfMeta.author || 'Document',
        totalPages: pdfMeta.totalPages || 1,
        coverDataUrl: pdfMeta.coverDataUrl,
        fileType,
        fileExtension
      };
    } catch (err) {
      console.warn('PDF meta extraction failed, falling back to custom cover:', err);
    }
  }

  // 2. Images - Use image file directly as cover
  if (fileType === 'image') {
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });

    return {
      title: cleanTitle,
      author: 'Image Asset',
      totalPages: 1,
      coverDataUrl: dataUrl,
      fileType,
      fileExtension
    };
  }

  // 3. Videos - Extract thumbnail frame from 1st second
  if (fileType === 'video') {
    try {
      const videoCover = await new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        const url = URL.createObjectURL(file);
        video.src = url;

        video.onloadeddata = () => {
          video.currentTime = Math.min(1.0, video.duration / 2 || 0.5);
        };

        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            URL.revokeObjectURL(url);
            resolve(dataUrl);
          } catch (e) {
            URL.revokeObjectURL(url);
            resolve(null);
          }
        };

        video.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };
      });

      if (videoCover) {
        return {
          title: cleanTitle,
          author: 'Video Note',
          totalPages: 1,
          coverDataUrl: videoCover,
          fileType,
          fileExtension
        };
      }
    } catch (err) {
      console.warn('Video thumbnail capture fallback:', err);
    }
  }

  // 4. Audio, Docs, Sheets, Text, Other - Generate Canvas Card Graphic
  const canvasCover = generateCanvasCardCover(cleanTitle, fileExtension, label, color);
  return {
    title: cleanTitle,
    author: label,
    totalPages: 1,
    coverDataUrl: canvasCover,
    fileType,
    fileExtension
  };
}

/**
 * Draw a cover canvas graphic with title, badge, gradient and icon style
 */
function generateCanvasCardCover(title, extension, label, accentColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 533; // 3:4 aspect ratio matching book cover
  const ctx = canvas.getContext('2d');

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 400, 533);
  grad.addColorStop(0, '#1e293b');
  grad.addColorStop(0.5, '#0f172a');
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 400, 533);

  // Subtle Accent Geometric Shapes
  ctx.fillStyle = accentColor + '20';
  ctx.beginPath();
  ctx.arc(320, 100, 140, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(80, 420, 120, 0, Math.PI * 2);
  ctx.fill();

  // Extension Badge Card Box
  ctx.fillStyle = accentColor;
  if (ctx.roundRect) {
    ctx.roundRect(130, 120, 140, 140, 24);
  } else {
    ctx.fillRect(130, 120, 140, 140);
  }
  ctx.fill();

  // Extension Text inside Badge
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(extension, 200, 190);

  // Title Text
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  
  // Wrap Title if needed
  const words = title.split(' ');
  let line = '';
  let y = 310;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 340 && n > 0) {
      ctx.fillText(line, 200, y);
      line = words[n] + ' ';
      y += 34;
      if (y > 410) {
        line = '...';
        break;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 200, y);

  // Bottom Label Subtitle
  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px sans-serif';
  ctx.fillText(label.toUpperCase(), 200, 470);

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Format bytes to readable size string (e.g. 2.4 MB)
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Parse CSV text into array of rows
 */
export function parseCsvContent(text) {
  if (!text) return { headers: [], rows: [] };
  const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        let val = cur.trim();
        if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
          val = val.slice(1, -1).replace(/""/g, '"');
        }
        result.push(val);
        cur = '';
      } else {
        cur += c;
      }
    }
    let val = cur.trim();
    if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
      val = val.slice(1, -1).replace(/""/g, '"');
    }
    result.push(val);
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}
