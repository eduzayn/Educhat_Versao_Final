import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/shared/ui/ui/button";

interface AudioMessageProps {
  audioUrl: string;
  duration?: number;
  isFromContact: boolean;
}

export function AudioMessage({ audioUrl, duration, isFromContact }: AudioMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (!isLoaded) {
      setIsLoaded(true);
      return;
    }
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const progressPercentage = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg max-w-sm ${
      isFromContact 
        ? 'bg-gray-100 text-gray-900' 
        : 'bg-blue-600 text-white'
    }`}>
      {isLoaded && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
        />
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlayPause}
        className={`w-8 h-8 p-0 rounded-full ${
          isFromContact
            ? 'hover:bg-gray-200 text-gray-700'
            : 'hover:bg-blue-500 text-white'
        }`}
      >
        {isLoaded && isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Volume2 className="w-3 h-3 opacity-70" />
          <span className="text-xs opacity-70">
            {isLoaded ? 'Áudio' : 'Clique para carregar áudio'}
          </span>
        </div>
        
        <div className="relative">
          <div className={`w-full h-1 rounded-full ${
            isFromContact ? 'bg-gray-300' : 'bg-blue-400'
          }`}>
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                isFromContact ? 'bg-gray-600' : 'bg-white'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-between text-xs opacity-70 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>
    </div>
  );
}