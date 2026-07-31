import React from 'react';
import { Flame, Zap, Target, BookOpen } from 'lucide-react';
import { calculateLevelInfo } from '../utils/gamification';

export function StatsDashboardRow({ profile, totalBooks, onOpenModalTab }) {
  if (!profile) return null;

  const levelInfo = calculateLevelInfo(profile.xp || 0);
  const minutesToday = Math.min(30, (profile.totalMinutesRead || 0) % 30);
  const dailyGoalPercent = Math.min(100, Math.round((minutesToday / 30) * 100));

  return (
    <div className="stats-row-container">
      <div className="stats-row-grid">
        {/* Card 1: Daily Goal -> Opens Goal Modal */}
        <div className="dash-stat-card" onClick={() => onOpenModalTab('goal')}>
          <div className="dash-stat-icon-wrapper goal-icon">
            <Target size={20} />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-label">Daily Goal</span>
            <span className="dash-stat-val">{minutesToday} / 30 Mins</span>
            <div className="dash-mini-bar-bg">
              <div className="dash-mini-bar-fill goal-fill" style={{ width: `${dailyGoalPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Card 2: Streak -> Opens Streak Modal */}
        <div className="dash-stat-card" onClick={() => onOpenModalTab('streak')}>
          <div className="dash-stat-icon-wrapper streak-icon">
            <Flame size={20} fill="currentColor" />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-label">Daily Streak</span>
            <span className="dash-stat-val">{profile.streak || 1} Days Active</span>
            <span className="dash-stat-sub">Read daily to keep 🔥</span>
          </div>
        </div>

        {/* Card 3: Reader Rank -> Opens Rank & XP Modal */}
        <div className="dash-stat-card" onClick={() => onOpenModalTab('stats')}>
          <div className="dash-stat-icon-wrapper xp-icon">
            <Zap size={20} />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-label">Reader Rank</span>
            <span className="dash-stat-val">Lvl {levelInfo.level} • {profile.xp || 0} XP</span>
            <div className="dash-mini-bar-bg">
              <div className="dash-mini-bar-fill xp-fill" style={{ width: `${levelInfo.progressPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Card 4: Library Size -> Opens Collection Stats Modal */}
        <div className="dash-stat-card" onClick={() => onOpenModalTab('collection')}>
          <div className="dash-stat-icon-wrapper book-icon">
            <BookOpen size={20} />
          </div>
          <div className="dash-stat-info">
            <span className="dash-stat-label">My Collection</span>
            <span className="dash-stat-val">{totalBooks} {totalBooks === 1 ? 'Book' : 'Books'}</span>
            <span className="dash-stat-sub">Stored in IndexedDB</span>
          </div>
        </div>
      </div>

      <style>{`
        .stats-row-container {
          max-width: 1300px;
          margin: 1.25rem auto 0;
          padding: 0 1.5rem;
        }

        .stats-row-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .dash-stat-card {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.875rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.875rem;
          cursor: pointer;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }

        .dash-stat-card:hover {
          border-color: var(--border-focus);
          transform: translateY(-2px);
        }

        .dash-stat-icon-wrapper {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .goal-icon { background-color: rgba(59, 130, 246, 0.12); color: #3b82f6; }
        .streak-icon { background-color: rgba(234, 179, 8, 0.12); color: #eab308; }
        .xp-icon { background-color: rgba(168, 85, 247, 0.12); color: #a855f7; }
        .book-icon { background-color: rgba(16, 185, 129, 0.12); color: #10b981; }

        .dash-stat-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          overflow: hidden;
        }

        .dash-stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .dash-stat-val {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dash-stat-sub {
          font-size: 0.725rem;
          color: var(--text-tertiary);
        }

        .dash-mini-bar-bg {
          height: 4px;
          border-radius: var(--radius-full);
          background-color: var(--bg-tertiary);
          overflow: hidden;
          margin-top: 0.2rem;
        }

        .dash-mini-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
        }

        .goal-fill { background-color: #3b82f6; }
        .xp-fill { background-color: #a855f7; }

        @media (max-width: 900px) {
          .stats-row-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 500px) {
          .stats-row-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
