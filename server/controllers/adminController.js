const User = require('../models/User');
const Exam = require('../models/Exam');
const Result = require('../models/Result');

/**
 * @desc    Get real-time statistics for admin dashboard
 * @route   GET /api/admin/stats
 * @access  Private / Admin
 */
const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalStudents, totalExams, totalAttempts] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      Exam.countDocuments(),
      Result.countDocuments(),
    ]);

    return res.status(200).json({
      totalUsers,
      totalStudents,
      totalExams,
      totalAttempts,
    });
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    return res.status(500).json({
      message: 'Failed to fetch admin statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all registered users from MongoDB
 * @route   GET /api/admin/users
 * @access  Private / Admin
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    return res.status(200).json({
      users,
    });
  } catch (error) {
    console.error('Error fetching registered users:', error);
    return res.status(500).json({
      message: 'Failed to fetch registered users',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a user by ID
 * @route   DELETE /api/admin/users/:id
 * @access  Private / Admin
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentAdminId = req.user?.id || req.user?._id?.toString();

    // Prevent admin from deleting themselves
    if (currentAdminId && currentAdminId === id.toString()) {
      return res.status(400).json({
        message: 'You cannot delete your own admin account.',
      });
    }

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `User ${userToDelete.name} (${userToDelete.email}) deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      message: 'Failed to delete user',
      error: error.message,
    });
  }
};

/**
 * @desc    Get recent platform activities from MongoDB (registrations, exams created, submissions)
 * @route   GET /api/admin/recent-activity
 * @access  Private / Admin
 */
const getRecentActivity = async (req, res) => {
  try {
    const [recentUsers, recentExams, recentResults] = await Promise.all([
      User.find().select('name role createdAt').sort({ createdAt: -1 }).limit(10).lean(),
      Exam.find().select('title passingPercentage createdAt').sort({ createdAt: -1 }).limit(10).lean(),
      Result.find()
        .populate('student', 'name email')
        .populate('exam', 'title passingPercentage')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const activities = [];

    // 1. User registrations
    recentUsers.forEach((user) => {
      if (user.createdAt) {
        activities.push({
          id: `user-${user._id}`,
          type: 'registration',
          message: `${user.name || 'A user'} registered`,
          actor: user.name,
          role: user.role,
          createdAt: user.createdAt,
        });
      }
    });

    // 2. Exams created
    recentExams.forEach((exam) => {
      if (exam.createdAt) {
        activities.push({
          id: `exam-${exam._id}`,
          type: 'exam_created',
          message: `New exam "${exam.title || 'Untitled Exam'}" created`,
          title: exam.title,
          createdAt: exam.createdAt,
        });
      }
    });

    // 3. Exam submissions / completions
    recentResults.forEach((result) => {
      const studentName = result.student?.name || 'A student';
      const examTitle = result.exam?.title || 'an exam';
      const date = result.submittedAt || result.createdAt;

      if (date) {
        activities.push({
          id: `result-${result._id}`,
          type: 'submission',
          message: `${studentName} submitted ${examTitle}`,
          studentName,
          examTitle,
          score: result.score,
          totalMarks: result.totalMarks,
          percentage: result.percentage,
          createdAt: date,
        });
      }
    });

    // Sort all activities descending by newest first
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limit to latest 10
    const latestActivities = activities.slice(0, 10);

    return res.status(200).json({
      activities: latestActivities,
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return res.status(500).json({
      message: 'Failed to fetch recent activity',
      error: error.message,
    });
  }
};

const bcrypt = require('bcryptjs');

/**
 * @desc    Get all mentors and their assigned students
 * @route   GET /api/admin/mentors
 * @access  Private / Admin
 */
const getMentors = async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const mentorIds = mentors.map((m) => m._id);

    // Find all assigned students for each mentor
    const assignedStudents = await User.find({
      role: 'student',
      assignedMentor: { $in: mentorIds },
    })
      .select('_id name email avatar status assignedMentor')
      .lean();

    const studentsByMentor = {};
    assignedStudents.forEach((student) => {
      const mId = student.assignedMentor?.toString();
      if (mId) {
        if (!studentsByMentor[mId]) studentsByMentor[mId] = [];
        studentsByMentor[mId].push({
          _id: student._id,
          id: student._id,
          name: student.name,
          email: student.email,
          avatar: student.avatar || '',
          status: student.status,
        });
      }
    });

    const enrichedMentors = mentors.map((mentor) => {
      const sList = studentsByMentor[mentor._id.toString()] || [];
      return {
        ...mentor,
        assignedStudentsCount: sList.length,
        assignedStudents: sList,
      };
    });

    return res.status(200).json({
      mentors: enrichedMentors,
    });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return res.status(500).json({
      message: 'Failed to fetch mentors',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all students with their assigned mentor and list of all available mentors
 * @route   GET /api/admin/mentor-assignments
 * @access  Private / Admin
 */
const getMentorAssignments = async (req, res) => {
  try {
    const [mentors, students] = await Promise.all([
      User.find({ role: 'mentor' }).select('_id name email avatar').sort({ name: 1 }),
      User.find({ role: 'student' })
        .select('_id name email avatar status assignedMentor')
        .populate('assignedMentor', 'name email avatar')
        .sort({ name: 1 }),
    ]);

    return res.status(200).json({
      mentors,
      students,
    });
  } catch (error) {
    console.error('Error fetching mentor assignments data:', error);
    return res.status(500).json({
      message: 'Failed to fetch mentor assignments data',
      error: error.message,
    });
  }
};

/**
 * @desc    Assign or re-assign a student to a mentor
 * @route   PUT /api/admin/students/:studentId/mentor
 * @access  Private / Admin
 */
const assignStudentMentor = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { mentorId } = req.body;

    if (!mentorId) {
      return res.status(400).json({ message: 'Mentor ID is required' });
    }

    const [student, mentor] = await Promise.all([
      User.findOne({ _id: studentId, role: 'student' }),
      User.findOne({ _id: mentorId, role: 'mentor' }),
    ]);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found or user is not a mentor' });
    }

    student.assignedMentor = mentor._id;
    await student.save();

    return res.status(200).json({
      success: true,
      message: `Student ${student.name} successfully assigned to mentor ${mentor.name}`,
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        assignedMentor: {
          _id: mentor._id,
          name: mentor.name,
          email: mentor.email,
        },
      },
    });
  } catch (error) {
    console.error('Error assigning mentor:', error);
    return res.status(500).json({
      message: 'Failed to assign mentor',
      error: error.message,
    });
  }
};

/**
 * @desc    Remove mentor assignment from a student
 * @route   DELETE /api/admin/students/:studentId/mentor
 * @access  Private / Admin
 */
const removeStudentMentor = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.assignedMentor = null;
    await student.save();

    return res.status(200).json({
      success: true,
      message: `Mentor assignment removed for student ${student.name}`,
    });
  } catch (error) {
    console.error('Error removing mentor assignment:', error);
    return res.status(500).json({
      message: 'Failed to remove mentor assignment',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new mentor account directly by Admin
 * @route   POST /api/admin/mentors
 * @access  Private / Admin
 */
const createMentor = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newMentor = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'mentor',
      status: 'active',
    });

    return res.status(201).json({
      success: true,
      message: `Mentor ${newMentor.name} created successfully`,
      mentor: {
        _id: newMentor._id,
        id: newMentor._id,
        name: newMentor.name,
        email: newMentor.email,
        role: newMentor.role,
        status: newMentor.status,
        createdAt: newMentor.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating mentor account:', error);
    return res.status(500).json({
      message: 'Failed to create mentor account',
      error: error.message,
    });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  deleteUser,
  getRecentActivity,
  getMentors,
  getMentorAssignments,
  assignStudentMentor,
  removeStudentMentor,
  createMentor,
};
