// covers: FR-NTE-003
// Telling the server which notes have been shown (Phase 2 D3).
import { flushShown } from '../noteDelivery';
import { usePartnerGlance } from '../partnerGlance';

const mockRpc = jest.fn();
jest.mock('../client', () => ({ rpc: (...args: unknown[]) => mockRpc(...args) }));

beforeEach(() => {
    mockRpc.mockReset();
    usePartnerGlance.setState({ glance: null, gone: null, notes: [], shown: ['a', 'b'] });
});

afterEach(() => {
    usePartnerGlance.setState({ glance: null, gone: null, notes: [], shown: [] });
});

describe('flushShown', () => {
    it('confirms each note it has shown', async () => {
        mockRpc.mockResolvedValue({ status: 'ok' });
        await flushShown();
        expect(mockRpc.mock.calls).toEqual([
            ['mark_note_shown', { p_id: 'a' }],
            ['mark_note_shown', { p_id: 'b' }],
        ]);
    });

    it('stops at the first failure, which is almost always the network, and doesn\'t throw', async () => {
        mockRpc.mockRejectedValue(new Error('offline'));
        await expect(flushShown()).resolves.toBeUndefined();
        expect(mockRpc).toHaveBeenCalledTimes(1);
    });

    it('leaves the ids for a snapshot to clear, which is the proof the server has them', async () => {
        mockRpc.mockResolvedValue({ status: 'ok' });
        await flushShown();
        expect(usePartnerGlance.getState().shown).toEqual(['a', 'b']);
    });

    it('does nothing with nothing shown', async () => {
        usePartnerGlance.setState({ shown: [] });
        await flushShown();
        expect(mockRpc).not.toHaveBeenCalled();
    });
});
