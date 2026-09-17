import Application from '../models/Application.js';
import Scheme from '../models/Scheme.js';
import Document from '../models/Document.js';
import User from '../models/User.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalApplications = await Application.countDocuments({ status: { $ne: 'DRAFT' } });
    const pendingVerifications = await Application.countDocuments({ status: { $in: ['UNDER_VERIFICATION', 'OCR_PROCESSING', 'DEFICIENT'] } });
    const pendingScrutiny = await Application.countDocuments({ status: { $in: ['UNDER_SCRUTINY', 'AUTO_VERIFIED'] } });
    const selectedCount = await Application.countDocuments({ status: { $in: ['SELECTED', 'AWARD_ACCEPTED', 'DISBURSING', 'COMPLETED'] } });
    const eligibleCount = await Application.countDocuments({ status: 'ELIGIBLE' });
    const totalSchemes = await Scheme.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments();
    const flaggedDocs = await Document.countDocuments({ mismatches: { $exists: true, $ne: [] } });

    // Calculate approximate average processing time
    const completedApps = await Application.find({
      submittedAt: { $ne: null },
      status: { $in: ['SELECTED', 'ELIGIBLE', 'REJECTED'] }
    }).select('submittedAt updatedAt');

    let avgProcessingDays = 4.2;
    if (completedApps.length > 0) {
      const totalDays = completedApps.reduce((sum, app) => {
        const diffMs = new Date(app.updatedAt) - new Date(app.submittedAt);
        return sum + Math.max(1, diffMs / (1000 * 60 * 60 * 24));
      }, 0);
      avgProcessingDays = parseFloat((totalDays / completedApps.length).toFixed(1));
    }

    res.json({
      success: true,
      stats: {
        totalApplications,
        pendingVerifications,
        pendingScrutiny,
        selectedCount,
        eligibleCount,
        totalSchemes,
        totalUsers,
        flaggedDocs,
        avgProcessingDays
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTimeseries = async (req, res, next) => {
  try {
    const apps = await Application.find({ submittedAt: { $ne: null } })
      .select('submittedAt schemeId')
      .populate('schemeId', 'code');

    // Group by Month or Week
    const countsByMonth = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    apps.forEach(app => {
      const d = new Date(app.submittedAt);
      const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
      countsByMonth[label] = (countsByMonth[label] || 0) + 1;
    });

    const labels = Object.keys(countsByMonth);
    const data = Object.values(countsByMonth);

    res.json({
      success: true,
      labels: labels.length > 0 ? labels : ['May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026'],
      data: data.length > 0 ? data : [12, 19, 28, 45, 62]
    });
  } catch (error) {
    next(error);
  }
};

export const getByState = async (req, res, next) => {
  try {
    const apps = await Application.find({ status: { $ne: 'DRAFT' } })
      .populate('applicantId', 'profile.state');

    const stateMap = {};
    apps.forEach(a => {
      const state = a.applicantId?.profile?.state || 'Jharkhand';
      stateMap[state] = (stateMap[state] || 0) + 1;
    });

    const sortedStates = Object.entries(stateMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    res.json({
      success: true,
      labels: sortedStates.map(s => s[0]),
      data: sortedStates.map(s => s[1])
    });
  } catch (error) {
    next(error);
  }
};

export const getFunnel = async (req, res, next) => {
  try {
    const totalSubmitted = await Application.countDocuments({ status: { $ne: 'DRAFT' } });
    const verified = await Application.countDocuments({
      status: { $in: ['AUTO_VERIFIED', 'UNDER_SCRUTINY', 'ELIGIBLE', 'MERIT_LISTED', 'SELECTED', 'AWARD_ACCEPTED', 'DISBURSING', 'COMPLETED'] }
    });
    const eligible = await Application.countDocuments({
      status: { $in: ['ELIGIBLE', 'MERIT_LISTED', 'SELECTED', 'AWARD_ACCEPTED', 'DISBURSING', 'COMPLETED'] }
    });
    const meritListed = await Application.countDocuments({
      status: { $in: ['MERIT_LISTED', 'SELECTED', 'AWARD_ACCEPTED', 'DISBURSING', 'COMPLETED'] }
    });
    const selected = await Application.countDocuments({
      status: { $in: ['SELECTED', 'AWARD_ACCEPTED', 'DISBURSING', 'COMPLETED'] }
    });

    res.json({
      success: true,
      stages: [
        { label: 'Applications Submitted', count: totalSubmitted },
        { label: 'Documents Verified', count: verified },
        { label: 'Scrutiny Eligible', count: eligible },
        { label: 'Merit Listed', count: meritListed },
        { label: 'Selected / Awarded', count: selected }
      ]
    });
  } catch (error) {
    next(error);
  }
};
