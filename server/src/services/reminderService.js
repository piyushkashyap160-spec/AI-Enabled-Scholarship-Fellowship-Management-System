import Scheme from '../models/Scheme.js';
import Application from '../models/Application.js';
import Deficiency from '../models/Deficiency.js';
import Disbursement from '../models/Disbursement.js';
import { sendNotification } from './notificationService.js';

/**
 * Background Reminder Service for Scheduled Reminders and Deadlines
 */
export const checkAndSendReminders = async () => {
  try {
    const now = new Date();

    // 1. Check Open Deficiencies due in 7, 3, or 1 days
    const openDeficiencies = await Deficiency.find({ status: 'open' }).populate({
      path: 'applicationId',
      populate: { path: 'applicantId' }
    });

    for (const def of openDeficiencies) {
      if (!def.applicationId || !def.applicationId.applicantId) continue;
      const applicant = def.applicationId.applicantId;
      const diffHours = (new Date(def.dueDate) - now) / (1000 * 60 * 60);
      const daysLeft = Math.ceil(diffHours / 24);

      if ([7, 3, 1].includes(daysLeft)) {
        await sendNotification({
          userId: applicant._id,
          type: 'DEFICIENCY_REMINDER',
          subject: `Reminder: Deficiency due in ${daysLeft} day(s) for ${def.docKey}`,
          body: `You have an open deficiency for document "${def.docKey}". Please resolve and re-upload before ${new Date(def.dueDate).toLocaleDateString('en-IN')}.`,
          link: '/applicant/deficiencies'
        });
      }
    }

    // 2. Check Active Schemes closing in 7, 3, or 1 days
    const activeSchemes = await Scheme.find({ isActive: true });
    for (const scheme of activeSchemes) {
      const diffHours = (new Date(scheme.closeDate) - now) / (1000 * 60 * 60);
      const daysLeft = Math.ceil(diffHours / 24);

      if ([7, 3, 1].includes(daysLeft)) {
        // Find draft or incomplete applications
        const draftApps = await Application.find({
          schemeId: scheme._id,
          status: 'DRAFT'
        }).populate('applicantId');

        for (const app of draftApps) {
          if (app.applicantId) {
            await sendNotification({
              userId: app.applicantId._id,
              type: 'DEADLINE_REMINDER',
              subject: `Urgent: ${scheme.name} closes in ${daysLeft} days`,
              body: `Your draft application #${app.applicationNo} has not been submitted yet. The deadline is ${new Date(scheme.closeDate).toLocaleDateString('en-IN')}.`,
              link: `/applicant/applications/${app._id}`
            });
          }
        }
      }
    }

    // 3. Check Pending Fellowship Progress Reports / Disbursements
    const pendingDisbursements = await Disbursement.find({
      status: 'pending',
      guideApproved: false
    }).populate({
      path: 'applicationId',
      populate: { path: 'applicantId' }
    });

    for (const disb of pendingDisbursements) {
      const diffDays = Math.ceil((new Date(disb.dueDate) - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 15 && diffDays > 0 && disb.applicationId?.applicantId) {
        await sendNotification({
          userId: disb.applicationId.applicantId._id,
          type: 'FELLOWSHIP_REPORT_REMINDER',
          subject: `Fellowship Progress Report Due for Installment #${disb.installmentNo}`,
          body: `Please upload your biannual progress report and supervisor certification to release Fellowship installment #${disb.installmentNo} (Rs ${disb.amount.toLocaleString('en-IN')}).`,
          link: '/applicant/fellowship'
        });
      }
    }
  } catch (error) {
    console.error(`[Reminder Service Error]: ${error.message}`);
  }
};

/**
 * Initialize background interval runner
 */
export const initReminderService = (intervalMs = 60 * 60 * 1000) => {
  console.log('[Reminder Service]: Initialized background interval runner (every 1 hour).');
  // Run once on startup
  setTimeout(checkAndSendReminders, 5000);
  // Schedule ongoing
  setInterval(checkAndSendReminders, intervalMs);
};
