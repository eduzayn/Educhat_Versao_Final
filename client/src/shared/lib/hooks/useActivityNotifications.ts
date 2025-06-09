import { useEffect, useRef, useState } from 'react';

interface Activity {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  contact: string;
  priority: string;
  status: string;
}

interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  reminderMinutes: number;
  soundFile: string;
}

export function useActivityNotifications(activities: Activity[] = []) {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    soundEnabled: true,
    reminderMinutes: 2,
    soundFile: '/sounds/notification-chime.wav'
  });

  const [notifiedActivities, setNotifiedActivities] = useState<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (settings.soundEnabled) {
      audioRef.current = new Audio(settings.soundFile);
      audioRef.current.preload = 'auto';
      audioRef.current.volume = 0.7;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [settings.soundFile, settings.soundEnabled]);

  // Play notification sound
  const playNotificationSound = () => {
    if (settings.soundEnabled && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      } catch (error) {
        console.error('Erro ao reproduzir som de notificação:', error);
      }
    }
  };

  // Show browser notification
  const showBrowserNotification = (activity: Activity) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`Lembrete: ${activity.title}`, {
        body: `Atividade de ${activity.type} com ${activity.contact} em 2 minutos`,
        icon: '/favicon.ico',
        tag: `activity-${activity.id}`,
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }
  };

  // Check for upcoming activities
  const checkUpcomingActivities = () => {
    if (!settings.enabled || activities.length === 0) return;

    const now = new Date();
    const reminderTime = settings.reminderMinutes * 60 * 1000; // Convert to milliseconds

    activities.forEach(activity => {
      if (activity.status === 'completed' || activity.status === 'cancelled') return;
      if (notifiedActivities.has(activity.id)) return;

      // Parse activity date and time
      if (!activity.date || !activity.time) return;

      try {
        const activityDateTime = new Date(`${activity.date}T${activity.time}`);
        const timeDifference = activityDateTime.getTime() - now.getTime();

        // Check if activity is within the reminder window (e.g., 2 minutes before)
        if (timeDifference > 0 && timeDifference <= reminderTime) {
          console.log(`🔔 Notificação de atividade: ${activity.title} em ${Math.floor(timeDifference / 60000)} minutos`);
          
          // Play sound
          playNotificationSound();
          
          // Show browser notification
          showBrowserNotification(activity);
          
          // Mark as notified
          setNotifiedActivities(prev => new Set(prev).add(activity.id));
        }
      } catch (error) {
        console.error('Erro ao processar data/hora da atividade:', error);
      }
    });
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  // Start monitoring
  useEffect(() => {
    if (settings.enabled) {
      // Request notification permission on first use
      requestNotificationPermission();

      // Check immediately
      checkUpcomingActivities();

      // Set up interval to check every 30 seconds
      intervalRef.current = setInterval(checkUpcomingActivities, 30000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [activities, settings.enabled, notifiedActivities]);

  // Clean up notified activities for past activities
  useEffect(() => {
    const now = new Date();
    const updatedNotified = new Set<string>();

    notifiedActivities.forEach(activityId => {
      const activity = activities.find(a => a.id === activityId);
      if (activity && activity.date && activity.time) {
        try {
          const activityDateTime = new Date(`${activity.date}T${activity.time}`);
          // Keep notification flag for 1 hour after the activity time
          if (now.getTime() - activityDateTime.getTime() < 3600000) {
            updatedNotified.add(activityId);
          }
        } catch (error) {
          // Remove invalid entries
        }
      }
    });

    if (updatedNotified.size !== notifiedActivities.size) {
      setNotifiedActivities(updatedNotified);
    }
  }, [activities]);

  return {
    settings,
    setSettings,
    playNotificationSound,
    requestNotificationPermission,
    notifiedActivities: Array.from(notifiedActivities)
  };
}