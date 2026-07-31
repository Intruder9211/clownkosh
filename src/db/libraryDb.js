import Dexie from 'dexie';

export const db = new Dexie('ClownkoshLibraryDB');

db.version(1).stores({
  books: '++id, title, author, totalPages, currentPage, progress, favorite, status, addedAt, lastReadAt'
});

db.version(2).stores({
  books: '++id, title, author, category, totalPages, currentPage, progress, favorite, status, addedAt, lastReadAt'
});

db.version(3).stores({
  books: '++id, title, author, category, totalPages, currentPage, progress, favorite, status, addedAt, lastReadAt',
  profile: 'id, name, avatar, bio, xp, level, streak, lastStreakDate, totalMinutesRead, totalPagesRead',
  notes: '++id, bookId, page, text, createdAt'
});

// Helper to save a new book
export async function saveBook({ title, author, category = 'English', uploadedBy = 'Reader', totalPages, coverDataUrl, pdfBlob }) {
  const now = new Date().toISOString();
  return await db.books.add({
    title: title || 'Untitled Document',
    author: author || 'Unknown Author',
    category: category || 'English',
    uploadedBy: uploadedBy || 'Reader',
    totalPages: totalPages || 1,
    currentPage: 1,
    progress: 0,
    coverDataUrl: coverDataUrl || null,
    pdfBlob: pdfBlob, // Store binary PDF in IndexedDB
    favorite: false,
    status: 'unread', // 'unread' | 'reading' | 'completed'
    addedAt: now,
    lastReadAt: now,
    bookmarks: [] // array of page numbers
  });
}

// Helper to update book progress
export async function updateBookProgress(bookId, currentPage, totalPages) {
  const progress = Math.min(100, Math.round((currentPage / totalPages) * 100));
  const status = progress >= 99 ? 'completed' : progress > 0 ? 'reading' : 'unread';
  const now = new Date().toISOString();

  await db.books.update(bookId, {
    currentPage,
    progress,
    status,
    lastReadAt: now
  });
}

// Helper to toggle favorite
export async function toggleFavorite(bookId, currentFavoriteState) {
  await db.books.update(bookId, {
    favorite: !currentFavoriteState
  });
}

// Helper to delete a book
export async function deleteBook(bookId) {
  await db.books.delete(bookId);
}

// Helper to toggle bookmark page
export async function toggleBookmark(bookId, pageNum) {
  const book = await db.books.get(bookId);
  if (!book) return;
  
  const bookmarks = book.bookmarks || [];
  const exists = bookmarks.includes(pageNum);
  const updated = exists 
    ? bookmarks.filter(p => p !== pageNum)
    : [...bookmarks, pageNum].sort((a, b) => a - b);

  await db.books.update(bookId, { bookmarks: updated });
  return updated;
}

// ==================== PROFILE DB HELPERS ==================== //

const DEFAULT_PROFILE = {
  id: 'user_main',
  name: 'Reader',
  avatar: '🦉',
  bio: 'Passionate reader exploring new books on Clownkosh.',
  xp: 150,
  level: 1,
  streak: 1,
  lastStreakDate: new Date().toISOString().split('T')[0],
  totalMinutesRead: 0,
  totalPagesRead: 0,
  unlockedAchievements: ['first_step']
};

export async function getProfile() {
  let profile = await db.profile.get('user_main');
  if (!profile) {
    await db.profile.put(DEFAULT_PROFILE);
    profile = DEFAULT_PROFILE;
  }
  return profile;
}

export async function updateProfile(updates) {
  await db.profile.update('user_main', updates);
  return await getProfile();
}

// ==================== NOTES DB HELPERS ==================== //

export async function addNote({ bookId, page, text }) {
  const now = new Date().toISOString();
  return await db.notes.add({
    bookId,
    page,
    text,
    createdAt: now
  });
}

export async function getNotesByBookId(bookId) {
  const notes = await db.notes.where('bookId').equals(bookId).toArray();
  notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return notes;
}

export async function deleteNote(noteId) {
  await db.notes.delete(noteId);
}
