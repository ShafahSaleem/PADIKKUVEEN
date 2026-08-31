import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import MyResults from './pages/MyResults';
import MentorDashboard from './pages/MentorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ExamPage from './pages/ExamPage';
import ExamInstructions from './pages/ExamInstructions';
import ResultPage from './pages/ResultPage';
import AdminExamList from './pages/AdminExamList';
import AdminExamForm from './pages/AdminExamForm';
import AdminQuestionList from './pages/AdminQuestionList';
import AdminQuestionForm from './pages/AdminQuestionForm';
import AdminCategories from './pages/AdminCategories';
import NotificationsPage from './pages/NotificationsPage';
import AdminNotifications from './pages/AdminNotifications';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isGoogleConfigured = Boolean(
    googleClientId &&
    !googleClientId.includes('your_google_client_id_here') &&
    googleClientId.trim() !== ''
  );

  const appContent = (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A]">
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Notifications Route */}
                <Route path="/notifications" element={<NotificationsPage />} />

                {/* Student Routes */}
                <Route path="/student-dashboard" element={<StudentDashboard />} />
                <Route path="/my-results" element={<MyResults />} />
                <Route path="/exam/:examId/instructions" element={<ExamInstructions />} />
                <Route path="/student/exams/:examId/instructions" element={<ExamInstructions />} />
                <Route path="/student/exams/:examId" element={<ExamPage />} />
                <Route path="/exam/:examId" element={<ExamPage />} />
                <Route path="/result/:resultId" element={<ResultPage />} />

                {/* Mentor Routes */}
                <Route path="/mentor-dashboard" element={<MentorDashboard />} />

                {/* Admin Routes */}
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/admin/exams" element={<AdminExamList />} />
                <Route path="/admin/exams/new" element={<AdminExamForm />} />
                <Route path="/admin/exams/edit/:id" element={<AdminExamForm />} />
                <Route path="/admin/exams/:examId/questions" element={<AdminQuestionList />} />
                <Route path="/admin/exams/:examId/questions/new" element={<AdminQuestionForm />} />
                <Route path="/admin/exams/:examId/questions/edit/:questionId" element={<AdminQuestionForm />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
              </Routes>
            </main>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );

  if (isGoogleConfigured) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {appContent}
      </GoogleOAuthProvider>
    );
  }

  return appContent;
}

export default App;
