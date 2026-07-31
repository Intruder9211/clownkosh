import { getProfile, updateProfile } from '../db/libraryDb';

export const ACHIEVEMENTS = [
  {
    id: 'first_step',
    title: 'First Step',
    desc: 'Uploaded your first book to Clownkosh',
    icon: '🚀',
    xpReward: 50
  },
  {
    id: 'streak_3d',
    title: 'Streak Master',
    desc: 'Maintained a 3-day active reading streak',
    icon: '🔥',
    xpReward: 200
  },
  {
    id: 'read_30m',
    title: 'Avid Scholar',
    desc: 'Read for a total of 30 minutes',
    icon: '⏱️',
    xpReward: 250
  },
  {
    id: 'first_finished',
    title: 'Book Finisher',
    desc: 'Completed your first entire PDF book',
    icon: '🏆',
    xpReward: 500
  },
  {
    id: 'note_taker',
    title: 'Thoughtful Reader',
    desc: 'Saved your first book note or quote',
    icon: '📝',
    xpReward: 100
  },
  {
    id: 'polyglot',
    title: 'Multilingual Explorer',
    desc: 'Read books across multiple categories',
    icon: '🌐',
    xpReward: 200
  }
];

export function calculateLevelInfo(xp = 0) {
  const levels = [
    { level: 1, title: 'Novice Reader 📖', minXp: 0, maxXp: 250 },
    { level: 2, title: 'Page Turner ⚡', minXp: 250, maxXp: 600 },
    { level: 3, title: 'Bookworm 🐛', minXp: 600, maxXp: 1200 },
    { level: 4, title: 'Avid Scholar 🎓', minXp: 1200, maxXp: 2000 },
    { level: 5, title: 'Master Bibliophile 👑', minXp: 2000, maxXp: 3200 },
    { level: 6, title: 'Archmage of Literature 🔮', minXp: 3200, maxXp: 5000 }
  ];

  let current = levels[0];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].minXp) {
      current = levels[i];
      break;
    }
  }

  const xpInCurrentLevel = xp - current.minXp;
  const xpSpan = current.maxXp - current.minXp;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpSpan) * 100));

  return {
    level: current.level,
    title: current.title,
    xp,
    currentLevelMinXp: current.minXp,
    nextLevelXp: current.maxXp,
    progressPercent
  };
}

/**
 * Adds XP to profile and unlocks achievements automatically
 */
export async function awardXp(amount, reason = '') {
  const profile = await getProfile();
  const newXp = (profile.xp || 0) + amount;
  const newLevelInfo = calculateLevelInfo(newXp);

  const updates = {
    xp: newXp,
    level: newLevelInfo.level
  };

  await updateProfile(updates);
  return { newXp, levelInfo: newLevelInfo };
}

/**
 * Checks and updates daily reading streak
 */
export async function checkDailyStreak() {
  const profile = await getProfile();
  const today = new Date().toISOString().split('T')[0];
  const lastDate = profile.lastStreakDate;

  if (!lastDate) {
    await updateProfile({ streak: 1, lastStreakDate: today });
    return 1;
  }

  if (lastDate === today) {
    return profile.streak || 1;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastDate === yesterdayStr) {
    const newStreak = (profile.streak || 1) + 1;
    await updateProfile({ streak: newStreak, lastStreakDate: today });
    await awardXp(100, 'Daily Streak Check-in');
    
    // Check 3 day streak achievement
    if (newStreak >= 3) {
      await unlockAchievement('streak_3d');
    }
    return newStreak;
  } else {
    // Reset streak if missed days
    await updateProfile({ streak: 1, lastStreakDate: today });
    return 1;
  }
}

/**
 * Tracks minutes spent reading and awards XP
 */
export async function trackReadingTime(minutes = 1) {
  const profile = await getProfile();
  const totalMins = (profile.totalMinutesRead || 0) + minutes;
  
  await updateProfile({ totalMinutesRead: totalMins });
  await awardXp(minutes * 10, 'Active Reading Time');

  if (totalMins >= 30) {
    await unlockAchievement('read_30m');
  }

  await checkDailyStreak();
}

/**
 * Unlocks an achievement by ID
 */
export async function unlockAchievement(achievementId) {
  const profile = await getProfile();
  const unlocked = profile.unlockedAchievements || [];

  if (!unlocked.includes(achievementId)) {
    const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
    const updatedList = [...unlocked, achievementId];
    
    await updateProfile({ unlockedAchievements: updatedList });
    if (ach && ach.xpReward) {
      await awardXp(ach.xpReward, `Unlocked ${ach.title}`);
    }
    return true;
  }
  return false;
}
