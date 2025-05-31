
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, X as LucideX, Loader2 } from 'lucide-react';
import type { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  messages: ChatMessage[]; // Kept for potential future use (e.g. transcript)
  onSendMessage: (messageText: string) => Promise<void>;
  isAiProcessingMessageVisible: boolean; // Kept for potential future use
  isAiAudioPlaying: boolean;
  onInterruptAiAudio: () => void;
  isAiProcessingResponse: boolean; 
}

export function ChatInterface({
  onSendMessage,
  isAiAudioPlaying,
  onInterruptAiAudio,
  isAiProcessingResponse,
}: ChatInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const currentRecognitionInstance = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);


  const stopListening = useCallback((stopRecognitionInstance = true) => {
    if (stopRecognitionInstance && currentRecognitionInstance.current) {
      try {
        currentRecognitionInstance.current.onstart = null;
        currentRecognitionInstance.current.onresult = null;
        currentRecognitionInstance.current.onerror = null;
        currentRecognitionInstance.current.onend = null;
        currentRecognitionInstance.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      currentRecognitionInstance.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    // AudioContext is tricky to fully clean up without closing, 
    // but stopping tracks is the main part for microphone access.
    // We'll close it on unmount.

    setIsListening(false);
  }, []);


  const handleSpeechResult = useCallback(async (event: SpeechRecognitionEvent) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }
    if (finalTranscript.trim()) {
      await onSendMessage(finalTranscript.trim());
    }
  }, [onSendMessage]);

  const startListening = useCallback(async () => {
    if (isListening || isAiProcessingResponse) return;

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ variant: "destructive", title: "Speech Recognition Not Supported", description: "Your browser does not support speech recognition." });
      return;
    }

    // Ensure any previous instance is fully stopped.
    if (currentRecognitionInstance.current) {
      stopListening(true);
    }
    
    // Attempt to get microphone access first
    try {
      if (!mediaStreamRef.current || !mediaStreamRef.current.active) {
        if (mediaStreamRef.current) { // Clean up old stream if any
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err: any) {
        console.error("Error getting media stream for recognition:", err);
        let desc = "Could not access microphone.";
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            desc = "Microphone access denied. Please allow microphone access in browser settings.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            desc = "No microphone found. Please ensure a microphone is connected.";
        }
        toast({ variant: "destructive", title: "Microphone Error", description: desc});
        stopListening(false); // Stop media stream if it started, but don't try to stop recognition if it never began
        return;
    }


    const recognition = new SpeechRecognition();
    currentRecognitionInstance.current = recognition;

    recognition.continuous = false; 
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      if (recognition === currentRecognitionInstance.current) {
        setIsListening(true);
      }
    };

    recognition.onresult = (event) => {
      if (recognition === currentRecognitionInstance.current) {
        handleSpeechResult(event);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (recognition === currentRecognitionInstance.current) {
        let toastErrorMessage = "An unknown speech error occurred.";
        if (event.error === 'no-speech') {
          toastErrorMessage = "No speech was detected. Please try again.";
        } else if (event.error === 'audio-capture') {
          toastErrorMessage = "Audio capture failed. Check microphone connection.";
        } else if (event.error === 'not-allowed') {
          toastErrorMessage = "Microphone access denied. Please allow it in browser settings.";
        } else if (event.error === 'network') {
            toastErrorMessage = "A network error occurred with speech recognition. Check connection.";
        }
        console.warn("Speech recognition error:", event.error, event.message);
        toast({ variant: "destructive", title: "Speech Error", description: toastErrorMessage });
        // onend will be called which calls stopListening
      }
    };
    
    recognition.onend = () => {
      // Check if this is the current instance before cleaning up.
      // This prevents race conditions if a new recognition starts quickly.
      if (recognition === currentRecognitionInstance.current) {
        stopListening(true); // stopListening will set isListening to false
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Error starting speech recognition:", e);
      toast({ variant: "destructive", title: "Mic Error", description: "Could not start microphone."})
      stopListening(true); // Full cleanup
    }
  }, [isListening, isAiProcessingResponse, toast, handleSpeechResult, stopListening]);


  const handleMicClick = () => {
    if (isListening) {
      stopListening(true); 
    } else {
      if (isAiAudioPlaying) {
        onInterruptAiAudio(); 
      }
      if (!isAiProcessingResponse) {
        startListening();
      }
    }
  };
  
  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      stopListening(true); // Ensure speech recognition is stopped
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(err => console.warn("Error closing AudioContext on unmount:", err));
        audioContextRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopListening]); // stopListening is stable

  let orbAnimationClass = 'animate-breathe';
  if (isListening) {
    orbAnimationClass = 'animate-listen-pulse';
  } else if (isAiAudioPlaying) {
    orbAnimationClass = 'animate-speak-pulse';
  } else if (isAiProcessingResponse) {
    orbAnimationClass = 'animate-processing-pulse';
  }

  return (
    <div className="flex flex-col h-[600px] w-full bg-zinc-900 items-center justify-between p-6 rounded-lg shadow-2xl relative overflow-hidden">
      {/* Orb */}
      <div className="flex-grow flex items-center justify-center w-full">
        <div 
          className={cn(
            "w-56 h-56 md:w-64 md:h-64 rounded-full relative transition-all duration-500 ease-in-out",
            orbAnimationClass
          )}
          style={{
            background: 'radial-gradient(circle at center, hsla(220, 100%, 95%, 0.7) 0%, hsla(210, 100%, 80%, 0.5) 40%, hsla(var(--primary), 0.3) 70%, transparent 85%)',
            // boxShadow is now primarily handled by the animation classes in globals.css
          }}
        >
          {isAiProcessingResponse && !isListening && !isAiAudioPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-blue-300 animate-spin opacity-70" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-6 pb-4 pt-8">
        <Button
          type="button"
          onClick={handleMicClick}
          disabled={isAiProcessingResponse && !isListening}
          aria-label={isListening ? "Stop listening" : "Start listening"}
          className={cn(
            "rounded-full w-20 h-20 flex items-center justify-center text-white transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-opacity-50",
            isListening 
              ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 focus:ring-red-400" 
              : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 focus:ring-blue-500",
            (isAiProcessingResponse && !isListening) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isListening ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
        </Button>
        
        {isListening && (
            <Button
              type="button"
              onClick={() => stopListening(true)}
              aria-label="Cancel listening"
              className="rounded-full w-16 h-16 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 text-white shadow-md hover:shadow-zinc-700/40 transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-zinc-600 focus:ring-opacity-50"
            >
              <LucideX className="h-8 w-8" />
            </Button>
        )}
      </div>
    </div>
  );
}
