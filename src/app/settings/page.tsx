
"use client";

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { AudioControls, type VoiceGender } from '@/components/therapy/AudioControls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { UserCircle, Bell, Save } from 'lucide-react';

interface UserProfileSettings {
  name: string;
  email: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  sessionReminders: boolean;
  progressUpdates: boolean;
}

interface AudioSettings {
  voice: VoiceGender;
  volume: number; // Stored as 0-100
  playbackSpeed: number; // Stored as 0.5-2.0
}

export default function SettingsPage() {
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfileSettings>({
    name: '',
    email: '',
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: false,
    sessionReminders: true,
    progressUpdates: false,
  });
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    voice: 'female',
    volume: 50, // Default volume percentage
    playbackSpeed: 1, // Default playback speed
  });
  const [isClient, setIsClient] = useState(false);

  // Load settings from localStorage on mount (client-side only)
  useEffect(() => {
    setIsClient(true); // Indicates component has mounted on client

    const storedProfile = localStorage.getItem('empathyAiProfileSettings');
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    }

    const storedNotifications = localStorage.getItem('empathyAiNotificationSettings');
    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications));
    }

    const storedAudio = localStorage.getItem('empathyAiAudioSettings');
    if (storedAudio) {
      const parsedAudio = JSON.parse(storedAudio);
      // Merge ensuring new fields have defaults if not in old localStorage data
      setAudioSettings(prev => ({ ...prev, ...parsedAudio }));
    }
  }, []);

  // Save profile settings to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('empathyAiProfileSettings', JSON.stringify(profile));
    }
  }, [profile, isClient]);

  // Save notification settings to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('empathyAiNotificationSettings', JSON.stringify(notifications));
    }
  }, [notifications, isClient]);

  // Save audio settings to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('empathyAiAudioSettings', JSON.stringify(audioSettings));
    }
  }, [audioSettings, isClient]);

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    // localStorage saving is handled by the useEffect hook for `profile`
    toast({
      title: "Profile Updated",
      description: "Your profile settings have been saved locally.",
    });
  };

  const getNotificationLabel = (key: keyof NotificationSettings) => {
    switch (key) {
      case 'emailNotifications': return 'Email Notifications';
      case 'sessionReminders': return 'Session Reminders';
      case 'progressUpdates': return 'Progress Updates';
      default: return '';
    }
  };
  
  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Notifications Updated",
      description: `Setting for "${getNotificationLabel(key)}" has been ${value ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleVoiceChange = (newVoice: VoiceGender) => {
    setAudioSettings(prev => ({ ...prev, voice: newVoice }));
    toast({
      title: "Voice Preference Updated",
      description: `AI voice set to ${newVoice}. This will apply to new AI responses.`,
    });
  };

  const handleVolumeChange = (volumeValue: number) => { // volumeValue is 0-1 from AudioControls
    setAudioSettings(prev => ({ ...prev, volume: Math.round(volumeValue * 100) }));
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    setAudioSettings(prev => ({ ...prev, playbackSpeed: speed }));
  };
  
  if (!isClient) {
    return (
        <AppShell>
             <div className="space-y-10 max-w-2xl mx-auto">
                 <header className="text-center">
                    <h1 className="text-3xl font-bold text-primary">Settings</h1>
                    <p className="text-muted-foreground mt-2">Loading your preferences...</p>
                </header>
            </div>
        </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-10 max-w-2xl mx-auto">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-primary">Settings</h1>
          <p className="text-muted-foreground mt-2">Customize your EmpathyAI experience.</p>
        </header>

        <AudioControls
          initialVoice={audioSettings.voice}
          onVoiceChange={handleVoiceChange}
          initialVolume={audioSettings.volume} 
          onVolumeChange={handleVolumeChange} 
          initialPlaybackSpeed={audioSettings.playbackSpeed}
          onPlaybackSpeedChange={handlePlaybackSpeedChange}
          onToggleRelaxationExercise={() => { /* Handled on TherapyPage */ }}
          isRelaxationExercisePlaying={false} 
        />

        <Card className="shadow-lg border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <UserCircle className="h-7 w-7 text-primary" />
              Profile Management
            </CardTitle>
            <CardDescription>Manage your account details. Changes are saved locally in your browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileInputChange}
                  placeholder="Your Name"
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleProfileInputChange}
                  placeholder="your@email.com"
                  className="text-base"
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                <Save className="mr-2 h-5 w-5" /> Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Bell className="h-7 w-7 text-primary" />
              Notification Settings
            </CardTitle>
            <CardDescription>Control how you receive updates. Preferences are saved locally.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {(Object.keys(notifications) as Array<keyof NotificationSettings>).map((key) => (
              <div key={key} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg shadow-sm">
                <Label htmlFor={key} className="text-base cursor-pointer">
                  {getNotificationLabel(key)}
                </Label>
                <Switch
                  id={key}
                  checked={notifications[key]}
                  onCheckedChange={(checked) => handleNotificationChange(key, checked)}
                  aria-label={getNotificationLabel(key)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}
