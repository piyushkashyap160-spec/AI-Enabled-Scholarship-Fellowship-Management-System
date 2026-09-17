/**
 * Pure Data-Driven Rules Engine for SIH PS 26239
 * Zero hardcoded scheme-specific if statements.
 */

/**
 * Calculate age in years from Date of Birth
 */
export const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Resolve property value from nested context object
 */
export const resolveFieldValue = (context, fieldKey) => {
  if (!context || !fieldKey) return undefined;

  // 1. Direct key match
  if (context[fieldKey] !== undefined) return context[fieldKey];

  // 2. Computed keys
  if (fieldKey === 'age') {
    if (context.age !== undefined) return Number(context.age);
    if (context.dob) return calculateAge(context.dob);
    if (context.profile?.dob) return calculateAge(context.profile.dob);
    return undefined;
  }

  if (fieldKey === 'marksPercent') {
    if (context.marksPercent !== undefined) return Number(context.marksPercent);
    if (context.education?.marksPercent !== undefined) return Number(context.education.marksPercent);
    if (context.profile?.education?.marksPercent !== undefined) return Number(context.profile.education.marksPercent);
    if (context.formData?.marksPercent !== undefined) return Number(context.formData.marksPercent);
  }

  if (fieldKey === 'familyIncome') {
    if (context.familyIncome !== undefined) return Number(context.familyIncome);
    if (context.profile?.familyIncome !== undefined) return Number(context.profile.familyIncome);
    if (context.formData?.familyIncome !== undefined) return Number(context.formData.familyIncome);
  }

  if (fieldKey === 'category') {
    return context.category || context.profile?.category || context.formData?.category;
  }

  if (fieldKey === 'educationLevel') {
    return context.educationLevel || context.education?.level || context.profile?.education?.level || context.formData?.educationLevel;
  }

  if (fieldKey === 'country') {
    return context.country || context.formData?.country || context.formData?.studyCountry;
  }

  // 3. Dot notation resolution (e.g. "profile.education.marksPercent")
  const parts = fieldKey.split('.');
  let current = context;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  if (current !== undefined) return current;

  // 4. Check in profile or formData sub-objects
  if (context.profile && context.profile[fieldKey] !== undefined) return context.profile[fieldKey];
  if (context.formData && context.formData[fieldKey] !== undefined) return context.formData[fieldKey];

  return undefined;
};

/**
 * Apply comparison operator
 */
export const applyOperator = (operator, actual, expected) => {
  if (operator === 'exists') {
    return actual !== undefined && actual !== null && actual !== '';
  }

  if (actual === undefined || actual === null) {
    return false;
  }

  switch (operator) {
    case 'equals':
      if (typeof actual === 'string' && typeof expected === 'string') {
        return actual.trim().toLowerCase() === expected.trim().toLowerCase();
      }
      return actual == expected;

    case 'notEquals':
      if (typeof actual === 'string' && typeof expected === 'string') {
        return actual.trim().toLowerCase() !== expected.trim().toLowerCase();
      }
      return actual != expected;

    case 'gt':
      return Number(actual) > Number(expected);

    case 'gte':
      return Number(actual) >= Number(expected);

    case 'lt':
      return Number(actual) < Number(expected);

    case 'lte':
      return Number(actual) <= Number(expected);

    case 'in': {
      const list = Array.isArray(expected) ? expected : String(expected).split(',').map(s => s.trim());
      const normalizedActual = typeof actual === 'string' ? actual.toLowerCase().trim() : actual;
      return list.some(item => {
        const normalizedItem = typeof item === 'string' ? item.toLowerCase().trim() : item;
        return normalizedItem == normalizedActual;
      });
    }

    case 'notIn': {
      const list = Array.isArray(expected) ? expected : String(expected).split(',').map(s => s.trim());
      const normalizedActual = typeof actual === 'string' ? actual.toLowerCase().trim() : actual;
      return !list.some(item => {
        const normalizedItem = typeof item === 'string' ? item.toLowerCase().trim() : item;
        return normalizedItem == normalizedActual;
      });
    }

    case 'between': {
      if (!Array.isArray(expected) || expected.length < 2) return false;
      const [min, max] = expected;
      const num = Number(actual);
      return num >= Number(min) && num <= Number(max);
    }

    default:
      console.warn(`[RulesEngine Warning]: Unknown operator '${operator}'`);
      return false;
  }
};

/**
 * Evaluate scheme eligibility rules against a merged applicant context.
 *
 * @param {Object} scheme - Scheme object containing eligibilityRules
 * @param {Object} context - Merged profile, formData, and OCR extracted values
 * @returns {Object} { passed: Boolean, results: Array<{ field, operator, expected, actual, passed, message }> }
 */
export const evaluate = (scheme, context) => {
  if (!scheme || !scheme.eligibilityRules || !Array.isArray(scheme.eligibilityRules)) {
    return { passed: true, results: [] };
  }

  const results = [];
  let overallPassed = true;

  for (const rule of scheme.eligibilityRules) {
    const actualValue = resolveFieldValue(context, rule.field);
    const passed = applyOperator(rule.operator, actualValue, rule.value);

    if (!passed) {
      overallPassed = false;
    }

    results.push({
      field: rule.field,
      operator: rule.operator,
      expected: rule.value,
      actual: actualValue !== undefined ? actualValue : 'Not Provided',
      passed,
      message: rule.message
    });
  }

  return {
    passed: overallPassed,
    results
  };
};

/**
 * Test a set of rules (or modified scheme) against a collection of applications.
 * Used by the Admin Rule Builder to demonstrate live impact before saving.
 */
export const testRulesAgainstApplications = (rules, applications) => {
  let passedCount = 0;
  let failedCount = 0;
  const evaluationList = [];

  const tempScheme = { eligibilityRules: rules };

  for (const app of applications) {
    const applicant = app.applicantId || {};
    const mergedContext = {
      name: applicant.name,
      dob: applicant.profile?.dob,
      age: applicant.profile?.dob ? calculateAge(applicant.profile.dob) : undefined,
      gender: applicant.profile?.gender,
      category: applicant.profile?.category || 'ST',
      familyIncome: app.formData?.familyIncome || applicant.profile?.familyIncome,
      marksPercent: app.formData?.marksPercent || applicant.profile?.education?.marksPercent,
      educationLevel: app.formData?.educationLevel || applicant.profile?.education?.level,
      course: app.formData?.course || applicant.profile?.education?.course,
      university: app.formData?.university || applicant.profile?.education?.university,
      country: app.formData?.studyCountry || app.formData?.country,
      disability: applicant.profile?.disability,
      ...app.formData
    };

    const evalResult = evaluate(tempScheme, mergedContext);
    if (evalResult.passed) {
      passedCount++;
    } else {
      failedCount++;
    }

    evaluationList.push({
      applicationId: app._id,
      applicationNo: app.applicationNo,
      applicantName: applicant.name || 'Anonymous Applicant',
      passed: evalResult.passed,
      results: evalResult.results
    });
  }

  return {
    totalEvaluated: applications.length,
    passedCount,
    failedCount,
    passRate: applications.length > 0 ? Math.round((passedCount / applications.length) * 100) : 0,
    evaluations: evaluationList
  };
};
