import Dexie from 'dexie';
import { supabase, isCloudConfigured } from './supabaseClient';

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

// Auto-recover if IndexedDB schema upgrade fails on older client browsers
db.open().catch(async (err) => {
  console.warn('Dexie DB open error, resetting storage safely:', err);
  try {
    await Dexie.delete('ClownkoshLibraryDB');
    await db.open();
  } catch (reOpenErr) {
    console.error('Failed to reopen Dexie database:', reOpenErr);
  }
});

// Helper to save a new book (saves locally to IndexedDB & syncs to Cloud if configured)
export async function saveBook({ title, author, category = 'English', uploadedBy = 'Reader', totalPages, coverDataUrl, pdfBlob }) {
  const now = new Date().toISOString();
  
  // 1. Save locally to IndexedDB first for instant UI response
  const localId = await db.books.add({
    title: title || 'Untitled Document',
    author: author || 'Unknown Author',
    category: category || 'English',
    uploadedBy: uploadedBy || 'Reader',
    totalPages: totalPages || 1,
    currentPage: 1,
    progress: 0,
    coverDataUrl: coverDataUrl || null,
    pdfBlob: pdfBlob,
    pdfUrl: null,
    cloudId: null,
    favorite: false,
    status: 'unread',
    addedAt: now,
    lastReadAt: now,
    bookmarks: []
  });

  // 2. If Cloud backend is configured, upload PDF to Supabase Storage & Database
  if (isCloudConfigured && supabase) {
    try {
      const fileName = `book_${localId}_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('clownkosh-pdfs')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase
          .storage
          .from('clownkosh-pdfs')
          .getPublicUrl(fileName);

        const pdfUrl = publicUrlData?.publicUrl;

        // Insert metadata into Supabase 'books' table
        const { data: dbData, error: dbError } = await supabase
          .from('books')
          .insert([{
            title: title || 'Untitled Document',
            author: author || 'Unknown Author',
            category: category || 'English',
            uploaded_by: uploadedBy || 'Reader',
            total_pages: totalPages || 1,
            cover_data_url: coverDataUrl || null,
            pdf_url: pdfUrl,
            added_at: now
          }])
          .select();

        if (!dbError && dbData && dbData.length > 0) {
          const cloudRecord = dbData[0];
          await db.books.update(localId, {
            cloudId: cloudRecord.id,
            pdfUrl: pdfUrl
          });
        }
      }
    } catch (err) {
      console.warn('Cloud sync error during upload, saved locally:', err);
    }
  }

  return localId;
}

// Fetch and sync books from Cloud to IndexedDB
export async function syncBooksFromCloud() {
  if (!isCloudConfigured || !supabase) return;

  try {
    const { data: cloudBooks, error } = await supabase
      .from('books')
      .select('*')
      .order('added_at', { ascending: false });

    if (error || !cloudBooks) return;

    for (const cb of cloudBooks) {
      // Check if book already exists in local IndexedDB by cloudId or pdfUrl
      const existing = await db.books
        .filter(b => b.cloudId === cb.id || (b.pdfUrl && b.pdfUrl === cb.pdf_url))
        .first();

      if (!existing) {
        // Add new cloud book into local storage
        await db.books.add({
          cloudId: cb.id,
          title: cb.title || 'Untitled Document',
          author: cb.author || 'Unknown Author',
          category: cb.category || 'English',
          uploadedBy: cb.uploaded_by || 'Community',
          totalPages: cb.total_pages || 1,
          currentPage: 1,
          progress: 0,
          coverDataUrl: cb.cover_data_url || null,
          pdfBlob: null, // Will fetch on-demand when user opens reader
          pdfUrl: cb.pdf_url || null,
          favorite: false,
          status: 'unread',
          addedAt: cb.added_at || new Date().toISOString(),
          lastReadAt: cb.added_at || new Date().toISOString(),
          bookmarks: []
        });
      }
    }
  } catch (err) {
    console.warn('Could not sync cloud books:', err);
  }
}

// Helper to get PDF Blob (fetches from pdfUrl if missing locally)
export async function ensurePdfBlob(book) {
  if (!book) return null;
  if (book.pdfBlob) {
    return book.pdfBlob;
  }

  if (book.pdfUrl) {
    try {
      const response = await fetch(book.pdfUrl);
      const blob = await response.blob();
      if (blob && book.id) {
        await db.books.update(book.id, { pdfBlob: blob });
      }
      return blob;
    } catch (err) {
      console.error('Failed to download PDF from cloud URL:', err);
    }
  }
  return null;
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
  const book = await db.books.get(bookId);
  if (book && book.cloudId && isCloudConfigured && supabase) {
    try {
      await supabase.from('books').delete().eq('id', book.cloudId);
    } catch (e) {
      console.warn('Cloud delete failed:', e);
    }
  }
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
  try {
    let profile = await db.profile.get('user_main');
    if (!profile) {
      await db.profile.put(DEFAULT_PROFILE);
      profile = DEFAULT_PROFILE;
    }
    return profile;
  } catch (err) {
    console.warn('Profile fetch warning:', err);
    return DEFAULT_PROFILE;
  }
}

export async function updateProfile(updates) {
  try {
    await db.profile.update('user_main', updates);
    return await getProfile();
  } catch (err) {
    console.warn('Profile update warning:', err);
    return DEFAULT_PROFILE;
  }
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
  try {
    const notes = await db.notes.where('bookId').equals(bookId).toArray();
    notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return notes;
  } catch (err) {
    console.warn('Get notes warning:', err);
    return [];
  }
}

export async function deleteNote(noteId) {
  await db.notes.delete(noteId);
}
