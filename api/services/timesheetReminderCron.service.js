const cron = require('node-cron');
const User = require('../models/users.model').UserModel;
const notificationService = require('./notification.service');

const TIMEZONE = 'Europe/Paris';
const CLOCK_IN_TEMPLATE = 'TIMESHEET_CLOCK_IN_REMINDER';
const CLOCK_OUT_TEMPLATE = 'TIMESHEET_CLOCK_OUT_REMINDER';

let started = false;

async function sendTimesheetReminder({ templateKey, reminderType, targetEmail }) {
  const userQuery = {
    role: 'agent',
    valid: true,
    desactive: false,
  };

  if (targetEmail) {
    userQuery.email = targetEmail;
  }

  const users = await User.find(userQuery);

  const results = await Promise.allSettled(
    users.map((user) =>
      notificationService.sendNotification({
        user,
        templateKey,
        data: {
          type: 'pointage_reminder',
          reminderType,
          userId: user._id.toString(),
        },
      })
    )
  );

  const failedCount = results.filter((result) => result.status === 'rejected').length;
  console.log(
    `[cron:pointage] ${reminderType} envoyé à ${users.length - failedCount}/${users.length} agents`
    + (targetEmail ? ` (filtre email: ${targetEmail})` : '')
  );
}

function startTimesheetReminderCrons() {
  if (started) return;
  if (process.env.ENABLE_TIMESHEET_REMINDER_CRON === 'false') {
    console.log('[cron:pointage] désactivé par ENABLE_TIMESHEET_REMINDER_CRON=false');
    return;
  }

  cron.schedule(
    '0 8 * * 1-5',
    () => {
      sendTimesheetReminder({
        templateKey: CLOCK_IN_TEMPLATE,
        reminderType: 'clock_in',
      }).catch((error) => {
        console.error('[cron:pointage] Erreur rappel pointage:', error);
      });
    },
    { timezone: TIMEZONE }
  );

  cron.schedule(
    '0 17 * * 1-5',
    () => {
      sendTimesheetReminder({
        templateKey: CLOCK_OUT_TEMPLATE,
        reminderType: 'clock_out',
      }).catch((error) => {
        console.error('[cron:pointage] Erreur rappel dépointage:', error);
      });
    },
    { timezone: TIMEZONE }
  );

  started = true;
  console.log(`[cron:pointage] rappels planifiés à 08:00 et 17:00 (${TIMEZONE})`);
}

module.exports = {
  startTimesheetReminderCrons,
  sendTimesheetReminder,
};
