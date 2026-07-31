import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, StickyNote, Calendar } from 'lucide-react';
import { getNotesByBookId, addNote, deleteNote } from '../db/libraryDb';
import { unlockAchievement } from '../utils/gamification';

export function NotesDrawer({ isOpen, onClose, bookId, currentPage }) {
  const [notes, setNotes] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');

  const fetchNotes = useCallback(async () => {
    if (!bookId) return;
    const list = await getNotesByBookId(bookId);
    setNotes(list);
  }, [bookId]);

  useEffect(() => {
    if (isOpen && bookId) {
      fetchNotes();
    }
  }, [isOpen, bookId, fetchNotes]);

  if (!isOpen) return null;

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    await addNote({
      bookId,
      page: currentPage || 1,
      text: newNoteText.trim()
    });

    setNewNoteText('');
    await unlockAchievement('note_taker');
    await fetchNotes();
  };

  const handleDelete = async (noteId) => {
    await deleteNote(noteId);
    await fetchNotes();
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <aside className="notes-drawer">
      <div className="notes-header">
        <div className="notes-title-group">
          <StickyNote size={18} />
          <h3>Book Notes & Quotes</h3>
        </div>
        <button onClick={onClose} className="btn-icon" title="Close Notes">
          <X size={16} />
        </button>
      </div>

      <div className="notes-body">
        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="add-note-form">
          <div className="note-input-wrapper">
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder={`Write a note or quote for Page ${currentPage}...`}
              className="note-textarea"
              rows={3}
            />
            <div className="note-form-footer">
              <span className="page-tag">Page {currentPage}</span>
              <button type="submit" disabled={!newNoteText.trim()} className="btn-primary add-note-btn">
                <Plus size={14} />
                <span>Save Note</span>
              </button>
            </div>
          </div>
        </form>

        {/* Saved Notes List */}
        <div className="notes-list">
          {notes.length === 0 ? (
            <div className="empty-notes">
              <p>No notes saved for this book yet.</p>
              <span>Write key takeaways or quotes as you read!</span>
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="note-card">
                <div className="note-card-header">
                  <span className="note-page-badge">Page {note.page}</span>
                  <div className="note-right-header">
                    <span className="note-date">
                      <Calendar size={11} />
                      {formatDate(note.createdAt)}
                    </span>
                    <button 
                      onClick={() => handleDelete(note.id)}
                      className="note-del-btn"
                      title="Delete note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="note-text">"{note.text}"</p>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .notes-drawer {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 320px;
          background-color: var(--bg-secondary);
          border-left: 1px solid var(--border-color);
          z-index: 100;
          display: flex;
          flex-direction: column;
          box-shadow: -4px 0 20px rgba(0,0,0,0.15);
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .notes-header {
          padding: 0.875rem 1rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .notes-title-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .notes-title-group h3 {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .notes-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 1rem;
          gap: 1rem;
          overflow: hidden;
        }

        .add-note-form {
          flex-shrink: 0;
        }

        .note-input-wrapper {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: var(--bg-primary);
          padding: 0.6rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .note-textarea {
          width: 100%;
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-size: 0.85rem;
          resize: none;
          outline: none;
        }

        .note-form-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.35rem;
          border-top: 1px solid var(--border-subtle);
        }

        .page-tag {
          font-size: 0.75rem;
          font-weight: 600;
          font-family: var(--font-mono);
          color: var(--text-secondary);
        }

        .add-note-btn {
          padding: 0.25rem 0.6rem;
          font-size: 0.75rem;
        }

        .notes-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .empty-notes {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .empty-notes span {
          display: block;
          font-size: 0.75rem;
          color: var(--text-tertiary);
          margin-top: 0.35rem;
        }

        .note-card {
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .note-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .note-page-badge {
          font-size: 0.7rem;
          font-weight: 700;
          font-family: var(--font-mono);
          background-color: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          border: 1px solid var(--border-color);
        }

        .note-right-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .note-date {
          font-size: 0.7rem;
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .note-del-btn {
          color: var(--text-tertiary);
        }

        .note-del-btn:hover {
          color: #ef4444;
        }

        .note-text {
          font-size: 0.85rem;
          line-height: 1.4;
          color: var(--text-primary);
          white-space: pre-wrap;
        }
      `}</style>
    </aside>
  );
}
