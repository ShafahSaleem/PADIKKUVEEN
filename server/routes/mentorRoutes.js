const express = require('express');
const router = express.Router();
const { protect, mentorOnly } = require('../middleware/authMiddleware');
const {
  getMentorStats,
  getMentorStudents,
  getMentorResults,
  getMentorStudentDetails,
  getMentorExams,
  createMentorExam,
  getMentorExamById,
  updateMentorExam,
  deleteMentorExam,
  toggleMentorExamStatus,
  getMentorExamQuestions,
  createMentorExamQuestion,
  updateMentorExamQuestion,
  deleteMentorExamQuestion,
  getMentorExamStudents,
  assignStudentsToMentorExam,
  removeStudentFromMentorExam,
  getMentorExamResults,
} = require('../controllers/mentorController');

// All mentor endpoints are protected and restricted to mentor role
router.use(protect, mentorOnly);

// 1. Dashboard Overview & Students
router.get('/stats', getMentorStats);
router.get('/students', getMentorStudents);
router.get('/results', getMentorResults);
router.get('/students/:studentId', getMentorStudentDetails);

// 2. Mentor Exam Management
router.get('/exams', getMentorExams);
router.post('/exams', createMentorExam);
router.get('/exams/:examId', getMentorExamById);
router.put('/exams/:examId', updateMentorExam);
router.delete('/exams/:examId', deleteMentorExam);
router.patch('/exams/:examId/status', toggleMentorExamStatus);

// 3. Mentor Question Management
router.get('/exams/:examId/questions', getMentorExamQuestions);
router.post('/exams/:examId/questions', createMentorExamQuestion);
router.put('/exams/:examId/questions/:questionId', updateMentorExamQuestion);
router.delete('/exams/:examId/questions/:questionId', deleteMentorExamQuestion);

// 4. Mentor Student Assignment to Exam & Exam Results
router.get('/exams/:examId/students', getMentorExamStudents);
router.post('/exams/:examId/assign', assignStudentsToMentorExam);
router.delete('/exams/:examId/assign/:studentId', removeStudentFromMentorExam);
router.get('/exams/:examId/results', getMentorExamResults);

module.exports = router;
