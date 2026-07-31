import React from 'react';
import { Star, BookOpen } from 'lucide-react';

export function FavoritesShelf({ books, onOpenReader }) {
  const favoriteBooks = books.filter(b => !!b.favorite);
  if (favoriteBooks.length === 0) return null;

  return (
    <section className="favorites-shelf-section">
      <div className="fav-header">
        <div className="fav-title-group">
          <Star size={18} className="star-icon" fill="currentColor" />
          <h3>Favorites & Top Picks ({favoriteBooks.length})</h3>
        </div>
      </div>

      <div className="fav-row">
        {favoriteBooks.map((book) => (
          <div key={book.id} className="fav-card" onClick={() => onOpenReader(book)}>
            <div className="fav-cover-wrapper">
              {book.coverDataUrl ? (
                <img src={book.coverDataUrl} alt={book.title} className="fav-cover-img" />
              ) : (
                <div className="fav-cover-placeholder">
                  <BookOpen size={24} />
                </div>
              )}
            </div>
            <div className="fav-info">
              <h4 className="fav-title" title={book.title}>{book.title}</h4>
              <span className="fav-author">{book.author}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .favorites-shelf-section {
          max-width: 1300px;
          margin: 1.5rem auto 0;
          padding: 0 1.5rem;
        }

        .fav-header {
          margin-bottom: 0.75rem;
        }

        .fav-title-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .star-icon {
          color: #eab308;
        }

        .fav-title-group h3 {
          font-size: 1rem;
          font-weight: 600;
        }

        .fav-row {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .fav-card {
          width: 140px;
          flex-shrink: 0;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .fav-card:hover {
          transform: translateY(-3px);
          border-color: var(--border-focus);
        }

        .fav-cover-wrapper {
          aspect-ratio: 3 / 4;
          width: 100%;
          background-color: var(--bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .fav-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .fav-cover-placeholder {
          color: var(--text-tertiary);
        }

        .fav-info {
          padding: 0.6rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .fav-title {
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fav-author {
          font-size: 0.75rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </section>
  );
}
