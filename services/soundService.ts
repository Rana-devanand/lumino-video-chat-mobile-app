import { Audio } from 'expo-av';

export const soundService = {
  ringSound: null as Audio.Sound | null,
  callingSound: null as Audio.Sound | null,

  async playRingtone() {
    try {
      if (this.ringSound) await this.ringSound.unloadAsync();
      
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/ringtone/memory.mp3'),
        { shouldPlay: true, isLooping: true }
      );
      this.ringSound = sound;
    } catch (error) {
      console.error('[SoundService] Ringtone error:', error);
    }
  },


  async playCallingSound() {
    try {
      if (this.callingSound) await this.callingSound.unloadAsync();
      
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/ringtone/memory.mp3'),
        { shouldPlay: true, isLooping: true }
      );
      this.callingSound = sound;
    } catch (error) {
      console.error('[SoundService] Calling sound error:', error);
    }
  },


  async stopAll() {
    if (this.ringSound) {
      await this.ringSound.stopAsync();
      await this.ringSound.unloadAsync();
      this.ringSound = null;
    }
    if (this.callingSound) {
      await this.callingSound.stopAsync();
      await this.callingSound.unloadAsync();
      this.callingSound = null;
    }
  }
};
