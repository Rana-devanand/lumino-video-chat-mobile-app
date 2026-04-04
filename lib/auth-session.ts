import { FirebaseAuthTypes } from '@react-native-firebase/auth';

/**
 * A simple global store to hold the Firebase confirmation object
 * between the Login screen and the Verify screen.
 * Expo Router params only support strings, so we use this for the object.
 */
class AuthSession {
  private confirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

  setConfirmation(result: FirebaseAuthTypes.ConfirmationResult | null) {
    this.confirmation = result;
  }

  getConfirmation() {
    return this.confirmation;
  }
}

export const authSession = new AuthSession();
