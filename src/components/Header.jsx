import React, { useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  LayoutGrid, 
  List, 
  Sun, 
  Moon, 
  Bookmark, 
  CheckCircle2, 
  Clock,
  Filter,
  Flame,
  User,
  ArrowLeft
} from 'lucide-react';
import { calculateLevelInfo } from '../utils/gamification';

export function Header({ 
  searchQuery, 
  setSearchQuery, 
  activeFilter, 
  setActiveFilter, 
  selectedCategory,
  setSelectedCategory,
  viewMode, 
  setViewMode, 
  theme, 
  toggleTheme, 
  onOpenUpload,
  profile,
  onOpenProfile,
  onResetHome,
  totalBooks,
  availableCategories = []
}) {
  const searchInputRef = useRef(null);

  // Keyboard shortcut to focus search input using '/'
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filterTabs = [
    { id: 'all', label: 'All Books', icon: BookOpen },
    { id: 'reading', label: 'Reading', icon: Clock },
    { id: 'completed', label: 'Finished', icon: CheckCircle2 },
    { id: 'favorites', label: 'Favorites', icon: Bookmark },
  ];

  const isFilterActive = selectedCategory !== 'all' || activeFilter !== 'all' || searchQuery !== '';
  const levelInfo = profile ? calculateLevelInfo(profile.xp || 0) : null;

  return (
    <header className="header-container">
      <div className="header-top">
        <div className="brand-group" onClick={onResetHome} style={{ cursor: 'pointer' }} title="Go to Clownkosh Home">
          {isFilterActive && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onResetHome();
              }}
              className="btn-icon back-arrow-btn" 
              title="Back to All Books"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div className="brand-icon-wrapper">
            <BookOpen className="brand-icon" size={22} />
          </div>
          <div>
            <h1 className="brand-title">Clownkosh</h1>
            <span className="brand-count">{totalBooks} {totalBooks === 1 ? 'book' : 'books'} stored</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-wrapper">
          <Search className="search-icon" size={16} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search title, author, or category... (Press '/' to focus)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="search-clear"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="header-actions">
          {/* Profile Trigger Button */}
          {profile && (
            <button 
              onClick={onOpenProfile}
              className="profile-trigger-btn"
              title="Open Profile, Levels & Achievements"
            >
              <span className="profile-btn-avatar">{profile.avatar || '🦉'}</span>
              <div className="profile-btn-info">
                <span className="profile-btn-name">{profile.name}</span>
                <span className="profile-btn-level">
                  Lvl {levelInfo?.level || 1} • <Flame size={11} className="streak-fire" fill="currentColor" /> {profile.streak || 1}d
                </span>
              </div>
            </button>
          )}

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="btn-icon" 
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* View Mode Toggle */}
          <div className="view-toggle-group">
            <button 
              onClick={() => setViewMode('grid')}
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>

          {/* Upload Button */}
          <button onClick={onOpenUpload} className="btn-primary">
            <Plus size={16} />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="header-bottom">
        <nav className="filter-nav">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`filter-tab ${isActive ? 'active' : ''}`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Category Dropdown Filter */}
        <div className="category-filter-wrapper">
          <Filter size={13} className="filter-icon" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="all">All Categories</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Fiction">Fiction</option>
            <option value="Technology">Technology</option>
            <option value="Education">Education</option>
            {availableCategories
              .filter(c => !['English', 'Hindi', 'Fiction', 'Technology', 'Education'].includes(c))
              .map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))
            }
          </select>
        </div>
      </div>

      <style>{`
        .header-container {
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-top {
          max-width: 1300px;
          margin: 0 auto;
          padding: 1.25rem 1.5rem 0.875rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }

        .brand-group {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .back-arrow-btn {
          background-color: var(--bg-tertiary);
          border-color: var(--border-color);
          margin-right: 0.2rem;
        }

        .back-arrow-btn:hover {
          background-color: var(--text-primary);
          color: var(--bg-primary);
        }

        .brand-icon-wrapper {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background-color: var(--text-primary);
          color: var(--bg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-title {
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1.1;
        }

        .brand-count {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-family: var(--font-mono);
        }

        .search-wrapper {
          flex: 1;
          max-width: 440px;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 0.5rem 2.25rem 0.5rem 2.5rem;
          font-size: 0.875rem;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.15s ease;
        }

        .search-input:focus {
          border-color: var(--border-focus);
          background-color: var(--bg-secondary);
        }

        .search-clear {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary);
          font-size: 1.25rem;
          line-height: 1;
        }

        .search-clear:hover {
          color: var(--text-primary);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .profile-trigger-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.3rem 0.6rem 0.3rem 0.4rem;
          border-radius: var(--radius-sm);
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          transition: all 0.15s ease;
        }

        .profile-trigger-btn:hover {
          border-color: var(--text-primary);
          background-color: var(--bg-tertiary);
        }

        .profile-btn-avatar {
          font-size: 1.25rem;
          line-height: 1;
        }

        .profile-btn-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.1;
        }

        .profile-btn-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .profile-btn-level {
          font-size: 0.7rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.15rem;
          font-family: var(--font-mono);
        }

        .streak-fire {
          color: #eab308;
        }

        .view-toggle-group {
          display: flex;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 2px;
        }

        .view-btn {
          padding: 0.35rem 0.6rem;
          border-radius: 4px;
          color: var(--text-tertiary);
        }

        .view-btn:hover {
          color: var(--text-primary);
        }

        .view-btn.active {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .header-bottom {
          max-width: 1300px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .filter-nav {
          display: flex;
          gap: 0.25rem;
        }

        .filter-tab {
          padding: 0.6rem 0.875rem;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
          border-bottom: 2px solid transparent;
          border-radius: 0;
          transition: all 0.15s ease;
        }

        .filter-tab:hover {
          color: var(--text-primary);
        }

        .filter-tab.active {
          color: var(--text-primary);
          border-bottom-color: var(--text-primary);
        }

        .category-filter-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .filter-icon {
          position: absolute;
          left: 0.6rem;
          pointer-events: none;
          color: var(--text-secondary);
        }

        .category-select {
          padding: 0.35rem 1.75rem 0.35rem 1.8rem;
          font-size: 0.8rem;
          font-weight: 500;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background-color: var(--bg-primary);
          color: var(--text-primary);
          cursor: pointer;
          outline: none;
        }

        .category-select:focus {
          border-color: var(--border-focus);
        }

        @media (max-width: 768px) {
          .header-top {
            flex-wrap: wrap;
          }
          .search-wrapper {
            order: 3;
            max-width: 100%;
          }
          .header-bottom {
            flex-wrap: wrap;
            padding-bottom: 0.5rem;
          }
          .profile-btn-info {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
