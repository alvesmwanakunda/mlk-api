'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    buildStatistics,
    getMonthRange,
    getWeekRange,
    getWorkedMinutes,
    normalizePresence
} = require('../api/services/timesheetStatistics.service');

test('normalise les différentes écritures de présence et absence', () => {
    assert.equal(normalizePresence('Présent'), 'Présent');
    assert.equal(normalizePresence(' presence '), 'Présent');
    assert.equal(normalizePresence('ABSENCE'), 'Absent');
    assert.equal(normalizePresence('Absent'), 'Absent');
    assert.equal(normalizePresence('Inconnu'), null);
});

test('calcule une durée stockée ou, à défaut, à partir des horaires', () => {
    assert.equal(getWorkedMinutes({ heure: 7, minute: 30 }), 450);
    assert.equal(getWorkedMinutes({ heureDebut: '08:15', heureFin: '12:45' }), 270);
    assert.equal(getWorkedMinutes({ heureDebut: '18:00', heureFin: '08:00' }), 0);
});

test('calcule des bornes UTC de mois et de semaine, lundi inclus', () => {
    const month = getMonthRange(2026, 12);
    assert.equal(month.start.toISOString(), '2026-12-01T00:00:00.000Z');
    assert.equal(month.end.toISOString(), '2027-01-01T00:00:00.000Z');

    const week = getWeekRange(new Date('2027-01-03T16:00:00.000Z'));
    assert.equal(week.start.toISOString(), '2026-12-28T00:00:00.000Z');
    assert.equal(week.end.toISOString(), '2027-01-04T00:00:00.000Z');
});

test('compte les jours uniques, construit le calendrier et additionne les heures', () => {
    const monthTimesheets = [
        {
            _id: '1',
            createdAt: new Date('2026-08-03T08:00:00.000Z'),
            presence: 'Présent',
            heure: 7,
            minute: 30
        },
        {
            _id: '2',
            createdAt: new Date('2026-08-03T13:00:00.000Z'),
            presence: 'Présent',
            heure: 1,
            minute: 15
        },
        {
            _id: '3',
            createdAt: new Date('2026-08-04T00:00:00.000Z'),
            presence: 'Absent',
            heure: 0,
            motifs: 'Congé'
        },
        {
            _id: '4',
            createdAt: new Date('2026-08-05T08:00:00.000Z'),
            presence: 'Présence',
            heureDebut: '08:00',
            heureFin: '12:30'
        },
        {
            _id: '5',
            createdAt: new Date('2026-08-06T00:00:00.000Z'),
            presence: 'Absent',
            heure: 0
        },
        {
            _id: '6',
            createdAt: new Date('2026-08-06T08:00:00.000Z'),
            presence: 'Présent',
            heure: 4
        }
    ];
    const currentWeekTimesheets = [
        { heure: 8, minute: 0 },
        { heure: 7, minute: 30 }
    ];

    const result = buildStatistics({
        year: 2026,
        month: 8,
        monthTimesheets,
        currentWeekTimesheets,
        now: new Date('2026-08-11T10:00:00.000Z')
    });

    assert.equal(result.calendrier.length, 31);
    assert.equal(result.resumeMois.nombrePresences, 3);
    assert.equal(result.resumeMois.nombreAbsences, 2);
    assert.equal(result.resumeMois.nombreJoursMixtes, 1);
    assert.equal(result.resumeMois.nombreJoursRenseignes, 4);
    assert.equal(result.resumeMois.totalMinutes, 1035);
    assert.equal(result.resumeMois.totalHeures, 17.25);

    const augustThird = result.calendrier.find((day) => day.date === '2026-08-03');
    assert.equal(augustThird.statut, 'Présent');
    assert.equal(augustThird.totalMinutes, 525);
    assert.deepEqual(augustThird.timesheetIds, ['1', '2']);

    const mixedDay = result.calendrier.find((day) => day.date === '2026-08-06');
    assert.equal(mixedDay.statut, 'Mixte');

    const emptyDay = result.calendrier.find((day) => day.date === '2026-08-07');
    assert.equal(emptyDay.statut, 'Non renseigné');

    assert.deepEqual(result.semaineCourante, {
        debut: '2026-08-10',
        fin: '2026-08-16',
        totalMinutes: 930,
        totalHeures: 15.5,
        duree: '15h 30min'
    });
});
