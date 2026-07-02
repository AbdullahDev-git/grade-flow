# GradeFlow — Full-Stack Assignment & AI Grading System

## Overview
GradeFlow is a web-based portal with two sides:
1. **Student Portal** — Students submit assignments.
2. **Admin Portal** — Admin creates assignments, reviews submissions, and uses AI to grade them.

## Tech Stack
- **Frontend:** Next.js (App Router) + JavaScript
- **Styling:** Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **File Storage:** Local `/uploads` folder (Cloudinary later)
- **Authentication:** JWT (JSON Web Tokens)
- **AI Grading:** OpenAI API (or Gemini API)
- **Deployment:** Vercel (Frontend + API), Supabase (PostgreSQL)

---

## Student Portal Features

### 1. Login Page
- Email and password login.
- First-time users set up password via invite link.

### 2. Dashboard
- Welcome banner with student's name.
- Sidebar with "All Assignments" link.
- Logout button (top right).
- Quick Action Card showing the most recent **PENDING** assignment:
  - Status badge (Pending - amber).
  - Assignment title.
  - Due date (red if within 48 hours).
  - "Submit Assignment" button (accent color - teal/mint).
- If no pending assignments: "No pending assignments. Great job!"

### 3. All Assignments Page
- Table with columns: Assignment Name | Status | Deadline.
- Status badges:
  - Submitted (Green)
  - Pending (Amber)
  - Overdue (Red)
- Overdue assignments: No submit button. "Closed" text.

### 4. Submit Assignment Page
- Breadcrumb: "← Back to Dashboard".
- Assignment title and deadline displayed.
- Drag-and-drop upload zone: "Upload ZIP file only (Max 10MB)".
- File selected: Show name, size, remove option.
- Upload progress bar.
- "Submit Assignment" button.
- Success: "✓ Submitted Successfully!" + "Back to Dashboard" button.
- After submission: Card disappears from dashboard. Status updated.

### Important
- Students **never** see grades, scores, or feedback. They only see submission status.

---

## Admin Portal Features

### 1. Admin Dashboard
- Welcome message with date.
- Stats cards: Total Assignments, Total Submissions, Pending Reviews.
- Recent Submissions table (last 5).

### 2. Sidebar
- Assignments
- Grades
- Invite Students
- Logout

### 3. Add Assignment
- Form fields: Title, Description, Deadline, Requirements PDF upload, Max File Size.
- "Publish" button to make it visible to all students.

### 4. All Assignments
- Table: Assignment Name | Deadline | Submissions (e.g., 12/20) | Status (Active/Closed).
- "Check" button per row.

### 5. Submission Check Page
- Assignment title, student name, submission date.
- Two buttons: "Download ZIP" (outlined), "AI Grade" (filled accent).
- AI Grading results section:
  - Total Score (large, out of 100).
  - Category breakdown bars:
    - Code Quality (25%)
    - Structure (20%)
    - Requirements Met (30%)
    - Best Practices (15%)
    - No Errors (10%)
- Manual Override button.

### 6. Grades Page
- Filters: By Assignment, By Student.
- Table: Student Name | Assignment | Score | Date | View Details.
- Export CSV button.

### 7. Invite Students
- Textarea for email addresses.
- "Send Invites" button.
- Table: Email | Status (Invited/Joined) | Date Invited | Resend.

---

## Database Models (PostgreSQL via Prisma)

### User
- `id` (uuid), `name`, `email` (unique), `password` (hashed), `role` (student/admin), `inviteStatus` (invited/joined)

### Assignment
- `id` (uuid), `title`, `description`, `deadline`, `requirementsPDF`, `maxFileSize`, `status` (active/closed), `createdById` (FK -> User)

### Submission
- `id` (uuid), `studentId` (FK -> User), `assignmentId` (FK -> Assignment), `zipFile`, `submittedAt`, `status` (submitted)
- Relation: `Grade` (one-to-one)

### Grade
- `id` (uuid), `submissionId` (FK -> Submission, unique), `totalScore`, `codeQuality`, `structure`, `requirementsMet`, `bestPractices`, `noErrors`, `gradedAt`

---

## Key Features
- Authentication (Login, Invite flow)
- Student Dashboard with Quick Action Card
- Assignment Submission (ZIP upload)
- All Assignments table with status badges
- Admin Dashboard with stats
- Add Assignment + Publish
- View Submissions + Download ZIP
- AI Grading (OpenAI/Gemini API integration)
- Grades table + CSV export
- Invite Students via email

---

## Status
Work in progress. Core features first, polish later.
