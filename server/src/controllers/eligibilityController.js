import Scheme from '../models/Scheme.js';
import User from '../models/User.js';
import Document from '../models/Document.js';
import Application from '../models/Application.js';
import { evaluate } from '../services/rulesEngine.js';
import { recommendSchemesForUser } from '../services/recommendService.js';

/**
 * Public eligibility check endpoint (no login required)
 * Never outputs a bare verdict; shows exact criteria breakdown.
 */
export const checkEligibility = async (req, res, next) => {
  try {
    const { schemeId, schemeCode, category = 'ST', educationLevel, course, marksPercent, familyIncome, age, country } = req.body;

    let scheme;
    if (schemeId) {
      scheme = await Scheme.findById(schemeId);
    } else if (schemeCode) {
      scheme = await Scheme.findOne({ code: schemeCode.toUpperCase(), isActive: true });
    } else {
      scheme = await Scheme.findOne({ isActive: true });
    }

    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found.' });
    }

    const context = {
      category,
      educationLevel,
      course,
      marksPercent: Number(marksPercent),
      familyIncome: Number(familyIncome),
      age: Number(age),
      country
    };

    const evalResult = evaluate(scheme, context);

    // If ineligible, check and suggest other schemes that this profile DOES satisfy
    let alternativeSchemes = [];
    if (!evalResult.passed) {
      const allSchemes = await Scheme.find({ _id: { $ne: scheme._id }, isActive: true });
      for (const other of allSchemes) {
        const otherEval = evaluate(other, context);
        if (otherEval.passed) {
          alternativeSchemes.push({
            id: other._id,
            code: other.code,
            name: other.name,
            level: other.level,
            description: other.description
          });
        }
      }
    }

    const failedCount = evalResult.results.filter(r => !r.passed).length;
    const passedCount = evalResult.results.filter(r => r.passed).length;

    res.json({
      success: true,
      scheme: {
        id: scheme._id,
        code: scheme.code,
        name: scheme.name,
        level: scheme.level,
        description: scheme.description,
        totalSeats: scheme.totalSeats
      },
      isEligible: evalResult.passed,
      summary: evalResult.passed
        ? `Eligible for ${scheme.code}. All ${passedCount} criteria satisfied.`
        : `Not eligible for ${scheme.code}. ${failedCount} criterion/criteria not met.`,
      criteriaResults: evalResult.results,
      alternativeSchemes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logged-in applicant recommendation endpoint
 */
export const getRecommendations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Fetch any previously uploaded documents across user's applications
    const userApps = await Application.find({ applicantId: user._id });
    const appIds = userApps.map(a => a._id);
    const uploadedDocs = await Document.find({ applicationId: { $in: appIds } });
    const uploadedDocKeys = uploadedDocs.map(d => d.docKey);

    const recommendations = await recommendSchemesForUser(user.profile || {}, uploadedDocKeys);

    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    next(error);
  }
};
