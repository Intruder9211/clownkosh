import React, { useState, useEffect } from 'react';
import { X, FileText, FileSpreadsheet, Save, Plus, Trash2, Tag, Loader2, CheckCircle2, Edit3 } from 'lucide-react';
import { saveBook, updateBookItem, ensurePdfBlob } from '../db/libraryDb';
import { generateCoverForFile, parseCsvContent } from '../utils/fileUtils';
import { awardXp } from '../utils/gamification';

export function CreateNoteModal({ isOpen, onClose, onNoteCreated, profile, editingBook = null }) {
  const [activeType, setActiveType] = useState('doc'); // 'doc' | 'sheet'
  
  // Document Note State
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Docs & Lecture Notes');
  const [docFormat, setDocFormat] = useState('DOC'); // 'DOC' | 'TXT' | 'MD'
  const [docContent, setDocContent] = useState('');

  // Spreadsheet Note State
  const [sheetTitle, setSheetTitle] = useState('');
  const [sheetCategory, setSheetCategory] = useState('Data & Spreadsheets');
  const [headers, setHeaders] = useState(['Column 1', 'Column 2', 'Column 3', 'Column 4']);
  const [rows, setRows] = useState([
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', '']
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Prefill form when editing an existing item
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function prefillForm() {
      if (editingBook) {
        const ft = (editingBook.fileType || '').toLowerCase();
        const ext = (editingBook.fileExtension || editingBook.title?.split('.').pop() || '').toLowerCase();
        const cat = (editingBook.category || '').toLowerCase();
        const isSheet = ft === 'sheet' || ['csv', 'xls', 'xlsx'].includes(ext) || cat.includes('sheet') || cat.includes('data');
        
        setActiveType(isSheet ? 'sheet' : 'doc');

        if (isSheet) {
          setSheetTitle(editingBook.title || '');
          setSheetCategory(editingBook.category || 'Data & Spreadsheets');
          try {
            const blob = await ensurePdfBlob(editingBook);
            if (blob && isMounted) {
              const text = await blob.text();
              const parsed = parseCsvContent(text);
              if (parsed.headers && parsed.headers.length > 0) setHeaders(parsed.headers);
              if (parsed.rows && parsed.rows.length > 0) setRows(parsed.rows);
            }
          } catch (err) {
            console.warn('Error reading sheet for edit:', err);
          }
        } else {
          setDocTitle(editingBook.title || '');
          setDocCategory(editingBook.category || 'Docs & Lecture Notes');
          setDocFormat(editingBook.fileExtension || 'DOC');
          try {
            const blob = await ensurePdfBlob(editingBook);
            if (blob && isMounted) {
              const text = await blob.text();
              setDocContent(text);
            }
          } catch (err) {
            console.warn('Error reading text for edit:', err);
          }
        }
      } else {
        // Reset to fresh blank sheet and blank document every time
        setDocTitle('');
        setDocContent('');
        setSheetTitle('');
        setHeaders(['Column 1', 'Column 2', 'Column 3', 'Column 4']);
        setRows([
          ['', '', '', ''],
          ['', '', '', ''],
          ['', '', '', '']
        ]);
      }
    }

    prefillForm();

    return () => {
      isMounted = false;
    };
  }, [isOpen, editingBook]);

  if (!isOpen) return null;

  const categories = [
    'Docs & Lecture Notes',
    'Data & Spreadsheets',
    'E-Books & PDFs',
    'CS & Technology',
    'Mathematics & Science',
    'Competitive Exams',
    'General Knowledge'
  ];

  // Spreadsheet Grid Helpers
  const addRow = () => {
    setRows([...rows, new Array(headers.length).fill('')]);
  };

  const removeRow = (rIdx) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, idx) => idx !== rIdx));
  };

  const updateHeader = (colIdx, val) => {
    const newHeaders = [...headers];
    newHeaders[colIdx] = val;
    setHeaders(newHeaders);
  };

  const updateCell = (rIdx, cIdx, val) => {
    const newRows = [...rows];
    newRows[rIdx][cIdx] = val;
    setRows(newRows);
  };

  const addColumn = () => {
    setHeaders([...headers, `Column ${headers.length + 1}`]);
    setRows(rows.map(row => [...row, '']));
  };

  const removeColumn = (colIdx) => {
    if (headers.length <= 1) return;
    setHeaders(headers.filter((_, idx) => idx !== colIdx));
    setRows(rows.map(row => row.filter((_, idx) => idx !== colIdx)));
  };

  // Save Handlers
  const handleSaveDoc = async () => {
    if (!docTitle.trim()) {
      alert('Please enter a note title.');
      return;
    }

    setIsSaving(true);
    try {
      const fileName = `${docTitle.trim()}.${docFormat.toLowerCase()}`;
      const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
      const file = new File([blob], fileName, { type: 'text/plain' });

      const coverMeta = await generateCoverForFile(file);

      if (editingBook && editingBook.id) {
        // Edit existing record
        await updateBookItem(editingBook.id, {
          title: docTitle.trim(),
          author: profile?.name || 'Author',
          category: docCategory,
          fileType: docFormat === 'DOC' ? 'doc' : 'text',
          fileExtension: docFormat,
          isCustomNote: true,
          coverDataUrl: coverMeta.coverDataUrl,
          mediaBlob: blob
        });
      } else {
        // Save new record
        await saveBook({
          title: docTitle.trim(),
          author: profile?.name || 'Author',
          category: docCategory,
          fileType: docFormat === 'DOC' ? 'doc' : 'text',
          fileExtension: docFormat,
          isCustomNote: true,
          fileSize: blob.size,
          mimeType: 'text/plain',
          uploadedBy: profile?.name || 'Writer',
          totalPages: 1,
          coverDataUrl: coverMeta.coverDataUrl,
          mediaBlob: blob
        });
        await awardXp(25, 'Created a custom document note!');
      }

      setSaveSuccess(true);
      if (onNoteCreated) onNoteCreated();

      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(false);
        setDocTitle('');
        setDocContent('');
        onClose();
      }, 1000);

    } catch (err) {
      console.error('Save note error:', err);
      setIsSaving(false);
      alert('Failed to save note. Please try again.');
    }
  };

  const handleSaveSheet = async () => {
    if (!sheetTitle.trim()) {
      alert('Please enter a sheet title.');
      return;
    }

    setIsSaving(true);
    try {
      const csvLines = [];
      const escapeCsvField = (f) => `"${(f || '').replace(/"/g, '""')}"`;
      csvLines.push(headers.map(escapeCsvField).join(','));
      rows.forEach(r => {
        csvLines.push(r.map(escapeCsvField).join(','));
      });
      const csvText = csvLines.join('\n');
      const fileName = `${sheetTitle.trim()}.csv`;
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
      const file = new File([blob], fileName, { type: 'text/csv' });

      const coverMeta = await generateCoverForFile(file);

      if (editingBook && editingBook.id) {
        // Edit existing record
        await updateBookItem(editingBook.id, {
          title: sheetTitle.trim(),
          author: profile?.name || 'Author',
          category: sheetCategory,
          fileType: 'sheet',
          fileExtension: 'CSV',
          isCustomNote: true,
          coverDataUrl: coverMeta.coverDataUrl,
          mediaBlob: blob
        });
      } else {
        // Save new record
        await saveBook({
          title: sheetTitle.trim(),
          author: profile?.name || 'Author',
          category: sheetCategory,
          fileType: 'sheet',
          fileExtension: 'CSV',
          isCustomNote: true,
          fileSize: blob.size,
          mimeType: 'text/csv',
          uploadedBy: profile?.name || 'Writer',
          totalPages: 1,
          coverDataUrl: coverMeta.coverDataUrl,
          mediaBlob: blob
        });
        await awardXp(30, 'Created a custom spreadsheet sheet!');
      }

      setSaveSuccess(true);
      if (onNoteCreated) onNoteCreated();

      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(false);
        setSheetTitle('');
        onClose();
      }, 1000);

    } catch (err) {
      console.error('Save sheet error:', err);
      setIsSaving(false);
      alert('Failed to save spreadsheet. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            {editingBook ? <Edit3 size={22} className="modal-icon text-amber-400" /> : <FileText size={22} className="modal-icon text-indigo-400" />}
            <div>
              <h2>{editingBook ? `Edit: ${editingBook.title}` : 'Create New Note or Sheet'}</h2>
              <p className="modal-subhead">{editingBook ? 'Modify and update your saved study note or spreadsheet' : 'Write custom lecture notes or build dynamic data spreadsheets'}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Type Switcher Tabs */}
        <div className="type-tabs-bar">
          <button
            onClick={() => setActiveType('doc')}
            className={`type-tab ${activeType === 'doc' ? 'active' : ''}`}
          >
            <FileText size={16} />
            <span>Write Document Note</span>
          </button>
          <button
            onClick={() => setActiveType('sheet')}
            className={`type-tab ${activeType === 'sheet' ? 'active' : ''}`}
          >
            <FileSpreadsheet size={16} />
            <span>Spreadsheet Grid</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {activeType === 'doc' ? (
            /* DOCUMENT NOTE FORM */
            <div className="note-form">
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="input-label">Note Title:</label>
                  <input
                    type="text"
                    placeholder="e.g. Physics Chapter 3 Core Formulas & Summaries..."
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="text-input"
                  />
                </div>

                <div className="form-group">
                  <label className="input-label">Category:</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                    className="select-input"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="input-label">Format:</label>
                  <select
                    value={docFormat}
                    onChange={(e) => setDocFormat(e.target.value)}
                    className="select-input"
                  >
                    <option value="DOC">DOC (Word)</option>
                    <option value="TXT">TXT (Text)</option>
                    <option value="MD">MD (Markdown)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Write / Edit Notes Content:</label>
                <textarea
                  placeholder="Type or edit your important study notes, highlights, key bullet points, or lecture summary here..."
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="textarea-input"
                  rows={11}
                />
              </div>

              <div className="form-footer">
                <span className="char-count">{docContent.length} characters</span>
                <button
                  onClick={handleSaveDoc}
                  disabled={isSaving}
                  className="btn-primary save-btn"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="spin-icon" />
                  ) : saveSuccess ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>{saveSuccess ? 'Changes Saved!' : editingBook ? 'Update Saved Note' : 'Save & Add to Notes'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* SPREADSHEET FORM */
            <div className="note-form">
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="input-label">Sheet Title:</label>
                  <input
                    type="text"
                    placeholder="e.g. Formula Table, Expense Sheet, Topic Marks Tracker..."
                    value={sheetTitle}
                    onChange={(e) => setSheetTitle(e.target.value)}
                    className="text-input"
                  />
                </div>

                <div className="form-group">
                  <label className="input-label">Category:</label>
                  <select
                    value={sheetCategory}
                    onChange={(e) => setSheetCategory(e.target.value)}
                    className="select-input"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Dynamic Spreadsheet Editor Table */}
              <div className="grid-editor-wrapper">
                <div className="grid-toolbar">
                  <button onClick={addRow} className="btn-sm">
                    <Plus size={14} /> Add Row
                  </button>
                  <button onClick={addColumn} className="btn-sm">
                    <Plus size={14} /> Add Column
                  </button>
                </div>

                <div className="table-overflow">
                  <table className="editor-table">
                    <thead>
                      <tr>
                        <th className="row-col-idx">#</th>
                        {headers.map((h, colIdx) => (
                          <th key={colIdx}>
                            <div className="header-cell-edit">
                              <input
                                type="text"
                                value={h}
                                onChange={(e) => updateHeader(colIdx, e.target.value)}
                              />
                              {headers.length > 1 && (
                                <button onClick={() => removeColumn(colIdx)} className="del-col-btn" title="Delete column">
                                  ×
                                </button>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="row-col-action"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          <td className="row-col-idx">{rIdx + 1}</td>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx}>
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                                className="cell-input"
                              />
                            </td>
                          ))}
                          <td className="row-col-action">
                            {rows.length > 1 && (
                              <button onClick={() => removeRow(rIdx)} className="del-row-btn" title="Delete row">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="form-footer">
                <span className="char-count">{rows.length} rows • {headers.length} columns</span>
                <button
                  onClick={handleSaveSheet}
                  disabled={isSaving}
                  className="btn-primary save-btn"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="spin-icon" />
                  ) : saveSuccess ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>{saveSuccess ? 'Sheet Updated!' : editingBook ? 'Update Saved Sheet' : 'Save Sheet to Library'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <style>{`
          .modal-content.large {
            max-width: 860px;
            width: 92%;
          }

          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.25rem 1.5rem 1rem;
            border-bottom: 1px solid var(--border-color);
          }

          .modal-title-group {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .modal-title-group h2 {
            font-size: 1.15rem;
            font-weight: 700;
          }

          .modal-subhead {
            font-size: 0.775rem;
            color: var(--text-tertiary);
          }

          .type-tabs-bar {
            display: flex;
            background-color: var(--bg-primary);
            border-bottom: 1px solid var(--border-color);
            padding: 0 1rem;
            gap: 0.5rem;
            overflow-x: auto;
            white-space: nowrap;
          }

          .type-tab {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.75rem 1rem;
            font-size: 0.85rem;
            font-weight: 600;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            color: var(--text-secondary);
            cursor: pointer;
            flex-shrink: 0;
          }

          .type-tab.active {
            color: var(--text-primary);
            border-bottom-color: var(--text-primary);
          }

          .modal-body {
            padding: 1.25rem;
            overflow-y: auto;
            flex: 1;
          }

          .note-form {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }

          .form-row {
            display: flex;
            gap: 1rem;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
          }

          .form-group.flex-1 { 
            flex: 1; 
            min-width: 0;
          }

          .input-label {
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--text-secondary);
          }

          .text-input, .select-input {
            width: 100%;
            box-sizing: border-box;
            padding: 0.5rem 0.75rem;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border-color);
            background-color: var(--bg-primary);
            color: var(--text-primary);
            font-size: 0.875rem;
            outline: none;
          }

          .textarea-input {
            width: 100%;
            box-sizing: border-box;
            padding: 0.75rem;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border-color);
            background-color: var(--bg-primary);
            color: var(--text-primary);
            font-size: 0.9rem;
            line-height: 1.5;
            outline: none;
            resize: vertical;
          }

          .textarea-input:focus, .text-input:focus, .select-input:focus {
            border-color: var(--border-focus);
          }

          .form-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 0.5rem;
          }

          .char-count {
            font-size: 0.775rem;
            color: var(--text-tertiary);
            font-family: var(--font-mono);
          }

          .save-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.6rem 1.25rem;
            font-size: 0.9rem;
          }

          /* Spreadsheet Editor Grid */
          .grid-editor-wrapper {
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            background-color: var(--bg-primary);
            overflow: hidden;
          }

          .grid-toolbar {
            display: flex;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            background-color: var(--bg-tertiary);
            border-bottom: 1px solid var(--border-color);
          }

          .btn-sm {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.3rem 0.6rem;
            font-size: 0.75rem;
            font-weight: 600;
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            color: var(--text-primary);
            cursor: pointer;
          }

          .table-overflow {
            max-height: 280px;
            overflow: auto;
          }

          .editor-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.825rem;
          }

          .editor-table th, .editor-table td {
            border: 1px solid var(--border-color);
            padding: 0.35rem 0.5rem;
          }

          .header-cell-edit {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.25rem;
          }

          .header-cell-edit input {
            background: none;
            border: none;
            font-weight: 700;
            color: var(--text-primary);
            width: 100%;
            outline: none;
            font-size: 0.825rem;
          }

          .del-col-btn, .del-row-btn {
            background: none;
            border: none;
            color: var(--text-tertiary);
            cursor: pointer;
            padding: 2px;
          }

          .del-col-btn:hover, .del-row-btn:hover {
            color: #ef4444;
          }

          .cell-input {
            width: 100%;
            background: none;
            border: none;
            color: var(--text-primary);
            outline: none;
            font-size: 0.825rem;
          }

          .row-col-idx {
            width: 32px;
            text-align: center;
            color: var(--text-tertiary);
            font-size: 0.75rem;
            background-color: var(--bg-tertiary);
          }

          .row-col-action {
            width: 32px;
            text-align: center;
          }

          @media (max-width: 640px) {
            .form-row {
              flex-direction: column;
              gap: 0.75rem;
            }
            .modal-body {
              padding: 1rem;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
