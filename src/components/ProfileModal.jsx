import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trophy, 
  Flame, 
  Zap, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Lock, 
  Edit3, 
  Target, 
  HardDrive,
  Calendar
} from 'lucide-react';
import { calculateLevelInfo, ACHIEVEMENTS } from '../utils/gamification';
import { updateProfile } from '../db/libraryDb';

export function ProfileModal({ isOpen, onClose, profile, initialTab = 'stats', totalBooks = 0, books = [], onProfileUpdated }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Sync initialTab whenever modal opens
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  // Edit Form State
  const [name, setName] = useState(profile?.name || 'Reader');
  const [avatar, setAvatar] = useState(profile?.avatar || '🦉');
  const [bio, setBio] = useState(profile?.bio || '');

  if (!isOpen || !profile) return null;

  const levelInfo = calculateLevelInfo(profile.xp || 0);
  const unlockedList = profile.unlockedAchievements || [];

  const avatarOptions = ['🦉', '🦊', '🐉', '🧙‍♂️', '🚀', '📚', '🐺', '🦁'];

  const minutesToday = Math.min(30, (profile.totalMinutesRead || 0) % 30);
  const dailyGoalPercent = Math.min(100, Math.round((minutesToday / 30) * 100));

  // Calculate total pages across books
  const totalPagesInLib = books.reduce((acc, b) => acc + (b.totalPages || 0), 0);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateProfile({
      name: name.trim() || 'Reader',
      avatar,
      bio: bio.trim()
    });
    if (onProfileUpdated) onProfileUpdated();
    setActiveTab('stats');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Header */}
        <div className="profile-header">
          <div className="profile-header-user">
            <div className="profile-avatar-large">{profile.avatar || '🦉'}</div>
            <div>
              <h2 className="profile-name">{profile.name}</h2>
              <span className="profile-level-badge">{levelInfo.title}</span>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon" title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="profile-tabs-nav">
          <button 
            onClick={() => setActiveTab('goal')}
            className={`profile-tab-btn ${activeTab === 'goal' ? 'active' : ''}`}
          >
            <Target size={15} />
            <span>Daily Goal</span>
          </button>

          <button 
            onClick={() => setActiveTab('streak')}
            className={`profile-tab-btn ${activeTab === 'streak' ? 'active' : ''}`}
          >
            <Flame size={15} />
            <span>Streak</span>
          </button>

          <button 
            onClick={() => setActiveTab('stats')}
            className={`profile-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          >
            <Trophy size={15} />
            <span>Rank & XP</span>
          </button>

          <button 
            onClick={() => setActiveTab('collection')}
            className={`profile-tab-btn ${activeTab === 'collection' ? 'active' : ''}`}
          >
            <HardDrive size={15} />
            <span>Storage</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('achievements')}
            className={`profile-tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
          >
            <Zap size={15} />
            <span>Badges</span>
          </button>

          <button 
            onClick={() => setActiveTab('edit')}
            className={`profile-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
          >
            <Edit3 size={15} />
            <span>Edit</span>
          </button>
        </div>

        {/* TAB: Daily Goal */}
        {activeTab === 'goal' && (
          <div className="profile-tab-body">
            <div className="modal-feature-card">
              <div className="feature-card-header">
                <Target size={28} className="goal-icon" />
                <div>
                  <h3>Daily Reading Goal</h3>
                  <p>Target: 30 Minutes of Reading per Day</p>
                </div>
              </div>

              <div className="xp-bar-bg" style={{ height: 10, margin: '1rem 0 0.5rem' }}>
                <div className="xp-bar-fill goal-fill" style={{ width: `${dailyGoalPercent}%` }} />
              </div>

              <div className="goal-stats-row">
                <span>Completed Today: <strong>{minutesToday} Mins</strong></span>
                <span>Remaining: <strong>{Math.max(0, 30 - minutesToday)} Mins</strong></span>
              </div>
            </div>

            <div className="info-box">
              <h4>💡 Why Read Daily?</h4>
              <p>Reading just 15–30 minutes every day improves comprehension, expands vocabulary, and earns you **+10 XP per minute** plus streak bonuses!</p>
            </div>
          </div>
        )}

        {/* TAB: Daily Streak */}
        {activeTab === 'streak' && (
          <div className="profile-tab-body">
            <div className="modal-feature-card streak-card-banner">
              <Flame size={48} className="flame-lg-icon" fill="currentColor" />
              <div className="streak-hero-text">
                <h2>{profile.streak || 1} Days Active Streak</h2>
                <p>Keep reading every day to increase your streak and earn +100 XP bonuses!</p>
              </div>
            </div>

            <div className="info-box">
              <h4>🔥 Streak Calendar Rule</h4>
              <p>Open any PDF book in Clownkosh once a day to check in. If you miss a day, your streak resets to 1 day.</p>
            </div>
          </div>
        )}

        {/* TAB: Rank & Level Progress */}
        {activeTab === 'stats' && (
          <div className="profile-tab-body">
            <div className="xp-card">
              <div className="xp-header">
                <span className="xp-level">Level {levelInfo.level} - {levelInfo.title}</span>
                <span className="xp-val">{levelInfo.xp} / {levelInfo.nextLevelXp} XP</span>
              </div>
              <div className="xp-bar-bg">
                <div 
                  className="xp-bar-fill" 
                  style={{ width: `${levelInfo.progressPercent}%` }} 
                />
              </div>
              <p className="xp-sub">
                {levelInfo.nextLevelXp - levelInfo.xp} XP needed for Level {levelInfo.level + 1}
              </p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <Flame size={22} className="stat-icon streak-icon" fill="currentColor" />
                <div>
                  <span className="stat-value">{profile.streak || 1} Days</span>
                  <span className="stat-label">Daily Reading Streak</span>
                </div>
              </div>

              <div className="stat-card">
                <Zap size={22} className="stat-icon xp-icon" />
                <div>
                  <span className="stat-value">{profile.xp || 0} XP</span>
                  <span className="stat-label">Total Points Earned</span>
                </div>
              </div>

              <div className="stat-card">
                <Clock size={22} className="stat-icon time-icon" />
                <div>
                  <span className="stat-value">{profile.totalMinutesRead || 0} Mins</span>
                  <span className="stat-label">Time Spent Reading</span>
                </div>
              </div>

              <div className="stat-card">
                <BookOpen size={22} className="stat-icon book-icon" />
                <div>
                  <span className="stat-value">{unlockedList.length} Badges</span>
                  <span className="stat-label">Achievements Unlocked</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Storage & Collection */}
        {activeTab === 'collection' && (
          <div className="profile-tab-body">
            <div className="modal-feature-card">
              <div className="feature-card-header">
                <HardDrive size={28} style={{ color: '#10b981' }} />
                <div>
                  <h3>Browser IndexedDB Storage</h3>
                  <p>100% Offline & Stored on Your Machine</p>
                </div>
              </div>

              <div className="storage-metrics-list" style={{ marginTop: '1rem' }}>
                <div className="storage-row">
                  <span>Total PDF Books Stored:</span>
                  <strong>{totalBooks} Books</strong>
                </div>
                <div className="storage-row">
                  <span>Total Document Pages:</span>
                  <strong>{totalPagesInLib} Pages</strong>
                </div>
                <div className="storage-row">
                  <span>Storage Engine:</span>
                  <strong>IndexedDB (Dexie.js v3)</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Achievements Gallery */}
        {activeTab === 'achievements' && (
          <div className="profile-tab-body">
            <div className="achievements-list">
              {ACHIEVEMENTS.map((ach) => {
                const isUnlocked = unlockedList.includes(ach.id);
                return (
                  <div key={ach.id} className={`ach-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                    <div className="ach-icon-box">
                      <span>{ach.icon}</span>
                    </div>
                    
                    <div className="ach-info">
                      <div className="ach-title-row">
                        <h4>{ach.title}</h4>
                        {isUnlocked ? (
                          <span className="ach-status-badge unlocked-badge">
                            <CheckCircle2 size={12} />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="ach-status-badge locked-badge">
                            <Lock size={12} />
                            <span>Locked</span>
                          </span>
                        )}
                      </div>
                      <p className="ach-desc">{ach.desc}</p>
                      <span className="ach-reward">+{ach.xpReward} XP Reward</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: Edit Profile Form */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveProfile} className="profile-tab-body edit-form">
            <div className="form-group">
              <label className="form-label">Choose Reader Avatar:</label>
              <div className="avatar-grid">
                {avatarOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`avatar-option ${avatar === emoji ? 'selected' : ''}`}
                  >
                    <span>{emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reader Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reading Bio / Quote:</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a favorite quote or reading goal..."
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setActiveTab('stats')} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Profile
              </button>
            </div>
          </form>
        )}

        <style>{`
          .profile-modal-content {
            max-width: 620px;
          }

          .profile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--border-color);
          }

          .profile-header-user {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .profile-avatar-large {
            width: 52px;
            height: 52px;
            border-radius: var(--radius-full);
            background-color: var(--bg-tertiary);
            border: 2px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.6rem;
          }

          .profile-name {
            font-size: 1.25rem;
            font-weight: 700;
          }

          .profile-level-badge {
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-secondary);
          }

          .profile-tabs-nav {
            display: flex;
            border-bottom: 1px solid var(--border-color);
            background-color: var(--bg-primary);
            overflow-x: auto;
          }

          .profile-tab-btn {
            flex: 1;
            padding: 0.65rem 0.5rem;
            font-size: 0.8rem;
            font-weight: 500;
            color: var(--text-secondary);
            border-bottom: 2px solid transparent;
            border-radius: 0;
            gap: 0.3rem;
            white-space: nowrap;
          }

          .profile-tab-btn:hover {
            color: var(--text-primary);
          }

          .profile-tab-btn.active {
            color: var(--text-primary);
            border-bottom-color: var(--text-primary);
            background-color: var(--bg-secondary);
          }

          .profile-tab-body {
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            max-height: 480px;
            overflow-y: auto;
          }

          .modal-feature-card {
            background-color: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: 1.25rem;
          }

          .feature-card-header {
            display: flex;
            align-items: center;
            gap: 0.875rem;
          }

          .feature-card-header h3 {
            font-size: 1.05rem;
            font-weight: 700;
          }

          .feature-card-header p {
            font-size: 0.8rem;
            color: var(--text-secondary);
          }

          .goal-stats-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            color: var(--text-secondary);
            margin-top: 0.5rem;
          }

          .goal-stats-row strong {
            color: var(--text-primary);
          }

          .streak-card-banner {
            display: flex;
            align-items: center;
            gap: 1.25rem;
            background-color: rgba(234, 179, 8, 0.08);
            border-color: rgba(234, 179, 8, 0.3);
          }

          .flame-lg-icon {
            color: #eab308;
            flex-shrink: 0;
          }

          .streak-hero-text h2 {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--text-primary);
          }

          .streak-hero-text p {
            font-size: 0.85rem;
            color: var(--text-secondary);
            margin-top: 0.2rem;
          }

          .info-box {
            background-color: var(--bg-primary);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-sm);
            padding: 0.875rem 1rem;
          }

          .info-box h4 {
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
          }

          .info-box p {
            font-size: 0.8rem;
            color: var(--text-secondary);
            line-height: 1.4;
          }

          .storage-metrics-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .storage-row {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid var(--border-subtle);
            font-size: 0.85rem;
          }

          .storage-row:last-child {
            border-bottom: none;
          }

          /* XP Progress Card */
          .xp-card {
            background-color: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: 1rem 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .xp-header {
            display: flex;
            justify-content: space-between;
            font-size: 0.875rem;
            font-weight: 600;
          }

          .xp-bar-bg {
            height: 8px;
            border-radius: var(--radius-full);
            background-color: var(--border-color);
            overflow: hidden;
          }

          .xp-bar-fill {
            height: 100%;
            background-color: var(--text-primary);
            border-radius: var(--radius-full);
            transition: width 0.3s ease;
          }

          .xp-sub {
            font-size: 0.75rem;
            color: var(--text-secondary);
            font-family: var(--font-mono);
          }

          /* Stats Grid */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .stat-card {
            background-color: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: 1rem;
            display: flex;
            align-items: center;
            gap: 0.875rem;
          }

          .streak-icon { color: #eab308; }
          .xp-icon { color: #3b82f6; }
          .time-icon { color: #10b981; }
          .book-icon { color: #8b5cf6; }

          .stat-value {
            display: block;
            font-size: 1.1rem;
            font-weight: 700;
            line-height: 1.1;
          }

          .stat-label {
            font-size: 0.75rem;
            color: var(--text-secondary);
          }

          /* Achievements List */
          .achievements-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .ach-card {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 0.875rem 1rem;
            border-radius: var(--radius-md);
            border: 1px solid var(--border-color);
            background-color: var(--bg-primary);
          }

          .ach-card.locked {
            opacity: 0.6;
          }

          .ach-icon-box {
            width: 42px;
            height: 42px;
            border-radius: var(--radius-sm);
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.35rem;
            flex-shrink: 0;
          }

          .ach-info {
            flex: 1;
          }

          .ach-title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .ach-title-row h4 {
            font-size: 0.925rem;
            font-weight: 600;
          }

          .ach-status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.7rem;
            font-weight: 600;
            padding: 0.15rem 0.5rem;
            border-radius: var(--radius-full);
          }

          .unlocked-badge {
            background-color: rgba(34, 197, 94, 0.15);
            color: #16a34a;
          }

          .locked-badge {
            background-color: var(--bg-tertiary);
            color: var(--text-tertiary);
          }

          .ach-desc {
            font-size: 0.8rem;
            color: var(--text-secondary);
            margin: 0.2rem 0 0.35rem;
          }

          .ach-reward {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--accent-color);
            font-family: var(--font-mono);
          }

          /* Edit Form */
          .edit-form {
            gap: 1rem;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
          }

          .form-label {
            font-size: 0.85rem;
            font-weight: 600;
          }

          .avatar-grid {
            display: flex;
            gap: 0.5rem;
          }

          .avatar-option {
            width: 44px;
            height: 44px;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border-color);
            background-color: var(--bg-primary);
            font-size: 1.35rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .avatar-option.selected {
            border-color: var(--text-primary);
            background-color: var(--bg-tertiary);
            transform: scale(1.08);
          }

          .form-input, .form-textarea {
            width: 100%;
            padding: 0.5rem 0.75rem;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border-color);
            background-color: var(--bg-primary);
            color: var(--text-primary);
            font-size: 0.875rem;
            outline: none;
          }

          .form-input:focus, .form-textarea:focus {
            border-color: var(--border-focus);
          }

          .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            margin-top: 0.5rem;
          }
        `}</style>
      </div>
    </div>
  );
}
