import { render, screen } from '@testing-library/react-native';
import appJson from '../../../app.json';
import TimerText from '../TimerText';

// Jest tests the code the app ships (Phase 1 B5). A component compiled by the
// React Compiler asks react/compiler-runtime's c() for its memo cache on every
// render; an uncompiled one never does. jest.babelTransformer.js turns the
// compiler on under Jest exactly when app.json does, as Metro does for the app,
// so this fails if the two ever disagree (for example after an Expo upgrade
// that changes how babel-preset-expo or jest-expo decide it).
jest.mock('react/compiler-runtime', () => {
    const actual = jest.requireActual('react/compiler-runtime');
    return { ...actual, c: jest.fn(actual.c) };
});
// @types/react hides the runtime's exports on purpose ("not meant to be used directly").
const memoCache = jest.requireMock<{ c: jest.Mock }>('react/compiler-runtime').c;

const compilerOn =
    (appJson.expo as { experiments?: { reactCompiler?: boolean } }).experiments?.reactCompiler === true;

// covers: NFR-PERF-003
describe('the React Compiler under Jest', () => {
    it(`compiles the components under test exactly when app.json does (now: ${compilerOn ? 'on' : 'off'})`, async () => {
        await render(<TimerText kind="pomodoro" idleMs={25 * 60_000} />);
        expect(screen.getByText('25:00')).toBeOnTheScreen();
        expect(memoCache.mock.calls.length > 0).toBe(compilerOn);
    });
});
