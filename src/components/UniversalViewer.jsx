import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Download, 
  StickyNote, 
  Edit3,
  Search, 
  Loader2,
  Sparkles
} from 'lucide-react';
import { ensurePdfBlob, updateBookProgress } from '../db/libraryDb';
import { trackReadingTime } from '../utils/gamification';
import { parseCsvContent, formatBytes } from '../utils/fileUtils';
import { PdfReader } from './PdfReader';
import { NotesDrawer } from './NotesDrawer';

export function UniversalViewer({ book, onClose, onProgressUpdated, onOpenEdit }) {
  const [forceDocViewer, setForceDocViewer] = useState(false);
  if (!book) return null;

  const ext = (book.fileExtension || '').toLowerCase();
  const ft = (book.fileType || '').toLowerCase();

  // Manually created custom notes/sheets use MediaAndDocViewer
  const isCustomNote = !!book.isCustomNote;

  if (!forceDocViewer && (!isCustomNote || ft === 'pdf' || ext === 'pdf')) {
    return (
      <PdfReader 
        book={book} 
        onClose={onClose} 
        onProgressUpdated={onProgressUpdated} 
        onFallbackToDoc={() => setForceDocViewer(true)}
        onOpenEdit={isCustomNote ? onOpenEdit : null}
      />
    );
  }

  return <MediaAndDocViewer book={book} onClose={onClose} onProgressUpdated={onProgressUpdated} onOpenEdit={isCustomNote ? onOpenEdit : null} />;
}

function MediaAndDocViewer({ book, onClose, onProgressUpdated, onOpenEdit }) {
  const { id, title, author, fileType = 'doc', fileExtension = 'DOC', fileSize = 0 } = book;
  const [blob, setBlob] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // Audio / Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);

  // Sheet / Text state
  const [textContent, setTextContent] = useState('');
  const [sheetData, setSheetData] = useState({ headers: [], rows: [] });
  const [sheetSearch, setSheetSearch] = useState('');

  const mediaRef = useRef(null);
  const containerRef = useRef(null);

  // Active duration timer for gamification XP
  useEffect(() => {
    const timer = setInterval(() => {
      trackReadingTime(1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Blob
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    async function loadData() {
      try {
        const fileBlob = await ensurePdfBlob(book);
        if (!active) return;
        if (fileBlob) {
          setBlob(fileBlob);
          const url = URL.createObjectURL(fileBlob);
          setBlobUrl(url);

          // If sheet or text, parse text content
          if (['sheet', 'text', 'doc'].includes(fileType)) {
            try {
              const text = await fileBlob.text();
              setTextContent(text);
              if (fileType === 'sheet' || fileExtension === 'CSV') {
                const parsed = parseCsvContent(text);
                setSheetData(parsed);
              }
            } catch (err) {
              console.warn('Text reading error:', err);
            }
          }
        }
      } catch (err) {
        console.error('Error loading media blob:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [book, fileType, fileExtension]);

  // Audio / Video timeupdate handlers
  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
      setDuration(mediaRef.current.duration || 0);

      if (mediaRef.current.duration) {
        updateBookProgress(id, Math.ceil(mediaRef.current.currentTime), Math.ceil(mediaRef.current.duration));
        if (onProgressUpdated) onProgressUpdated();
      }
    }
  };

  const togglePlay = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleRateChange = (rate) => {
    setPlaybackRate(rate);
    if (mediaRef.current) {
      mediaRef.current.playbackRate = rate;
    }
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = title || `resource.${fileExtension.toLowerCase()}`;
    a.click();
  };

  return (
    <div className="viewer-overlay" ref={containerRef}>
      {/* Viewer Header Bar */}
      <div className="viewer-bar">
        <div className="bar-left">
          <button onClick={onClose} className="btn-icon back-btn" title="Back to Library">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="bar-title" title={title}>{title}</h2>
            <div className="bar-meta">
              <span className={`format-tag ${fileType}`}>{fileExtension}</span>
              <span>{author}</span>
              {fileSize > 0 && <span>• {formatBytes(fileSize)}</span>}
            </div>
          </div>
        </div>

        <div className="bar-actions">
          {onOpenEdit && (['doc', 'text', 'sheet'].includes((fileType || '').toLowerCase()) || ['doc', 'docx', 'txt', 'md', 'csv', 'xls', 'xlsx'].includes((fileExtension || title?.split('.').pop() || '').toLowerCase())) && (
            <button 
              onClick={() => onOpenEdit(book)} 
              className="btn-action edit-action-btn" 
              title="Edit Note or Sheet"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}
            >
              <Edit3 size={17} />
              <span>Edit {fileType === 'sheet' || fileExtension === 'CSV' ? 'Sheet' : 'Note'}</span>
            </button>
          )}

          <button onClick={() => setIsNotesOpen(true)} className="btn-action" title="Open Notes & Highlights">
            <StickyNote size={17} />
            <span>Notes</span>
          </button>

          <button onClick={handleDownload} className="btn-action primary" title="Download File">
            <Download size={17} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Viewer Content Body */}
      <div className="viewer-body">
        {isLoading ? (
          <div className="viewer-loading">
            <Loader2 size={36} className="spin-icon" />
            <p>Loading resource preview...</p>
          </div>
        ) : (
          <>
            {/* 1. AUDIO PLAYER VIEW */}
            {fileType === 'audio' && (
              <div className="audio-player-card">
                <div className="audio-visualizer-box">
                  <div className="audio-icon-pulse">
                    <Music size={48} />
                  </div>
                  <div className="wave-bars">
                    {[40, 70, 30, 90, 50, 80, 60, 100, 45, 85].map((h, i) => (
                      <span key={i} className={`wave-bar ${isPlaying ? 'animated' : ''}`} style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>

                <audio
                  ref={mediaRef}
                  src={blobUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                />

                <div className="timeline-container">
                  <span className="time-text">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="timeline-slider"
                  />
                  <span className="time-text">{formatTime(duration)}</span>
                </div>

                <div className="player-controls-row">
                  <div className="rate-selector">
                    {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleRateChange(rate)}
                        className={`rate-btn ${playbackRate === rate ? 'active' : ''}`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>

                  <button onClick={togglePlay} className="play-big-btn">
                    {isPlaying ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: 3 }} />}
                  </button>

                  <button onClick={toggleMute} className="btn-icon">
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                </div>
              </div>
            )}

            {/* 2. VIDEO PLAYER VIEW */}
            {fileType === 'video' && (
              <div className="video-player-container">
                <video
                  ref={mediaRef}
                  src={blobUrl}
                  controls
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  className="video-element"
                />
              </div>
            )}

            {/* 3. SPREADSHEET / CSV TABLE VIEW */}
            {fileType === 'sheet' && (
              <div className="sheet-view-container">
                <div className="sheet-toolbar">
                  <div className="search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Search cells or rows..."
                      value={sheetSearch}
                      onChange={(e) => setSheetSearch(e.target.value)}
                    />
                  </div>
                  <span className="row-count-badge">
                    {sheetData.rows.length} Rows • {sheetData.headers.length} Columns
                  </span>
                </div>

                <div className="table-scroll-wrapper">
                  <table className="sheet-table">
                    {sheetData.headers.length > 0 && (
                      <thead>
                        <tr>
                          <th>#</th>
                          {sheetData.headers.map((h, i) => (
                            <th key={i}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {sheetData.rows
                        .filter((r) => !sheetSearch || r.some((c) => c.toLowerCase().includes(sheetSearch.toLowerCase())))
                        .map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td className="row-num">{rIdx + 1}</td>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. TEXT / DOC VIEW */}
            {(fileType === 'text' || fileType === 'doc') && (
              <div className="document-view-container">
                <div className="doc-paper">
                  {textContent ? (
                    <pre className="text-content-pre">{textContent}</pre>
                  ) : (
                    <div className="binary-doc-fallback">
                      <FileText size={64} className="doc-big-icon" />
                      <h3>{title}</h3>
                      <p>Document preview ready. Click below to download or view full file.</p>
                      <button onClick={handleDownload} className="btn-action primary big">
                        <Download size={18} /> Download {fileExtension} Document
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. IMAGE VIEW */}
            {fileType === 'image' && (
              <div className="image-view-container">
                <img src={blobUrl} alt={title} className="image-preview" />
              </div>
            )}

            {/* 6. OTHER / FALLBACK */}
            {fileType === 'other' && (
              <div className="binary-doc-fallback">
                <Sparkles size={64} className="doc-big-icon text-indigo-400" />
                <h3>{title}</h3>
                <p>Universal File Resource ({fileExtension})</p>
                <button onClick={handleDownload} className="btn-action primary big">
                  <Download size={18} /> Download Resource File
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Slide-out Notes Drawer */}
      <NotesDrawer
        bookId={id}
        currentPage={1}
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
      />

      <style>{`
        .viewer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          background-color: var(--bg-primary);
          display: flex;
          flex-direction: column;
        }

        .viewer-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.5rem;
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
        }

        .bar-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .bar-title {
          font-size: 1.05rem;
          font-weight: 700;
        }

        .bar-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.775rem;
          color: var(--text-secondary);
        }

        .format-tag {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.1rem 0.4rem;
          border-radius: var(--radius-sm);
          text-transform: uppercase;
          background-color: var(--bg-tertiary);
        }

        .format-tag.audio { background-color: rgba(139, 92, 246, 0.2); color: #a78bfa; }
        .format-tag.video { background-color: rgba(245, 158, 11, 0.2); color: #fbbf24; }
        .format-tag.sheet { background-color: rgba(16, 185, 129, 0.2); color: #34d399; }
        .format-tag.doc { background-color: rgba(59, 130, 246, 0.2); color: #60a5fa; }
        .format-tag.text { background-color: rgba(6, 182, 212, 0.2); color: #22d3ee; }

        .bar-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .btn-action {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          font-weight: 600;
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          cursor: pointer;
        }

        .btn-action.primary {
          background-color: var(--text-primary);
          color: var(--bg-primary);
        }

        .btn-action.big {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          margin-top: 1rem;
        }

        .viewer-body {
          flex: 1;
          overflow: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background-color: var(--bg-primary);
        }

        .viewer-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: var(--text-secondary);
        }

        /* Audio Player Styling */
        .audio-player-card {
          width: 100%;
          max-width: 520px;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          box-shadow: var(--card-shadow);
        }

        .audio-visualizer-box {
          width: 100%;
          height: 180px;
          background-color: var(--bg-tertiary);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          position: relative;
          overflow: hidden;
        }

        .audio-icon-pulse {
          color: #a78bfa;
        }

        .wave-bars {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 40px;
        }

        .wave-bar {
          width: 5px;
          background-color: #8b5cf6;
          border-radius: 4px;
          transition: height 0.2s ease;
        }

        .wave-bar.animated {
          animation: wave 1.2s ease-in-out infinite alternate;
        }

        @keyframes wave {
          0% { height: 20%; }
          100% { height: 100%; }
        }

        .timeline-container {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .time-text {
          font-size: 0.75rem;
          font-family: var(--font-mono);
          color: var(--text-secondary);
        }

        .timeline-slider {
          flex: 1;
          accent-color: #8b5cf6;
        }

        .player-controls-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .play-big-btn {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: #8b5cf6;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .play-big-btn:hover {
          transform: scale(1.05);
        }

        .rate-selector {
          display: flex;
          gap: 0.25rem;
        }

        .rate-btn {
          font-size: 0.7rem;
          padding: 0.25rem 0.45rem;
          border-radius: var(--radius-sm);
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          cursor: pointer;
        }

        .rate-btn.active {
          background-color: #8b5cf6;
          color: #ffffff;
          border-color: #8b5cf6;
        }

        /* Video Player */
        .video-player-container {
          width: 100%;
          max-width: 960px;
          height: 100%;
          max-height: 560px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .video-element {
          width: 100%;
          height: 100%;
          border-radius: var(--radius-md);
          background-color: #000;
        }

        /* Spreadsheet View */
        .sheet-view-container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .sheet-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-color);
          background-color: var(--bg-tertiary);
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-sm);

        }

        .search-box input {
          background: none;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 0.85rem;
        }

        .row-count-badge {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-family: var(--font-mono);
        }

        .table-scroll-wrapper {
          flex: 1;
          overflow: auto;
        }

        .sheet-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .sheet-table th, .sheet-table td {
          border: 1px solid var(--border-color);
          padding: 0.5rem 0.75rem;
          text-align: left;
        }

        .sheet-table th {
          background-color: var(--bg-tertiary);
          font-weight: 600;
          position: sticky;
          top: 0;
        }

        .row-num {
          background-color: var(--bg-tertiary);
          color: var(--text-tertiary);
          font-size: 0.75rem;
          text-align: center;
          width: 40px;
        }

        /* Document / Text View */
        .document-view-container {
          width: 100%;
          max-width: 800px;
          height: 100%;
          overflow-y: auto;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 2rem;
        }

        .text-content-pre {
          white-space: pre-wrap;
          font-family: var(--font-sans);
          line-height: 1.6;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .binary-doc-fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 3rem;
          text-align: center;
        }

        /* Image View */
        .image-view-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-preview {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: var(--radius-sm);
        }
      `}</style>
    </div>
  );
}
