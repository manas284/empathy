
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Mic, MicOff } from 'lucide-react';
import type { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (messageText: string) => Promise<void>;
  isAiProcessingMessageVisible: boolean;
  isAiAudioPlaying: boolean;
  onInterruptAiAudio: () => void;
  isAiProcessingResponse: boolean; // New prop to disable mic if AI is thinking
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
    // Ensure AudioContext is closed only if it's not already closed, and ideally when the component unmounts
    // or when it's certain it won't be needed again soon. Closing it aggressively might impact quick restarts.
    // For now, let's keep it open during the session and close on unmount.
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
        analyserRef.current.fftSize = 256; // You can adjust this for visual detail
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
      }
      if (!mediaStreamRef.current || mediaStreamRef.current.getTracks().every(track => track.readyState === 'ended')) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      if (!sourceRef.current || !sourceRef.current.mediaStream?.active) {
         if(sourceRef.current) sourceRef.current.disconnect();
         sourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
         sourceRef.current.connect(analyserRef.current);
      }
      drawVisualizer();
    } catch (err) {
      console.error("Error setting up visualizer or getting media stream:", err);
      toast({ variant: "destructive", title: "Visualizer Error", description: "Could not access microphone for visualizer."});
      stopListening();
    }
  }, [toast, stopListening, drawVisualizer]);


  const startListening = useCallback(() => {
    if (isListening || isAiProcessingResponse) return; // Don't start if already listening or AI is processing

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ variant: "destructive", title: "Speech Recognition Not Supported", description: "Your browser does not support speech recognition." });
      return;
    }

    // Ensure any previous instance is fully stopped and cleaned up by its own event handlers
    if (currentRecognitionInstance.current) {
        try { currentRecognitionInstance.current.stop(); } catch (e) { /* ignore if already stopped */ }
    }
    
    const recognition = new SpeechRecognition();
    currentRecognitionInstance.current = recognition; // Store this specific instance

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      if (recognition === currentRecognitionInstance.current) { // Check if this is the active instance
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
        console.warn("Speech recognition error", event.error, event); // Changed to warn for network/no-speech
        let errorMessage = "An unknown speech error occurred.";
        if (event.error === 'no-speech') {
          errorMessage = "No speech was detected. Please try again.";
        } else if (event.error === 'audio-capture') {
          errorMessage = "Audio capture failed. Ensure microphone is connected and permission is granted.";
        } else if (event.error === 'not-allowed') {
          errorMessage = "Microphone access denied. Please allow microphone access in browser settings.";
        } else if (event.error === 'network') {
          errorMessage = "A network error occurred with the browser's speech recognition service. Please check your connection or try again later.";
        }
        toast({ variant: "destructive", title: "Speech Error", description: errorMessage });
        // onend will handle cleanup
      }
    };

    recognition.onend = () => {
      if (recognition === currentRecognitionInstance.current) { // Only cleanup if this is the instance that ended
        stopListening(); // This now also sets isListening to false
        currentRecognitionInstance.current = null;
      }
    };
    
    try {
        recognition.start();
    } catch (e) {
        console.error("Error starting speech recognition:", e);
        toast({ variant: "destructive", title: "Mic Error", description: "Could not start microphone."})
        stopListening(); // Ensure cleanup
    }
  }, [isListening, toast, handleSpeechResult, stopListening, setupVisualizer, isAiProcessingResponse]);


  const handleMicClick = () => {
    if (isListening) {
      stopListening(); // User wants to stop listening
    } else { // User wants to start listening
      if (isAiAudioPlaying) {
        onInterruptAiAudio();
      }
      if (!isAiProcessingResponse) { // Only start if AI isn't currently processing a response
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
    // Cleanup on component unmount
    return () => {
      if (currentRecognitionInstance.current) {
        currentRecognitionInstance.current.onstart = null;
        currentRecognitionInstance.current.onresult = null;
        currentRecognitionInstance.current.onerror = null;
        currentRecognitionInstance.current.onend = null;
        try { currentRecognitionInstance.current.stop(); } catch(e) { /* ignore */ }
        currentRecognitionInstance.current = null;
      }
      stopListening(); // General cleanup for visualizer and media stream
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, [stopListening]);

  return (
    <div className={cn("flex flex-col border rounded-lg shadow-lg bg-card", isListening ? "h-[650px]" : "h-[600px]")}>
      {isListening && (
        <div className="p-2 border-b">
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
      <div className="border-t p-4 flex items-center justify-center bg-background">
        <Button
          type="button"
          size="lg"
          variant={isListening ? "destructive" : "outline"}
          onClick={handleMicClick}
          disabled={isAiProcessingResponse && !isListening}
          aria-label={isListening ? "Stop listening" : "Start listening"}
          className="rounded-full w-20 h-20 flex items-center justify-center" // Made button larger and circular
        >
          {isListening ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
        </Button>
      </div>
    </div>
  );
}
