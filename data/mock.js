export const assignments = [
  { id: 1, title: "Advanced Algorithms", deadline: "Oct 24, 2023", submissions: "34/45", status: "Active" },
  { id: 2, title: "Database Systems", deadline: "Oct 30, 2023", submissions: "28/40", status: "Active" },
  { id: 3, title: "Network Security", deadline: "Oct 15, 2023", submissions: "42/42", status: "Closed" },
  { id: 4, title: "Machine Learning", deadline: "Oct 20, 2023", submissions: "38/38", status: "Closed" },
  { id: 5, title: "Compiler Construction", deadline: "Nov 05, 2023", submissions: "12/35", status: "Draft" },
  { id: 6, title: "Advanced Web Architecture", deadline: "Oct 28, 2023", submissions: "22/30", status: "Active" },
  { id: 7, title: "Quantum Mechanics Thesis", deadline: "Nov 01, 2023", submissions: "18/25", status: "Active" },
  { id: 8, title: "Modern Poetry Analysis", deadline: "Oct 12, 2023", submissions: "30/30", status: "Closed" },
];

export const recentSubmissions = [
  { id: 1, student: "Jane Doe", assignment: "Advanced Calculus Theory", date: "Oct 23, 2023", status: "Pending" },
  { id: 2, student: "Michael Smith", assignment: "Microeconomics Final Paper", date: "Oct 23, 2023", status: "Graded" },
  { id: 3, student: "Alice Brown", assignment: "Cellular Biology Quiz 4", date: "Oct 23, 2023", status: "Pending" },
  { id: 4, student: "Robert King", assignment: "Intro to Philosophy Essay", date: "Oct 22, 2023", status: "Graded" },
  { id: 5, student: "Linda Hall", assignment: "World History Map Project", date: "Oct 22, 2023", status: "Pending" },
];

export const grades = [
  { id: 1, student: "Avery Sterling", assignment: "Quantum Mechanics Thesis", score: "94/100", date: "Oct 24, 2023" },
  { id: 2, student: "Marcus Chen", assignment: "Advanced Calculus Quiz", score: "78/100", date: "Oct 22, 2023" },
  { id: 3, student: "Elena Rodriguez", assignment: "Modern Exam", score: "82/100", date: "Oct 20, 2023" },
  { id: 4, student: "Jordan Smith", assignment: "Lab Report: Thermodynamics", score: "52/100", date: "Oct 18, 2023" },
  { id: 5, student: "Lam Hufson", assignment: "Quantum Mechanics Thesis", score: "91/100", date: "Oct 18, 2023" },
  { id: 6, student: "Sarah Chen", assignment: "Database Systems Project", score: "88/100", date: "Oct 25, 2023" },
  { id: 7, student: "David Kim", assignment: "Network Security Lab", score: "76/100", date: "Oct 21, 2023" },
];

export const invitations = [
  { id: 1, email: "j.smith@university.edu", status: "Invited", date: "Oct 24, 2023" },
  { id: 2, email: "m.garcia@university.edu", status: "Joined", date: "Oct 23, 2023" },
  { id: 3, email: "a.joe@university.edu", status: "Invited", date: "Oct 22, 2023" },
  { id: 4, email: "k.williams@university.edu", status: "Joined", date: "Oct 21, 2023" },
  { id: 5, email: "p.nguyen@university.edu", status: "Expired", date: "Oct 19, 2023" },
];

export const dashboardStats = {
  totalAssignments: 24,
  totalSubmissions: 148,
  pendingReviews: 12,
  activeStudents: 342,
};

export const systemHealth = {
  serverLoad: 82,
  dbSync: "Active",
  uptime: "99.9%",
  lastBackup: "Today, 2:30 AM",
};

export const aiGradingResult = {
  totalScore: 85,
  grade: "A+",
  breakdown: [
    { label: "Code Quality", score: 25, max: 25, percentage: 100 },
    { label: "Structure & Logic", score: 20, max: 25, percentage: 80 },
    { label: "Requirements Met", score: 30, max: 30, percentage: 100 },
    { label: "Best Practices", score: 15, max: 20, percentage: 75 },
    { label: "No Errors / Bugs", score: 10, max: 10, percentage: 100 },
  ],
  feedback: "Excellent use of async/await patterns. However, the directory structure could be more modular to separate routes from controllers. Documentation is sparse but accurate.",
  integrity: "No Plagiarism Detected",
};

export const quotes = [
  '"Clarity is the ultimate sophistication. Our goal is to make academic administration feel like a calm, guided experience." — System Architects, Design Philosophy Dept.',
  '"Education is not the filling of a pail, but the lighting of a fire." — W.B. Yeats',
  '"The beautiful thing about learning is that nobody can take it away from you." — B.B. King',
  '"Teaching is the one profession that creates all other professions." — Unknown',
];
