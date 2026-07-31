import React from 'react';
import { BookCard } from './BookCard';
import { Library, UploadCloud, SearchX, ArrowLeft } from 'lucide-react';

export function BookGrid({ 
  books, 
  viewMode, 
  onOpenReader, 
  onOpenUpload, 
  onResetHome,
  onBookDeleted, 
  onBookUpdated,
  searchQuery,
  activeFilter
}) {
  if (!books || books.length === 0) {
    const isSearching = searchQuery.trim() !== '' || activeFilter !== 'all';
    
    return (
      <div className="empty-state">
        <div className="empty-icon-wrapper">
          {isSearching ? <SearchX size={32} /> : <Library size={32} />}
        </div>
        <h2 className="empty-title">
          {isSearching ? 'No matching books found' : 'Your library is empty'}
        </h2>
        <p className="empty-desc">
          {isSearching 
            ? 'No books match your current category or search query. Click below to return home or upload a new PDF.' 
            : 'Upload PDF files from your computer to build your personal digital bookshelf.'
          }
        </p>

        <div className="empty-actions">
          {onResetHome && (
            <button onClick={onResetHome} className="btn-secondary">
              <ArrowLeft size={16} />
              <span>Back to All Books</span>
            </button>
          )}

          <button onClick={onOpenUpload} className="btn-primary">
            <UploadCloud size={16} />
            <span>Upload PDF</span>
          </button>
        </div>

        <style>{`
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5rem 1.5rem;
            text-align: center;
            max-width: 440px;
            margin: 0 auto;
          }

          .empty-icon-wrapper {
            width: 64px;
            height: 64px;
            border-radius: var(--radius-lg);
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-tertiary);
            margin-bottom: 1rem;
          }

          .empty-title {
            font-size: 1.15rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }

          .empty-desc {
            font-size: 0.875rem;
            color: var(--text-secondary);
            margin-bottom: 1.25rem;
            line-height: 1.5;
          }

          .empty-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="grid-container">
      <div className={viewMode === 'grid' ? 'book-grid-layout' : 'book-list-layout'}>
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            viewMode={viewMode}
            onOpenReader={onOpenReader}
            onBookDeleted={onBookDeleted}
            onBookUpdated={onBookUpdated}
          />
        ))}
      </div>

      <style>{`
        .grid-container {
          max-width: 1300px;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
        }

        .book-grid-layout {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1.5rem;
        }

        .book-list-layout {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        @media (max-width: 640px) {
          .book-grid-layout {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
