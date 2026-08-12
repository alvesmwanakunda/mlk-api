'use strict';

const DAYS_IN_FRENCH = [
    'Dimanche',
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi'
];

function dateKey(date) {
    return date.toISOString().slice(0, 10);
}

function addUtcDays(date, days) {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

function getMonthRange(year, month) {
    return {
        start: new Date(Date.UTC(year, month - 1, 1)),
        end: new Date(Date.UTC(year, month, 1))
    };
}

function getWeekRange(referenceDate) {
    const start = new Date(Date.UTC(
        referenceDate.getUTCFullYear(),
        referenceDate.getUTCMonth(),
        referenceDate.getUTCDate()
    ));
    const day = start.getUTCDay();
    start.setUTCDate(start.getUTCDate() - (day === 0 ? 6 : day - 1));

    return {
        start,
        end: addUtcDays(start, 7)
    };
}

function normalizePresence(value) {
    if (typeof value !== 'string') return null;

    const normalized = value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    if (['present', 'presence'].includes(normalized)) return 'Présent';
    if (['absent', 'absence'].includes(normalized)) return 'Absent';

    return null;
}

function parseClock(value) {
    if (typeof value !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
        return null;
    }

    const [hours, minutes] = value.split(':').map(Number);
    return (hours * 60) + minutes;
}

function getWorkedMinutes(timesheet) {
    const hasStoredDuration = timesheet.heure !== undefined && timesheet.heure !== null
        || timesheet.minute !== undefined && timesheet.minute !== null;

    if (hasStoredDuration) {
        const hours = Number(timesheet.heure || 0);
        const minutes = Number(timesheet.minute || 0);

        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
        return Math.max(0, Math.round((hours * 60) + minutes));
    }

    const start = parseClock(timesheet.heureDebut);
    const end = parseClock(timesheet.heureFin);

    if (start === null || end === null || end < start) return 0;
    return end - start;
}

function formatDuration(totalMinutes) {
    const safeMinutes = Math.max(0, Math.round(totalMinutes));
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    return `${hours}h ${String(minutes).padStart(2, '0')}min`;
}

function durationSummary(totalMinutes) {
    return {
        totalMinutes,
        totalHeures: Number((totalMinutes / 60).toFixed(2)),
        duree: formatDuration(totalMinutes)
    };
}

function getIsoWeek(date) {
    const target = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ));
    const dayNumber = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
    const isoYear = target.getUTCFullYear();
    const firstDay = new Date(Date.UTC(isoYear, 0, 1));
    const week = Math.ceil((((target - firstDay) / 86400000) + 1) / 7);

    return { year: isoYear, week };
}

function createCalendar(year, month, timesheets) {
    const { start, end } = getMonthRange(year, month);
    const entriesByDay = new Map();

    timesheets.forEach((timesheet) => {
        const createdAt = new Date(timesheet.createdAt);
        if (Number.isNaN(createdAt.getTime()) || createdAt < start || createdAt >= end) return;

        const key = dateKey(createdAt);
        if (!entriesByDay.has(key)) entriesByDay.set(key, []);
        entriesByDay.get(key).push(timesheet);
    });

    const calendar = [];
    for (let date = new Date(start); date < end; date = addUtcDays(date, 1)) {
        const key = dateKey(date);
        const entries = entriesByDay.get(key) || [];
        const presenceValues = new Set(entries.map((entry) => normalizePresence(entry.presence)).filter(Boolean));

        let statut = 'Non renseigné';
        if (presenceValues.has('Présent') && presenceValues.has('Absent')) statut = 'Mixte';
        else if (presenceValues.has('Présent')) statut = 'Présent';
        else if (presenceValues.has('Absent')) statut = 'Absent';

        const totalMinutes = entries.reduce((total, entry) => total + getWorkedMinutes(entry), 0);
        const motifs = [...new Set(entries.map((entry) => entry.motifs).filter(Boolean))];
        const dayOfWeek = date.getUTCDay();

        calendar.push({
            date: key,
            jour: DAYS_IN_FRENCH[dayOfWeek],
            estWeekend: dayOfWeek === 0 || dayOfWeek === 6,
            statut,
            ...durationSummary(totalMinutes),
            motifs,
            timesheetIds: entries.map((entry) => String(entry._id))
        });
    }

    return calendar;
}

function getWeeksOfMonth(calendar) {
    const weeks = new Map();

    calendar.forEach((day) => {
        const date = new Date(`${day.date}T00:00:00.000Z`);
        const range = getWeekRange(date);
        const key = dateKey(range.start);

        if (!weeks.has(key)) {
            const isoWeek = getIsoWeek(date);
            weeks.set(key, {
                annee: isoWeek.year,
                semaine: isoWeek.week,
                debut: dateKey(range.start),
                fin: dateKey(addUtcDays(range.end, -1)),
                totalMinutes: 0
            });
        }

        weeks.get(key).totalMinutes += day.totalMinutes;
    });

    return [...weeks.values()].map((week) => ({
        annee: week.annee,
        semaine: week.semaine,
        debut: week.debut,
        fin: week.fin,
        ...durationSummary(week.totalMinutes)
    }));
}

function buildStatistics({ year, month, monthTimesheets, currentWeekTimesheets, now = new Date() }) {
    const calendar = createCalendar(year, month, monthTimesheets);
    const currentWeekRange = getWeekRange(now);
    const currentWeekMinutes = currentWeekTimesheets.reduce(
        (total, timesheet) => total + getWorkedMinutes(timesheet),
        0
    );
    const monthMinutes = calendar.reduce((total, day) => total + day.totalMinutes, 0);
    const informedDays = calendar.filter((day) => day.statut !== 'Non renseigné');

    return {
        resumeMois: {
            nombrePresences: calendar.filter((day) => ['Présent', 'Mixte'].includes(day.statut)).length,
            nombreAbsences: calendar.filter((day) => ['Absent', 'Mixte'].includes(day.statut)).length,
            nombreJoursMixtes: calendar.filter((day) => day.statut === 'Mixte').length,
            nombreJoursRenseignes: informedDays.length,
            nombreJoursNonRenseignes: calendar.length - informedDays.length,
            nombreJoursOuvresNonRenseignes: calendar.filter(
                (day) => !day.estWeekend && day.statut === 'Non renseigné'
            ).length,
            ...durationSummary(monthMinutes)
        },
        semaineCourante: {
            debut: dateKey(currentWeekRange.start),
            fin: dateKey(addUtcDays(currentWeekRange.end, -1)),
            ...durationSummary(currentWeekMinutes)
        },
        semainesDuMois: getWeeksOfMonth(calendar),
        calendrier: calendar
    };
}

module.exports = {
    buildStatistics,
    getMonthRange,
    getWeekRange,
    getWorkedMinutes,
    normalizePresence
};
