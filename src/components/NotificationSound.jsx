import { useEffect, useRef } from 'react';

export default function NotificationSound({ play, onPlayComplete }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (play && audioRef.current) {
      // Try to play the notification sound
      audioRef.current.play().catch(error => {
        // Fallback: Create a simple beep sound using Web Audio API
        if (error.name === 'NotAllowedError') {
          playFallbackSound();
        }
        console.warn('Could not play notification sound:', error);
      });
      
      // Call the callback when sound finishes
      if (onPlayComplete) {
        const handleEnded = () => {
          onPlayComplete();
        };
        audioRef.current.addEventListener('ended', handleEnded);
        return () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('ended', handleEnded);
          }
        };
      }
    }
  }, [play, onPlayComplete]);

  const playFallbackSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // 800Hz beep
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play fallback sound:', error);
    }
  };

  return (
    <audio
      ref={audioRef}
      preload="auto"
      style={{ display: 'none' }}
    >
      <source src="/notification-sound.mp3" type="audio/mpeg" />
      <source src="/notification-sound.wav" type="audio/wav" />
      Your browser does not support the audio element.
    </audio>
  );
}
