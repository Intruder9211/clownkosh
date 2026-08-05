import * as pdfjsLib from 'pdfjs-dist';

// Use Vite worker bundling for 100% reliable worker loading in production & dev
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch (e) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`;
  }
}


/**
 * Parses an uploaded PDF File blob, extracts title/author metadata if present,
 * and renders Page 1 onto an offscreen canvas to generate a cover thumbnail data URL.
 */
export async function extractBookMetadataAndCover(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    
    const loadingTask = pdfjsLib.getDocument({ data: typedArray });
    const pdfDoc = await loadingTask.promise;

    const totalPages = pdfDoc.numPages;

    // Try to get PDF Metadata
    let title = file.name.replace(/\.[^/.]+$/, ""); // fallback to filename without extension
    let author = 'Unknown Author';

    try {
      const metadata = await pdfDoc.getMetadata();
      if (metadata && metadata.info) {
        if (metadata.info.Title && typeof metadata.info.Title === 'string' && metadata.info.Title.trim() !== '') {
          title = metadata.info.Title.trim();
        }
        if (metadata.info.Author && typeof metadata.info.Author === 'string' && metadata.info.Author.trim() !== '') {
          author = metadata.info.Author.trim();
        }
      }
    } catch (e) {
      console.warn('Metadata parsing skipped:', e);
    }

    // Render Page 1 for Cover Preview
    let coverDataUrl = null;
    try {
      const page1 = await pdfDoc.getPage(1);
      const viewport = page1.getViewport({ scale: 0.8 }); // preview size

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page1.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      coverDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    } catch (coverErr) {
      console.error('Failed to generate page 1 cover:', coverErr);
    }

    return {
      title,
      author,
      totalPages,
      coverDataUrl
    };
  } catch (err) {
    console.error('Error parsing PDF file:', err);
    throw new Error(`Failed to read PDF file (${err.message || 'Invalid format'}). Please ensure it is a valid PDF document.`);
  }
}

/**
 * Loads PDF Document instance for the reader component.
 */
export async function getPdfDocumentInstance(pdfBlob) {
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);
  return await pdfjsLib.getDocument({ data: typedArray }).promise;
}

