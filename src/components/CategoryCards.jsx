import React from 'react';
import { Languages, Book, Code, GraduationCap, Compass, FileSpreadsheet, Music, Video, FileText, Globe } from 'lucide-react';

export function CategoryCards({ books, selectedCategory, setSelectedCategory }) {
  const categoryDefs = [
    { id: 'Docs & Lecture Notes', label: 'Docs & Notes', icon: FileText, color: '#3b82f6' },
    { id: 'E-Books & PDFs', label: 'E-Books & PDFs', icon: Book, color: '#ef4444' },
    { id: 'Data & Spreadsheets', label: 'Spreadsheets', icon: FileSpreadsheet, color: '#10b981' },
    { id: 'Audio Lectures', label: 'Audio Lectures', icon: Music, color: '#8b5cf6' },
    { id: 'Video Tutorials', label: 'Video Tutorials', icon: Video, color: '#f59e0b' },
    { id: 'CS & Technology', label: 'CS & Tech', icon: Code, color: '#06b6d4' },
    { id: 'Mathematics & Science', label: 'Math & Science', icon: GraduationCap, color: '#ec4899' },
    { id: 'General Knowledge', label: 'General Knowledge', icon: Globe, color: '#6366f1' },
  ];

  const getItemCount = (catId) => {
    return books.filter(b => (b.category || '').toLowerCase() === catId.toLowerCase()).length;
  };

  return (
    <section className="category-section">
      <div className="cat-section-header">
        <h3>Explore Notes Categories</h3>
        <p className="cat-section-sub">Quick access to organized lecture materials, sheets, audio, and documents</p>
      </div>

      <div className="category-grid">
        {categoryDefs.map((cat) => {
          const Icon = cat.icon;
          const count = getItemCount(cat.id);
          const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();

          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
              className={`cat-card ${isSelected ? 'selected' : ''}`}
            >
              <div className="cat-card-top">
                <div className="cat-icon-wrapper" style={{ color: cat.color, backgroundColor: `${cat.color}18` }}>
                  <Icon size={18} />
                </div>
                <span className="cat-count-pill">{count} {count === 1 ? 'item' : 'items'}</span>
              </div>
              <h4 className="cat-title">{cat.label}</h4>
            </div>
          );
        })}
      </div>

      <style>{`
        .category-section {
          max-width: 1300px;
          margin: 1.5rem auto 0;
          padding: 0 1.5rem;
        }

        .cat-section-header {
          margin-bottom: 0.75rem;
        }

        .cat-section-header h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .cat-section-sub {
          font-size: 0.775rem;
          color: var(--text-tertiary);
          margin-top: 2px;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .cat-card {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.875rem 1rem;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }

        .cat-card:hover {
          border-color: var(--border-focus);
          transform: translateY(-2px);
          box-shadow: var(--card-shadow);
        }

        .cat-card.selected {
          border-color: var(--text-primary);
          background-color: var(--bg-tertiary);
        }

        .cat-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cat-icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cat-count-pill {
          font-size: 0.7rem;
          font-family: var(--font-mono);
          color: var(--text-secondary);
          background-color: var(--bg-primary);
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
        }

        .cat-title {
          font-size: 0.9rem;
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .category-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 600px) {
          .category-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </section>
  );
}
