import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize, 
  Bookmark, 
  PanelLeft,
  Loader2,
  Maximize2,
  StickyNote,
  Sparkles,
  Edit3,
  FileText,
  Palette
} from 'lucide-react';
import { getPdfDocumentInstance } from '../utils/pdfUtils';
import { updateBookProgress, toggleBookmark, toggleFavorite, ensurePdfBlob } from '../db/libraryDb';
import { trackReadingTime, unlockAchievement } from '../utils/gamification';
import { NotesDrawer } from './NotesDrawer';
import { Companion3D } from './Companion3D';

export function PdfReader({ book, onClose, onProgressUpdated, onFallbackToDoc, onOpenEdit }) {
  const { id, title, totalPages, currentPage: initialPage = 1, pdfBlob, bookmarks: initialBookmarks = [], favorite: initialFavorite = false } = book;

  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [fitMode, setFitMode] = useState('auto'); // 'auto' | 'custom'
  const [manualScale, setManualScale] = useState(1.0);
  const [displayScale, setDisplayScale] = useState(100);
  const [readerTheme, setReaderTheme] = useState('paper'); // 'paper' | 'sepia' | 'dark'
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [show3dCompanion, setShow3dCompanion] = useState(true);
  const [thumbnails, setThumbnails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pageInputValue, setPageInputValue] = useState(initialPage.toString());

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const readerRootRef = useRef(null);
  const renderTaskRef = useRef(null);
  const pageCacheRef = useRef(new Map());
  const lastContainerDimensions = useRef({ width: 0, height: 0 });
  const animFrameRef = useRef(null);

  // Clear cache when document changes
  useEffect(() => {
    pageCacheRef.current.clear();
  }, [id]);

  // Sync input value when page changes
  useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);

  // Track active reading time every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      trackReadingTime(1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Check finished book achievement
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 1) {
      unlockAchievement('first_finished');
    }
  }, [currentPage, totalPages]);

  // Separate progress tracking effect (prevents re-render side-effects in rendering loop)
  useEffect(() => {
    if (id && currentPage && totalPages) {
      updateBookProgress(id, currentPage, totalPages).then(() => {
        if (onProgressUpdated) onProgressUpdated();
      });
    }
  }, [id, currentPage, totalPages, onProgressUpdated]);

  const bookId = book?.id;
  const bookPdfUrl = book?.pdfUrl;

  // Load PDF Document instance once per book (fetches from cloud if blob is missing)
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(false);

    async function loadPdf() {
      try {
        const activeBlob = await ensurePdfBlob(book);
        if (!activeBlob) {
          throw new Error('PDF file unavailable.');
        }
        const doc = await getPdfDocumentInstance(activeBlob);
        if (isMounted) {
          setPdfDoc(doc);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Failed to load PDF in reader, switching to doc viewer:', err);
        if (isMounted) {
          setIsLoading(false);
          setLoadError(true);
          if (onFallbackToDoc) {
            onFallbackToDoc();
          }
        }
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [bookId, bookPdfUrl]);

  // Calculate auto-fit scale based on container dimensions
  const calculateAutoFitScale = useCallback((pageObj) => {
    if (!pageObj) return 1.0;

    const container = containerRef.current;
    const paddingX = window.innerWidth <= 640 ? 12 : 32;
    const paddingY = window.innerWidth <= 640 ? 12 : 32;

    const containerWidth = container && container.clientWidth > 0 ? container.clientWidth : window.innerWidth;
    const containerHeight = container && container.clientHeight > 0 ? container.clientHeight : (window.innerHeight - 56);

    const availableWidth = Math.max(200, containerWidth - paddingX);
    const availableHeight = Math.max(200, containerHeight - paddingY);

    const unscaledViewport = pageObj.getViewport({ scale: 1.0 });

    const scaleX = availableWidth / unscaledViewport.width;
    const scaleY = availableHeight / unscaledViewport.height;

    const fitScale = Math.min(scaleX, scaleY);
    return Math.max(0.2, Math.min(3.0, fitScale));
  }, []);

  // Double-buffered PDF Page Rendering with Offscreen Canvas & In-Memory Caching
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (e) {
        // ignore cancellation
      }
      renderTaskRef.current = null;
    }

    try {
      const page = await pdfDoc.getPage(currentPage);
      
      let targetScale = manualScale;
      if (fitMode === 'auto') {
        targetScale = calculateAutoFitScale(page);
      }

      setDisplayScale(Math.round(targetScale * 100));

      const viewport = page.getViewport({ scale: targetScale });
      const mainCanvas = canvasRef.current;
      if (!mainCanvas) return;

      const outputScale = window.devicePixelRatio || 1;
      const renderWidth = Math.floor(viewport.width * outputScale);
      const renderHeight = Math.floor(viewport.height * outputScale);
      const displayWidthPx = `${Math.floor(viewport.width)}px`;
      const displayHeightPx = `${Math.floor(viewport.height)}px`;

      const cacheKey = `${currentPage}_${renderWidth}x${renderHeight}_${outputScale}`;
      
      // Check in-memory canvas cache for instant rendering
      if (pageCacheRef.current.has(cacheKey)) {
        const cachedOffscreen = pageCacheRef.current.get(cacheKey);
        mainCanvas.width = renderWidth;
        mainCanvas.height = renderHeight;
        mainCanvas.style.width = displayWidthPx;
        mainCanvas.style.height = displayHeightPx;
        const mainCtx = mainCanvas.getContext('2d');
        mainCtx.drawImage(cachedOffscreen, 0, 0);
        return;
      }

      // Render to an Offscreen Canvas (Double-Buffering) to avoid main canvas blanking/flicker
      const offscreen = document.createElement('canvas');
      offscreen.width = renderWidth;
      offscreen.height = renderHeight;

      const offscreenCtx = offscreen.getContext('2d');
      const transform = outputScale !== 1 
        ? [outputScale, 0, 0, outputScale, 0, 0] 
        : null;

      const renderTask = page.render({
        canvasContext: offscreenCtx,
        viewport: viewport,
        transform: transform
      });

      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;

      // Store offscreen canvas in cache (limit max 15 pages in memory)
      if (pageCacheRef.current.size > 15) {
        const firstKey = pageCacheRef.current.keys().next().value;
        pageCacheRef.current.delete(firstKey);
      }
      pageCacheRef.current.set(cacheKey, offscreen);

      // Atomically copy rendered pixels onto visible main canvas
      mainCanvas.width = renderWidth;
      mainCanvas.height = renderHeight;
      mainCanvas.style.width = displayWidthPx;
      mainCanvas.style.height = displayHeightPx;
      const mainContext = mainCanvas.getContext('2d');
      mainContext.drawImage(offscreen, 0, 0);

    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', err);
      }
    }
  }, [pdfDoc, currentPage, manualScale, fitMode, calculateAutoFitScale]);

  // Re-render page when PDF doc, page, scale or fitMode changes
  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [pdfDoc, currentPage, manualScale, fitMode, renderPage]);

  // Scroll & Mobile-Safe ResizeObserver (Ignores mobile address-bar collapse height shifts)
  useEffect(() => {
    if (!containerRef.current || fitMode !== 'auto') return;

    const handleResize = (entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const newWidth = Math.floor(entry.contentRect.width);
      const newHeight = Math.floor(entry.contentRect.height);

      const widthDelta = Math.abs(newWidth - lastContainerDimensions.current.width);
      const heightDelta = Math.abs(newHeight - lastContainerDimensions.current.height);

      // On mobile browsers, scrolling collapses the top/bottom bar changing height without width change.
      // We ignore height-only resizes unless width changes significantly (> 12px) to stop scroll flickering.
      if (widthDelta > 12 || (widthDelta > 4 && heightDelta > 20)) {
        lastContainerDimensions.current = { width: newWidth, height: newHeight };
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(() => {
          renderPage();
        });
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [fitMode, renderPage]);

  // Handle Page Navigation
  const goToPage = (pageNum) => {
    const target = Math.max(1, Math.min(totalPages, pageNum));
    setCurrentPage(target);
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  // 50%-50% Screen split click for instant page sliding
  const handleViewportClick = (e) => {
    if (e.target.closest('button, input, select, textarea, aside, .reader-header, .notes-drawer')) return;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const halfWidth = rect.width / 2;

    if (clickX < halfWidth) {
      if (currentPage > 1) {
        goToPage(currentPage - 1);
      }
    } else {
      if (currentPage < totalPages) {
        goToPage(currentPage + 1);
      }
    }
  };

  // Manual Zoom Handler
  const handleZoomIn = () => {
    setFitMode('custom');
    setManualScale(s => Math.min(3.0, s + 0.15));
  };

  const handleZoomOut = () => {
    setFitMode('custom');
    setManualScale(s => Math.max(0.4, s - 0.15));
  };

  const handleResetFit = () => {
    setFitMode('auto');
  };

  // Page input submission
  const handlePageInputSubmit = (e) => {
    if (e.key === 'Enter') {
      const parsed = parseInt(pageInputValue, 10);
      if (!isNaN(parsed)) {
        goToPage(parsed);
      }
    }
  };

  // Bookmark & Favorite toggle (Adds to Favorites collection)
  const handleToggleBookmark = async () => {
    const nextFavState = !isFavorite;
    setIsFavorite(nextFavState);
    await toggleFavorite(id, isFavorite);
    const updated = await toggleBookmark(id, currentPage);
    if (updated) setBookmarks(updated);
    if (onProgressUpdated) onProgressUpdated();
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'INPUT') return;

      if (e.key === 'ArrowLeft' || e.key === 'k' || e.key === 'K') {
        prevPage();
      } else if (e.key === 'ArrowRight' || e.key === 'j' || e.key === 'J') {
        nextPage();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape' && !document.fullscreenElement) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      readerRootRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Render Thumbnail list in Sidebar
  useEffect(() => {
    if (isSidebarOpen && pdfDoc && thumbnails.length === 0) {
      const loadThumbnails = async () => {
        const list = [];
        const count = Math.min(totalPages, 30);
        for (let p = 1; p <= count; p++) {
          try {
            const page = await pdfDoc.getPage(p);
            const vp = page.getViewport({ scale: 0.2 });
            const canvas = document.createElement('canvas');
            canvas.width = vp.width;
            canvas.height = vp.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport: vp }).promise;
            list.push({ pageNum: p, dataUrl: canvas.toDataURL() });
          } catch (e) {
            console.error(e);
          }
        }
        setThumbnails(list);
      };
      loadThumbnails();
    }
  }, [isSidebarOpen, pdfDoc, totalPages, thumbnails.length]);

  const isCurrentPageBookmarked = bookmarks.includes(currentPage);

  return (
    <div ref={readerRootRef} className={`reader-root theme-${readerTheme}`}>
      {/* Top Header Control Bar */}
      <header className="reader-header">
        <div className="reader-header-left">
          <button onClick={onClose} className="btn-secondary nav-back" title="Back to Clownkosh (Esc)">
            <ArrowLeft size={16} />
            <span className="back-text">Clownkosh</span>
          </button>
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className={`btn-icon ${isSidebarOpen ? 'active' : ''}`}
            title="Toggle Sidebar Pages"
          >
            <PanelLeft size={18} />
          </button>

          <div className="reader-book-title" title={title}>
            <span>{title}</span>
          </div>
        </div>

        {/* Center Page Controls */}
        <div className="reader-page-controls">
          <button 
            onClick={prevPage} 
            disabled={currentPage <= 1}
            className="btn-icon" 
            title="Previous Page"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="page-input-wrapper">
            <input
              type="text"
              value={pageInputValue}
              onChange={(e) => setPageInputValue(e.target.value)}
              onKeyDown={handlePageInputSubmit}
              className="page-input"
            />
            <span className="page-total">/ {totalPages}</span>
          </div>

          <button 
            onClick={nextPage} 
            disabled={currentPage >= totalPages}
            className="btn-icon" 
            title="Next Page"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="reader-header-right">
          {/* 3D Companion Toggle */}
          <button 
            onClick={() => setShow3dCompanion(!show3dCompanion)} 
            className={`btn-icon ${show3dCompanion ? 'active' : ''}`}
            title="Toggle 3D Reading Buddy"
          >
            <Sparkles size={18} />
          </button>

          {/* Edit Note / Content Toggle */}
          {onOpenEdit && (
            <button 
              onClick={() => onOpenEdit(book)} 
              className="btn-icon" 
              title="Edit Note or Content"
              style={{ color: '#f59e0b' }}
            >
              <Edit3 size={18} />
            </button>
          )}

          {/* Notes Drawer Toggle */}
          <button 
            onClick={() => setIsNotesOpen(!isNotesOpen)} 
            className={`btn-icon ${isNotesOpen ? 'active' : ''}`} 
            title="Book Notes & Quotes"
          >
            <StickyNote size={18} />
          </button>

          {/* Zoom & Fit Controls */}
          <div className="zoom-controls">
            <button onClick={handleZoomOut} className="btn-icon" title="Zoom Out">
              <ZoomOut size={16} />
            </button>
            
            <button 
              onClick={handleResetFit}
              className={`fit-btn ${fitMode === 'auto' ? 'active' : ''}`}
              title="Fit to Screen"
            >
              <Maximize2 size={13} />
              <span>{fitMode === 'auto' ? 'Fit Screen' : `${displayScale}%`}</span>
            </button>

            <button onClick={handleZoomIn} className="btn-icon" title="Zoom In">
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Theme Palette Popover Picker */}
          <div className="theme-palette-wrapper">
            <button 
              onClick={() => setIsPaletteOpen(!isPaletteOpen)}
              className={`btn-icon ${isPaletteOpen ? 'active' : ''}`}
              title="Choose Reader Color Theme"
            >
              <Palette size={18} />
            </button>

            {isPaletteOpen && (
              <div className="theme-palette-dropdown">
                <button 
                  onClick={() => { setReaderTheme('paper'); setIsPaletteOpen(false); }}
                  className={`palette-option ${readerTheme === 'paper' ? 'active' : ''}`}
                >
                  <span className="palette-dot paper-dot" />
                  <span>Paper Light</span>
                </button>

                <button 
                  onClick={() => { setReaderTheme('sepia'); setIsPaletteOpen(false); }}
                  className={`palette-option ${readerTheme === 'sepia' ? 'active' : ''}`}
                >
                  <span className="palette-dot sepia-dot" />
                  <span>Sepia Warm</span>
                </button>

                <button 
                  onClick={() => { setReaderTheme('dark'); setIsPaletteOpen(false); }}
                  className={`palette-option ${readerTheme === 'dark' ? 'active' : ''}`}
                >
                  <span className="palette-dot dark-dot" />
                  <span>Night Dark</span>
                </button>
              </div>
            )}
          </div>

          {/* Favorite & Bookmark Save Toggle */}
          <button 
            onClick={handleToggleBookmark}
            className={`btn-icon ${isFavorite || isCurrentPageBookmarked ? 'bookmarked' : ''}`}
            title={isFavorite ? 'Saved in Favorites & Bookmarked' : 'Add to Favorites & Save Bookmark'}
          >
            <Bookmark size={18} fill={isFavorite || isCurrentPageBookmarked ? 'currentColor' : 'none'} />
          </button>

          {/* Fullscreen Toggle */}
          <button onClick={toggleFullscreen} className="btn-icon" title="Toggle Fullscreen (F)">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </header>

      {/* Main Reading Viewport */}
      <div className="reader-main">
        {/* Left Sidebar Drawer */}
        {isSidebarOpen && (
          <aside className="reader-sidebar">
            <div className="sidebar-header">
              <h3>Pages ({totalPages})</h3>
            </div>
            <div className="sidebar-thumbnails">
              {thumbnails.map((item) => (
                <div 
                  key={item.pageNum}
                  onClick={() => goToPage(item.pageNum)}
                  className={`thumb-card ${currentPage === item.pageNum ? 'active' : ''}`}
                >
                  <img src={item.dataUrl} alt={`Page ${item.pageNum}`} className="thumb-img" />
                  <span className="thumb-label">
                    Page {item.pageNum}
                    {bookmarks.includes(item.pageNum) && <Bookmark size={12} className="thumb-bm-icon" fill="currentColor" />}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Central Document Area - Auto-fits screen with 50-50 click sliding */}
        <div ref={containerRef} className="document-viewport" onClick={handleViewportClick}>
          {isLoading ? (
            <div className="reader-loading">
              <Loader2 className="spin-icon" size={32} />
              <span>Loading document...</span>
            </div>
          ) : loadError || !pdfDoc ? (
            <div className="reader-loading" style={{ gap: '1rem', textAlign: 'center', padding: '2rem' }}>
              <FileText size={48} style={{ color: '#f59e0b' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Document Note Resource</h3>
              <p style={{ fontSize: '0.875rem', opacity: 0.85, maxWidth: '360px' }}>
                This resource is a text document note or non-PDF file. Click below to view in universal document reader.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                {onFallbackToDoc && (
                  <button onClick={onFallbackToDoc} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                    Open Document Reader
                  </button>
                )}
                <button onClick={onClose} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  Back to Library
                </button>
              </div>
            </div>
          ) : (
            <div className="canvas-wrapper">
              <canvas ref={canvasRef} className="pdf-canvas" />
            </div>
          )}
        </div>

        {/* 3D Animated Reading Companion Widget */}
        {show3dCompanion && (
          <Companion3D
            currentPage={currentPage}
            totalPages={totalPages}
            isReading={true}
          />
        )}

        {/* Notes Drawer */}
        <NotesDrawer
          isOpen={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
          bookId={id}
          currentPage={currentPage}
        />
      </div>

      <style>{`
        .reader-root {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          font-family: var(--font-sans);
          transition: background-color 0.2s ease;
          overflow: hidden;
          width: 100vw;
          height: 100vh;
        }

        /* Reader Color Themes & High-Contrast Visibility */
        .theme-paper {
          background-color: #f3f4f6;
          color: #111827;
        }
        .theme-paper .reader-header, .theme-paper .reader-sidebar {
          background-color: #ffffff;
          border-color: #e5e7eb;
          color: #111827;
        }
        .theme-paper .pdf-canvas {
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        }
        .theme-paper .reader-page-controls {
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          color: #111827;
        }
        .theme-paper .page-input {
          background-color: #ffffff;
          color: #111827;
          border: 1px solid #d1d5db;
          font-weight: 600;
        }
        .theme-paper .page-total {
          color: #374151;
          font-weight: 500;
          opacity: 1;
        }
        .theme-paper .fit-btn {
          background-color: #ffffff;
          color: #374151;
          border-color: #d1d5db;
        }
        .theme-paper .btn-icon {
          color: #374151;
        }

        .theme-sepia {
          background-color: #fbf0d9;
          color: #433422;
        }
        .theme-sepia .reader-header, .theme-sepia .reader-sidebar {
          background-color: #f4e4c1;
          border-color: #e6d3a7;
          color: #433422;
        }
        .theme-sepia .pdf-canvas {
          box-shadow: 0 4px 20px rgba(67, 52, 34, 0.15);
          filter: sepia(20%);
        }
        .theme-sepia .reader-page-controls {
          background-color: #eee0c2;
          border: 1px solid #e6d3a7;
          color: #433422;
        }
        .theme-sepia .page-input {
          background-color: #fbf0d9;
          color: #433422;
          border: 1px solid #d6c398;
          font-weight: 600;
        }
        .theme-sepia .page-total {
          color: #433422;
          opacity: 0.9;
        }
        .theme-sepia .fit-btn {
          background-color: #fbf0d9;
          color: #433422;
          border-color: #e6d3a7;
        }
        .theme-sepia .btn-icon {
          color: #433422;
        }

        .theme-dark {
          background-color: #121418;
          color: #e2e8f0;
        }
        .theme-dark .reader-header, .theme-dark .reader-sidebar {
          background-color: #1a1d24;
          border-color: #2a2f3a;
          color: #e2e8f0;
        }
        .theme-dark .pdf-canvas {
          box-shadow: 0 4px 24px rgba(0,0,0,0.6);
          filter: invert(90%) hue-rotate(180deg);
        }
        .theme-dark .reader-page-controls {
          background-color: #242933;
          border: 1px solid #2a2f3a;
          color: #e2e8f0;
        }
        .theme-dark .page-input {
          background-color: #121418;
          color: #ffffff;
          border: 1px solid #3b4252;
          font-weight: 600;
        }
        .theme-dark .page-total {
          color: #94a3b8;
          opacity: 1;
        }
        .theme-dark .fit-btn {
          background-color: #242933;
          color: #e2e8f0;
          border-color: #3b4252;
        }
        .theme-dark .btn-icon {
          color: #94a3b8;
        }

        /* Header Control Bar */
        .reader-header {
          height: 56px;
          padding: 0 0.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
          z-index: 10;
          flex-shrink: 0;
          width: 100%;
          box-sizing: border-box;
        }

        .reader-header-left, .reader-header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-back {
          padding: 0.35rem 0.6rem;
          font-size: 0.85rem;
        }

        .reader-book-title {
          font-size: 0.875rem;
          font-weight: 600;
          max-width: 180px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .reader-page-controls {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .page-input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-family: var(--font-mono);
          font-size: 0.8rem;
        }

        .page-input {
          width: 42px;
          text-align: center;
          padding: 0.2rem 0.25rem;
          border-radius: 4px;
          font-size: 0.85rem;
          font-family: inherit;
          outline: none;
        }

        .page-total {
          font-size: 0.85rem;
        }

        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 0.2rem;
          font-family: var(--font-mono);
          font-size: 0.8rem;
        }

        .fit-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.25rem 0.45rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .fit-btn:hover, .fit-btn.active {
          opacity: 0.9;
        }

        /* Palette Picker Dropdown */
        .theme-palette-wrapper {
          position: relative;
        }

        .theme-palette-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.35rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          z-index: 100;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          min-width: 140px;
        }

        .palette-option {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.4rem 0.6rem;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-primary);
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }

        .palette-option:hover, .palette-option.active {
          background-color: var(--bg-tertiary);
        }

        .palette-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }

        .paper-dot { background-color: #ffffff; border: 1px solid #9ca3af; }
        .sepia-dot { background-color: #f4e4c1; border: 1px solid #d6c398; }
        .dark-dot { background-color: #1e293b; border: 1px solid #475569; }

        .bookmarked {
          color: #eab308 !important;
        }

        /* Reader Layout */
        .reader-main {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
          width: 100%;
          height: calc(100vh - 56px);
        }

        .reader-sidebar {
          width: 200px;
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          flex-shrink: 0;
        }

        .sidebar-header {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .sidebar-header h3 {
          font-size: 0.85rem;
          font-weight: 600;
        }

        .sidebar-thumbnails {
          flex: 1;
          overflow-y: auto;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .thumb-card {
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 0.35rem;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
        }

        .thumb-card:hover, .thumb-card.active {
          border-color: var(--text-primary);
          background-color: rgba(0,0,0,0.05);
        }

        .thumb-img {
          width: 100%;
          border-radius: 4px;
        }

        .thumb-label {
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-family: var(--font-mono);
        }

        .thumb-bm-icon {
          color: #eab308;
        }

        /* Responsive Viewport with Screen Padding & Zero Blinking */
        .document-viewport {
          flex: 1;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          contain: layout paint size;
          touch-action: pan-x pan-y;
        }

        .canvas-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: auto;
          max-width: 100%;
          max-height: 100%;
          overflow: hidden;
          contain: layout paint;
          isolation: isolate;
        }

        .pdf-canvas {
          display: block;
          border-radius: 4px;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transform: translate3d(0, 0, 0);
          will-change: transform;
          backface-visibility: hidden;
        }

        .reader-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin: auto;
          opacity: 0.7;
        }

        @media (max-width: 640px) {
          .reader-book-title {
            display: none;
          }
          .back-text {
            display: none;
          }
          .zoom-controls {
            display: none;
          }
          .document-viewport {
            padding: 0.25rem;
          }
          .reader-header-left, .reader-header-right {
            gap: 0.35rem;
          }
        }
      `}</style>
    </div>
  );
}
