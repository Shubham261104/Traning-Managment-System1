# 🎓 SkillBridge — Training Center & Learning Management System

<div align="center">

![SkillBridge Banner](https://img.shields.io/badge/SkillBridge-v3.0_Enterprise-6c5ce7?style=for-the-badge&logo=react)
![NodeJS](https://img.shields.io/badge/Node.js-v18.x-339933?style=for-the-badge&logo=node.js)
![ExpressJS](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-47A248?style=for-the-badge&logo=mongodb)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite)
![SocketIO](https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socket.io)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A production-ready, enterprise-grade Training & Course Management Platform**  
Built with React + Vite, Node.js, Express, MongoDB, and Socket.IO.

[Features](#-feature-overview) · [Tech Stack](#%EF%B8%8F-tech-stack) · [Architecture](#-project-architecture) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [Workflow](#-development-workflow) · [Troubleshooting](#-troubleshooting)

</div>

---

## 📖 Overview

SkillBridge is a full-stack, role-based Learning Management System (LMS) designed for training centers. It provides dedicated portals for **Students**, **Instructors**, and **Super Administrators**, with features such as real-time collaborative whiteboards, AI-powered course generation, proctored quizzes, certificate issuance, discussion forums, and a 1-to-1 mentorship booking system.

---

## 🌟 Feature Overview

### 🖌️ 1. Live Whiteboard Suite *(Real-Time Collaborative)*
- **Viewport-Fit Responsive UI**: Modern SaaS light-theme interface that fits cleanly within the browser without horizontal scroll.
- **Real-Time Collaboration**: Powered by Socket.IO WebSocket rooms — synchronized drawing strokes, canvas clear, live cursor tracking, laser pointer, room chat, emoji reactions, and a participant roster.
- **11 Interactive Drawing Tools**: Select & Move, Pen, Highlighter, Eraser, Line, Arrow, Rectangle, Circle, Text Box, Sticky Notes, Laser Pointer.
- **Canvas Customization**: 8 color swatches + custom picker, 4 stroke widths, 3 line styles (Solid/Dashed/Dotted), 5 workspace grid patterns, Undo/Redo stack.
- **Multi-Page Management**: Dynamic page creation, tab switching, page cloning, deletion, and per-page state persistence.
- **Embedded Utilities**:
  - 🧮 **Calculator** — Full arithmetic modal; no navigation away.
  - ⏱ **Countdown Timer** — Configurable timer synced for all room participants.
  - 🔗 **Share Session Modal** — One-click share link generator.
  - 📁 **Past Sessions History** — Fetch, view, and restore saved sessions from MongoDB.
- **Instructor Dock (Right Sidebar)**:
  - 👥 **Roster** — Participant list with real-time online/offline & hand-raise indicators.
  - 💬 **Chat** — Session chat with question flags and emoji reactions.
  - 📁 **Files** — Teaching material upload & download manager.
  - ℹ️ **Session Info** — Ticking session timer, auto-save badge, PNG export.

### 💬 2. Discussion Forum
- Multi-category community forums with thread publishing and nested reply trees.
- Dynamic course ID resolution for enrolled students and instructors.

### 📅 3. Attendance & Delivery Type System
- **Delivery Types**: `LIVE_CLASS`, `RECORDED`, `MATERIAL_BASED`.
- **Instructor-Only Marking**: Role-based API & UI guards prevent student attendance tampering.
- **Student Attendance Hub**: Read-only summary panel showing overall attendance %, present/absent logs.
- **Whiteboard Sync**: Automatically records live session participant attendance into course records.

### 🤝 4. 1-to-1 Mentorship & Booking
- Instructor cards with availability schedules, expertise tags, and ratings.
- Direct booking flow with a full audit log.

### 👑 5. Admin Dashboard & Course Directory
- **15-Tab Deep-Dive Course Modal**: Overview, Instructor Reassignment, Enrollment Limits, Drag & Drop Module/Lesson Builder, Analytics, Reviews, Financial Breakdown, Progress Roster, Certificate Templates, Announcements, Access Controls, Duplicate Flow.
- **🤖 AI Course Generator**: Auto-generates curriculum, modules, quiz questions, and descriptions.
- **Filters & CSV Export**: Multi-attribute filtering and one-click catalog download.

### 👨‍🎓 6. Student Portal & Proctored Quiz Engine
- **Anti-Cheat Proctoring**: Tab-switch detection, automated anti-cheat logs, auto-grading.
- **Certificate Issuance**: Dynamic PDF certificates via PDFKit with unique certificate IDs.
- **Learning Streak Tracker**: Daily engagement streaks and progress metrics.

### 🔐 7. Authentication System
- JWT-based stateless auth with `bcryptjs` password hashing.
- Google OAuth integration (optional, configurable).
- OTP email verification (optional, requires SMTP config).
- Role-based route guards for `admin`, `instructor`, `student`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend Framework** | React 18 + Vite 5 |
| **Routing** | React Router DOM v6 |
| **Real-Time** | Socket.IO Client v4 |
| **HTTP Client** | Axios |
| **Styling** | Vanilla CSS, CSS Grid, Flexbox, Glassmorphism |
| **Icons** | React Icons v4 |
| **Backend Runtime** | Node.js v18+ |
| **Backend Framework** | Express.js v4 |
| **WebSocket Server** | Socket.IO v4 |
| **Database** | MongoDB 6+ with Mongoose ORM |
| **Auth** | JSON Web Tokens (JWT) + bcryptjs |
| **File Uploads** | Multer |
| **PDF Generation** | PDFKit |
| **Email** | Nodemailer (optional) |
| **Google Auth** | google-auth-library (optional) |

---

## 📂 Project Architecture

```
SkillBridge/                          ← Repository root
├── SkillBridge/                      ← Main application
│   ├── backend/
│   │   ├── .env                      ← Environment variables (DO NOT COMMIT)
│   │   ├── server.js                 ← Express + Socket.IO entry point
│   │   ├── seed.js                   ← Database seeding script
│   │   ├── middleware/
│   │   │   ├── auth.js               ← JWT verification middleware
│   │   │   └── upload.js             ← Multer file upload config
│   │   ├── models/                   ← Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Course.js
│   │   │   ├── Enrollment.js
│   │   │   ├── Attendance.js
│   │   │   ├── Quiz.js / QuizAttempt.js / QuizQuestion.js
│   │   │   ├── WhiteboardSession.js
│   │   │   ├── Discussion.js
│   │   │   ├── MentorshipSession.js / InstructorAvailability.js
│   │   │   ├── Certificate.js
│   │   │   ├── Announcement.js
│   │   │   ├── Notification.js
│   │   │   ├── SupportTicket.js
│   │   │   ├── Message.js / Conversation.js
│   │   │   ├── WalletTransaction.js
│   │   │   ├── Profile.js
│   │   │   └── TeamMember.js
│   │   ├── routes/                   ← Express API route handlers
│   │   │   ├── auth.js               ← /api/auth
│   │   │   ├── admin.js              ← /api/admin
│   │   │   ├── instructor.js         ← /api/instructor
│   │   │   ├── student.js            ← /api/student
│   │   │   ├── courses.js            ← /api/courses
│   │   │   ├── attendance.js         ← /api/attendance
│   │   │   ├── quizzes.js            ← /api/quizzes
│   │   │   ├── certificates.js       ← /api/certificates
│   │   │   ├── forum.js              ← /api/forum
│   │   │   ├── mentorship.js         ← /api/mentorship
│   │   │   ├── messages.js           ← /api/messages
│   │   │   ├── announcements.js      ← /api/announcements
│   │   │   ├── notifications.js      ← /api/notifications
│   │   │   ├── support.js            ← /api/support
│   │   │   └── team.js               ← /api/team
│   │   ├── utils/
│   │   │   └── (PDF generator, email utilities, progress calculator)
│   │   └── uploads/                  ← Uploaded files (avatars, materials)
│   │
│   └── frontend/
│       ├── vite.config.js            ← Vite dev server + proxy config
│       ├── index.html
│       └── src/
│           ├── App.jsx               ← Route tree & provider wrappers
│           ├── main.jsx              ← React app mount point
│           ├── index.css
│           ├── context/
│           │   ├── AuthContext.jsx   ← Auth state + JWT management
│           │   └── ThemeContext.jsx  ← Light/Dark theme provider
│           ├── components/
│           │   ├── PrivateRoute.jsx  ← Role-based route guard
│           │   └── ErrorBoundary.jsx
│           └── pages/
│               ├── Home.jsx / Home.css
│               ├── Login.jsx / Login.css
│               ├── Register.jsx
│               ├── HelpSupport.jsx
│               ├── public/
│               │   ├── AboutUs.jsx
│               │   ├── ContactUs.jsx
│               │   ├── MemberDetail.jsx
│               │   ├── PrivacyPolicy.jsx
│               │   └── TermsOfService.jsx
│               ├── admin/
│               │   ├── AdminDashboard.jsx   ← Main admin hub (system stats, users)
│               │   ├── AdminCourses.jsx     ← Course directory & deep-dive modal
│               │   ├── AdminStudents.jsx    ← Student management
│               │   ├── AdminInstructors.jsx ← Instructor management
│               │   ├── AdminAnnouncements.jsx
│               │   ├── AdminMentorship.jsx
│               │   └── AdminTeam.jsx
│               ├── instructor/
│               │   ├── InstructorDashboard.jsx ← Main hub (courses, quizzes, attendance, forum, whiteboard nav)
│               │   ├── LiveWhiteboard.jsx      ← Real-time Socket.IO whiteboard
│               │   ├── InstructorMentorship.jsx
│               │   ├── InstructorCourses.jsx
│               │   ├── InstructorQuizzes.jsx
│               │   ├── InstructorAnnouncements.jsx
│               │   ├── InstructorProfile.jsx
│               │   └── CourseManageView.jsx
│               └── student/
│                   ├── StudentDashboard.jsx ← Main hub (courses, progress, attendance, forum)
│                   ├── QuizTake.jsx         ← Anti-cheat proctored quiz engine
│                   ├── StudentMentorship.jsx
│                   ├── StudentCourses.jsx
│                   ├── StudentCertificates.jsx
│                   ├── StudentQuizzes.jsx
│                   ├── StudentProfile.jsx
│                   └── StudentCourseMaterials.jsx
│
├── local_db_data/                    ← Local MongoDB data directory
├── mongodb_data/
└── README.md                         ← Root-level overview
```

---

## ⚡ Quick Start

### Prerequisites

| Requirement | Version | Notes |
|:------------|:--------|:------|
| **Node.js** | v18.x or higher | [Download](https://nodejs.org/) |
| **npm** | v9+ | Comes with Node.js |
| **MongoDB** | v6.0+ | Local instance or Atlas cloud |
| **Git** | Any recent | For cloning |

> **Windows users**: Ensure MongoDB is installed and the `mongod` service is running before starting the backend.

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Shubham261104/Traning-Managment-System.git
cd Traning-Managment-System/SkillBridge
```

---

### Step 2 — Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install all dependencies
npm install
```

#### Configure Environment Variables

Create or edit the `backend/.env` file:

```env
# Server
PORT=5001
NODE_ENV=development

# Database — use local MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/training_center

# Security — change this in production!
JWT_SECRET=skillbridge_super_secret_jwt_key_2026

# Optional: MongoDB Atlas cloud URI
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/training_center

# Optional: Google OAuth (for social login)
# GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Optional: Email/SMTP (for OTP verification)
# EMAIL_SERVICE=gmail
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_app_password_here
```

#### Start the Backend Server

```bash
# Development mode (with auto-restart via nodemon)
npm run dev

# Production mode
npm start
```

> ✅ Backend API + Socket.IO server runs at **`http://localhost:5001`**

---

### Step 3 — Frontend Setup

Open a **new terminal window** and run:

```bash
# Navigate to the frontend directory
cd frontend

# Install all dependencies
npm install

# Start the Vite development server
npm run dev
```

> ✅ Frontend runs at **`http://localhost:3000`**  
> All `/api` and `/uploads` requests are automatically proxied to `http://localhost:5001`.

---

### Step 4 — (Optional) Seed the Database

To populate the database with sample courses, users, and data:

```bash
# From the backend/ directory
node seed.js
```

---

### Step 5 — Access the Application

| Portal | URL | Default Role |
|:-------|:----|:-------------|
| **Home / Landing** | `http://localhost:3000` | Public |
| **Login** | `http://localhost:3000/login` | — |
| **Register** | `http://localhost:3000/register` | — |
| **Admin Dashboard** | `http://localhost:3000/admin` | `admin` |
| **Instructor Dashboard** | `http://localhost:3000/instructor` | `instructor` |
| **Student Dashboard** | `http://localhost:3000/student` | `student` |
| **API Health Check** | `http://localhost:5001/api/health` | — |

---

## 🗂️ User Roles & Access

| Feature | Student | Instructor | Admin |
|:--------|:-------:|:----------:|:-----:|
| View Courses | ✅ | ✅ | ✅ |
| Enroll in Courses | ✅ | ❌ | ✅ |
| Mark Attendance | ❌ | ✅ | ✅ |
| View Own Attendance | ✅ | ✅ | ✅ |
| Take Proctored Quiz | ✅ | ❌ | ❌ |
| Create Quiz | ❌ | ✅ | ✅ |
| Live Whiteboard | View | Host | View |
| Discussion Forum | ✅ | ✅ | ✅ |
| 1-to-1 Mentorship | Book | Offer | Manage |
| Certificate Download | ✅ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| AI Course Generator | ❌ | ❌ | ✅ |

---

## 📡 API Reference

### 🔐 Authentication — `/api/auth`

| Method | Endpoint | Description | Auth |
|:-------|:---------|:------------|:----:|
| `POST` | `/api/auth/register` | Register a new Student or Instructor | ❌ |
| `POST` | `/api/auth/login` | Sign in & receive JWT token | ❌ |
| `GET` | `/api/auth/me` | Get current user profile & role | ✅ |
| `POST` | `/api/auth/google` | Google OAuth sign-in | ❌ |
| `POST` | `/api/auth/verify-otp` | Email OTP verification | ❌ |

### 👑 Admin Portal — `/api/admin`

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/admin/courses` | Course directory with search & filters |
| `POST` | `/api/admin/courses` | Create a new course |
| `PUT` | `/api/admin/courses/:id` | Update course details |
| `DELETE` | `/api/admin/courses/:id` | Delete a course |
| `POST` | `/api/admin/courses/ai-generator` | Generate course via AI |
| `GET` | `/api/admin/students` | List all students |
| `GET` | `/api/admin/instructors` | List all instructors |
| `PUT` | `/api/admin/users/:id` | Update user role/status |

### 👨‍🏫 Instructor Portal — `/api/instructor`

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/instructor/dashboard` | Performance metrics & KPIs |
| `GET` | `/api/instructor/courses` | Instructor's course list |
| `GET` | `/api/instructor/courses/:courseId/students` | Enrolled student roster |
| `GET` | `/api/instructor/courses/:courseId/materials` | Uploaded teaching materials |
| `POST` | `/api/instructor/courses/:courseId/materials` | Upload teaching materials |
| `POST` | `/api/instructor/whiteboard/sessions` | Save whiteboard session to DB |
| `GET` | `/api/instructor/whiteboard/sessions` | Fetch past saved sessions |
| `GET` | `/api/instructor/whiteboard/sessions/:id` | Fetch single session state |
| `DELETE` | `/api/instructor/whiteboard/sessions/:id` | Delete session record |
| `POST` | `/api/instructor/whiteboard/attendance` | Sync live participants → course attendance |

### 👨‍🎓 Student Portal — `/api/student`

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/student/dashboard` | Dashboard stats, streak, enrolled courses |
| `GET` | `/api/student/attendance` | Read-only attendance summary & history |
| `GET` | `/api/student/quizzes` | Available quizzes for enrolled courses |
| `POST` | `/api/student/quizzes/:quizId/attempt` | Submit proctored quiz attempt |
| `GET` | `/api/student/certificates` | Issued certificates list |
| `GET` | `/api/student/certificates/:id/download` | Download PDF certificate |

### 📅 Attendance — `/api/attendance`

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/attendance` | Mark attendance (Instructor only) |
| `GET` | `/api/attendance/:courseId` | Get course attendance records |

### 💬 Discussion Forum — `/api/forum`

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/forum` | List all forum threads |
| `POST` | `/api/forum` | Publish a new thread |
| `POST` | `/api/forum/:threadId/reply` | Post a reply |

### 🤝 Mentorship — `/api/mentorship`

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/mentorship/instructors` | List available instructors |
| `POST` | `/api/mentorship/book` | Book a mentorship session |
| `GET` | `/api/mentorship/sessions` | List booked sessions |

### 📢 Announcements — `/api/announcements`

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/announcements` | List announcements |
| `POST` | `/api/announcements` | Create announcement |

### 🎫 Support — `/api/support`

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/support` | Submit a support ticket |
| `GET` | `/api/support` | List tickets (Admin view) |

### 🏥 Health Check

| Method | Endpoint | Response |
|:-------|:---------|:---------|
| `GET` | `/api/health` | `{ "status": "OK", "message": "Server is running" }` |

---

## 🔌 Socket.IO Real-Time Events

The backend maintains in-memory room state (participants, timer, active page) per whiteboard room.

| Event (Emit) | Direction | Description |
|:-------------|:----------|:------------|
| `join-room` | Client → Server | Join a whiteboard room |
| `whiteboard-draw` | Client ↔ Server | Broadcast a drawing stroke |
| `whiteboard-clear` | Client ↔ Server | Clear the canvas |
| `whiteboard-page-change` | Client ↔ Server | Switch active page |
| `whiteboard-page-update` | Client ↔ Server | Sync page data |
| `whiteboard-sticky-update` | Client ↔ Server | Sync sticky notes |
| `cursor-move` | Client ↔ Server | Live cursor position |
| `laser-move` | Client ↔ Server | Laser pointer position |
| `chat-message` | Client ↔ Server | Send/receive chat message |
| `reaction` | Client ↔ Server | Emoji reaction broadcast |
| `hand-raise` | Client ↔ Server | Toggle hand-raise status |
| `timer-update` | Client ↔ Server | Countdown timer sync |
| `session-status-change` | Client ↔ Server | Start/stop session |
| `room-state` | Server → Client | Full room state snapshot on join |
| `user-joined` | Server → Client | New participant notification |
| `user-left` | Server → Client | Participant disconnect notification |

---

## 🔄 Development Workflow

### Local Development

```
Terminal 1 (Backend):
  cd SkillBridge/backend
  npm run dev
  → Server: http://localhost:5001
  → Socket.IO: ws://localhost:5001

Terminal 2 (Frontend):
  cd SkillBridge/frontend
  npm run dev
  → App: http://localhost:3000
  → Proxy: /api/* → http://localhost:5001
```

### Production Build

```bash
# Build the React frontend
cd frontend
npm run build
# Output is in frontend/dist/

# Preview the production build locally
npm run preview
```

### Git Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Stage and commit changes
git add .
git commit -m "feat: describe your change"

# Push and open a PR
git push origin feature/your-feature-name
```

---

## 🗄️ Database Models (Mongoose Schemas)

| Model | Description |
|:------|:------------|
| `User` | Auth account — email, password (hashed), role (`admin`/`instructor`/`student`) |
| `Course` | Course metadata, delivery type, modules, lessons, tags |
| `Enrollment` | Student ↔ Course relationship, progress tracking |
| `Attendance` | Per-session student attendance records |
| `Quiz` / `QuizQuestion` / `QuizAttempt` | Quiz engine with proctoring data |
| `WhiteboardSession` | Saved whiteboard state (pages, strokes, sticky notes) |
| `Discussion` | Forum threads and nested replies |
| `MentorshipSession` | Booked 1-to-1 sessions with status & audit log |
| `InstructorAvailability` | Available time slots per instructor |
| `MentorshipSettings` | Global mentorship configuration |
| `Certificate` | Issued certificate records with unique IDs |
| `Announcement` | Course/global announcements |
| `Notification` | Real-time notification records |
| `SupportTicket` | Help & support ticket tracking |
| `Message` / `Conversation` | Private messaging system |
| `Profile` | Extended user profile (bio, avatar, skills) |
| `WalletTransaction` | Payment/wallet ledger |
| `TeamMember` | About-us page team member records |

---

## 🌐 Deployment

### Vercel (Frontend)

A `vercel.json` is included in `frontend/`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

Deploy: push to GitHub and connect the `frontend/` directory to Vercel.

### Backend Deployment (Render / Railway / VPS)

1. Set all environment variables in your cloud provider's dashboard.
2. Set the start command to `npm start`.
3. Ensure your MongoDB Atlas URI is set in `MONGODB_URI`.
4. Update the frontend Vite proxy (or `VITE_API_URL`) to point to your deployed backend URL.

---

## 🐛 Troubleshooting

### Backend Won't Start

- Ensure MongoDB is running: `mongosh` or check Windows Services for `MongoDB`.
- Verify `backend/.env` exists with `JWT_SECRET`, `MONGODB_URI`, and `PORT`.
- Run `npm install` in the `backend/` directory.

### Frontend Can't Reach API

- Confirm backend is running on port `5001`.
- Check `vite.config.js` proxy target: should be `http://localhost:5001`.
- Inspect the Network tab in browser DevTools for failed requests.

### "JWT_SECRET is not set" Error

- Add `JWT_SECRET=your_secret` to `backend/.env`.
- Restart the backend server.

### MongoDB Connection Error

```bash
# Windows — Start MongoDB service
net start MongoDB

# Or run directly
mongod --dbpath "C:\data\db"
```

### Reinstall Dependencies

```bash
# Backend
cd backend
Remove-Item -Recurse node_modules, package-lock.json
npm install

# Frontend
cd frontend
Remove-Item -Recurse node_modules, package-lock.json
npm install
```

### Socket.IO Not Connecting

- Ensure the backend is running on port `5001`.
- Check browser console for WebSocket errors.
- Verify CORS is open on the server (`origin: '*'` in development).

---

## 📁 Key Configuration Files

| File | Purpose |
|:-----|:--------|
| `backend/.env` | Environment variables (port, DB URI, JWT secret) |
| `backend/server.js` | Express + Socket.IO server entry point |
| `frontend/vite.config.js` | Dev server port (3000) & API proxy to 5001 |
| `frontend/src/App.jsx` | React Router tree with role-based route guards |
| `frontend/src/context/AuthContext.jsx` | JWT auth state management |
| `SkillBridge/vercel.json` | Monorepo Vercel deployment config |

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## 👤 Author

**Shubham Kumar**  
GitHub: [@Shubham261104](https://github.com/Shubham261104)

---

<div align="center">

⭐ **SkillBridge Training Management System** — Engineered for Next-Gen Education.

*If you found this project useful, please consider giving it a star!*

</div>
