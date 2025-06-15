import { AudioRecorder, AudioRecorderRef } from "../AudioRecorder";

interface AudioRecorderSectionProps {
  showAudioRecorder: boolean;
  isRecording: boolean;
  audioRecorderRef: React.RefObject<AudioRecorderRef>;
  onSendAudio: (audioBlob: Blob, duration: number) => Promise<void>;
  onCancel: () => void;
  onRecordingStateChange: (isRecording: boolean) => void;
}

export function AudioRecorderSection({
  showAudioRecorder,
  isRecording,
  audioRecorderRef,
  onSendAudio,
  onCancel,
  onRecordingStateChange,
}: AudioRecorderSectionProps) {
  if (!showAudioRecorder) return null;

  return (
    <div className="mb-4 border rounded-lg p-3 bg-gray-50">
      <AudioRecorder
        ref={audioRecorderRef}
        onSendAudio={onSendAudio}
        onCancel={onCancel}
        onRecordingStateChange={onRecordingStateChange}
        autoStart={isRecording}
      />
    </div>
  );
}