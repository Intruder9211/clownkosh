import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, Loader2, CheckCircle2, AlertCircle, Tag } from 'lucide-react';
import { extractBookMetadataAndCover } from '../utils/pdfUtils';
import { saveBook } from '../db/libraryDb';

export function UploadModal({ isOpen, onClose, onBookAdded, profile }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('English');
  const [customCategory, setCustomCategory] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null); // { state: 'processing' | 'success' | 'error', message: string, progress: number }
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const categories = ['English', 'Hindi', 'Fiction', 'Technology', 'Education', 'Other'];

  const finalCategory = selectedCategory === 'Other' && customCategory.trim() !== '' 
    ? customCategory.trim() 
    : selectedCategory;

  const handleFiles = async (files) => {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      setUploadStatus({
        state: 'error',
        message: 'Please select a valid PDF file (.pdf).'
      });
      return;
    }

    setUploadStatus({
      state: 'processing',
      message: `Processing ${pdfFiles.length} file(s)... Extracting cover previews...`,
      progress: 20
    });

    try {
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        
        // Extract PDF Metadata and generate page 1 cover image canvas
        const meta = await extractBookMetadataAndCover(file);
        
        // Save to IndexedDB with category and uploader credit
        await saveBook({
          title: meta.title,
          author: meta.author,
          category: finalCategory,
          uploadedBy: profile?.name || 'Reader',
          totalPages: meta.totalPages,
          coverDataUrl: meta.coverDataUrl,
          pdfBlob: file
        });
      }

      setUploadStatus({
        state: 'success',
        message: `Successfully added ${pdfFiles.length} book(s) under "${finalCategory}"!`,
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
        message: err.message || 'Failed to import PDF file. Please try again.'
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
            <FileText size={20} className="modal-icon" />
            <h2>Upload Books</h2>
          </div>
          <button onClick={onClose} className="btn-icon" title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Category Selector */}
          <div className="category-section">
            <label className="category-label">
              <Tag size={14} />
              <span>Select Book Category / Language:</span>
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
                placeholder="Enter custom category..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="custom-cat-input"
              />
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
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
            <div className="dropzone-icon">
              <UploadCloud size={36} />
            </div>
            <p className="dropzone-text">
              <span className="highlight">Click to select PDF</span> or drag and drop files here
            </p>
            <p className="dropzone-sub">
              Assigned Category: <strong>{finalCategory}</strong>
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
            gap: 0.6rem;
          }

          .modal-title-group h2 {
            font-size: 1.1rem;
            font-weight: 600;
          }

          .modal-icon {
            color: var(--text-secondary);
          }

          .modal-body {
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
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
            font-weight: 500;
            color: var(--text-secondary);
          }

          .category-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 0.35rem;
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
            padding: 2rem 1.5rem;
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
            width: 48px;
            height: 48px;
            border-radius: var(--radius-full);
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
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
