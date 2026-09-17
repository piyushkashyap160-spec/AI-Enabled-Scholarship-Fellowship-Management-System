import Scheme from '../models/Scheme.js';
import { evaluate, calculateAge } from './rulesEngine.js';

/**
 * Recommend schemes for an applicant based on profile attributes and explain every criterion.
 * Never returns an opaque score.
 */
export const recommendSchemesForUser = async (userProfile, uploadedDocKeys = []) => {
  const schemes = await Scheme.find({ isActive: true });
  const recommendations = [];

  const age = userProfile.dob ? calculateAge(userProfile.dob) : (userProfile.age ? Number(userProfile.age) : null);

  const context = {
    ...userProfile,
    age,
    marksPercent: userProfile.marksPercent || userProfile.education?.marksPercent,
    educationLevel: userProfile.educationLevel || userProfile.education?.level,
    course: userProfile.course || userProfile.education?.course,
    university: userProfile.university || userProfile.education?.university,
    familyIncome: userProfile.familyIncome,
    category: userProfile.category || 'ST'
  };

  for (const scheme of schemes) {
    const evalResult = evaluate(scheme, context);
    const positiveReasons = [];
    const negativeReasons = [];
    const warnings = [];

    // Breakdown of eligibility rules
    for (const res of evalResult.results) {
      if (res.passed) {
        positiveReasons.push(`✓ ${res.message} (Your value: ${res.actual})`);
      } else {
        negativeReasons.push(`✗ ${res.message} (Your value: ${res.actual}, Required: ${JSON.stringify(res.expected)})`);
      }
    }

    // Check required documents availability
    if (scheme.requiredDocuments && scheme.requiredDocuments.length > 0) {
      for (const reqDoc of scheme.requiredDocuments) {
        if (!uploadedDocKeys.includes(reqDoc.key)) {
          warnings.push(`⚠ You will need to submit: ${reqDoc.label}`);
        }
      }
    }

    let matchStatus = 'not_eligible';
    let matchLabel = 'Not Eligible';
    let badgeVariant = 'danger';

    if (evalResult.passed) {
      if (warnings.length === 0) {
        matchStatus = 'strong_match';
        matchLabel = 'Strong Match';
        badgeVariant = 'success';
      } else {
        matchStatus = 'potential_match';
        matchLabel = 'Eligible (Documents Pending)';
        badgeVariant = 'warning';
      }
    }

    recommendations.push({
      schemeId: scheme._id,
      code: scheme.code,
      name: scheme.name,
      level: scheme.level,
      description: scheme.description,
      closeDate: scheme.closeDate,
      totalSeats: scheme.totalSeats,
      stipendAmountPerYear: scheme.stipendAmountPerYear,
      isEligible: evalResult.passed,
      matchStatus,
      matchLabel,
      badgeVariant,
      positiveReasons,
      negativeReasons,
      warnings,
      criteriaBreakdown: evalResult.results
    });
  }

  // Sort: Strong matches first, then potential matches, then ineligible
  recommendations.sort((a, b) => {
    const order = { strong_match: 1, potential_match: 2, not_eligible: 3 };
    return order[a.matchStatus] - order[b.matchStatus];
  });

  return recommendations;
};
