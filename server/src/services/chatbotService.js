import Scheme from '../models/Scheme.js';
import Application from '../models/Application.js';
import Document from '../models/Document.js';
import Deficiency from '../models/Deficiency.js';
import User from '../models/User.js';
import { recommendSchemesForUser } from './recommendService.js';
import { evaluate } from './rulesEngine.js';

/**
 * Intelligent Retrieval and Intent-based Chatbot for SIH PS 26239
 * Grounded in local MongoDB data without any external LLM dependencies.
 */
export const processChatbotMessage = async (userId, message) => {
  const query = (message || '').trim().toLowerCase();
  const user = userId ? await User.findById(userId) : null;
  const userProfile = user?.profile || {};

  // 1. Intent: "Which schemes can I apply for?" / "Recommend schemes" / "What schemes are available"
  if (query.includes('which scheme') || query.includes('can i apply') || query.includes('available scheme') || query.includes('recommend') || query.includes('eligible scheme') || query.includes('list scheme')) {
    if (!user) {
      const schemes = await Scheme.find({ isActive: true });
      const list = schemes.map(s => `• **${s.name} (${s.code})**: ${s.level.toUpperCase()} level. Total Seats: ${s.totalSeats}.`).join('\n');
      return {
        reply: `Here are the currently active scholarship & fellowship schemes under the Ministry of Tribal Affairs:\n\n${list}\n\n*Tip: Log in to get personalized eligibility recommendations based on your profile!*`,
        source: 'Live Schemes Registry (MoTA Database)',
        suggestions: ['Am I eligible for NFST?', 'What documents do I need for NOS?', 'When is the deadline?']
      };
    }

    const recs = await recommendSchemesForUser(userProfile);
    const formatted = recs.map(r => {
      const icon = r.isEligible ? '✅' : '❌';
      return `**${icon} ${r.name} (${r.code})** — *${r.matchLabel}*\n${r.positiveReasons.slice(0, 2).join('\n')}\n${r.negativeReasons.slice(0, 1).join('\n')}`;
    }).join('\n\n');

    return {
      reply: `Based on your registered profile (Category: **${userProfile.category || 'ST'}**, Income: **₹${(userProfile.familyIncome || 0).toLocaleString('en-IN')}**, Marks: **${userProfile.education?.marksPercent || 0}%**):\n\n${formatted}`,
      source: 'Rules & Recommendation Engine (MoTA DB)',
      suggestions: ['Check my application status', 'What documents do I need for NOS?', 'Why was my document rejected?']
    };
  }

  // 2. Intent: "What documents do I need for [Scheme]?" / "Required documents"
  if (query.includes('document') && (query.includes('need') || query.includes('require') || query.includes('upload') || query.includes('for'))) {
    const isNos = query.includes('nos') || query.includes('overseas');
    const isNfst = query.includes('nfst') || query.includes('fellowship') || query.includes('national');

    let schemeCode = null;
    if (isNos) schemeCode = 'NOS';
    if (isNfst) schemeCode = 'NFST';

    let filter = { isActive: true };
    if (schemeCode) filter.code = schemeCode;

    const schemes = await Scheme.find(filter);
    if (schemes.length === 0) {
      return {
        reply: "No schemes found matching that name. Available schemes are **NFST** (National Fellowship for ST) and **NOS** (National Overseas Scholarship).",
        source: 'MoTA Scheme Guidelines',
        suggestions: ['Documents for NFST', 'Documents for NOS']
      };
    }

    const text = schemes.map(s => {
      const docs = s.requiredDocuments.map(d => `• **${d.label}** (${d.acceptedTypes.join(', ').toUpperCase()})${d.maxAgeMonths ? ` — *Valid within ${d.maxAgeMonths} months*` : ''}`).join('\n');
      return `### Required Documents for ${s.name} (${s.code}):\n${docs}`;
    }).join('\n\n');

    return {
      reply: `${text}\n\n*Note: Ensure certificates are clear scans in PDF/JPG format under 5MB.*`,
      source: 'MoTA Scheme Guidelines (Live DB)',
      suggestions: ['How does OCR document verification work?', 'Am I eligible for NFST?', 'Check deadline']
    };
  }

  // 3. Intent: "What is the status of my application?" / "Application status"
  if (query.includes('status') || query.includes('application status') || query.includes('track my application') || query.includes('my application')) {
    if (!user) {
      return {
        reply: "Please log in with your applicant account to track your live application status.",
        source: 'Authentication System',
        suggestions: ['Log In', 'Explore Schemes']
      };
    }

    const latestApp = await Application.findOne({ applicantId: user._id })
      .populate('schemeId')
      .sort({ createdAt: -1 });

    if (!latestApp) {
      return {
        reply: "You have not submitted any scholarship applications yet. Visit the **Schemes** section to check your eligibility and apply!",
        source: 'Application Repository',
        suggestions: ['Which schemes can I apply for?', 'Am I eligible for NFST?']
      };
    }

    const stageDesc = {
      DRAFT: 'Draft created (pending final submission)',
      SUBMITTED: 'Application submitted successfully',
      OCR_PROCESSING: 'AI OCR scanning your uploaded certificates',
      AUTO_VERIFIED: 'Documents verified automatically with high confidence',
      DEFICIENT: 'Deficiency raised. Please re-upload required documents',
      UNDER_VERIFICATION: 'Assigned to Verifier Queue for document scrutiny',
      UNDER_SCRUTINY: 'Under Scrutiny by Ministry Officers',
      ELIGIBLE: 'Verified and marked Eligible for Merit Consideration',
      INELIGIBLE: 'Did not satisfy scheme eligibility criteria',
      MERIT_LISTED: 'Included in Provisional Merit Ranking',
      SELECTED: 'Selected for Fellowship / Scholarship Award!',
      WAITLISTED: 'Placed on Official Waiting List',
      REJECTED: 'Application rejected during scrutiny',
      AWARD_ACCEPTED: 'Award Acceptance Letter submitted',
      DISBURSING: 'Stipend disbursement in progress',
      COMPLETED: 'Fellowship tenure completed'
    };

    const latestStage = latestApp.stageHistory[latestApp.stageHistory.length - 1];

    return {
      reply: `### Application #${latestApp.applicationNo}\n• **Scheme**: ${latestApp.schemeId?.name || 'Scholarship'}\n• **Current Stage**: **${latestApp.status}** (${stageDesc[latestApp.status] || latestApp.status})\n• **Last Update**: ${latestStage ? new Date(latestStage.at).toLocaleDateString('en-IN') : 'N/A'}\n• **Latest Remark**: *"${latestStage?.remark || 'Processing in progress'}"*`,
      source: 'Live Application Database (Application Record)',
      suggestions: ['Why was my document rejected?', 'What are the next steps?', 'View my deficiency inbox']
    };
  }

  // 4. Intent: "Why was my document rejected?" / "Deficiency reason"
  if (query.includes('reject') || query.includes('deficiency') || query.includes('why') && query.includes('doc')) {
    if (!user) {
      return {
        reply: "Please log in to check specific document feedback and deficiency reasons for your account.",
        source: 'Authentication System',
        suggestions: ['Log In']
      };
    }

    const openDeficiencies = await Deficiency.find({
      status: 'open'
    }).populate({
      path: 'applicationId',
      match: { applicantId: user._id }
    });

    const userDefs = openDeficiencies.filter(d => d.applicationId);

    if (userDefs.length === 0) {
      // Check recently flagged documents
      const apps = await Application.find({ applicantId: user._id });
      const appIds = apps.map(a => a._id);
      const flaggedDocs = await Document.find({
        applicationId: { $in: appIds },
        mismatches: { $exists: true, $ne: [] }
      });

      if (flaggedDocs.length === 0) {
        return {
          reply: "Good news! You have **no active deficiencies or rejected documents** on your account.",
          source: 'Live Deficiency Tracker',
          suggestions: ['Check application status', 'When is the deadline?']
        };
      }

      const issues = flaggedDocs.map(d => `• **${d.docKey.replace(/_/g, ' ').toUpperCase()}**: ${d.mismatches.map(m => m.message).join('; ')}`).join('\n');
      return {
        reply: `### Document Flags Detected:\n${issues}\n\n*You can review or re-upload corrected documents in your Application Details.*`,
        source: 'AI OCR & Document Verification Engine',
        suggestions: ['How do I resolve a deficiency?', 'Check application status']
      };
    }

    const defDetails = userDefs.map(d => `• **Document**: \`${d.docKey}\`\n  • **Reason**: ${d.reason}\n  • **Raised By**: ${d.raisedBy}\n  • **Deadline**: ${new Date(d.dueDate).toLocaleDateString('en-IN')}`).join('\n\n');

    return {
      reply: `### Active Deficiencies Requiring Action:\n\n${defDetails}\n\n*Click on **Deficiency Inbox** in the sidebar to re-upload your document before the due date.*`,
      source: 'Live Deficiency Management System',
      suggestions: ['Go to Deficiency Inbox', 'Check application status']
    };
  }

  // 5. Intent: "When is the deadline?" / "Last date"
  if (query.includes('deadline') || query.includes('last date') || query.includes('close date') || query.includes('when')) {
    const schemes = await Scheme.find({ isActive: true });
    const text = schemes.map(s => {
      const close = new Date(s.closeDate);
      const daysLeft = Math.ceil((close - new Date()) / (1000 * 60 * 60 * 24));
      return `• **${s.name} (${s.code})**: Closes on **${close.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}** (${daysLeft > 0 ? `${daysLeft} days remaining` : 'Closed'})`;
    }).join('\n');

    return {
      reply: `### Scheme Application Deadlines:\n\n${text}\n\n*Please submit your application and all required documents before 11:59 PM on the closing date.*`,
      source: 'MoTA Scheme Schedules (Live DB)',
      suggestions: ['Which schemes can I apply for?', 'Am I eligible for NFST?']
    };
  }

  // 6. Intent: "Am I eligible for [Scheme]?" / "Eligibility pre-check"
  if (query.includes('eligible for') || query.includes('check eligibility')) {
    const isNos = query.includes('nos') || query.includes('overseas');
    const isNfst = query.includes('nfst') || query.includes('national') || query.includes('fellowship');

    const code = isNos ? 'NOS' : (isNfst ? 'NFST' : 'NFST');
    const scheme = await Scheme.findOne({ code, isActive: true });

    if (!scheme) {
      return {
        reply: `Could not find scheme ${code}. Please specify NFST or NOS.`,
        source: 'MoTA Schemes DB',
        suggestions: ['Am I eligible for NFST?', 'Am I eligible for NOS?']
      };
    }

    if (!user) {
      return {
        reply: `To check eligibility for **${scheme.name} (${scheme.code})**:\n• Category: Must be **Scheduled Tribe (ST)**\n• Max Family Income: **₹8,00,000 per annum**\n• Minimum Marks: **60%** in qualifying degree\n• Age Limit: **35 Years**\n\n*Use our **Eligibility Pre-Check Tool** on the top menu to enter your details without logging in!*`,
        source: 'Scheme Eligibility Guidelines',
        suggestions: ['Open Eligibility Checker', 'Documents required for ' + scheme.code]
      };
    }

    const evalResult = evaluate(scheme, {
      ...userProfile,
      marksPercent: userProfile.education?.marksPercent,
      educationLevel: userProfile.education?.level,
      familyIncome: userProfile.familyIncome,
      category: userProfile.category
    });

    const breakdown = evalResult.results.map(r => `${r.passed ? '✅' : '❌'} **${r.field}**: ${r.message} (Your value: ${r.actual})`).join('\n');

    return {
      reply: `### Eligibility Analysis for ${scheme.name} (${scheme.code}):\n**Overall Verdict**: ${evalResult.passed ? '🎉 **ELIGIBLE TO APPLY**' : '⚠️ **NOT CURRENTLY ELIGIBLE**'}\n\n${breakdown}`,
      source: 'Automated Rules Engine (Local Evaluation)',
      suggestions: ['Which other schemes can I apply for?', 'What documents do I need for ' + scheme.code]
    };
  }

  // Default fallback with helpful options
  return {
    reply: `I am your **Tribal Affairs Scholarship Assistant**. I can help you with questions regarding schemes, rules, and your application.\n\nHere are some things you can ask me:\n• *"Which schemes can I apply for?"*\n• *"What documents do I need for NOS or NFST?"*\n• *"What is the status of my application?"*\n• *"Why was my document flagged or rejected?"*\n• *"When is the application deadline?"*\n• *"Am I eligible for NFST?"*`,
    source: 'MoTA Automated Helpdesk',
    suggestions: [
      'Which schemes can I apply for?',
      'What documents do I need for NOS?',
      'When is the deadline?',
      'Am I eligible for NFST?'
    ]
  };
};
