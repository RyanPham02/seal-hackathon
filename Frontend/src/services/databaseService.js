// databaseService.js
// Simulated Backend using LocalStorage to handle 1000+ users efficiently

import { 
  mockEvents, mockTeams, mockUsersPending, mockSubmissions, 
  mockAwardsConfig, mockTracks, mockScoringTeams, mockLeaderboard 
} from '../mockData';

const DB_KEY = 'seal_hackathon_db';

const ROLES = ['Frontend Dev', 'Backend Dev', 'Fullstack Dev', 'UI/UX Designer', 'AI Engineer', 'Data Scientist', 'Business Analyst', 'DevOps', 'QA Engineer', 'Mobile Dev'];
const SKILLS = ['React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java', 'C#', 'MongoDB', 'PostgreSQL', 'Figma', 'AWS', 'Docker', 'TensorFlow', 'PyTorch', 'Next.js', 'Spring Boot'];

const FIRST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const MIDDLE_NAMES = ['Văn', 'Thị', 'Thanh', 'Minh', 'Hải', 'Ngọc', 'Thành', 'Thu', 'Đức', 'Gia'];
const LAST_NAMES = ['A', 'B', 'C', 'D', 'Hùng', 'Linh', 'Khoa', 'Tâm', 'Nam', 'An', 'Bảo', 'Châu', 'Dũng', 'Giang', 'Hà', 'Khang', 'Lan', 'Mai', 'Nhi', 'Phong', 'Quang', 'Sơn', 'Trang', 'Tuấn', 'Uyên', 'Vy', 'Yến'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSkills(count) {
  const shuffled = [...SKILLS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Khởi tạo 1,000 người dùng tự do (Free Agents) chưa có nhóm
function generateInitialUsers() {
  const users = [];
  for (let i = 0; i < 1000; i++) {
    const fullName = `${getRandomItem(FIRST_NAMES)} ${getRandomItem(MIDDLE_NAMES)} ${getRandomItem(LAST_NAMES)}`;
    users.push({
      id: `USR-${10000 + i}`,
      name: fullName,
      email: `user${i}@student.edu.vn`,
      role: getRandomItem(ROLES),
      skills: getRandomSkills(Math.floor(Math.random() * 3) + 2), // 2-4 skills
      xp: Math.floor(Math.random() * 5000),
      teamId: null, // Chưa có nhóm
      recentActiveMs: Date.now() - Math.random() * 1000000000,
      achievements: []
    });
  }
  return users;
}

// Khởi tạo dữ liệu
function initDB() {
  if (typeof window === 'undefined') return;
  
  const storedDB = localStorage.getItem(DB_KEY);
  if (!storedDB) {
    const db = {
      users: generateInitialUsers(),
      teams: mockTeams,
      events: mockEvents,
      tracks: mockTracks,
      submissions: mockSubmissions,
      awards: mockAwardsConfig,
      pendingUsers: mockUsersPending,
      pendingApprovals: [
        { id: 'APP-1', type: 'TEAM', name: 'CyberNinjas', members: 4, track: 'Cybersecurity', date: new Date().toISOString(), status: 'Pending' },
        { id: 'APP-2', type: 'USER', name: 'Phạm Văn Hùng', role: 'Fullstack Dev', track: 'Web', date: new Date().toISOString(), status: 'Pending' },
      ],
      criteriaTemplates: [
        { id: '1', name: 'Standard Software Engineering', totalWeight: 100, usageCount: 5, status: 'Active', 
          items: [
            { key: '1', name: 'Technical Execution', weight: 40, desc: 'Code quality, architecture, and functional completeness.' },
            { key: '2', name: 'Innovation', weight: 30, desc: 'Originality of the idea and approach.' },
            { key: '3', name: 'Presentation', weight: 30, desc: 'Clarity and effectiveness of the pitch and demo.' }
          ]
        },
        { id: '2', name: 'AI/ML Focus', totalWeight: 100, usageCount: 2, status: 'Active', 
          items: [
            { key: '1', name: 'Model Accuracy', weight: 35, desc: 'Performance and reliability of the ML model.' },
            { key: '2', name: 'Data Processing', weight: 25, desc: 'Quality of data pipeline and preprocessing.' },
            { key: '3', name: 'Business Value', weight: 20, desc: 'Applicability to real-world problems.' },
            { key: '4', name: 'Presentation', weight: 20, desc: 'Clarity of the pitch.' }
          ]
        }
      ],
      auditLogs: [
        { id: 'LOG-1', user: 'System', action: 'System initialized with 1000 users', time: new Date().toISOString(), icon: 'info' }
      ]
    };
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } else {
    // Migration: Đảm bảo các bảng mới được thêm vào DB cũ nếu chưa có
    let db = JSON.parse(storedDB);
    let updated = false;
    if (!db.teams) { db.teams = mockTeams; updated = true; }
    if (!db.events) { db.events = mockEvents; updated = true; }
    if (!db.tracks) { db.tracks = mockTracks; updated = true; }
    if (!db.submissions) { db.submissions = mockSubmissions; updated = true; }
    if (!db.awards) { db.awards = mockAwardsConfig; updated = true; }
    if (!db.pendingUsers) { db.pendingUsers = mockUsersPending; updated = true; }
    if (!db.scoringTeams) { db.scoringTeams = mockScoringTeams; updated = true; }
    if (!db.criteriaTemplates) {
      db.criteriaTemplates = [
        { id: '1', name: 'Standard Software Engineering', totalWeight: 100, usageCount: 5, status: 'Active', 
          items: [
            { key: '1', name: 'Technical Execution', weight: 40, desc: 'Code quality, architecture, and functional completeness.' },
            { key: '2', name: 'Innovation', weight: 30, desc: 'Originality of the idea and approach.' },
            { key: '3', name: 'Presentation', weight: 30, desc: 'Clarity and effectiveness of the pitch and demo.' }
          ]
        },
        { id: '2', name: 'AI/ML Focus', totalWeight: 100, usageCount: 2, status: 'Active', 
          items: [
            { key: '1', name: 'Model Accuracy', weight: 35, desc: 'Performance and reliability of the ML model.' },
            { key: '2', name: 'Data Processing', weight: 25, desc: 'Quality of data pipeline and preprocessing.' },
            { key: '3', name: 'Business Value', weight: 20, desc: 'Applicability to real-world problems.' },
            { key: '4', name: 'Presentation', weight: 20, desc: 'Clarity of the pitch.' }
          ]
        }
      ];
      updated = true;
    }
    
    if (updated) {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    }
  }
}

// Gọi ngay khi file được import
initDB();

const getFallbackDB = () => ({
  users: [],
  teams: mockTeams,
  events: mockEvents,
  tracks: mockTracks,
  submissions: mockSubmissions,
  awards: mockAwardsConfig,
  pendingUsers: mockUsersPending,
  scoringTeams: mockScoringTeams,
  pendingApprovals: [],
  criteriaTemplates: [],
  auditLogs: []
});

export const databaseService = {
  getDB: () => {
    if (typeof window === 'undefined') return getFallbackDB();
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : getFallbackDB();
  },
  
  saveDB: (db) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    }
  },
  
  // ================= METRICS & ADMIN =================
  getDashboardMetrics: () => {
    const db = databaseService.getDB();
    return {
      activeEvents: 1,
      totalTeams: db.teams.length + 24, // Giả lập có 24 nhóm đã cứng
      pendingApprovals: db.pendingApprovals.length,
      upcomingEvent: 'Grand Finale - Hackathon 2026'
    };
  },

  getPendingApprovals: () => databaseService.getDB().pendingApprovals,

  approveRequest: (id) => {
    const db = databaseService.getDB();
    db.pendingApprovals = db.pendingApprovals.filter(app => app.id !== id);
    db.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      user: 'Admin',
      action: `Approved request ${id}`,
      time: new Date().toISOString(),
      icon: 'check'
    });
    databaseService.saveDB(db);
  },

  rejectRequest: (id) => {
    const db = databaseService.getDB();
    db.pendingApprovals = db.pendingApprovals.filter(app => app.id !== id);
    db.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      user: 'Admin',
      action: `Rejected request ${id}`,
      time: new Date().toISOString(),
      icon: 'info'
    });
    databaseService.saveDB(db);
  },

  // ================= ADMIN ENTITIES CRUD =================
  // Teams
  getTeams: () => databaseService.getDB().teams || [],
  updateTeam: (updatedTeam) => {
    const db = databaseService.getDB();
    db.teams = db.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t);
    databaseService.saveDB(db);
  },
  
  // Events
  getEvents: () => databaseService.getDB().events || [],
  addEvent: (event) => {
    const db = databaseService.getDB();
    db.events.push(event);
    databaseService.saveDB(db);
  },
  updateEvent: (updatedEvent) => {
    const db = databaseService.getDB();
    db.events = db.events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    databaseService.saveDB(db);
  },
  deleteEvent: (id) => {
    const db = databaseService.getDB();
    db.events = db.events.filter(e => e.id !== id);
    databaseService.saveDB(db);
  },

  // Submissions
  getSubmissions: () => databaseService.getDB().submissions || [],
  updateSubmission: (updatedSub) => {
    const db = databaseService.getDB();
    db.submissions = db.submissions.map(s => s.id === updatedSub.id ? updatedSub : s);
    databaseService.saveDB(db);
  },

  // Tracks
  getTracks: () => databaseService.getDB().tracks || [],
  addTrack: (track) => {
    const db = databaseService.getDB();
    db.tracks.push(track);
    databaseService.saveDB(db);
  },
  updateTrack: (updatedTrack) => {
    const db = databaseService.getDB();
    db.tracks = db.tracks.map(t => t.id === updatedTrack.id ? updatedTrack : t);
    databaseService.saveDB(db);
  },
  deleteTrack: (id) => {
    const db = databaseService.getDB();
    db.tracks = db.tracks.filter(t => t.id !== id);
    databaseService.saveDB(db);
  },

  // Awards
  getAwards: () => databaseService.getDB().awards || [],
  updateAward: (updatedAward) => {
    const db = databaseService.getDB();
    db.awards = db.awards.map(a => a.id === updatedAward.id ? updatedAward : a);
    databaseService.saveDB(db);
  },
  
  // Pending Users
  getPendingUsers: () => databaseService.getDB().pendingUsers || [],
  removePendingUser: (id) => {
    const db = databaseService.getDB();
    db.pendingUsers = db.pendingUsers.filter(u => u.id !== id);
    databaseService.saveDB(db);
  },

  // Criteria Templates
  getCriteriaTemplates: () => databaseService.getDB().criteriaTemplates || [],
  addCriteriaTemplate: (template) => {
    const db = databaseService.getDB();
    db.criteriaTemplates.push(template);
    databaseService.saveDB(db);
  },
  updateCriteriaTemplate: (updatedTemplate) => {
    const db = databaseService.getDB();
    db.criteriaTemplates = db.criteriaTemplates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
    databaseService.saveDB(db);
  },
  deleteCriteriaTemplate: (id) => {
    const db = databaseService.getDB();
    db.criteriaTemplates = db.criteriaTemplates.filter(t => t.id !== id);
    databaseService.saveDB(db);
  },

  // Scoring Teams
  getScoringTeams: () => databaseService.getDB().scoringTeams || [],
  updateScoringTeam: (updatedTeam) => {
    const db = databaseService.getDB();
    db.scoringTeams = db.scoringTeams.map(t => t.id === updatedTeam.id ? updatedTeam : t);
    databaseService.saveDB(db);
  },

  // ================= AUDIT LOG =================
  getAuditLogs: () => databaseService.getDB().auditLogs,

  logAction: (user, action, icon = 'info') => {
    const db = databaseService.getDB();
    db.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      user,
      action,
      time: new Date().toISOString(),
      icon
    });
    databaseService.saveDB(db);
  },

  // ================= MATCHMAKING ALGORITHM =================
  /**
   * Tự động quét 1000+ users và tìm ra Top 10 tốt nhất cho nhóm.
   * teamRoles: mảng các vai trò ĐÃ CÓ trong nhóm (vd: ['Frontend Dev', 'Team Leader'])
   */
  getTop10BestMatches: (teamRoles = [], searchTerm = '') => {
    const db = databaseService.getDB();
    let freeAgents = db.users.filter(u => !u.teamId);

    // Bắt buộc lọc theo search term trước nếu có
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      freeAgents = freeAgents.filter(user => {
        const hasRole = user.role.toLowerCase().includes(lowerSearch);
        const hasSkill = user.skills.some(s => s.toLowerCase().includes(lowerSearch));
        const hasName = user.name.toLowerCase().includes(lowerSearch);
        return hasRole || hasSkill || hasName;
      });
    }

    // Xác định các vai trò bị THIẾU
    const allRoles = ROLES;
    const missingRoles = allRoles.filter(r => !teamRoles.includes(r));

    // Tính điểm từng user
    const scoredUsers = freeAgents.map(user => {
      let score = 0;
      let matchReasons = [];

      // Trọng số 1: Vai trò đang thiếu (Quan trọng nhất)
      if (missingRoles.includes(user.role)) {
        score += 5000;
        matchReasons.push('Fills Missing Role');
      } else {
        score += 1000;
      }

      if (searchTerm) {
        score += 10000; // Search term là ưu tiên tuyệt đối
        matchReasons.push('Matches Search');
      }

      // Trọng số 3: Tỉ lệ hoàn thành / Kinh nghiệm (XP)
      score += user.xp;

      // Tính % Phù hợp giả lập dựa trên score
      const matchPercentage = Math.min(99, Math.max(40, Math.floor((score / 15000) * 100)));

      return { ...user, matchScore: score, matchPercentage, matchReasons };
    });

    // Thuật toán: Sort giảm dần theo điểm, sau đó lấy Top N
    scoredUsers.sort((a, b) => b.matchScore - a.matchScore);

    // Lấy đúng số lượng: Nếu có searchTerm lấy Top 3 (như yêu cầu), nếu không lấy Top 10.
    const limit = searchTerm ? 3 : 10;
    return scoredUsers.slice(0, limit);
  },

  // Lấy User theo XP để xem huy hiệu
  getUserXP: (email) => {
    // Giả lập lấy XP của current user
    const db = databaseService.getDB();
    const user = db.users.find(u => u.email === email) || { xp: 2400, achievements: ['First Commit', 'Bug Hunter'] };
    return user;
  }
};
