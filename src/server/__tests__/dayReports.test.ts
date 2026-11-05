/* eslint-disable @typescript-eslint/no-require-imports -- each launch loads the modules fresh, as a cold start does */
// covers: FR-PAR-003, FR-MIG-003
// A paired person's day reaches the server (Phase 2 C3): queued if offline, safe to replay, right across
// midnight, nothing at all while unpaired, and no history.
import type { DayStats } from '../../types';

const mockLaunchStorage = jest.requireActual('react-native-mmkv').createMMKV();
jest.mock('../../utils/appStorage', () => ({ appStorage: mockLaunchStorage }));

const mockRpc = jest.fn();
jest.mock('../client', () => {
    class SessionEnded extends Error {}
    return { rpc: (...args: unknown[]) => mockRpc(...args), SessionEnded };
});

const TODAY = '2026-11-05';
const YESTERDAY = '2026-11-04';
const LAST_WEEK = '2026-10-29';

const day = (over: Partial<DayStats> = {}): DayStats => ({ focusSessions: 1, focusMinutes: 25, ...over });

function launch({ paired = true }: { paired?: boolean } = {}) {
    jest.resetModules();
    const { appStorage } = require('../../utils/appStorage');
    const { MIGRATION_DONE, MIGRATION_FLAG_KEY } = require('../../utils/storageMigration');
    appStorage.set(MIGRATION_FLAG_KEY, MIGRATION_DONE);
    const home = require('../home') as typeof import('../home');
    home.homeClient.setQueryData(home.HOME_KEY, { couple: paired ? { id: 'c', paired_at: 'x' } : null });
    const reports = require('../dayReports') as typeof import('../dayReports');
    const stats = require('../../stores/statsStore') as typeof import('../../stores/statsStore');
    return { home, reports, store: stats.useStatsStore };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 10));
const pending = () => {
    const raw = mockLaunchStorage.getString('day_reports_pending_v1');
    return raw ? Object.keys(JSON.parse(raw)) : [];
};

beforeEach(() => {
    mockRpc.mockReset();
    mockRpc.mockResolvedValue({ status: 'ok' });
    mockLaunchStorage.clearAll();
    jest.spyOn(Date, 'now').mockReturnValue(new Date(`${TODAY}T15:00:00`).getTime());
    jest.useFakeTimers({ doNotFake: ['setTimeout', 'clearTimeout', 'setImmediate', 'nextTick', 'queueMicrotask'], now: new Date(`${TODAY}T15:00:00`) });
});

afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
});

describe('a credited focus', () => {
    it('sends that day\'s totals, in milliseconds', async () => {
        const { reports, store } = launch();
        reports.startDayReports();

        store.setState({ days: { [TODAY]: day({ focusSessions: 2, focusMinutes: 50, goalHit: true, goalMinutes: 50 }) } });
        await settle();

        expect(mockRpc).toHaveBeenCalledTimes(1);
        expect(mockRpc).toHaveBeenCalledWith('report_day', {
            p_day: TODAY,
            p_focus_ms: 3000000,
            p_sessions: 2,
            p_goal_hit: true,
            p_goal_minutes: 50,
        });
        expect(pending()).toEqual([]);
    });

    it('credits a session that crossed midnight to the day it started', async () => {
        const { reports, store } = launch();
        reports.startDayReports();

        store.setState({ days: { [YESTERDAY]: day() } });
        await settle();

        expect(mockRpc).toHaveBeenCalledWith('report_day', expect.objectContaining({ p_day: YESTERDAY }));
    });
});

describe('no history', () => {
    it('never sends an older day, even when the whole store changes', async () => {
        const { reports, store } = launch();
        reports.startDayReports();

        store.setState({ days: { [LAST_WEEK]: day(), '2026-01-01': day(), [TODAY]: day() } });
        await settle();

        expect(mockRpc).toHaveBeenCalledTimes(1);
        expect(mockRpc).toHaveBeenCalledWith('report_day', expect.objectContaining({ p_day: TODAY }));
    });
});

describe('unpaired', () => {
    it('sends nothing and queues nothing', async () => {
        const { reports, store } = launch({ paired: false });
        reports.startDayReports();

        store.setState({ days: { [TODAY]: day() } });
        await settle();
        await reports.reportToday();
        await reports.flushDayReports();

        expect(mockRpc).not.toHaveBeenCalled();
        expect(pending()).toEqual([]);
    });

    it('sends nothing with no snapshot yet', async () => {
        const { reports, store, home } = launch();
        home.homeClient.removeQueries({ queryKey: home.HOME_KEY });
        reports.startDayReports();
        store.setState({ days: { [TODAY]: day() } });
        await settle();
        expect(mockRpc).not.toHaveBeenCalled();
    });

    it('empties the queue when the server says you aren\'t paired', async () => {
        const { reports, store } = launch();
        mockRpc.mockResolvedValue({ status: 'not_paired' });
        reports.startDayReports();
        store.setState({ days: { [TODAY]: day(), [YESTERDAY]: day() } });
        await settle();
        expect(pending()).toEqual([]);
    });
});

describe('offline', () => {
    it('keeps the report queued, across a cold start, and sends it next time', async () => {
        const first = launch();
        mockRpc.mockRejectedValue(new Error('offline'));
        first.reports.startDayReports();
        first.store.setState({ days: { [TODAY]: day({ focusMinutes: 25 }) } });
        await settle();
        expect(pending()).toEqual([TODAY]);

        const second = launch();
        mockRpc.mockReset();
        mockRpc.mockResolvedValue({ status: 'ok' });
        await second.reports.flushDayReports();

        expect(mockRpc).toHaveBeenCalledWith('report_day', expect.objectContaining({ p_day: TODAY, p_focus_ms: 1500000 }));
        expect(pending()).toEqual([]);
    });

    it('keeps the latest totals for a day, not one entry per focus', async () => {
        const { reports, store } = launch();
        mockRpc.mockRejectedValue(new Error('offline'));
        reports.startDayReports();
        store.setState({ days: { [TODAY]: day({ focusSessions: 1, focusMinutes: 25 }) } });
        await settle();
        store.setState({ days: { [TODAY]: day({ focusSessions: 2, focusMinutes: 50 }) } });
        await settle();

        const queue = JSON.parse(mockLaunchStorage.getString('day_reports_pending_v1')!);
        expect(Object.keys(queue)).toEqual([TODAY]);
        expect(queue[TODAY].p_sessions).toBe(2);
    });

    it('sends the oldest day first', async () => {
        const { reports, store } = launch();
        reports.startDayReports();
        store.setState({ days: { [TODAY]: day(), [YESTERDAY]: day() } });
        await settle();
        expect(mockRpc.mock.calls.map((c) => c[1].p_day)).toEqual([YESTERDAY, TODAY]);
    });
});

describe('replay', () => {
    it('keeps a newer total that arrived while the older one was being sent', async () => {
        const { reports, store } = launch();
        let finish: (value: { status: string }) => void = () => {};
        mockRpc.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
        reports.startDayReports();

        store.setState({ days: { [TODAY]: day({ focusMinutes: 25 }) } });
        await settle();
        store.setState({ days: { [TODAY]: day({ focusMinutes: 50 }) } });
        await settle();
        finish({ status: 'ok' });
        await settle();

        expect(pending()).toEqual([TODAY]);
        await reports.flushDayReports();
        expect(mockRpc).toHaveBeenLastCalledWith('report_day', expect.objectContaining({ p_focus_ms: 3000000 }));
        expect(pending()).toEqual([]);
    });

    it('drops an invalid report: sending it again can\'t help', async () => {
        const { reports, store } = launch();
        mockRpc.mockResolvedValue({ status: 'invalid' });
        reports.startDayReports();
        store.setState({ days: { [TODAY]: day() } });
        await settle();
        expect(pending()).toEqual([]);
    });
});

describe('reportToday', () => {
    it('sends today\'s totals, so a day shows as soon as a person pairs', async () => {
        const { reports, store } = launch();
        store.setState({ days: { [TODAY]: day({ focusSessions: 3, focusMinutes: 75 }) } });
        await reports.reportToday();
        expect(mockRpc).toHaveBeenCalledWith('report_day', expect.objectContaining({ p_day: TODAY, p_sessions: 3 }));
    });

    it('sends nothing with no focus today', async () => {
        const { reports } = launch();
        await reports.reportToday();
        expect(mockRpc).not.toHaveBeenCalled();
    });
});

describe('the time zone', () => {
    it('is sent when it changes, and not again', async () => {
        const { syncTimeZone } = require('../timeZone') as typeof import('../timeZone');
        await syncTimeZone('Europe/Istanbul');
        await syncTimeZone('Europe/Istanbul');
        expect(mockRpc).toHaveBeenCalledTimes(1);
        expect(mockRpc).toHaveBeenCalledWith('set_profile', { p_tz: 'Europe/Istanbul' });

        await syncTimeZone('Pacific/Auckland');
        expect(mockRpc).toHaveBeenCalledTimes(2);
    });

    it('tries again after a failure', async () => {
        const { syncTimeZone } = require('../timeZone') as typeof import('../timeZone');
        mockRpc.mockRejectedValueOnce(new Error('offline'));
        await expect(syncTimeZone('Europe/Istanbul')).resolves.toBeUndefined();
        await syncTimeZone('Europe/Istanbul');
        expect(mockRpc).toHaveBeenCalledTimes(2);
    });
});
