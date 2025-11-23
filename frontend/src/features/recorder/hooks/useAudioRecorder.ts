import { useState, useRef, useEffect } from 'react';

export interface AudioRecording {
  id: string;
  url: string;
  timestamp: Date;
  name: string;
}

export const useAudioRecorder = () => {
  const [micActive, setMicActive] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devs) => {
        // Filter devices to only include audioinput with non-empty deviceId
        const audioInputs = devs.filter(
          (dev) => dev.kind === 'audioinput' && dev.deviceId !== ''
        );
        setDevices(audioInputs);
        if (audioInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      })
      .catch((err) => console.error('Error enumerando dispositivos:', err));
  }, [selectedDeviceId]);

  const activateMic = async () => {
    if (micActive) return;
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const newRecording: AudioRecording = {
          id: crypto.randomUUID(),
          url,
          timestamp: new Date(),
          name: `Grabación ${recordings.length + 1}`
        };
        setRecordings(prev => [...prev, newRecording]);
        chunksRef.current = [];
      };

      updateVolume();
      setMicActive(true);
    } catch (err) {
      console.error('Error al activar el micrófono:', err);
    }
  };

  const deactivateMic = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaRecorderRef.current) {
      if (recording) {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    setMicActive(false);
    setVolume(0);
    setRecording(false);
  };

  const updateVolume = () => {
    if (!analyserRef.current) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    setVolume(avg);
    animationFrameRef.current = requestAnimationFrame(updateVolume);
  };

  const startRecording = () => {
    if (!micActive || recording || !mediaRecorderRef.current) return;
    chunksRef.current = [];
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (!recording || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => {
      const recording = prev.find(r => r.id === id);
      if (recording) {
        URL.revokeObjectURL(recording.url);
      }
      return prev.filter(r => r.id !== id);
    });
  };

  return {
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
  };
};