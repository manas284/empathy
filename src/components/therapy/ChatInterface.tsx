
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
  isAiProcessingMessageVisible: boolean; // True when AI is fetching/generating text (for "processing..." message)
  isAiAudioPlaying: boolean; // True when AI audio is actively playing
  onInterruptAiAudio: () => void; // Function to call to stop AI's current audio
}

export function ChatInterface({ 
  messages, 
  onSendMessage, 
  isAiProcessingMessageVisible,
  isAiAudioPlaying,
  onInterruptAiAudio
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
    setIsListening(false); 
  }, []); 

  const handleSpeechResult = useCallback((event: SpeechRecognitionEvent) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }
    if (finalTranscript.trim()) {
      onSendMessage(finalTranscript.trim());
    }
  }, [onSendMessage]);

  const drawVisualizer = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current || !dataArrayRef.current || !audioContextRef.current) {
      return;
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
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
        analyserRef.current.fftSize = 256;
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
      }
      if (!mediaStreamRef.current || mediaStreamRef.current.getTracks().every(track => track.readyState === 'ended')) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      if (!sourceRef.current || !sourceRef.current.mediaStream?.active) { 
         if(sourceRef.current) sourceRef.current.disconnect(); // Disconnect old source if any
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
    if (isListening) return;

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ variant: "destructive", title: "Speech Recognition Not Supported", description: "Your browser does not support speech recognition." });
      return;
    }
    
    if (currentRecognitionInstance.current) {
        currentRecognitionInstance.current.onresult = null;
        currentRecognitionInstance.current.onerror = null;
        currentRecognitionInstance.current.onend = null;
        currentRecognitionInstance.current.onstart = null;
        try { currentRecognitionInstance.current.stop(); } catch (e) { /* ignore */ }
        currentRecognitionInstance.current = null; 
    }
    
    const recognition = new SpeechRecognition();
    currentRecognitionInstance.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false; 
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
        } else {
          console.error("Speech recognition error", event.error, event);
        }
        toast({ variant: "destructive", title: "Speech Error", description: errorMessage });
      }
    };

    recognition.onend = () => {
      if (recognition === currentRecognitionInstance.current) {
        stopListening(); 
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
  }, [isListening, toast, handleSpeechResult, stopListening, setupVisualizer]);


  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else { // Not listening, user wants to start
      if (isAiAudioPlaying) { // If AI is speaking, interrupt it
        onInterruptAiAudio(); 
      }
      // Only start listening if AI is not in the middle of processing the *previous* turn's text response.
      if (!isAiProcessingMessageVisible) {
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
    return () => {
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
          disabled={isAiProcessingMessageVisible && !isListening} // Disable if AI is processing and user is not already trying to stop listening
          aria-label={isListening ? "Stop listening" : "Start listening"}
          className="rounded-full w-20 h-20 flex items-center justify-center"
        >
          {isListening ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
        </Button>
      </div>
    </div>
  );
}
