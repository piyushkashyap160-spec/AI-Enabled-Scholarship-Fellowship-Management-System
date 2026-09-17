import Notification from '../models/Notification.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let enTemplates = {};
let hiTemplates = {};

try {
  enTemplates = JSON.parse(fs.readFileSync(path.join(__dirname, '../i18n/en.json'), 'utf-8'));
  hiTemplates = JSON.parse(fs.readFileSync(path.join(__dirname, '../i18n/hi.json'), 'utf-8'));
} catch (e) {
  console.warn('[i18n Warning]: Could not load notification locale JSONs.');
}

/**
 * Send notification to user across mock Email, SMS, and in-app collection
 */
export const sendNotification = async ({
  userId,
  type = 'GENERAL',
  subject,
  body,
  link = '',
  channel = 'inapp',
  templateKey = null,
  templateParams = {}
}) => {
  try {
    const user = await User.findById(userId);
    const lang = user?.preferredLanguage || 'en';
    const templates = lang === 'hi' ? hiTemplates : enTemplates;

    let finalSubject = subject;
    let finalBody = body;

    if (templateKey && templates.notifications && templates.notifications[templateKey]) {
      let templSub = templates.notifications[templateKey].subject || subject;
      let templBody = templates.notifications[templateKey].body || body;

      for (const [k, v] of Object.entries(templateParams)) {
        templSub = templSub.replace(new RegExp(`{${k}}`, 'g'), v);
        templBody = templBody.replace(new RegExp(`{${k}}`, 'g'), v);
      }

      finalSubject = templSub;
      finalBody = templBody;
    }

    // Save to MongoDB Notification collection
    const notification = await Notification.create({
      userId,
      channel,
      type,
      subject: finalSubject,
      body: finalBody,
      link,
      sentAt: new Date(),
      read: false
    });

    // Mock console logging for Email & SMS delivery
    console.log('\n================== [MOCK DISPATCH: MoTA NOTIFICATION] ==================');
    console.log(`[TO USER]: ${user?.name || userId} (${user?.email || 'N/A'}) | Phone: ${user?.phone || 'N/A'}`);
    console.log(`[CHANNEL]: ${channel.toUpperCase()} | [TYPE]: ${type} | [LANGUAGE]: ${lang.toUpperCase()}`);
    console.log(`[SUBJECT]: ${finalSubject}`);
    console.log(`[BODY]: ${finalBody}`);
    if (link) console.log(`[ACTION LINK]: ${link}`);
    console.log('========================================================================\n');

    return notification;
  } catch (error) {
    console.error(`[Notification Service Error]: ${error.message}`);
    return null;
  }
};
