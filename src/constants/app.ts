import Constants from 'expo-constants';

/**
 * The app's display name, read from `app.json`, so the copy that names the app follows one
 * place. "Valentine Pomodoro" is a working name and the public one is undecided (PRODUCT.md).
 */
export const APP_NAME: string = Constants.expoConfig?.name ?? 'Valentine Pomodoro';
