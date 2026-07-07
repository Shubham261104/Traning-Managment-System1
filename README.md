# Training Center Management System

A full-featured, multi-role platform for managing courses, students, instructors, and certifications with a modern, colorful design.

## Features

### 🔐 Authentication & User Roles
- Three distinct user roles: Admin, Instructor, Student
- Secure login system with email/password authentication
- Role-based access control

### 📚 Course Management (Admin)
- Create, edit, and archive courses
- Assign instructors to courses
- Set course schedules and capacity
- View course analytics

### 👥 Student Management
- Admin: View all students, approve/reject enrollments
- Student: Browse courses, request enrollment, track progress

### 👨‍🏫 Instructor Management
- Admin: Manage instructor profiles and assignments
- Instructor: View assigned courses, manage students, create quizzes

### 📝 Assessment System
- Create quizzes with multiple choice and true/false questions
- Auto-grading with instant results
- Track quiz attempts and scores

### 🏆 Certification & Progress Tracking
- Track completion status
- Downloadable PDF certificates
- Certificate verification system

### 📊 Dashboards
- Role-specific dashboards with overview statistics
- Quick actions and recent activity

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB with Mongoose
- JWT authentication
- PDF generation with PDFKit

### Frontend
- React with JavaScript
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls

## Installation

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/training_center
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

4. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Database Models

- **users**: User accounts with authentication
- **profiles**: User profile information
- **courses**: Course details and schedules
- **enrollments**: Student course enrollments
- **quizzes**: Quiz definitions
- **quiz_questions**: Quiz questions
- **quiz_attempts**: Student quiz attempts
- **certificates**: Generated certificates

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Admin Routes
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/enrollments/pending` - Pending enrollments
- `PUT /api/admin/enrollments/:id` - Approve/reject enrollment
- `GET /api/admin/students` - Get all students
- `GET /api/admin/instructors` - Get all instructors
- `POST /api/admin/courses` - Create course
- `PUT /api/admin/courses/:id` - Update course
- `PUT /api/admin/courses/:id/archive` - Archive course

### Instructor Routes
- `GET /api/instructor/dashboard` - Instructor dashboard
- `GET /api/instructor/courses` - Get assigned courses
- `GET /api/instructor/courses/:courseId/students` - Get course students
- `POST /api/instructor/quizzes` - Create quiz
- `GET /api/instructor/courses/:courseId/quizzes` - Get course quizzes

### Student Routes
- `GET /api/student/dashboard` - Student dashboard
- `GET /api/student/courses/available` - Get available courses
- `POST /api/student/enrollments` - Request enrollment
- `GET /api/student/enrollments` - Get my enrollments
- `GET /api/student/courses/:courseId/quizzes` - Get course quizzes
- `POST /api/student/quizzes/:quizId/attempt` - Submit quiz attempt
- `GET /api/student/quizzes/attempts` - Get quiz attempts history
- `GET /api/student/certificates` - Get certificates

## Usage

1. Start MongoDB on your system
2. Start the backend server (runs on port 5000)
3. Start the frontend development server (runs on port 3000)
4. Open http://localhost:3000 in your browser
5. Register a new account or login with existing credentials

## Default Roles

When registering, you can choose from:
- **Student**: Browse and enroll in courses
- **Instructor**: Create quizzes and manage students
- **Admin**: Full system access

## License

MIT

