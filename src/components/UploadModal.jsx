import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, FileText, Loader2, CheckCircle2, AlertCircle, Tag, FileSpreadsheet, Music, Video, Image as ImageIcon, FileCode } from 'lucide-react';
import { generateCoverForFile, detectFileTypeAndExtension } from '../utils/fileUtils';
import { saveBook } from '../db/libraryDb';

export function getFormatDetailsForCategory(catName) {
  const cat = (catName || '').toLowerCase();
  if (cat.includes('audio')) {
    return { label: 'Audio Lecture Files', extHint: 'MP3, WAV, M4A, AAC', accept: '.mp3,.wav,.m4a,.aac,.flac,.ogg', icon: Music, color: '#8b5cf6' };
  }
  if (cat.includes('video')) {
    return { label: 'Video Tutorial Files', extHint: 'MP4, WEBM, MKV', accept: '.mp4,.webm,.mkv,.avi,.mov', icon: Video, color: '#f59e0b' };
  }
  if (cat.includes('sheet') || cat.includes('data')) {
    return { label: 'Spreadsheets & Data Tables', extHint: 'XLS, XLSX, CSV', accept: '.xls,.xlsx,.csv,.tsv,.ods', icon: FileSpreadsheet, color: '#10b981' };
  }
  if (cat.includes('doc') || cat.includes('note')) {
    return { label: 'Documents & Lecture Notes', extHint: 'DOC, DOCX, TXT, MD, PDF', accept: '.doc,.docx,.txt,.md,.rtf,.pdf', icon: FileText, color: '#3b82f6' };
  }
  if (cat.includes('pdf') || cat.includes('book')) {
    return { label: 'PDF Documents & E-Books', extHint: 'PDF files', accept: '.pdf', icon: FileText, color: '#ef4444' };
  }
  if (cat.includes('diagram') || cat.includes('visual')) {
    return { label: 'Image Diagrams & Charts', extHint: 'PNG, JPG, WEBP, SVG', accept: '.png,.jpg,.jpeg,.webp,.gif,.svg', icon: ImageIcon, color: '#ec4899' };
  }
  return { label: 'Study Notes & Media Resources', extHint: 'PDF, DOC, XLS, MP3, MP4', accept: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.mp3,.wav,.mp4,.webm,.txt,.md,.png,.jpg,.jpeg,.webp,.zip', icon: UploadCloud, color: '#6366f1' };
}

export function UploadModal({ isOpen, onClose, onBookAdded, profile, initialCategory = 'Docs & Lecture Notes' }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [customCategory, setCustomCategory] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Sync initial category when modal opens
  useEffect(() => {
    if (isOpen && initialCategory) {
      setSelectedCategory(initialCategory !== 'all' ? initialCategory : 'Docs & Lecture Notes');
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const categories = [
    'Docs & Lecture Notes',
    'E-Books & PDFs',
    'Data & Spreadsheets',
    'Audio Lectures',
    'Video Tutorials',
    'Diagrams & Visuals',
    'CS & Technology',
    'Mathematics & Science',
    'Competitive Exams',
    'General Knowledge',
    'Other'
  ];

  const finalCategory = selectedCategory === 'Other' && customCategory.trim() !== '' 
    ? customCategory.trim() 
    : selectedCategory;

  const activeFormatInfo = getFormatDetailsForCategory(finalCategory);
  const FormatIcon = activeFormatInfo.icon;

  const handleFiles = async (filesList) => {
    const files = Array.from(filesList);
    
    if (files.length === 0) {
      setUploadStatus({
        state: 'error',
        message: 'Please select valid files to upload.'
      });
      return;
    }

    setUploadStatus({
      state: 'processing',
      message: `Processing ${files.length} ${activeFormatInfo.label} item(s)... Extracting previews & metadata...`,
      progress: 20
    });

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const fileDetails = detectFileTypeAndExtension(file);
        const coverMeta = await generateCoverForFile(file);

        await saveBook({
          title: coverMeta.title || file.name,
          author: coverMeta.author || profile?.name || 'Contributor',
          category: finalCategory,
          fileType: fileDetails.fileType,
          fileExtension: fileDetails.fileExtension,
          fileSize: file.size,
          mimeType: fileDetails.mimeType,
          uploadedBy: profile?.name || 'Reader',
          totalPages: coverMeta.totalPages || 1,
          coverDataUrl: coverMeta.coverDataUrl,
          mediaBlob: file
        });
      }

      setUploadStatus({
        state: 'success',
        message: `Successfully uploaded ${files.length} item(s) to "${finalCategory}"!`,
        progress: 100
      });

      if (onBookAdded) onBookAdded();

      setTimeout(() => {
        setUploadStatus(null);
        onClose();
      }, 1200);

    } catch (err) {
      console.error(err);
      setUploadStatus({
        state: 'error',
        message: err.message || 'Failed to import files. Please try again.'
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <FormatIcon size={24} style={{ color: activeFormatInfo.color }} />
            <div>
              <h2>Upload {activeFormatInfo.label}</h2>
              <p className="modal-subhead">Format target: <strong>{activeFormatInfo.extHint}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Format Chips Banner */}
          <div className="format-chips-container" style={{ borderColor: activeFormatInfo.color + '40' }}>
            <span className="chips-label">Accepted Formats for {finalCategory}:</span>
            <div className="chips-list">
              <span className="format-chip" style={{ color: activeFormatInfo.color, backgroundColor: activeFormatInfo.color + '15' }}>
                <FormatIcon size={12} /> {activeFormatInfo.extHint}
              </span>
            </div>
          </div>

          {/* Category Selector */}
          <div className="category-section">
            <label className="category-label">
              <Tag size={14} />
              <span>Select Category / Subject:</span>
            </label>
            <div className="category-pills">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {selectedCategory === 'Other' && (
              <input
                type="text"
                placeholder="Enter custom category name..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="custom-cat-input"
              />
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={activeFormatInfo.accept}
            multiple
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />

          <div
            className={`dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="dropzone-icon" style={{ color: activeFormatInfo.color }}>
              <FormatIcon size={32} />
            </div>
            <p className="dropzone-text">
              <span className="highlight">Click to select {activeFormatInfo.label}</span> or drag files here
            </p>
            <p className="dropzone-sub">
              Target Category: <strong>{finalCategory}</strong> ({activeFormatInfo.extHint})
            </p>
          </div>

          {/* Status Alert */}
          {uploadStatus && (
            <div className={`status-banner ${uploadStatus.state}`}>
              {uploadStatus.state === 'processing' && <Loader2 className="spin-icon" size={18} />}
              {uploadStatus.state === 'success' && <CheckCircle2 size={18} />}
              {uploadStatus.state === 'error' && <AlertCircle size={18} />}
              <span>{uploadStatus.message}</span>
            </div>
          )}
        </div>

        <style>{`
          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--border-color);
          }

          .modal-title-group {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .modal-title-group h2 {
            font-size: 1.15rem;
            font-weight: 700;
          }

          .modal-subhead {
            font-size: 0.775rem;
            color: var(--text-tertiary);
            margin-top: 1px;
          }

          .modal-body {
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1.15rem;
          }

          .format-chips-container {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            padding: 0.6rem 0.85rem;
            background-color: var(--bg-primary);
            border: 1px dashed var(--border-color);
            border-radius: var(--radius-md);
          }

          .chips-label {
            font-size: 0.725rem;
            font-weight: 600;
            color: var(--text-tertiary);
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .chips-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
          }

          .format-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 0.2rem 0.6rem;
            border-radius: var(--radius-sm);
          }

          .category-section {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .category-label {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-secondary);
          }

          .category-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 0.35rem;
            max-height: 120px;
            overflow-y: auto;
          }

          .category-pill {
            padding: 0.35rem 0.75rem;
            border-radius: var(--radius-full);
            font-size: 0.8rem;
            font-weight: 500;
            background-color: var(--bg-primary);
            border: 1px solid var(--border-color);
            color: var(--text-secondary);
            transition: all 0.15s ease;
          }

          .category-pill:hover {
            color: var(--text-primary);
            border-color: var(--text-tertiary);
          }

          .category-pill.active {
            background-color: var(--text-primary);
            color: var(--bg-primary);
            border-color: var(--text-primary);
          }

          .custom-cat-input {
            margin-top: 0.25rem;
            padding: 0.4rem 0.75rem;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border-color);
            background-color: var(--bg-primary);
            color: var(--text-primary);
            font-size: 0.85rem;
            outline: none;
          }

          .custom-cat-input:focus {
            border-color: var(--border-focus);
          }

          .dropzone {
            border: 2px dashed var(--border-color);
            border-radius: var(--radius-md);
            padding: 1.75rem 1.25rem;
            text-align: center;
            background-color: var(--bg-primary);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
          }

          .dropzone:hover, .dropzone.dragging {
            border-color: var(--text-primary);
            background-color: var(--bg-tertiary);
          }

          .dropzone-icon {
            width: 52px;
            height: 52px;
            border-radius: var(--radius-full);
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .dropzone-text {
            font-size: 0.9rem;
            color: var(--text-secondary);
          }

          .dropzone-text .highlight {
            color: var(--text-primary);
            font-weight: 600;
            text-decoration: underline;
          }

          .dropzone-sub {
            font-size: 0.75rem;
            color: var(--text-tertiary);
          }

          .dropzone-sub strong {
            color: var(--text-primary);
          }

          .status-banner {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.875rem 1rem;
            border-radius: var(--radius-sm);
            font-size: 0.875rem;
            font-weight: 500;
          }

          .status-banner.processing {
            background-color: var(--accent-light);
            color: var(--accent-color);
          }

          .status-banner.success {
            background-color: rgba(34, 197, 94, 0.1);
            color: #16a34a;
          }

          .status-banner.error {
            background-color: rgba(239, 68, 68, 0.1);
            color: #dc2626;
          }

          .spin-icon {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
