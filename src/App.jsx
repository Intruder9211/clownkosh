import React, { useState, useEffect, useCallback } from 'react';
import { db, getProfile, syncBooksFromCloud } from './db/libraryDb';
import { Header } from './components/Header';
import { BookGrid } from './components/BookGrid';
import { UploadModal } from './components/UploadModal';
import { PdfReader } from './components/PdfReader';
import { ContinueReadingHero } from './components/ContinueReadingHero';
import { ProfileModal } from './components/ProfileModal';
import { StatsDashboardRow } from './components/StatsDashboardRow';
import { CategoryCards } from './components/CategoryCards';
import { FavoritesShelf } from './components/FavoritesShelf';
import { unlockAchievement, checkDailyStreak } from './utils/gamification';

export function App() {
  const [books, setBooks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [theme, setTheme] = useState(() => localStorage.getItem('clownkosh_theme') || 'dark');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState('stats');
  const [readingBook, setReadingBook] = useState(null);

  // Apply root theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('clownkosh_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Reset filters to go home
  const handleResetHome = () => {
    setSearchQuery('');
    setActiveFilter('all');
    setSelectedCategory('all');
  };

  // Open profile modal at specific tab
  const handleOpenModalTab = (tabName = 'stats') => {
    setProfileModalTab(tabName);
    setIsProfileOpen(true);
  };

  // Load user profile
  const fetchProfileData = useCallback(async () => {
    try {
      const p = await getProfile();
      setProfile(p);
      await checkDailyStreak();
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  // Load books from IndexedDB & sync from cloud
  const fetchBooks = useCallback(async () => {
    try {
      const allBooks = await db.books.toArray();
      
      // Auto-migrate & backfill category for any books uploaded previously
      for (const book of allBooks) {
        if (!book.category) {
          book.category = 'English';
          await db.books.update(book.id, { category: 'English' });
        }
      }

      // Sort by lastReadAt or addedAt descending
      allBooks.sort((a, b) => new Date(b.lastReadAt || b.addedAt) - new Date(a.lastReadAt || a.addedAt));
      setBooks(allBooks);

      if (allBooks.length > 0) {
        await unlockAchievement('first_step');
      }
    } catch (err) {
      console.error('Error fetching books from IndexedDB:', err);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
    fetchProfileData();

    // Trigger cloud sync in background and refresh books list
    syncBooksFromCloud().then(() => fetchBooks());
  }, [fetchBooks, fetchProfileData]);

  // Extract unique categories present in library
  const availableCategories = Array.from(new Set(books.map(b => b.category || 'English').filter(Boolean)));

  // Identify last read book for hero banner
  const lastReadBook = books.length > 0 ? books[0] : null;

  // Filter & Search Logic
  const filteredBooks = books.filter(book => {
    const bookCategory = (book.category || 'English').trim().toLowerCase();

    // Category Filter (Case-insensitive matching & English fallback for legacy books)
    if (selectedCategory !== 'all') {
      const targetCategory = selectedCategory.trim().toLowerCase();
      if (bookCategory !== targetCategory) {
        return false;
      }
    }

    // Search query filter (title, author, or category)
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookCategory.includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Filter tab logic
    if (activeFilter === 'reading') return book.status === 'reading';
    if (activeFilter === 'completed') return book.status === 'completed';
    if (activeFilter === 'favorites') return !!book.favorite;

    return true; // 'all'
  });

  const handleBookAdded = async () => {
    await fetchBooks();
    await fetchProfileData();
    await unlockAchievement('first_step');
  };

  const isDefaultHomeView = !searchQuery && activeFilter === 'all' && selectedCategory === 'all';

  return (
    <div className="app-container">
      {/* Top Header Navigation */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        viewMode={viewMode}
        setViewMode={setViewMode}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenUpload={() => setIsUploadOpen(true)}
        profile={profile}
        onOpenProfile={() => handleOpenModalTab('stats')}
        onResetHome={handleResetHome}
        totalBooks={books.length}
        availableCategories={availableCategories}
      />

      {/* Stats Dashboard Row */}
      {isDefaultHomeView && (
        <StatsDashboardRow
          profile={profile}
          totalBooks={books.length}
          onOpenModalTab={handleOpenModalTab}
        />
      )}

      {/* Hero Continue Reading Banner */}
      {isDefaultHomeView && (
        <ContinueReadingHero
          lastReadBook={lastReadBook}
          profile={profile}
          onResumeReading={(book) => setReadingBook(book)}
        />
      )}

      {/* Category Cards Section */}
      {isDefaultHomeView && (
        <CategoryCards
          books={books}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      )}

      {/* Favorites Shelf */}
      {isDefaultHomeView && (
        <FavoritesShelf
          books={books}
          onOpenReader={(book) => setReadingBook(book)}
        />
      )}

      {/* Main Bookshelf Gallery */}
      <main>
        <BookGrid
          books={filteredBooks}
          viewMode={viewMode}
          onOpenReader={(book) => setReadingBook(book)}
          onOpenUpload={() => setIsUploadOpen(true)}
          onResetHome={handleResetHome}
          onBookDeleted={() => {
            fetchBooks();
            fetchProfileData();
          }}
          onBookUpdated={() => {
            fetchBooks();
            fetchProfileData();
          }}
          searchQuery={searchQuery}
          activeFilter={activeFilter}
        />
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onBookAdded={handleBookAdded}
        profile={profile}
      />

      {/* Profile & Gamification Modal */}
      {isProfileOpen && profile && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          profile={profile}
          initialTab={profileModalTab}
          totalBooks={books.length}
          books={books}
          onProfileUpdated={fetchProfileData}
        />
      )}

      {/* Dedicated Interactive PDF Reader */}
      {readingBook && (
        <PdfReader
          book={readingBook}
          onClose={() => {
            setReadingBook(null);
            fetchBooks();
            fetchProfileData();
          }}
          onProgressUpdated={() => {
            fetchBooks();
            fetchProfileData();
          }}
        />
      )}
    </div>
  );
}

export default App;
