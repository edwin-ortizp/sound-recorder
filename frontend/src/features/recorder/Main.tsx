import React from 'react';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { Recorder } from './components/Recorder';
import { RecordingsList } from './components/RecordingsList';
import { Card, CardContent } from "@/components/ui/card";

const AudioRecorder: React.FC = () => {
  const {
    micActive,
    recording,
    volume,
    recordings,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    activateMic,
    deactivateMic,
    startRecording,
    stopRecording,
    deleteRecording
  } = useAudioRecorder();

  return (
    <Card className="bg-white shadow-xl">
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Recorder
            micActive={micActive}
            recording={recording}
            volume={volume}
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            onDeviceSelect={setSelectedDeviceId}
            onActivateMic={activateMic}
            onDeactivateMic={deactivateMic}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
          />
          <RecordingsList
            recordings={recordings}
            onDelete={deleteRecording}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioRecorder;