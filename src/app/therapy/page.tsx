
'use client';

import { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/AppShell';
import { UserInputForm } from '@/components/therapy/UserInputForm';
import { ChatInterface } from '@/components/therapy/ChatInterface';
import { AudioControls, type VoiceGender } from '@/components/therapy/AudioControls';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Info, Sparkles, User, ListChecks, Paintbrush2, Heart, Smile } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, PersonalizedTherapyOutput, AdaptedLanguageStyle, ChatMessage } from '@/types';

import { personalizeTherapyRecommendations } from '@/ai/flows/personalize-therapy-recommendations';
import { adaptLanguageAndTechniques } from '@/ai/flows/adapt-language-and-techniques';
import { generateEmpatheticResponse } from '@/ai/flows/generate-empathetic-responses';
import { generateSpeech } from '@/ai/flows/generate-speech-flow';

type TherapyStage = 'initialData' | 'recommendations' | 'chat';

// TODO: Replace this with your desired relaxation audio file URL
const PLACEHOLDER_RELAXATION_AUDIO_URL = "https://www.soundjay.com/nature/sounds/river-1.mp3";

export default function TherapyPage() {
  const [stage, setStage] = useState<TherapyStage>('initialData');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [personalizedSessionInfo, setPersonalizedSessionInfo] = useState<PersonalizedTherapyOutput | null>(null);
  const [identifiedNeeds, setIdentifiedNeeds] = useState<string[]>([]);
  const [adaptedStyle, setAdaptedStyle] = useState<AdaptedLanguageStyle | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [empathyLevel, setEmpathyLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // For initial profile submission

  // AI Turn States
  const [isAiProcessingResponse, setIsAiProcessingResponse] = useState(false);
  const [isAiAudioActuallyPlaying, setIsAiAudioActuallyPlaying] = useState(false);
  
  // AI Speech Audio
  const [currentVoiceGender, setCurrentVoiceGender] = useState<VoiceGender>('female');
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const aiAudioRef = useRef<HTMLAudioElement>(null);
  const [currentVolume, setCurrentVolume] = useState(0.5); 
  const [currentPlaybackSpeed, setCurrentPlaybackSpeed] = useState(1);

  // Relaxation Exercise Audio
  const relaxationAudioRef = useRef<HTMLAudioElement>(null);
  const [isRelaxationExercisePlaying, setIsRelaxationExercisePlaying] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const audioElement = aiAudioRef.current;
    if (audioElement) {
      const handlePlay = () => setIsAiAudioActuallyPlaying(true);
      const handleEnd = () => {
        setAudioDataUri(null); 
        setIsAiAudioActuallyPlaying(false);
      };
      const handlePause = () => {
        if (audioDataUri === null || audioElement.src === '' || !audioElement.src || audioElement.ended) {
            setIsAiAudioActuallyPlaying(false);
        }
      };
      const handleError = (e: Event) => {
        setAudioDataUri(null);
        setIsAiAudioActuallyPlaying(false);
        const errorEvent = e as ErrorEvent;
        console.error("AI Audio Error:", errorEvent.message || e);
        toast({ variant: "destructive", title: "Audio Playback Error", description: "Could not play the AI's voice." });
      };

      audioElement.addEventListener('play', handlePlay);
      audioElement.addEventListener('playing', handlePlay);
      audioElement.addEventListener('ended', handleEnd);
      audioElement.addEventListener('pause', handlePause);
      audioElement.addEventListener('error', handleError);
      
      audioElement.volume = currentVolume;
      audioElement.playbackRate = currentPlaybackSpeed;

      if (audioDataUri && audioElement.src !== audioDataUri) {
        audioElement.src = audioDataUri;
        audioElement.load(); 
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (error.name === 'AbortError') {
              console.log("AI audio playback aborted (expected interruption).");
            } else {
              console.error("Error playing AI audio:", error);
            }
            setIsAiAudioActuallyPlaying(false); 
          });
        }
      } else if (!audioDataUri && !audioElement.paused) {
        audioElement.pause();
        if (audioElement.currentSrc && audioElement.currentSrc !== '') {
          audioElement.removeAttribute('src'); 
          audioElement.load(); 
        }
      }
      
      return () => {
        audioElement.removeEventListener('play', handlePlay);
        audioElement.removeEventListener('playing', handlePlay);
        audioElement.removeEventListener('ended', handleEnd);
        audioElement.removeEventListener('pause', handlePause);
        audioElement.removeEventListener('error', handleError);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioDataUri, currentVolume, currentPlaybackSpeed]);


  useEffect(() => {
    const audioElement = relaxationAudioRef.current;
    if (audioElement) {
      const handlePlay = () => setIsRelaxationExercisePlaying(true);
      const handleEnd = () => setIsRelaxationExercisePlaying(false); 
      const handlePause = () => setIsRelaxationExercisePlaying(false);
      const handleError = () => {
        setIsRelaxationExercisePlaying(false);
        toast({ variant: "destructive", title: "Audio Playback Error", description: "Could not play the relaxation exercise." });
      };

      audioElement.addEventListener('play', handlePlay);
      audioElement.addEventListener('ended', handleEnd);
      audioElement.addEventListener('pause', handlePause);
      audioElement.addEventListener('error', handleError);
      audioElement.volume = currentVolume; 

      return () => {
        audioElement.removeEventListener('play', handlePlay);
        audioElement.removeEventListener('ended', handleEnd);
        audioElement.removeEventListener('pause', handlePause);
        audioElement.removeEventListener('error', handleError);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVolume]); 

  const stopAiSpeech = () => {
    if (aiAudioRef.current && !aiAudioRef.current.paused) {
      aiAudioRef.current.pause();
    }
    setAudioDataUri(null); 
    setIsAiAudioActuallyPlaying(false); 
  };

  const stopRelaxationExercise = () => {
    if (relaxationAudioRef.current && !relaxationAudioRef.current.paused) {
      relaxationAudioRef.current.pause();
    }
    setIsRelaxationExercisePlaying(false);
  };

  const playAiSpeech = async (text: string, voice: VoiceGender) => {
    stopRelaxationExercise(); 
    stopAiSpeech(); 
    
    try {
      const speechResponse = await generateSpeech({ text, voiceGender: voice });
      setAudioDataUri(speechResponse.audioDataUri); 
    } catch (speechError) {
      console.error("Error generating speech:", speechError);
      toast({ variant: "destructive", title: "Speech Generation Error", description: "Could not generate audio for the AI response." });
      setAudioDataUri(null);
      setIsAiAudioActuallyPlaying(false);
    } 
  };

  const handleProfileSubmit = async (data: UserProfile) => {
    setIsLoading(true);
    setIsAiProcessingResponse(true); 
    setUserProfile(data); 
    
    stopAiSpeech();
    stopRelaxationExercise();

    try {
      const adaptInput = { ...data, additionalContext: data.background };

      const [recoOutput, adaptResponse] = await Promise.all([
        personalizeTherapyRecommendations(data),
        adaptLanguageAndTechniques(adaptInput),
      ]);

      setPersonalizedSessionInfo(recoOutput);
      setIdentifiedNeeds(recoOutput.identifiedTherapeuticNeeds);
      setAdaptedStyle(adaptResponse);
      
      const needsText = recoOutput.identifiedTherapeuticNeeds.length > 0 
        ? `Based on your information, I've identified that focusing on areas such as ${recoOutput.identifiedTherapeuticNeeds.join(', ')} could be beneficial.`
        : "Thank you for sharing. I'm reviewing your information to best support you.";

      const initialAiText = `Thank you for sharing. ${needsText}\n\nHere are some initial thoughts on how we might proceed:\n${recoOutput.recommendations}\n\nOur approach will be as follows: ${adaptResponse.adaptedLanguage}\n\nFeel free to share what's on your mind to begin our conversation.`;
      
      setMessages([{
        id: crypto.randomUUID(),
        sender: 'ai',
        text: initialAiText,
        timestamp: new Date(),
      }]);

      setStage('chat');
      toast({ title: "Profile processed", description: "Personalized therapy session ready." });
      setIsLoading(false);
      setIsAiProcessingResponse(false); 

      await playAiSpeech(initialAiText, currentVoiceGender);

    } catch (error) {
      console.error("Error processing profile:", error);
      let errorMessage = "Could not process your profile. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("503") || error.message.toLowerCase().includes("model is overloaded")) {
          errorMessage = "The AI service is temporarily busy. Please try submitting your profile again in a few moments.";
        }
      }
      toast({ variant: "destructive", title: "Profile Processing Error", description: errorMessage });
      stopAiSpeech(); 
      setIsAiProcessingResponse(false); 
      setIsAiAudioActuallyPlaying(false);
      setIsLoading(false); 
      setStage('initialData'); 
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!userProfile || !messageText.trim()) return;

    const newUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    
    stopAiSpeech(); 
    stopRelaxationExercise();
    setIsAiProcessingResponse(true); 

    try {
      let apiAnxietyLevel: 'Low' | 'High' = 'Low';
      if (userProfile.anxietyLevel === 'Medium' || userProfile.anxietyLevel === 'High') {
        apiAnxietyLevel = 'High';
      }
      
      const empatheticResponseInput = {
        age: userProfile.age,
        genderIdentity: userProfile.genderIdentity,
        ethnicity: userProfile.ethnicity,
        vulnerableScore: userProfile.vulnerableScore,
        anxietyLevel: apiAnxietyLevel,
        breakupType: userProfile.breakupType,
        background: userProfile.background, 
        currentMessage: messageText,
        empathyLevel: empathyLevel,
        chatHistory: messages.slice(-4).map(msg => ({role: msg.sender as 'user' | 'ai', text: msg.text})),
      };

      const aiResponse = await generateEmpatheticResponse(empatheticResponseInput);
      
      setIsAiProcessingResponse(false); 

      const newAiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: aiResponse.response,
        detectedSentiment: aiResponse.detectedSentiment,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newAiMessage]);
      setEmpathyLevel(aiResponse.updatedEmpathyLevel);

      await playAiSpeech(aiResponse.response, currentVoiceGender);

    } catch (error) {
      console.error("Error getting AI response:", error);
      let errorText = "I'm having a little trouble connecting right now. Please try sending your message again in a moment.";
      let toastTitle = "AI Response Error";
      let toastDescription = "Could not get AI response.";

      if (error instanceof Error) {
        if (error.message.includes("503") || error.message.toLowerCase().includes("model is overloaded")) {
          errorText = "I'm currently experiencing high demand and can't process your message right now. Please try again in a few moments.";
          toastTitle = "AI Service Busy";
          toastDescription = "The AI service is temporarily overloaded. Please try again shortly.";
        }
      }

      const errorAiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: errorText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorAiMessage]);
      toast({ variant: "destructive", title: toastTitle, description: toastDescription });
      
      stopAiSpeech(); 
      setIsAiProcessingResponse(false); 
      setIsAiAudioActuallyPlaying(false); 
    }
  };

  const handleVoiceGenderChange = (gender: VoiceGender) => {
    setCurrentVoiceGender(gender);
    stopAiSpeech(); 
  };

  const handleVolumeChange = (volume: number) => {
    setCurrentVolume(volume);
    if (aiAudioRef.current) aiAudioRef.current.volume = volume;
    if (relaxationAudioRef.current) relaxationAudioRef.current.volume = volume;
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    setCurrentPlaybackSpeed(speed);
    if (aiAudioRef.current) aiAudioRef.current.playbackRate = speed;
  };
  
  const handleToggleRelaxationExercise = () => {
    const audio = relaxationAudioRef.current;
    if (!audio) return;

    if (isRelaxationExercisePlaying) {
      audio.pause();
    } else {
      stopAiSpeech(); 
      if (audio.src !== PLACEHOLDER_RELAXATION_AUDIO_URL) {
        audio.src = PLACEHOLDER_RELAXATION_AUDIO_URL;
        audio.load(); 
      }
      audio.play().catch(err => {
        console.error("Error playing relaxation exercise:", err);
        toast({variant: "destructive", title: "Playback Error", description: "Could not play relaxation exercise."});
        setIsRelaxationExercisePlaying(false); 
      });
    }
  };

  const showProcessingMessage = isAiProcessingResponse && messages.length > 0 && messages[messages.length-1]?.sender === 'user';

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-primary">AI Therapy Session</h1>
          <p className="text-muted-foreground mt-2">A safe space for you to explore your thoughts and feelings.</p>
        </header>

        {stage === 'initialData' && (
          <UserInputForm onSubmit={handleProfileSubmit} isLoading={isLoading} />
        )}
        
        {isLoading && stage !== 'initialData' && ( 
          <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Personalizing your session...</p>
          </div>
        )}

        {stage === 'chat' && userProfile && (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
               <ChatInterface 
                 messages={messages} 
                 onSendMessage={handleSendMessage} 
                 isAiProcessingMessageVisible={showProcessingMessage}
                 isAiAudioPlaying={isAiAudioActuallyPlaying}
                 onInterruptAiAudio={stopAiSpeech}
                 isAiProcessingResponse={isAiProcessingResponse}
                />
            </div>
            <div className="space-y-6 lg:sticky lg:top-24">
              <AudioControls 
                initialVoice={currentVoiceGender}
                onVoiceChange={handleVoiceGenderChange}
                onVolumeChange={handleVolumeChange}
                onPlaybackSpeedChange={handlePlaybackSpeedChange}
                onToggleRelaxationExercise={handleToggleRelaxationExercise}
                isRelaxationExercisePlaying={isRelaxationExercisePlaying}
                initialVolume={currentVolume * 100}
                initialPlaybackSpeed={currentPlaybackSpeed}
              />
               <Card className="shadow-md border-border/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-primary"/> Session Context</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Profile:</strong> Age {userProfile.age}, {userProfile.genderIdentity}, Anxiety: {userProfile.anxietyLevel}.</p>
                  </div>
                  
                  {identifiedNeeds.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <p><strong>AI Focus:</strong> {identifiedNeeds.join(', ')}</p>
                    </div>
                  )}
                  {personalizedSessionInfo && (
                     <div className="flex items-start gap-2">
                        <ListChecks className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p><strong>Recommendations:</strong> <span className="text-muted-foreground">{personalizedSessionInfo.recommendations.substring(0,70)}...</span></p>
                    </div>
                  )}
                  {adaptedStyle && (
                    <div className="flex items-start gap-2">
                        <Paintbrush2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p><strong>AI Style:</strong> <span className="text-muted-foreground">{adaptedStyle.adaptedLanguage.substring(0,70)}...</span></p>
                    </div>
                  )}
                   <div className="flex items-start gap-2">
                      <Heart className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p><strong>Empathy Level:</strong> {empathyLevel}/5</p>
                   </div>
                  {messages.slice(-1)[0]?.sender === 'ai' && messages.slice(-1)[0].detectedSentiment && (
                     <div className="flex items-start gap-2">
                        <Smile className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <p><strong>Detected Sentiment:</strong> {messages.slice(-1)[0].detectedSentiment}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
      <audio ref={aiAudioRef} hidden />
      <audio ref={relaxationAudioRef} hidden loop />
    </AppShell>
  );
}
