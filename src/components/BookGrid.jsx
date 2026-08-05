import React from 'react';
import { BookCard } from './BookCard';
import { Library, UploadCloud, SearchX, ArrowLeft, Music, Video, FileSpreadsheet, FileText, Image as ImageIcon } from 'lucide-react';
import { getFormatDetailsForCategory } from './UploadModal';

export function BookGrid({ 
  books, 
  viewMode, 
  onOpenReader, 
  onOpenUpload, 
  onOpenEdit,
  onResetHome,
  onBookDeleted, 
  onBookUpdated,
  searchQuery,
  activeFilter,
  selectedCategory = 'all',
  selectedFormatType = 'all'
}) {
  if (!books || books.length === 0) {
    const isSearching = searchQuery.trim() !== '' || activeFilter !== 'all' || selectedCategory !== 'all' || selectedFormatType !== 'all';
    
    // Determine dynamic upload label
    const activeCategoryOrFormat = selectedCategory !== 'all' ? selectedCategory : (selectedFormatType !== 'all' ? selectedFormatType : 'Docs & Lecture Notes');
    const formatInfo = getFormatDetailsForCategory(activeCategoryOrFormat);
    const FormatIcon = formatInfo.icon || UploadCloud;

    // Determine dynamic titles for filter tabs
    let emptyTitle = `No ${formatInfo.label.toLowerCase()} found`;
    let emptyDesc = `No notes match your filter query. Upload ${formatInfo.label.toLowerCase()} (${formatInfo.extHint}) or click below to reset.`;

    if (activeFilter === 'reading') {
      emptyTitle = 'No items currently in progress';
      emptyDesc = 'Whenever you open or read any book, document, spreadsheet, or lecture note, it will automatically appear here!';
    } else if (activeFilter === 'completed') {
      emptyTitle = 'No finished items yet';
      emptyDesc = 'Items you finish reading or studying will be automatically collected here!';
    } else if (activeFilter === 'favorites') {
      emptyTitle = 'No favorite notes saved';
      emptyDesc = 'Click the star icon on any card to add important notes to your favorites shelf!';
    } else if (!isSearching) {
      emptyTitle = `Your library is empty`;
      emptyDesc = `Upload your first ${formatInfo.label.toLowerCase()} or create a custom note to build your knowledge package.`;
    }

    return (
      <div className="empty-state">
        <div className="empty-icon-wrapper" style={{ color: formatInfo.color }}>
          {isSearching ? <SearchX size={32} /> : <FormatIcon size={32} />}
        </div>
        <h2 className="empty-title">{emptyTitle}</h2>
        <p className="empty-desc">{emptyDesc}</p>

        <div className="empty-actions">
          {onResetHome && isSearching && (
            <button onClick={onResetHome} className="btn-secondary">
              <ArrowLeft size={16} />
              <span>Back to All Items</span>
            </button>
          )}

          <button onClick={onOpenUpload} className="btn-primary" style={{ backgroundColor: formatInfo.color }}>
            <UploadCloud size={16} />
            <span>Upload {formatInfo.label.split(' ')[0]}</span>
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
            max-width: 460px;
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
            onOpenEdit={onOpenEdit}
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
