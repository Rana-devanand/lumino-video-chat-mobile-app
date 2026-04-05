import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { authService } from './authService';

export const sharingService = {
  /**
   * Generates the referral link for the current user.
   */
  async getInviteUrl() {
    const user = await authService.getCurrentUser();
    const referralId = user?.id || 'guest';
    
    // Fallback to a placeholder IP if ENV is missing
    const bridgeBaseUrl = process.env.EXPO_PUBLIC_WEB_REDIRECT_LINK || "http://[IP_ADDRESS]:3000";
    return `${bridgeBaseUrl}/?referrer=${referralId}`;
  },

  /**
   * Triggers the native sharing dialog with the invite message.
   */
  async shareInvite() {
    try {
      const inviteUrl = await this.getInviteUrl();
      const message = `Hey! Join me on Lumino for high-quality video calls. Use my link to get started: ${inviteUrl}`;
      
      const result = await Share.share({
        message,
        url: inviteUrl, // iOS only link field
        title: 'Invite to Lumino',
      });

      return result;
    } catch (error) {
      console.error('[sharingService] shareInvite failed:', error);
      throw error;
    }
  },

  /**
   * Copies the invite URL to the clipboard and provides haptic feedback.
   */
  async copyInviteUrl() {
    try {
      const url = await this.getInviteUrl();
      await Clipboard.setStringAsync(url);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (error) {
      console.error('[sharingService] copyInviteUrl failed:', error);
      return false;
    }
  }
};
