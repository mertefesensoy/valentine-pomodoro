import { Platform } from 'react-native';
import { hasKey } from './index';

/**
 * The key for this phone's platform (the Android closed-test plan, Stage 1). A few lines name the iPhone, iOS or
 * the App Store, and Android reaches some of them: the appearance footer, the notifications-off notice and its
 * button, and the update prompt. Each has an Android sibling, `<key>Android`.
 *
 * Contract: on Android, returns `<key>Android` when English has it, otherwise `key`; on every other platform,
 * returns `key` unchanged, so iOS keeps its exact words. A key with no Android sibling (such as
 * `settings.notifications.failed`) stays as it is, never a missing key. Pure for a given `os`.
 */
export function platformKey(key: string, os: typeof Platform.OS = Platform.OS): string {
    if (os !== 'android') return key;
    const variant = `${key}Android`;
    return hasKey(variant) ? variant : key;
}
