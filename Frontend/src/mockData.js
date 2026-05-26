export const submissionDeadline = Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 30; // 2.5 days from now

export const mockDashboardStats = {
  activeEvents: 2,
  pendingApprovals: 12,
  totalTeams: 48,
  upcomingDeadline: 'Final Round',
  upcomingEvent: 'SEAL Spring 2025'
};

export const mockPendingApprovals = [
  { id: 1, teamName: 'CyberGuardians', members: 4, track: 'SECURITY', date: 'Oct 24, 2024' },
  { id: 2, teamName: 'EcoMinds', members: 3, track: 'SUSTAINABILITY', date: 'Oct 25, 2024' },
  { id: 3, teamName: 'DevDynamos', members: 5, track: 'FINTECH', date: 'Oct 26, 2024' },
];

export const mockRecentActivities = [
  { id: 1, user: 'Nguyen Van A', action: "approved Team 'TechTitans'", time: '2 hours ago', icon: 'check' },
  { id: 2, user: 'Judge B', action: 'submitted scores for Final Round', time: '5 hours ago', icon: 'score' },
  { id: 3, user: 'System', action: 'updated ranking for SEAL Spring 2025', time: 'Yesterday', icon: 'system' },
];

export const mockTracks = [
  { id: 1, name: 'Web Dev', desc: 'Web application development', mentor: 'Dr. Le Van A', mentorInitials: 'LV', teamsCount: 15, status: 'Submitted' },
  { id: 2, name: 'Mobile App', desc: 'iOS & Android solutions', mentor: 'Ms. Pham Thi B', mentorInitials: 'PT', teamsCount: 12, status: 'Submitted' },
  { id: 3, name: 'AI/ML', desc: 'Artificial Intelligence & Learning', mentor: 'Mr. Nguyen Hoang C', mentorInitials: 'NH', teamsCount: 21, status: 'Submitted' },
];

export const mockRecommendedMentors = [
  { id: 1, name: 'Prof. Tran Thi T', expertise: 'Fullstack, Architecture', initials: 'TT' },
  { id: 2, name: 'Dr. Dang Van E', expertise: 'DevOps, Cloud Security', initials: 'DV' },
  { id: 3, name: 'Mr. Ngo Thanh F', expertise: 'Frontend Expert, UI/UX', initials: 'NT' },
];

export const mockCalibrationData = [
  { criteria: 'Technical', JudgeA: 85, JudgeB: 88, JudgeC: 86 },
  { criteria: 'UX/UI', JudgeA: 70, JudgeB: 90, JudgeC: 85 },
  { criteria: 'Innovation', JudgeA: 95, JudgeB: 92, JudgeC: 94 },
  { criteria: 'Presentation', JudgeA: 60, JudgeB: 85, JudgeC: 75 },
];

export const mockCalibrationDatasetCSV = [
  { submissionId: 'SUB001', judgeId: 'J01', judgeType: 'Internal', technicalScore: 85, uxScore: 70, innovationScore: 95, presentationScore: 60 },
  { submissionId: 'SUB001', judgeId: 'J02', judgeType: 'Guest', technicalScore: 88, uxScore: 90, innovationScore: 92, presentationScore: 85 },
  { submissionId: 'SUB001', judgeId: 'J03', judgeType: 'Internal', technicalScore: 86, uxScore: 85, innovationScore: 94, presentationScore: 75 },
];

export const mockAwardsRanking = [
  { rank: 1, teamName: 'AI Pioneers', track: 'AI/ML', totalScore: 94.5, prize: 'First Prize' },
  { rank: 2, teamName: 'CyberGuardians', track: 'SECURITY', totalScore: 91.2, prize: 'Second Prize' },
  { rank: 3, teamName: 'EcoMinds', track: 'SUSTAINABILITY', totalScore: 88.0, prize: 'Third Prize' },
  { rank: 4, teamName: 'DevDynamos', track: 'FINTECH', totalScore: 85.5, prize: 'Consolation Prize' },
];

// --- PHASE 2 MOCK DATA ---

export const mockEvents = [
  { id: 1, name: 'SEAL Spring 2025', season: 'Spring', status: 'Active', roundsCount: 2, icon: 'star' },
  { id: 2, name: 'Global AI Summit', season: 'Summer', status: 'Draft', roundsCount: 0, icon: 'draft' },
];

export const mockTeams = [
  { id: 'TM-2024-001', name: 'TechTitans', membersCount: 4, track: 'AI/ML', mix: 'All FPT', status: 'Submitted', score: 88.5, initials: ['AL', 'BK'] },
  { id: 'TM-2024-002', name: 'CyberGuardians', membersCount: 2, track: 'Cybersecurity', mix: 'Mixed', status: 'Pending', score: null, initials: ['JD', 'MS'] },
  { id: 'TM-2024-003', name: 'DevDragons', membersCount: 3, track: 'Web3', mix: 'All External', status: 'Late', score: 72.0, initials: ['RH'] },
];

export const mockUsersPending = [
  { id: 1, name: 'Tran Nam', email: 'nam.tran@university.edu', role: 'Judge', verification: 'Public University', applied: 'Oct 24, 2023', initials: 'TN' },
  { id: 2, name: 'Hoang Lan', email: 'lan.h@corporate.com', role: 'Mentor', verification: 'International Inst.', applied: 'Oct 25, 2023', initials: 'HL' },
  { id: 3, name: 'Anh Vu', email: 'v.anh@techstart.vn', role: 'Leader', verification: 'Private Academy', applied: 'Oct 25, 2023', initials: 'AV' },
];

export const mockSubmissions = [
  { id: 1, team: 'NovaTech', repo: 'github.com/novatech/core', demo: true, report: true, lastCommit: '2 hours ago', branch: 'main', status: 'Submitted', initials: 'NT' },
  { id: 2, team: 'CyberEdge', repo: 'github.com/cedge/app', demo: true, report: true, lastCommit: '15 mins ago', branch: 'dev-v2', status: 'Late', initials: 'CE' },
  { id: 3, team: 'SkyNet', repo: 'github.com/skynet/sys', demo: false, report: true, lastCommit: 'No activity', branch: 'Not connected', status: 'Disqualified', initials: 'SN' },
  { id: 4, team: 'CodeCrafters', repo: 'github.com/cc/final-project', demo: true, report: true, lastCommit: '5 hours ago', branch: 'main', status: 'Submitted', initials: 'CC' },
];

export const mockScoringTeams = [
  { id: 'ML-042', name: 'NeuralNet Arch', desc: 'Real-time edge...', status: 'JUDGING' },
  { id: 'ML-089', name: 'Visionary AI', desc: 'Diagnostic imagin...', status: 'QUEUED' },
  { id: 'ML-012', name: 'Deep Blue Sky', desc: 'Atmospheric...', status: '8.4/10' },
];

// --- PHASE 3 MOCK DATA ---

export const mockResearchMatrix = [
  { trackId: 'TRK-204', team: 'Participant_0012', judgeId: 'J-Alpha-4', score: 88, variance: '± 1.2', status: 'Submitted' },
  { trackId: 'TRK-204', team: 'Participant_0012', judgeId: 'J-Gamma-2', score: 85, variance: '± 0.8', status: 'Submitted' },
  { trackId: 'TRK-112', team: 'Participant_0941', judgeId: 'J-Alpha-4', score: 12, variance: '± 4.5', status: 'Disqualified' },
  { trackId: 'TRK-505', team: 'Participant_0556', judgeId: 'J-Beta-9', score: 72, variance: '± 2.1', status: 'Late' },
];

export const mockAwardsConfig = [
  { id: 1, type: 'PREMIUM AWARD', title: 'Grand Prize', subtitle: 'Giải Đặc Biệt', prize: '$10,000', bonus: '+ Full Incubation Program', icon: 'star', color: '#1e3a8a', assignedTo: '' },
  { id: 2, type: 'RUNNER UP', title: 'First Runner-Up', subtitle: 'Giải Nhất', prize: '$5,000', bonus: '+ Cloud Credits ($2k)', icon: 'trophy', color: '#475569', assignedTo: 'CyberSentinels (Score: 97.2)' },
  { id: 3, type: 'TRACK WINNER', title: 'Track Winner: AI/ML', subtitle: 'Quán quân AI/ML', prize: '$2,500', bonus: 'Nvidia H100 GPU Access', icon: 'robot', color: '#b45309', assignedTo: '' },
  { id: 4, type: 'TRACK WINNER', title: 'Track Winner: Web3', subtitle: 'Quán quân Web3', prize: '$2,500', bonus: 'Ledger Hardware Wallets', icon: 'bitcoin', color: '#4338ca', assignedTo: 'ChainLinkers (Score: 91.4)' },
  { id: 5, type: 'TRACK WINNER', title: 'Sustainability Award', subtitle: 'Giải thưởng Bền vững', prize: '$2,500', bonus: 'ESG Mentorship Package', icon: 'leaf', color: '#15803d', assignedTo: '' },
  { id: 6, type: 'VOTED BY PEERS', title: 'Community Choice', subtitle: 'Giải bình chọn', prize: '$1,500', bonus: 'Gift Voucher Bundle', icon: 'heart', color: '#be123c', assignedTo: 'MemeEngine (Score: N/A)' },
];

export const mockLeaderboard = [
  { rank: 1, name: 'NeuroStream AI', track: 'AI & ML', score: 98.50, q1: 32.5, q2: 33.0, q3: 33.0, status: 'Advancing to Final' },
  { rank: 2, name: 'Quantum Ledger', track: 'Blockchain', score: 96.25, q1: 31.0, q2: 32.5, q3: 32.7, status: 'Advancing to Final' },
  { rank: 3, name: 'CyberGuard Labs', track: 'Security', score: 94.80, q1: 30.0, q2: 31.8, q3: 33.0, status: 'Advancing to Final' },
  { rank: 11, name: 'EcoSync VN', track: 'Sustainability', score: 82.10, q1: 25.0, q2: 28.5, q3: 28.6, status: 'Pending Decision' },
];

// --- PHASE 4 MOCK DATA ---

export const mockMentorTeams = [
  { id: 'TM-M01', name: 'Alpha Coders', track: 'Web Dev', status: 'In Progress', lastUpdate: '2 hours ago', repo: 'github.com/alpha/web' },
  { id: 'TM-M02', name: 'Beta Builders', track: 'Web Dev', status: 'Need Review', lastUpdate: '1 day ago', repo: 'github.com/beta/app' },
];

export const mockMyTeamMembers = [
  { id: 'MB-01', name: 'Alex Nguyen', role: 'Team Leader', email: 'alex@example.com', avatar: 'AN' },
  { id: 'MB-02', name: 'Sarah Tran', role: 'Member', email: 'sarah@example.com', avatar: 'ST' },
  { id: 'MB-03', name: 'David Lee', role: 'Member', email: 'david@example.com', avatar: 'DL' },
];
