import { WelcomeScreen } from '../src/screens/welcome/WelcomeScreen';

// `/welcome`: the one-time v1.4 welcome (Phase 1 D1), presented full screen with a fade over the
// tabs by the Timer screen's calm-entry gate. Start fades it back into the Timer tab.
export default function WelcomeRoute() {
  return <WelcomeScreen />;
}
