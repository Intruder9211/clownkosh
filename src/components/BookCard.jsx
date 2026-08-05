import React from 'react';
import { BookOpen, Star, Trash2, Clock, CheckCircle, User, FileText, FileSpreadsheet, Music, Video, Image as ImageIcon, FileCode, Edit3 } from 'lucide-react';
import { toggleFavorite, deleteBook } from '../db/libraryDb';
import { formatBytes } from '../utils/fileUtils';

export function BookCard({ book, viewMode, onOpenReader, onOpenEdit, onBookDeleted, onBookUpdated }) {
  const {
    id,
    title,
    author,
    category = 'General Knowledge',
    fileType = 'pdf',
    fileExtension = 'PDF',
    fileSize = 0,
    uploadedBy = 'Reader',
    totalPages,
    currentPage,
    progress = 0,
    coverDataUrl,
    favorite = false,
    status = 'unread',
    lastReadAt
  } = book;

  const ext = (fileExtension || title?.split('.').pop() || '').toLowerCase();
  const ft = (fileType || '').toLowerCase();
  const isEditable = !!book.isCustomNote || (['doc', 'text', 'sheet'].includes(ft) && book.isCustomNote !== false);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    await toggleFavorite(id, favorite);
    if (onBookUpdated) onBookUpdated();
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onOpenEdit) onOpenEdit(book);
  };

  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove "${title}" from your library?`)) {
      await deleteBook(id);
      if (onBookDeleted) onBookDeleted();
    }
  };

  const formatLastRead = (isoString) => {
    if (!isoString) return 'Not opened';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Format Icon helper
  const getFormatIcon = (ft) => {
    switch (ft) {
      case 'audio': return <Music size={13} className="format-icon audio" />;
      case 'video': return <Video size={13} className="format-icon video" />;
      case 'sheet': return <FileSpreadsheet size={13} className="format-icon sheet" />;
      case 'doc': return <FileText size={13} className="format-icon doc" />;
      case 'text': return <FileCode size={13} className="format-icon text" />;
      case 'image': return <ImageIcon size={13} className="format-icon image" />;
      default: return <BookOpen size={13} className="format-icon pdf" />;
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="book-list-row" onClick={() => onOpenReader(book)}>
        <div className="list-cover-wrapper">
          {coverDataUrl ? (
            <img src={coverDataUrl} alt={title} className="list-cover-img" />
          ) : (
            <div className="list-cover-placeholder">
              {getFormatIcon(fileType)}
            </div>
          )}
        </div>

        <div className="list-info">
          <div className="list-title-row">
            <span className={`format-badge-sm ${fileType}`}>{fileExtension}</span>
            <h3 className="list-title" title={title}>{title}</h3>
          </div>
          <div className="list-sub-info">
            <span className="list-author">{author}</span>
            <span className="category-pill-sm">{category}</span>
            {fileSize > 0 && <span className="size-pill-sm">{formatBytes(fileSize)}</span>}
            <span className="uploader-pill-sm">
              <User size={10} style={{ marginRight: 2 }} />
              {uploadedBy}
            </span>
          </div>
        </div>

        <div className="list-status">
          <span className="badge">
            {status === 'completed' && <CheckCircle size={12} style={{ marginRight: 4 }} />}
            {status === 'reading' && <Clock size={12} style={{ marginRight: 4 }} />}
            {progress}% read
          </span>
        </div>

        <div className="list-pages">
          <span className="pages-text">{fileType === 'pdf' ? `Page ${currentPage || 1} of ${totalPages}` : `${fileExtension} File`}</span>
        </div>

        <div className="list-actions" onClick={(e) => e.stopPropagation()}>
          {onOpenEdit && isEditable && (
            <button 
              onClick={handleEditClick}
              className="btn-icon edit-btn"
              title="Edit Note / Sheet"
              style={{ color: '#f59e0b' }}
            >
              <Edit3 size={15} />
            </button>
          )}

          <button 
            onClick={handleFavoriteClick}
            className={`btn-icon ${favorite ? 'active-fav' : ''}`}
            title={favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={16} fill={favorite ? 'currentColor' : 'none'} />
          </button>

          <button 
            onClick={handleDeleteClick}
            className="btn-icon delete-btn"
            title="Delete item"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <style>{`
          .book-list-row {
            display: grid;
            grid-template-columns: 42px 1fr 140px 140px auto;
            align-items: center;
            gap: 1.25rem;
            padding: 0.75rem 1rem;
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .book-list-row:hover {
            border-color: var(--border-focus);
            background-color: var(--bg-tertiary);
          }

          .list-cover-wrapper {
            width: 42px;
            height: 56px;
            border-radius: 4px;
            overflow: hidden;
            background-color: var(--bg-primary);
            border: 1px solid var(--border-color);
            flex-shrink: 0;
          }

          .list-cover-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .list-cover-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-tertiary);
          }

          .list-info {
            overflow: hidden;
          }

          .list-title-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .list-title {
            font-size: 0.925rem;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .list-sub-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 2px;
          }

          .list-author {
            font-size: 0.8rem;
            color: var(--text-secondary);
          }

          .category-pill-sm, .uploader-pill-sm, .size-pill-sm {
            display: inline-flex;
            align-items: center;
            font-size: 0.7rem;
            font-weight: 500;
            padding: 0.1rem 0.4rem;
            border-radius: var(--radius-full);
            background-color: var(--bg-tertiary);
            color: var(--text-secondary);
            border: 1px solid var(--border-color);
          }

          .format-badge-sm {
            font-size: 0.65rem;
            font-weight: 800;
            padding: 0.1rem 0.35rem;
            border-radius: 3px;
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }

          .format-badge-sm.pdf { background-color: rgba(239, 68, 68, 0.2); color: #ef4444; }
          .format-badge-sm.doc { background-color: rgba(59, 130, 246, 0.2); color: #3b82f6; }
          .format-badge-sm.sheet { background-color: rgba(16, 185, 129, 0.2); color: #10b981; }
          .format-badge-sm.audio { background-color: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
          .format-badge-sm.video { background-color: rgba(245, 158, 11, 0.2); color: #f59e0b; }
          .format-badge-sm.image { background-color: rgba(236, 72, 153, 0.2); color: #ec4899; }
          .format-badge-sm.text { background-color: rgba(6, 182, 212, 0.2); color: #06b6d4; }

          .list-pages {
            font-size: 0.8rem;
            color: var(--text-secondary);
            font-family: var(--font-mono);
          }

          .list-actions {
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }

          .active-fav {
            color: #eab308 !important;
          }

          .delete-btn:hover {
            color: #ef4444 !important;
          }
        `}</style>
      </div>
    );
  }

  // Grid View Card
  return (
    <div className="book-card" onClick={() => onOpenReader(book)}>
      {/* Cover Image Container */}
      <div className="cover-container">
        {coverDataUrl ? (
          <img src={coverDataUrl} alt={title} className="cover-img" />
        ) : (
          <div className="cover-placeholder">
            {getFormatIcon(fileType)}
            <span className="placeholder-title">{title}</span>
          </div>
        )}

        {/* Format Badge Overlay */}
        <div className={`card-format-badge ${fileType}`}>
          {fileExtension}
        </div>

        {/* Category Badge on top left of cover */}
        <div className="card-category-badge">
          {category}
        </div>

        {/* Status & Favorite Badges */}
        <div className="card-top-badges">
          {onOpenEdit && isEditable && (
            <button
              onClick={handleEditClick}
              className="edit-badge"
              title="Edit Note / Sheet"
              style={{ color: '#facc15' }}
            >
              <Edit3 size={14} />
            </button>
          )}

          <button 
            onClick={handleFavoriteClick}
            className={`favorite-badge ${favorite ? 'is-fav' : ''}`}
            title={favorite ? 'Unfavorite' : 'Favorite'}
          >
            <Star size={15} fill={favorite ? 'currentColor' : 'none'} />
          </button>
          
          <button 
            onClick={handleDeleteClick}
            className="delete-badge"
            title="Delete item"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Progress Overlay Bar at bottom of cover */}
        <div className="card-progress-bar-bg">
          <div 
            className="card-progress-bar-fill" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* Book Metadata Footer */}
      <div className="card-body">
        <h3 className="card-title" title={title}>{title}</h3>
        <p className="card-author">{author}</p>
        
        <div className="card-uploader-row">
          <User size={11} className="uploader-icon" />
          <span>Uploaded by <strong>{uploadedBy}</strong></span>
        </div>

        <div className="card-meta">
          <span className="card-progress-text">{progress}% complete</span>
          <span className="card-last-read">{formatLastRead(lastReadAt)}</span>
        </div>

        {onOpenEdit && isEditable && (
          <div className="card-edit-action-row" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={handleEditClick} 
              className="card-edit-btn"
              title={`Edit ${fileType === 'sheet' || fileExtension === 'CSV' ? 'Spreadsheet' : 'Document Note'}`}
            >
              <Edit3 size={12} />
              <span>Edit {fileType === 'sheet' || fileExtension === 'CSV' ? 'Sheet' : 'Note'}</span>
            </button>
          </div>
        )}
      </div>

      <style>{`
        .book-card {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .book-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-focus);
          box-shadow: var(--card-shadow-hover);
        }

        .cover-container {
          aspect-ratio: 3 / 4;
          width: 100%;
          background-color: var(--bg-tertiary);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid var(--border-subtle);
        }

        .cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .book-card:hover .cover-img {
          transform: scale(1.02);
        }

        .cover-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.5rem;
          text-align: center;
          color: var(--text-tertiary);
        }

        .placeholder-title {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-format-badge {
          position: absolute;
          bottom: 0.6rem;
          right: 0.6rem;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }

        .card-format-badge.pdf { background-color: #ef4444; color: #fff; }
        .card-format-badge.doc { background-color: #3b82f6; color: #fff; }
        .card-format-badge.sheet { background-color: #10b981; color: #fff; }
        .card-format-badge.audio { background-color: #8b5cf6; color: #fff; }
        .card-format-badge.video { background-color: #f59e0b; color: #fff; }
        .card-format-badge.image { background-color: #ec4899; color: #fff; }
        .card-format-badge.text { background-color: #06b6d4; color: #fff; }

        .card-category-badge {
          position: absolute;
          top: 0.6rem;
          left: 0.6rem;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-full);
          background-color: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          color: #ffffff;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          text-transform: capitalize;
        }

        .card-top-badges {
          position: absolute;
          top: 0.6rem;
          right: 0.6rem;
          display: flex;
          gap: 0.35rem;
          opacity: 0.85;
          transition: opacity 0.15s ease;
        }

        .book-card:hover .card-top-badges {
          opacity: 1;
        }

        .favorite-badge, .delete-badge, .edit-badge {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
          background-color: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .edit-badge:hover {
          background-color: rgba(245, 158, 11, 0.9);
          color: #ffffff;
        }

        .favorite-badge.is-fav {
          color: #facc15;
          background-color: rgba(0, 0, 0, 0.8);
        }

        .favorite-badge:hover {
          background-color: rgba(0, 0, 0, 0.85);
          color: #facc15;
        }

        .delete-badge:hover {
          background-color: rgba(220, 38, 38, 0.9);
          color: #ffffff;
        }

        .card-progress-bar-bg {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background-color: rgba(0, 0, 0, 0.15);
        }

        .card-progress-bar-fill {
          height: 100%;
          background-color: var(--text-primary);
          transition: width 0.3s ease;
        }

        .card-body {
          padding: 0.875rem 1rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .card-title {
          font-size: 0.925rem;
          font-weight: 600;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-author {
          font-size: 0.8rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-uploader-row {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.725rem;
          color: var(--text-tertiary);
          margin-top: 0.15rem;
        }

        .uploader-icon {
          color: var(--text-secondary);
        }

        .card-uploader-row strong {
          color: var(--text-secondary);
        }

        .card-meta {
          margin-top: 0.4rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-tertiary);
          font-family: var(--font-mono);
        }

        .card-edit-action-row {
          margin-top: 0.5rem;
          display: flex;
        }

        .card-edit-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          width: 100%;
          justify-content: center;
          padding: 0.35rem 0.6rem;
          background-color: rgba(245, 158, 11, 0.12);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.25);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .card-edit-btn:hover {
          background-color: rgba(245, 158, 11, 0.22);
          border-color: rgba(245, 158, 11, 0.4);
        }

        .card-progress-text {
          font-weight: 500;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
