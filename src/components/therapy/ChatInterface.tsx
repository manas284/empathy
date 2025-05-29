
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Mic, MicOff, X as LucideX } from 'lucide-react'; // Renamed X to LucideX
import type { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (messageText: string) => Promise<void>;
  isAiProcessingMessageVisible: boolean;
  isAiAudioPlaying: boolean;
  onInterruptAiAudio: () => void;
  isAiProcessingResponse: boolean;
}

export function ChatInterface({
  messages,
  onSendMessage,
  isAiProcessingMessageVisible,
  isAiAudioPlaying,
  onInterruptAiAudio,
  isAiProcessingResponse,
}: ChatInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const currentRecognitionInstance = useRef<SpeechRecognition | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const visualizerAnimationRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const stopListening = useCallback(() => {
    if (currentRecognitionInstance.current) {
      currentRecognitionInstance.current.stop();
      // onend will handle setting isListening to false and cleaning up recognitionRef
    }
    if (visualizerAnimationRef.current) {
      cancelAnimationFrame(visualizerAnimationRef.current);
      visualizerAnimationRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    // Keep AudioContext open for the session, close on unmount.
    setIsListening(false); // Explicitly set here to ensure UI updates quickly
  }, []);


  const handleSpeechResult = useCallback(async (event: SpeechRecognitionEvent) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }
    if (finalTranscript.trim()) {
      // Automatically send the message
      await onSendMessage(finalTranscript.trim());
    }
  }, [onSendMessage]);


  const drawVisualizer = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current || !dataArrayRef.current || !audioContextRef.current) {
      return;
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(console.error);
    }

    visualizerAnimationRef.current = requestAnimationFrame(drawVisualizer);
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const barWidth = (WIDTH / dataArrayRef.current.length) * 2.5;
    let x = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const barHeight = dataArrayRef.current[i] / 2;
      // Use primary theme color for visualizer bars
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }, []);

  const setupVisualizer = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
      }

      if (!mediaStreamRef.current || mediaStreamRef.current.getTracks().every(track => track.readyState === 'ended')) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      if (!sourceRef.current || !sourceRef.current.mediaStream?.active) {
         if(sourceRef.current) sourceRef.current.disconnect(); // Disconnect old source if exists
         sourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
         sourceRef.current.connect(analyserRef.current);
      }
      if(!visualizerAnimationRef.current) { // Start drawing only if not already drawing
        drawVisualizer();
      }
    } catch (err) {
      console.warn("Error setting up visualizer or getting media stream:", err);
      toast({ variant: "destructive", title: "Visualizer Error", description: "Could not access microphone for visualizer."});
      stopListening(); // This will also set isListening to false
    }
  }, [toast, stopListening, drawVisualizer]);


  const startListening = useCallback(() => {
    if (isListening || isAiProcessingResponse) return;

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ variant: "destructive", title: "Speech Recognition Not Supported", description: "Your browser does not support speech recognition." });
      return;
    }

    if (currentRecognitionInstance.current) {
        try { currentRecognitionInstance.current.stop(); } catch (e) { /* ignore */ }
    }
    
    const recognition = new SpeechRecognition();
    currentRecognitionInstance.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false; // We only care about the final transcript
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      if (recognition === currentRecognitionInstance.current) {
        setIsListening(true);
        setupVisualizer();
      }
    };

    recognition.onresult = (event) => {
      if (recognition === currentRecognitionInstance.current) {
        handleSpeechResult(event);
      }
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (recognition === currentRecognitionInstance.current) {
        let errorMessage = "An unknown speech error occurred.";
        let title = "Speech Error";
        if (event.error === 'no-speech') {
          errorMessage = "No speech was detected. Please try again.";
          console.warn("Speech recognition error: no-speech", event);
        } else if (event.error === 'audio-capture') {
          errorMessage = "Audio capture failed. Ensure microphone is connected and permission is granted.";
          console.error("Speech recognition error: audio-capture", event);
        } else if (event.error === 'not-allowed') {
          errorMessage = "Microphone access denied. Please allow microphone access in browser settings.";
          console.error("Speech recognition error: not-allowed", event);
        } else if (event.error === 'network') {
          errorMessage = "A network error occurred with the browser's speech recognition service. Please check your connection or try again later.";
          console.warn("Speech recognition error: network", event);
          title = "Network Error";
        } else {
          console.error("Speech recognition error", event.error, event);
        }
        toast({ variant: "destructive", title: title, description: errorMessage });
        // onend will handle cleanup via stopListening
      }
    };

    recognition.onend = () => {
      if (recognition === currentRecognitionInstance.current) {
        stopListening(); // This will set isListening to false and clean up visualizer
        currentRecognitionInstance.current = null;
      }
    };
    
    try {
        recognition.start();
    } catch (e) {
        console.error("Error starting speech recognition:", e);
        toast({ variant: "destructive", title: "Mic Error", description: "Could not start microphone."})
        stopListening();
    }
  }, [isListening, isAiProcessingResponse, toast, handleSpeechResult, stopListening, setupVisualizer]);


  const handleMicClick = () => {
    if (isListening) {
      stopListening();
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
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    return () => { // Cleanup on component unmount
      if (currentRecognitionInstance.current) {
        currentRecognitionInstance.current.onstart = null;
        currentRecognitionInstance.current.onresult = null;
        currentRecognitionInstance.current.onerror = null;
        currentRecognitionInstance.current.onend = null;
        try { currentRecognitionInstance.current.stop(); } catch(e) { /* ignore */ }
        currentRecognitionInstance.current = null;
      }
      stopListening();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopListening]); // Added stopListening to ensure it's the latest version

  return (
    <div className={cn(
        "flex flex-col border rounded-lg shadow-lg bg-card", 
        isListening ? "h-[650px]" : "h-[600px]" // Keep dynamic height
      )}>
      {isListening && (
        <div className="p-2 border-b bg-zinc-800"> {/* Darker background for visualizer area */}
          <canvas ref={canvasRef} width="300" height="50" className="w-full h-[50px] rounded"></canvas>
        </div>
      )}
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex items-end space-x-2',
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.sender === 'ai' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback><Bot size={18}/></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-xs lg:max-w-md p-3 rounded-lg shadow',
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted text-muted-foreground rounded-bl-none'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <p className="text-xs text-right mt-1 opacity-70">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.sender === 'user' && (
                <Avatar className="h-8 w-8">
                   <AvatarFallback><User size={18}/></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isAiProcessingMessageVisible && (
             <div className="flex items-end space-x-2 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarFallback><Bot size={18}/></AvatarFallback>
              </Avatar>
              <div className="max-w-xs lg:max-w-md p-3 rounded-lg shadow bg-muted text-muted-foreground rounded-bl-none">
                <p className="text-sm italic">EmpathyAI is processing...</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-4 flex items-center justify-center bg-zinc-900 space-x-4"> {/* Dark background for controls */}
        {!isListening && (
            <Button
              type="button"
              onClick={handleMicClick}
              disabled={isAiProcessingResponse}
              aria-label="Start listening"
              className="rounded-full w-20 h-20 flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Mic className="h-10 w-10" />
            </Button>
        )}
        {isListening && (
          <>
            <Button
              type="button"
              onClick={handleMicClick} // This will call stopListening
              aria-label="Stop listening"
              className="rounded-full w-16 h-16 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white"
            >
              <MicOff className="h-8 w-8" />
            </Button>
            <Button
              type="button"
              onClick={stopListening} // Explicitly stop listening and clean up
              aria-label="Cancel"
              className="rounded-full w-16 h-16 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 text-white"
            >
              <LucideX className="h-8 w-8" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
      