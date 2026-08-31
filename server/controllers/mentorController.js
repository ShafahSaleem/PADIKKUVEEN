const mongoose = require('mongoose');
const User = require('../models/User');
const Result = require('../models/Result');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Category = require('../models/Category');
const ExamAttempt = require('../models/ExamAttempt');

/**
 * @desc    Get dashboard statistics for the logged-in mentor
 * @route   GET /api/mentor/stats
 * @access  Private / Mentor
 */
const getMentorStats = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;

    // 1. Find all students assigned to this mentor
    const assignedStudents = await User.find({
      assignedMentor: mentorId,
      role: 'student',
    }).select('_id name email avatar status');

    const studentsCount = assignedStudents.length;
    const studentIds = assignedStudents.map((s) => s._id);

    // 2. Count mentor created exams & active exams
    const [totalExamsCreated, totalActiveExams] = await Promise.all([
      Exam.countDocuments({ createdBy: mentorId }),
      Exam.countDocuments({ createdBy: mentorId, isActive: true }),
    ]);

    if (studentIds.length === 0) {
      return res.status(200).json({
        studentsCount: 0,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        totalExamsCreated,
        totalActiveExams,
        topPerformers: [],
        studentsNeedingAttention: [],
      });
    }

    // 3. Fetch all results submitted by assigned students OR on mentor's created exams
    const mentorExams = await Exam.find({ createdBy: mentorId }).select('_id');
    const mentorExamIds = mentorExams.map((e) => e._id);

    const results = await Result.find({
      $or: [{ student: { $in: studentIds } }, { exam: { $in: mentorExamIds } }],
    })
      .populate('exam', 'title passingPercentage')
      .populate('student', 'name email avatar')
      .sort({ submittedAt: -1 });

    const totalAttempts = results.length;

    if (totalAttempts === 0) {
      return res.status(200).json({
        studentsCount,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        totalExamsCreated,
        totalActiveExams,
        topPerformers: [],
        studentsNeedingAttention: [],
      });
    }

    let totalPercentage = 0;
    let passedCount = 0;

    // Group results per student for top performers & attention calculations
    const studentResultsMap = {};
    studentIds.forEach((id) => {
      studentResultsMap[id.toString()] = [];
    });

    results.forEach((r) => {
      const percentage =
        typeof r.percentage === 'number'
          ? Math.round(r.percentage)
          : r.totalMarks > 0
          ? Math.round((r.score / r.totalMarks) * 100)
          : 0;

      const passingPct = r.exam?.passingPercentage ?? 50;
      const isPassed = percentage >= passingPct;

      totalPercentage += percentage;
      if (isPassed) passedCount += 1;

      const studentIdStr = r.student?._id ? r.student._id.toString() : r.student?.toString();
      if (studentResultsMap[studentIdStr]) {
        studentResultsMap[studentIdStr].push({
          percentage,
          isPassed,
          submittedAt: r.submittedAt || r.createdAt,
          examTitle: r.exam?.title || 'Exam',
        });
      }
    });

    const averageScore = Math.round(totalPercentage / totalAttempts);
    const passRate = Math.round((passedCount / totalAttempts) * 100);

    // 4. Compute Top Performers
    const performerList = [];
    assignedStudents.forEach((student) => {
      const sId = student._id.toString();
      const sResults = studentResultsMap[sId] || [];
      if (sResults.length > 0) {
        const studentAvg = Math.round(
          sResults.reduce((acc, curr) => acc + curr.percentage, 0) / sResults.length
        );
        const bestScore = Math.max(...sResults.map((item) => item.percentage));
        performerList.push({
          studentId: student._id,
          name: student.name,
          email: student.email,
          avatar: student.avatar,
          averageScore: studentAvg,
          bestScore,
          examsCount: sResults.length,
        });
      }
    });

    performerList.sort((a, b) => b.averageScore - a.averageScore);
    const topPerformers = performerList.slice(0, 5);

    // 5. Compute Students Needing Attention
    const studentsNeedingAttention = [];
    assignedStudents.forEach((student) => {
      const sId = student._id.toString();
      const sResults = studentResultsMap[sId] || [];

      if (sResults.length > 0) {
        const latestResult = sResults[0];
        const studentAvg = Math.round(
          sResults.reduce((acc, curr) => acc + curr.percentage, 0) / sResults.length
        );

        if (!latestResult.isPassed || studentAvg < 50) {
          studentsNeedingAttention.push({
            studentId: student._id,
            name: student.name,
            email: student.email,
            avatar: student.avatar,
            averageScore: studentAvg,
            lastExamPercentage: latestResult.percentage,
            reason: !latestResult.isPassed
              ? `Failed latest test: ${latestResult.examTitle} (${latestResult.percentage}%)`
              : `Low overall average (${studentAvg}%)`,
          });
        }
      }
    });

    return res.status(200).json({
      studentsCount,
      totalAttempts,
      averageScore,
      passRate,
      totalExamsCreated,
      totalActiveExams,
      topPerformers,
      studentsNeedingAttention,
    });
  } catch (error) {
    console.error('Error fetching mentor stats:', error);
    return res.status(500).json({
      message: 'Failed to fetch mentor statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all students assigned to the logged-in mentor with exam statistics
 * @route   GET /api/mentor/students
 * @access  Private / Mentor
 */
const getMentorStudents = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;
    const { search } = req.query;

    const query = { assignedMentor: mentorId, role: 'student' };
    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ name: reg }, { email: reg }];
    }

    const [students, mentorExams] = await Promise.all([
      User.find(query).select('name email avatar status createdAt').sort({ createdAt: -1 }),
      Exam.find({ createdBy: mentorId }).select('assignedStudents'),
    ]);

    const studentIds = students.map((s) => s._id);

    const results = await Result.find({ student: { $in: studentIds } })
      .populate('exam', 'title passingPercentage')
      .sort({ submittedAt: -1 });

    const studentMetricsMap = {};
    studentIds.forEach((id) => {
      studentMetricsMap[id.toString()] = {
        totalExamsTaken: 0,
        passedCount: 0,
        totalPercentage: 0,
        bestPercentage: 0,
        scores: [],
      };
    });

    results.forEach((r) => {
      const sId = r.student ? r.student.toString() : '';
      if (studentMetricsMap[sId]) {
        const percentage =
          typeof r.percentage === 'number'
            ? Math.round(r.percentage)
            : r.totalMarks > 0
            ? Math.round((r.score / r.totalMarks) * 100)
            : 0;

        const passingPct = r.exam?.passingPercentage ?? 50;
        const isPassed = percentage >= passingPct;

        studentMetricsMap[sId].totalExamsTaken += 1;
        if (isPassed) studentMetricsMap[sId].passedCount += 1;
        studentMetricsMap[sId].totalPercentage += percentage;
        studentMetricsMap[sId].scores.push(percentage);
        if (percentage > studentMetricsMap[sId].bestPercentage) {
          studentMetricsMap[sId].bestPercentage = percentage;
        }
      }
    });

    const studentsWithMetrics = students.map((student) => {
      const sId = student._id.toString();
      const metrics = studentMetricsMap[sId] || {
        totalExamsTaken: 0,
        passedCount: 0,
        totalPercentage: 0,
        bestPercentage: 0,
      };

      const examsAssigned = mentorExams.filter(
        (e) => Array.isArray(e.assignedStudents) && e.assignedStudents.some((id) => id.toString() === sId)
      ).length;

      const avgScore =
        metrics.totalExamsTaken > 0
          ? Math.round(metrics.totalPercentage / metrics.totalExamsTaken)
          : 0;

      return {
        _id: student._id,
        id: student._id,
        name: student.name,
        email: student.email,
        avatar: student.avatar || '',
        status: student.status || 'Active',
        joinedDate: student.createdAt,
        examsAssigned,
        totalExamsTaken: metrics.totalExamsTaken,
        passedCount: metrics.passedCount,
        averageScore: avgScore,
        bestPercentage: metrics.bestPercentage,
        performanceStatus:
          metrics.totalExamsTaken === 0
            ? 'No Tests'
            : avgScore >= 75
            ? 'Excellent'
            : avgScore >= 50
            ? 'Good'
            : 'Needs Attention',
      };
    });

    return res.status(200).json({ students: studentsWithMetrics });
  } catch (error) {
    console.error('Error fetching mentor students:', error);
    return res.status(500).json({
      message: 'Failed to fetch assigned students',
      error: error.message,
    });
  }
};

/**
 * @desc    Get exam results for assigned students & mentor's exams
 * @route   GET /api/mentor/results
 * @access  Private / Mentor
 */
const getMentorResults = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;
    const { category, search, status } = req.query;

    const assignedStudents = await User.find({
      assignedMentor: mentorId,
      role: 'student',
    }).select('_id');
    const studentIds = assignedStudents.map((s) => s._id);

    const mentorExams = await Exam.find({ createdBy: mentorId }).select('_id');
    const mentorExamIds = mentorExams.map((e) => e._id);

    const filter = {
      $or: [{ student: { $in: studentIds } }, { exam: { $in: mentorExamIds } }],
    };

    let results = await Result.find(filter)
      .populate('student', 'name email avatar')
      .populate({
        path: 'exam',
        select: 'title passingPercentage category totalMarks duration',
        populate: { path: 'category', select: 'name icon' },
      })
      .sort({ submittedAt: -1 });

    if (category && category !== 'all') {
      results = results.filter((r) => {
        const catId = r.exam?.category?._id?.toString() || r.exam?.category?.toString();
        return catId === category;
      });
    }

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      results = results.filter((r) => {
        const studentName = (r.student?.name || '').toLowerCase();
        const studentEmail = (r.student?.email || '').toLowerCase();
        const examTitle = (r.exam?.title || '').toLowerCase();
        return (
          studentName.includes(term) ||
          studentEmail.includes(term) ||
          examTitle.includes(term)
        );
      });
    }

    const formatted = results.map((r) => {
      const percentage =
        typeof r.percentage === 'number'
          ? Math.round(r.percentage)
          : r.totalMarks > 0
          ? Math.round((r.score / r.totalMarks) * 100)
          : 0;

      const passingPct = r.exam?.passingPercentage ?? 50;
      const isPassed = percentage >= passingPct;

      return {
        _id: r._id,
        id: r._id,
        student: {
          _id: r.student?._id || '',
          name: r.student?.name || 'Unknown Student',
          email: r.student?.email || '',
          avatar: r.student?.avatar || '',
        },
        exam: {
          _id: r.exam?._id || '',
          title: r.exam?.title || 'Unknown Exam',
          category: r.exam?.category?.name || 'General',
          categoryIcon: r.exam?.category?.icon || '📚',
          duration: r.exam?.duration || 0,
        },
        score: r.score,
        totalMarks: r.totalMarks,
        totalQuestions: r.totalQuestions,
        correctAnswers: r.correctAnswers,
        wrongAnswers: r.wrongAnswers,
        unanswered: r.unanswered,
        percentage,
        isPassed,
        submittedAt: r.submittedAt || r.createdAt,
      };
    });

    if (status && status !== 'all') {
      const isPassFilter = status === 'passed';
      return res.status(200).json({
        results: formatted.filter((item) => item.isPassed === isPassFilter),
      });
    }

    return res.status(200).json({ results: formatted });
  } catch (error) {
    console.error('Error fetching mentor results:', error);
    return res.status(500).json({
      message: 'Failed to fetch exam results',
      error: error.message,
    });
  }
};

/**
 * @desc    Get detailed performance metrics & history for a single assigned student
 * @route   GET /api/mentor/students/:studentId
 * @access  Private / Mentor
 */
const getMentorStudentDetails = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const student = await User.findById(studentId).select('-password');
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    // STRICT SECURITY: Must be assigned to this logged-in mentor
    if (student.assignedMentor?.toString() !== mentorId.toString()) {
      return res.status(403).json({
        message: 'Forbidden: You are not authorized to view this student',
      });
    }

    const results = await Result.find({ student: studentId })
      .populate({
        path: 'exam',
        select: 'title passingPercentage category duration totalMarks',
        populate: { path: 'category', select: 'name icon' },
      })
      .sort({ submittedAt: -1 });

    const totalExams = results.length;
    let totalScoreSum = 0;
    let passedExams = 0;
    let bestScore = 0;

    const categoryStats = {};

    const history = results.map((r) => {
      const percentage =
        typeof r.percentage === 'number'
          ? Math.round(r.percentage)
          : r.totalMarks > 0
          ? Math.round((r.score / r.totalMarks) * 100)
          : 0;

      const passingPct = r.exam?.passingPercentage ?? 50;
      const isPassed = percentage >= passingPct;

      totalScoreSum += percentage;
      if (isPassed) passedExams += 1;
      if (percentage > bestScore) bestScore = percentage;

      const catName = r.exam?.category?.name || 'General';
      if (!categoryStats[catName]) {
        categoryStats[catName] = {
          name: catName,
          icon: r.exam?.category?.icon || '📚',
          total: 0,
          passed: 0,
          percentages: [],
        };
      }
      categoryStats[catName].total += 1;
      if (isPassed) categoryStats[catName].passed += 1;
      categoryStats[catName].percentages.push(percentage);

      return {
        _id: r._id,
        examTitle: r.exam?.title || 'Exam',
        category: catName,
        categoryIcon: r.exam?.category?.icon || '📚',
        score: r.score,
        totalMarks: r.totalMarks,
        correctAnswers: r.correctAnswers,
        wrongAnswers: r.wrongAnswers,
        unanswered: r.unanswered,
        percentage,
        isPassed,
        submittedAt: r.submittedAt || r.createdAt,
      };
    });

    const averageScore = totalExams > 0 ? Math.round(totalScoreSum / totalExams) : 0;

    const categoryPerformance = Object.values(categoryStats).map((cat) => ({
      category: cat.name,
      icon: cat.icon,
      examsAttempted: cat.total,
      examsPassed: cat.passed,
      averageScore: Math.round(
        cat.percentages.reduce((a, b) => a + b, 0) / cat.percentages.length
      ),
    }));

    return res.status(200).json({
      student: {
        _id: student._id,
        id: student._id,
        name: student.name,
        email: student.email,
        avatar: student.avatar || '',
        status: student.status,
        createdAt: student.createdAt,
      },
      summary: {
        totalExams,
        passedExams,
        averageScore,
        bestScore,
        passRate: totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0,
      },
      categoryPerformance,
      history,
    });
  } catch (error) {
    console.error('Error fetching mentor student details:', error);
    return res.status(500).json({
      message: 'Failed to fetch student details',
      error: error.message,
    });
  }
};

// ==========================================
// MENTOR EXAM MANAGEMENT CONTROLLERS
// ==========================================

/**
 * @desc    Get all exams created by the logged-in mentor
 * @route   GET /api/mentor/exams
 * @access  Private / Mentor
 */
const getMentorExams = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;

    const exams = await Exam.find({ createdBy: mentorId })
      .populate('category', 'name icon')
      .populate('assignedStudents', 'name email avatar')
      .sort({ createdAt: -1 });

    const examIds = exams.map((e) => e._id);

    // Aggregate question counts
    const questionCounts = await Question.aggregate([
      { $match: { exam: { $in: examIds } } },
      { $group: { _id: '$exam', count: { $sum: 1 } } },
    ]);
    const questionCountMap = {};
    questionCounts.forEach((qc) => {
      questionCountMap[qc._id.toString()] = qc.count;
    });

    // Aggregate attempts count
    const attemptCounts = await Result.aggregate([
      { $match: { exam: { $in: examIds } } },
      { $group: { _id: '$exam', count: { $sum: 1 } } },
    ]);
    const attemptCountMap = {};
    attemptCounts.forEach((ac) => {
      attemptCountMap[ac._id.toString()] = ac.count;
    });

    const examsWithDetails = exams.map((exam) => {
      const eId = exam._id.toString();
      const examObj = exam.toObject ? exam.toObject() : exam;
      return {
        ...examObj,
        questionCount: questionCountMap[eId] || 0,
        totalQuestions: questionCountMap[eId] || 0,
        assignedStudentsCount: Array.isArray(exam.assignedStudents) ? exam.assignedStudents.length : 0,
        totalAttempts: attemptCountMap[eId] || 0,
      };
    });

    return res.status(200).json({ exams: examsWithDetails });
  } catch (error) {
    console.error('Error fetching mentor exams:', error);
    return res.status(500).json({
      message: 'Failed to fetch mentor exams',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new exam by mentor
 * @route   POST /api/mentor/exams
 * @access  Private / Mentor
 */
const createMentorExam = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;
    const { title, description, duration, totalMarks, category, passingPercentage, numberOfQuestions, isActive } =
      req.body;

    if (!title || !duration || !totalMarks) {
      return res.status(400).json({ message: 'Title, duration, and totalMarks are required' });
    }

    const examData = {
      title: title.trim(),
      description: description ? description.trim() : '',
      duration: Number(duration),
      totalMarks: Number(totalMarks),
      passingPercentage: typeof passingPercentage === 'number' ? passingPercentage : 50,
      numberOfQuestions: typeof numberOfQuestions === 'number' && numberOfQuestions > 0 ? numberOfQuestions : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: mentorId,
      assignedStudents: [],
    };

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      examData.category = category;
    }

    const exam = await Exam.create(examData);
    const populated = await Exam.findById(exam._id).populate('category', 'name icon');

    return res.status(201).json({
      message: 'Exam created successfully',
      exam: {
        ...populated.toObject(),
        questionCount: 0,
        assignedStudentsCount: 0,
      },
    });
  } catch (error) {
    console.error('Error creating mentor exam:', error);
    return res.status(500).json({
      message: 'Failed to create exam',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single mentor exam by ID
 * @route   GET /api/mentor/exams/:examId
 * @access  Private / Mentor
 */
const getMentorExamById = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID' });
    }

    const exam = await Exam.findById(examId)
      .populate('category', 'name icon')
      .populate('assignedStudents', 'name email avatar');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // STRICT OWNERSHIP CHECK
    if (exam.createdBy.toString() !== mentorId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this exam' });
    }

    const questionCount = await Question.countDocuments({ exam: examId });
    const attemptsCount = await Result.countDocuments({ exam: examId });

    return res.status(200).json({
      exam: {
        ...exam.toObject(),
        questionCount,
        totalQuestions: questionCount,
        totalAttempts: attemptsCount,
      },
    });
  } catch (error) {
    console.error('Error fetching mentor exam details:', error);
    return res.status(500).json({
      message: 'Failed to fetch exam details',
      error: error.message,
    });
  }
};

/**
 * @desc    Update mentor exam
 * @route   PUT /api/mentor/exams/:examId
 * @access  Private / Mentor
 */
const updateMentorExam = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // STRICT OWNERSHIP CHECK
    if (exam.createdBy.toString() !== mentorId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this exam' });
    }

    const updates = req.body;
    const allowed = [
      'title',
      'description',
      'duration',
      'totalMarks',
      'passingPercentage',
      'numberOfQuestions',
      'category',
      'isActive',
    ];

    allowed.forEach((field) => {
      if (field in updates) {
        if (field === 'category') {
          exam.category = updates.category && mongoose.Types.ObjectId.isValid(updates.category) ? updates.category : null;
        } else if (field === 'numberOfQuestions') {
          exam.numberOfQuestions =
            typeof updates.numberOfQuestions === 'number' && updates.numberOfQuestions > 0
              ? updates.numberOfQuestions
              : null;
        } else {
          exam[field] = updates[field];
        }
      }
    });

    await exam.save();
    const updated = await Exam.findById(examId)
      .populate('category', 'name icon')
      .populate('assignedStudents', 'name email avatar');

    const questionCount = await Question.countDocuments({ exam: examId });

    return res.status(200).json({
      message: 'Exam updated successfully',
      exam: {
        ...updated.toObject(),
        questionCount,
      },
    });
  } catch (error) {
    console.error('Error updating mentor exam:', error);
    return res.status(500).json({
      message: 'Failed to update exam',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete mentor exam
 * @route   DELETE /api/mentor/exams/:examId
 * @access  Private / Mentor
 */
const deleteMentorExam = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // STRICT OWNERSHIP CHECK
    if (exam.createdBy.toString() !== mentorId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this exam' });
    }

    await Promise.all([
      Exam.findByIdAndDelete(examId),
      Question.deleteMany({ exam: examId }),
      ExamAttempt.deleteMany({ exam: examId }),
    ]);

    return res.status(200).json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting mentor exam:', error);
    return res.status(500).json({
      message: 'Failed to delete exam',
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle mentor exam active status
 * @route   PATCH /api/mentor/exams/:examId/status
 * @access  Private / Mentor
 */
const toggleMentorExamStatus = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // STRICT OWNERSHIP CHECK
    if (exam.createdBy.toString() !== mentorId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this exam' });
    }

    exam.isActive = !exam.isActive;
    await exam.save();

    return res.status(200).json({
      message: `Exam ${exam.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: exam.isActive,
      exam,
    });
  } catch (error) {
    console.error('Error toggling mentor exam status:', error);
    return res.status(500).json({
      message: 'Failed to toggle exam status',
      error: error.message,
    });
  }
};

// ==========================================
// MENTOR QUESTION MANAGEMENT CONTROLLERS
// ==========================================

/**
 * @desc    Get all questions for a mentor's exam
 * @route   GET /api/mentor/exams/:examId/questions
 * @access  Private / Mentor
 */
const getMentorExamQuestions = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // STRICT OWNERSHIP CHECK
    if (exam.createdBy.toString() !== mentorId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this exam' });
    }

    const questions = await Question.find({ exam: examId }).sort({ createdAt: 1 });
    return res.status(200).json({ questions });
  } catch (error) {
    console.error('Error fetching mentor exam questions:', error);
    return res.status(500).json({
      message: 'Failed to fetch exam questions',
      error: error.message,
    });
  }
};

/**
 * @desc    Add a question to a mentor's exam
 * @route   POST /api/mentor/exams/:examId/questions
 * @access  Private / Mentor
 */
const createMentorExamQuestion = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;
    const { examId } = req.params;
    const { questionText, options, correctAnswer, marks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // STRICT OWNERSHIP CHECK
    if (exam.createdBy.toString() !== mentorId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this exam' });
    }

    if (!questionText || !options || !correctAnswer) {
      return res.status(400).json({ message: 'questionText, options, and correctAnswer are required' });
    }
    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ message: 'Exactly 4 options are required' });
    }

    const question = await Question.create({
      exam: examId,
      questionText: questionText.trim(),
      options: options.map((opt) => String(opt).trim()),
      correctAnswer: String(correctAnswer).trim(),
      marks: typeof marks === 'number' && marks > 0 ? marks : 1,
    });

    return res.status(201).json({
      message: 'Question added successfully',
      question,
    });
  } catch (error) {
    console.error('Error creating mentor exam question:', error);
    return res.status(500).json({
      message: 'Failed to create question',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a question in a mentor's exam
 * @route   PUT /api/mentor/exams/:examId/questions/:questionId
 * @access  Private / Mentor
 */
const updateMentorExamQuestion = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;
    const { examId, questionId } = req.params;
    const { questionText, options, correctAnswer, marks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(examId) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: 'Invalid exam or question ID' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // STRICT OWNERSHIP CHECK
    if (exam.createdBy.toString() !== mentorId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this exam' });
    }

    const question = await Question.findOne({ _id: questionId, exam: examId });
    if (!question) {
      return res.status(404).json({ message: 'Question not found in this exam' });
    }

    if (questionText) question.questionText = questionText.trim();
    if (Array.isArray(options) && options.length === 4) {
      question.options = options.map((opt) => String(opt).trim());
    }
    if (correctAnswer !== undefined) question.correctAnswer = String(correctAnswer).trim();
    if (typeof marks === 'number' && marks > 0) question.marks = marks;

    await question.save();

    return res.status(200).json({
      message: 'Question updated successfully',
      question,
    });
  } catch (error) {
    console.error('Error updating mentor question:', error);
    return res.status(500).json({
      message: 'Failed to update question',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a question from a mentor's exam
 * @route   DELETE /api/mentor/exams/:examId/questions/:questionId
 * @access  Private / Mentor
 */
const deleteMentorExamQuestion = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;
    const { examId, questionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: 'Invalid exam or question ID' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // STRICT OWNERSHIP CHECK
    if (exam.createdBy.toString() !== mentorId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this exam' });
    }

    const deleted = await Question.findOneAndDelete({ _id: questionId, exam: examId });
    if (!deleted) {
      return res.status(404).json({ message: 'Question not found' });
    }

    return res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting mentor question:', error);
    return res.status(500).json({
      message: 'Failed to delete question',
      error: error.message,
    });
  }
};

// ==========================================
// MENTOR STUDENT ASSIGNMENT CONTROLLERS
// ==========================================

/**
 * @desc    Get mentor's assigned students showing which ones are assigned to this exam
 * @route   GET /api/mentor/exams/:examId/students
 * @access  Private / Mentor
 */
const getMentorExamStudents = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // STRICT OWNERSHIP CHECK
    if (exam.createdBy.toString() !== mentorId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this exam' });
    }

    // Fetch all students assigned to this mentor
    const myStudents = await User.find({
      assignedMentor: mentorId,
      role: 'student',
    }).select('name email avatar status createdAt');

    const assignedSet = new Set(
      (exam.assignedStudents || []).map((id) => id.toString())
    );

    const students = myStudents.map((s) => ({
      _id: s._id,
      id: s._id,
      name: s.name,
      email: s.email,
      avatar: s.avatar || '',
      status: s.status,
      isAssigned: assignedSet.has(s._id.toString()),
    }));

    return res.status(200).json({
      exam: {
        _id: exam._id,
        title: exam.title,
        assignedCount: exam.assignedStudents?.length || 0,
      },
      students,
    });
  } catch (error) {
    console.error('Error fetching mentor exam students:', error);
    return res.status(500).json({
      message: 'Failed to fetch students for exam',
      error: error.message,
    });
  }
};

/**
 * @desc    Assign students to a mentor's exam (Strict: only mentor's assigned students)
 * @route   POST /api/mentor/exams/:examId/assign
 * @access  Private / Mentor
 */
const assignStudentsToMentorExam = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;
    const { examId } = req.params;
    const { studentIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // STRICT OWNERSHIP CHECK
    if (exam.createdBy.toString() !== mentorId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this exam' });
    }

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'studentIds must be an array of IDs' });
    }

    // STRICT CROSS-MENTOR VALIDATION: Verify every student in studentIds belongs to this mentor
    if (studentIds.length > 0) {
      const validStudents = await User.find({
        _id: { $in: studentIds },
        assignedMentor: mentorId,
        role: 'student',
      }).select('_id');

      if (validStudents.length !== studentIds.length) {
        return res.status(403).json({
          message: 'Forbidden: You can only assign students who are assigned to your mentorship',
        });
      }
    }

    exam.assignedStudents = studentIds;
    await exam.save();

    // Dispatch notification to newly assigned students
    try {
      const { createSystemNotification } = require('./notificationController');
      if (studentIds.length > 0) {
        await createSystemNotification({
          userIds: studentIds,
          title: '📝 New Exam Assigned by Mentor',
          message: `Your mentor assigned you the exam: "${exam.title}".`,
          type: 'exam',
          link: '/student-dashboard',
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify assigned students:', notifErr);
    }

    return res.status(200).json({
      message: 'Students assigned to exam successfully',
      assignedCount: exam.assignedStudents.length,
      assignedStudents: exam.assignedStudents,
    });
  } catch (error) {
    console.error('Error assigning students to mentor exam:', error);
    return res.status(500).json({
      message: 'Failed to assign students to exam',
      error: error.message,
    });
  }
};

/**
 * @desc    Remove a student from a mentor's exam
 * @route   DELETE /api/mentor/exams/:examId/assign/:studentId
 * @access  Private / Mentor
 */
const removeStudentFromMentorExam = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;
    const { examId, studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid exam or student ID' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // STRICT OWNERSHIP CHECK
    if (exam.createdBy.toString() !== mentorId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this exam' });
    }

    exam.assignedStudents = (exam.assignedStudents || []).filter(
      (id) => id.toString() !== studentId.toString()
    );
    await exam.save();

    return res.status(200).json({
      message: 'Student unassigned from exam successfully',
      assignedCount: exam.assignedStudents.length,
    });
  } catch (error) {
    console.error('Error removing student from exam:', error);
    return res.status(500).json({
      message: 'Failed to remove student from exam',
      error: error.message,
    });
  }
};

/**
 * @desc    Get results for a specific mentor exam
 * @route   GET /api/mentor/exams/:examId/results
 * @access  Private / Mentor
 */
const getMentorExamResults = async (req, res) => {
  try {
    const mentorId = req.user?.id || req.user?._id;
    const { examId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid exam ID' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // STRICT OWNERSHIP CHECK
    if (exam.createdBy.toString() !== mentorId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You do not own this exam' });
    }

    const results = await Result.find({ exam: examId })
      .populate('student', 'name email avatar')
      .sort({ submittedAt: -1 });

    const formatted = results.map((r) => {
      const percentage =
        typeof r.percentage === 'number'
          ? Math.round(r.percentage)
          : r.totalMarks > 0
          ? Math.round((r.score / r.totalMarks) * 100)
          : 0;

      const passingPct = exam.passingPercentage ?? 50;
      const isPassed = percentage >= passingPct;

      return {
        _id: r._id,
        id: r._id,
        student: {
          _id: r.student?._id || '',
          name: r.student?.name || 'Unknown',
          email: r.student?.email || '',
          avatar: r.student?.avatar || '',
        },
        score: r.score,
        totalMarks: r.totalMarks,
        totalQuestions: r.totalQuestions,
        correctAnswers: r.correctAnswers,
        wrongAnswers: r.wrongAnswers,
        unanswered: r.unanswered,
        percentage,
        isPassed,
        submittedAt: r.submittedAt || r.createdAt,
      };
    });

    return res.status(200).json({
      examTitle: exam.title,
      results: formatted,
    });
  } catch (error) {
    console.error('Error fetching mentor exam results:', error);
    return res.status(500).json({
      message: 'Failed to fetch exam results',
      error: error.message,
    });
  }
};

module.exports = {
  getMentorStats,
  getMentorStudents,
  getMentorResults,
  getMentorStudentDetails,
  // Mentor Exam Endpoints
  getMentorExams,
  createMentorExam,
  getMentorExamById,
  updateMentorExam,
  deleteMentorExam,
  toggleMentorExamStatus,
  // Mentor Question Endpoints
  getMentorExamQuestions,
  createMentorExamQuestion,
  updateMentorExamQuestion,
  deleteMentorExamQuestion,
  // Mentor Student Assignment Endpoints
  getMentorExamStudents,
  assignStudentsToMentorExam,
  removeStudentFromMentorExam,
  getMentorExamResults,
};
