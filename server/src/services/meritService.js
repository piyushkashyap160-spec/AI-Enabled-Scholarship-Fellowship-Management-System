import Scheme from '../models/Scheme.js';
import Application from '../models/Application.js';
import User from '../models/User.js';

/**
 * Compute normalized merit score and detailed breakdown for an application
 */
export const calculateApplicationMeritScore = (application, scheme) => {
  const weights = scheme.meritWeights || { marksPercent: 0.5, entranceScore: 0.3, interviewScore: 0.2 };
  const applicant = application.applicantId;
  const formData = application.formData || {};
  const profile = applicant?.profile || {};

  // Extract raw values
  const marks = Number(formData.marksPercent || profile.education?.marksPercent || 0);
  const entranceScore = Number(formData.entranceScore || formData.gateScore || formData.greScore || formData.ugcNetScore || 75);
  const interviewScore = Number(formData.interviewScore || 80);
  const researchScore = Number(formData.researchPapersPublished ? Math.min(formData.researchPapersPublished * 20, 100) : 70);

  // Normalize scores to 0 - 100
  const normMarks = Math.max(0, Math.min(100, marks));
  const normEntrance = Math.max(0, Math.min(100, entranceScore));
  const normInterview = Math.max(0, Math.min(100, interviewScore));
  const normResearch = Math.max(0, Math.min(100, researchScore));

  const breakdown = {};
  let totalScore = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const w = Number(weight) || 0;
    totalWeight += w;
    let compValue = 0;
    let label = key;

    if (key === 'marksPercent') {
      compValue = normMarks;
      label = 'Academic Marks';
    } else if (key === 'entranceScore' || key === 'gateScore' || key === 'ugcNetScore') {
      compValue = normEntrance;
      label = 'Entrance / Qualifying Exam';
    } else if (key === 'interviewScore') {
      compValue = normInterview;
      label = 'Interview & Presentation';
    } else if (key === 'researchExperience' || key === 'publications') {
      compValue = normResearch;
      label = 'Research & Publications';
    } else {
      compValue = Number(formData[key] || 70);
      label = key.replace(/_/g, ' ');
    }

    const weightedPoints = parseFloat((compValue * w).toFixed(2));
    totalScore += weightedPoints;

    breakdown[key] = {
      label,
      rawScore: compValue,
      weight: w,
      weightedScore: weightedPoints
    };
  }

  // If weights don't sum to 1.0, scale to 100
  if (totalWeight > 0 && Math.abs(totalWeight - 1.0) > 0.01) {
    totalScore = (totalScore / totalWeight);
  }

  return {
    meritScore: parseFloat(totalScore.toFixed(2)),
    meritBreakdown: breakdown
  };
};

/**
 * Generate full provisional and waiting merit lists for a scheme with horizontal reservation quotas.
 */
export const generateSchemeMeritList = async (schemeId) => {
  const scheme = await Scheme.findById(schemeId);
  if (!scheme) throw new Error('Scheme not found');

  // Fetch all eligible applications for this scheme
  const eligibleApps = await Application.find({
    schemeId,
    status: { $in: ['ELIGIBLE', 'UNDER_SCRUTINY', 'MERIT_LISTED', 'SELECTED', 'WAITLISTED'] }
  }).populate('applicantId');

  if (eligibleApps.length === 0) {
    return {
      scheme,
      totalEligible: 0,
      totalSeats: scheme.totalSeats,
      provisionalList: [],
      waitingList: [],
      unallocatedList: []
    };
  }

  // Calculate scores for all
  const scoredApps = eligibleApps.map(app => {
    const { meritScore, meritBreakdown } = calculateApplicationMeritScore(app, scheme);
    const applicant = app.applicantId;
    const isFemale = applicant?.profile?.gender === 'female';
    const isDisability = Boolean(applicant?.profile?.disability);
    const isPvtg = Boolean(applicant?.profile?.pvtg || app.formData?.isPvtg);

    return {
      application: app,
      applicantId: applicant?._id,
      applicantName: applicant?.name || 'Applicant',
      gender: applicant?.profile?.gender || 'male',
      isFemale,
      isDisability,
      isPvtg,
      state: applicant?.profile?.state || 'Unknown',
      meritScore,
      meritBreakdown,
      currentStatus: app.status
    };
  });

  // Sort strictly by meritScore descending
  scoredApps.sort((a, b) => b.meritScore - a.meritScore);

  // Assign overall merit ranks
  scoredApps.forEach((item, index) => {
    item.meritRank = index + 1;
  });

  const totalSeats = scheme.totalSeats || 50;
  const quotas = scheme.reservationQuota || { female: 0.30, disability: 0.04, pvtg: 0.05 };

  const femaleSeatsRequired = Math.floor(totalSeats * (quotas.female || 0.30));
  const pwdSeatsRequired = Math.floor(totalSeats * (quotas.disability || 0.04));
  const pvtgSeatsRequired = Math.floor(totalSeats * (quotas.pvtg || 0.05));

  const selectedSet = new Set();
  const provisionalList = [];

  // 1. First Pass: Pure merit selection up to general capacity
  for (const item of scoredApps) {
    if (provisionalList.length < totalSeats) {
      provisionalList.push({ ...item, selectionCategory: 'Open Merit' });
      selectedSet.add(item.application._id.toString());
    }
  }

  // 2. Second Pass: Verify Horizontal Quotas (Female, PwD, PVTG)
  const currentFemaleCount = provisionalList.filter(i => i.isFemale).length;
  const currentPwdCount = provisionalList.filter(i => i.isDisability).length;
  const currentPvtgCount = provisionalList.filter(i => i.isPvtg).length;

  // Female quota adjustment
  if (currentFemaleCount < femaleSeatsRequired) {
    const needed = femaleSeatsRequired - currentFemaleCount;
    const unselectedFemales = scoredApps.filter(i => !selectedSet.has(i.application._id.toString()) && i.isFemale);
    for (let i = 0; i < Math.min(needed, unselectedFemales.length); i++) {
      const candidate = unselectedFemales[i];
      // Replace the lowest scoring open merit non-protected candidate if total seats reached
      if (provisionalList.length >= totalSeats) {
        for (let j = provisionalList.length - 1; j >= 0; j--) {
          if (!provisionalList[j].isFemale && !provisionalList[j].isDisability && !provisionalList[j].isPvtg) {
            const removed = provisionalList.splice(j, 1)[0];
            selectedSet.delete(removed.application._id.toString());
            break;
          }
        }
      }
      provisionalList.push({ ...candidate, selectionCategory: 'Horizontal Quota (Female)' });
      selectedSet.add(candidate.application._id.toString());
    }
  }

  // PwD quota adjustment
  if (currentPwdCount < pwdSeatsRequired) {
    const needed = pwdSeatsRequired - currentPwdCount;
    const unselectedPwd = scoredApps.filter(i => !selectedSet.has(i.application._id.toString()) && i.isDisability);
    for (let i = 0; i < Math.min(needed, unselectedPwd.length); i++) {
      const candidate = unselectedPwd[i];
      if (provisionalList.length >= totalSeats) {
        for (let j = provisionalList.length - 1; j >= 0; j--) {
          if (!provisionalList[j].isDisability && !provisionalList[j].isFemale) {
            const removed = provisionalList.splice(j, 1)[0];
            selectedSet.delete(removed.application._id.toString());
            break;
          }
        }
      }
      provisionalList.push({ ...candidate, selectionCategory: 'Horizontal Quota (PwD)' });
      selectedSet.add(candidate.application._id.toString());
    }
  }

  // Re-sort provisional list by score
  provisionalList.sort((a, b) => b.meritScore - a.meritScore);

  // 3. Waiting List (Next 50% seats)
  const waitingSize = Math.ceil(totalSeats * 0.5);
  const remainingApps = scoredApps.filter(i => !selectedSet.has(i.application._id.toString()));
  const waitingList = remainingApps.slice(0, waitingSize).map((item, idx) => ({
    ...item,
    waitlistRank: idx + 1,
    selectionCategory: 'Waitlisted'
  }));

  // 4. Unallocated / Remaining
  const unallocatedList = remainingApps.slice(waitingSize);

  return {
    scheme,
    totalEligible: scoredApps.length,
    totalSeats,
    quotaBreakdown: {
      femaleSeats: femaleSeatsRequired,
      pwdSeats: pwdSeatsRequired,
      pvtgSeats: pvtgSeatsRequired,
      femaleSelected: provisionalList.filter(i => i.isFemale).length,
      pwdSelected: provisionalList.filter(i => i.isDisability).length,
      pvtgSelected: provisionalList.filter(i => i.isPvtg).length
    },
    provisionalList,
    waitingList,
    unallocatedList
  };
};
