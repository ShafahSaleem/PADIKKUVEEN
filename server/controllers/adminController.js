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

module.exports = {
  getAdminStats,
  getAllUsers,
  deleteUser,
  getRecentActivity,
};
