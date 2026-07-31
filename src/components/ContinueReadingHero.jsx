import React from 'react';
import { BookOpen, Play, Flame, Trophy, Clock } from 'lucide-react';

export function ContinueReadingHero({ lastReadBook, profile, onResumeReading }) {
  if (!lastReadBook) return null;

  const {
    title,
    author,
    category,
    currentPage = 1,
    totalPages = 1,
    progress = 0,
    coverDataUrl
  } = lastReadBook;

  const streak = profile?.streak || 1;

  return (
    <section className="hero-banner">
      <div className="hero-content">
        {/* Left Side: Book Cover Card */}
        <div className="hero-cover-wrapper" onClick={() => onResumeReading(lastReadBook)}>
          {coverDataUrl ? (
            <img src={coverDataUrl} alt={title} className="hero-cover-img" />
          ) : (
            <div className="hero-cover-placeholder">
              <BookOpen size={40} />
            </div>
          )}
          <div className="hero-cover-overlay">
            <Play size={24} className="hero-play-icon" />
          </div>
        </div>

        {/* Right Side: Info & Resume Action */}
        <div className="hero-info">
          <div className="hero-badge-row">
            <span className="hero-badge hero-cat-badge">{category || 'English'}</span>
            <span className="hero-badge hero-streak-badge">
              <Flame size={13} fill="currentColor" />
              <span>{streak}-Day Streak</span>
            </span>
          </div>

          <h2 className="hero-title">{title}</h2>
          <p className="hero-author">By {author}</p>

          <div className="hero-progress-section">
            <div className="hero-progress-header">
              <span>Page {currentPage} of {totalPages}</span>
              <span className="hero-percent">{progress}% Completed</span>
            </div>
            <div className="hero-progress-bar-bg">
              <div 
                className="hero-progress-bar-fill" 
                style={{ width: `${Math.max(5, progress)}%` }} 
              />
            </div>
          </div>

          <div className="hero-actions">
            <button onClick={() => onResumeReading(lastReadBook)} className="btn-primary hero-btn">
              <Play size={16} fill="currentColor" />
              <span>Resume Reading (Page {currentPage})</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .hero-banner {
          max-width: 1300px;
          margin: 1.5rem auto 0;
          padding: 0 1.5rem;
        }

        .hero-content {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 2rem;
          box-shadow: var(--card-shadow);
          transition: border-color 0.2s ease;
        }

        .hero-content:hover {
          border-color: var(--border-focus);
        }

        .hero-cover-wrapper {
          width: 130px;
          aspect-ratio: 3 / 4;
          border-radius: var(--radius-md);
          overflow: hidden;
          background-color: var(--bg-tertiary);
          position: relative;
          cursor: pointer;
          flex-shrink: 0;
          border: 1px solid var(--border-subtle);
        }

        .hero-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero-cover-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
        }

        .hero-cover-overlay {
          position: absolute;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          color: #ffffff;
        }

        .hero-cover-wrapper:hover .hero-cover-overlay {
          opacity: 1;
        }

        .hero-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .hero-badge-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .hero-cat-badge {
          background-color: var(--bg-tertiary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .hero-streak-badge {
          background-color: rgba(234, 179, 8, 0.15);
          color: #eab308;
          border: 1px solid rgba(234, 179, 8, 0.3);
        }

        .hero-title {
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1.2;
        }

        .hero-author {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .hero-progress-section {
          margin-top: 0.5rem;
          max-width: 460px;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .hero-progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-family: var(--font-mono);
        }

        .hero-percent {
          font-weight: 600;
          color: var(--text-primary);
        }

        .hero-progress-bar-bg {
          height: 6px;
          border-radius: var(--radius-full);
          background-color: var(--bg-tertiary);
          overflow: hidden;
          border: 1px solid var(--border-subtle);
        }

        .hero-progress-bar-fill {
          height: 100%;
          background-color: var(--text-primary);
          border-radius: var(--radius-full);
          transition: width 0.3s ease;
        }

        .hero-actions {
          margin-top: 0.75rem;
        }

        .hero-btn {
          padding: 0.6rem 1.25rem;
          font-size: 0.9rem;
        }

        @media (max-width: 640px) {
          .hero-content {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }
          .hero-badge-row {
            justify-content: center;
          }
          .hero-progress-section {
            max-width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
