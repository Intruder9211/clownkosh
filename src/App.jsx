import React, { useState, useEffect, useCallback } from 'react';
import { db, getProfile, syncBooksFromCloud } from './db/libraryDb';
import { Header } from './components/Header';
import { BookGrid } from './components/BookGrid';
import { UploadModal } from './components/UploadModal';
import { CreateNoteModal } from './components/CreateNoteModal';
import { UniversalViewer } from './components/UniversalViewer';
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
  const [selectedFormatType, setSelectedFormatType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [theme, setTheme] = useState(() => localStorage.getItem('clownkosh_theme') || 'dark');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState('stats');
  const [readingBook, setReadingBook] = useState(null);

  const handleOpenCreateNote = (bookToEdit = null) => {
    setEditingBook(bookToEdit);
    setIsCreateNoteOpen(true);
  };

  // Apply root theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('clownkosh_theme', theme);
  }, [theme]);

  // Lock background body scroll when any modal or reader overlay is open
  useEffect(() => {
    const isModalOpen = isUploadOpen || isCreateNoteOpen || isProfileOpen || !!readingBook;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isUploadOpen, isCreateNoteOpen, isProfileOpen, readingBook]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleOpenReader = async (book) => {
    if (!book) return;
    if (book.status === 'unread' || !book.status) {
      await db.books.update(book.id, { status: 'reading', lastReadAt: new Date().toISOString() });
      await fetchBooks();
    }
    setReadingBook(book);
  };

  // Reset filters to go home
  const handleResetHome = () => {
    setSearchQuery('');
    setActiveFilter('all');
    setSelectedCategory('all');
    setSelectedFormatType('all');
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

  // Load books & resources from IndexedDB & sync from cloud
  const fetchBooks = useCallback(async () => {
    try {
      const allBooks = await db.books.toArray();
      
      // Auto-migrate & backfill category / format for legacy books
      for (const book of allBooks) {
        let updated = false;
        if (!book.category) {
          book.category = 'Docs & Lecture Notes';
          updated = true;
        }

        const ext = (book.fileExtension || book.title?.split('.').pop() || '').toLowerCase();
        if (['doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) {
          if (book.fileType !== 'doc' && book.fileType !== 'text') {
            book.fileType = ext === 'txt' || ext === 'md' ? 'text' : 'doc';
            book.fileExtension = ext.toUpperCase();
            updated = true;
          }
        } else if (['csv', 'xls', 'xlsx'].includes(ext)) {
          if (book.fileType !== 'sheet') {
            book.fileType = 'sheet';
            book.fileExtension = 'CSV';
            updated = true;
          }
        } else if (['mp3', 'wav', 'm4a', 'aac'].includes(ext)) {
          if (book.fileType !== 'audio') {
            book.fileType = 'audio';
            book.fileExtension = ext.toUpperCase();
            updated = true;
          }
        } else if (['mp4', 'webm', 'mkv'].includes(ext)) {
          if (book.fileType !== 'video') {
            book.fileType = 'video';
            book.fileExtension = ext.toUpperCase();
            updated = true;
          }
        } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
          if (book.fileType !== 'image') {
            book.fileType = 'image';
            book.fileExtension = ext.toUpperCase();
            updated = true;
          }
        } else if (!book.fileType) {
          book.fileType = 'doc';
          book.fileExtension = 'DOC';
          updated = true;
        }

        if (updated) {
          await db.books.update(book.id, {
            category: book.category,
            fileType: book.fileType,
            fileExtension: book.fileExtension
          });
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
  const availableCategories = Array.from(new Set(books.map(b => b.category || 'Docs & Lecture Notes').filter(Boolean)));

  // Identify last read book for hero banner
  const lastReadBook = books.length > 0 ? books[0] : null;

  // Filter & Search Logic
  const filteredBooks = books.filter(book => {
    const bookCategory = (book.category || 'Docs & Lecture Notes').trim().toLowerCase();
    const bookFormat = (book.fileType || 'pdf').trim().toLowerCase();

    // Format Filter
    if (selectedFormatType !== 'all') {
      if (bookFormat !== selectedFormatType.toLowerCase()) {
        return false;
      }
    }

    // Category Filter
    if (selectedCategory !== 'all') {
      const targetCategory = selectedCategory.trim().toLowerCase();
      if (bookCategory !== targetCategory) {
        return false;
      }
    }

    // Search query filter (title, author, category, extension)
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.fileExtension || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const isDefaultHomeView = !searchQuery && activeFilter === 'all' && selectedCategory === 'all' && selectedFormatType === 'all';

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
        selectedFormatType={selectedFormatType}
        setSelectedFormatType={setSelectedFormatType}
        viewMode={viewMode}
        setViewMode={setViewMode}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenCreateNote={() => handleOpenCreateNote(null)}
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
          onResumeReading={handleOpenReader}
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
          onOpenReader={handleOpenReader}
        />
      )}

      {/* Main Bookshelf Gallery */}
      <main>
        <BookGrid
          books={filteredBooks}
          viewMode={viewMode}
          onOpenReader={handleOpenReader}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenEdit={(book) => handleOpenCreateNote(book)}
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
          selectedCategory={selectedCategory}
          selectedFormatType={selectedFormatType}
        />
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onBookAdded={handleBookAdded}
        profile={profile}
        initialCategory={selectedCategory !== 'all' ? selectedCategory : (selectedFormatType !== 'all' ? selectedFormatType : 'Docs & Lecture Notes')}
      />

      {/* Create Note / Sheet Modal */}
      <CreateNoteModal
        isOpen={isCreateNoteOpen}
        onClose={() => {
          setIsCreateNoteOpen(false);
          setEditingBook(null);
        }}
        onNoteCreated={async () => {
          await handleBookAdded();
          if (readingBook) {
            const updated = await db.books.get(readingBook.id);
            if (updated) setReadingBook(updated);
          }
        }}
        profile={profile}
        editingBook={editingBook}
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

      {/* Dedicated Universal Reader & Viewer Overlay */}
      {readingBook && (
        <UniversalViewer
          book={readingBook}
          onClose={() => {
            setReadingBook(null);
            fetchBooks();
            fetchProfileData();
          }}
          onOpenEdit={(book) => handleOpenCreateNote(book)}
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
