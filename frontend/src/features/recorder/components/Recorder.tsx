import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Mic, MicOff, Radio, Square, Volume2 } from "lucide-react";

interface RecorderProps {
  micActive: boolean;
  recording: boolean;
  volume: number;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onDeviceSelect: (deviceId: string) => void;
  onActivateMic: () => void;
  onDeactivateMic: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const Recorder: React.FC<RecorderProps> = ({
  micActive,
  recording,
  volume,
  devices,
  selectedDeviceId,
  onDeviceSelect,
  onActivateMic,
  onDeactivateMic,
  onStartRecording,
  onStopRecording,
}) => {
  return (
    <TooltipProvider>
      <Card className="bg-card h-full">
      <CardHeader className="pb-8">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <Radio className="h-6 w-6 text-red-500" />
          Grabadora de Audio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Selector de Micrófono */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mic className="h-5 w-5" />
            <span className="text-lg font-medium">Seleccionar Micrófono:</span>
          </div>
          <Select
            value={selectedDeviceId}
            onValueChange={onDeviceSelect}
            disabled={micActive}
          >
            <SelectTrigger className="w-full text-base py-6">
              <SelectValue placeholder="Selecciona un micrófono" />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device) => (
                <SelectItem 
                  key={device.deviceId} 
                  value={device.deviceId}
                  className="py-3 text-base"
                >
                  {device.label || `Micrófono ${device.deviceId}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Estado del Micrófono */}
        {micActive && (
          <Alert className={`${volume > 50 ? 'bg-green-100' : 'bg-slate-100'} py-6`}>
            <Volume2 className={`h-5 w-5 ${volume > 50 ? 'text-green-500' : 'text-slate-500'}`} />
            <AlertDescription className="flex items-center gap-3 text-lg ml-2">
              {volume > 50 ? 'Detectando audio' : 'Esperando audio...'}
            </AlertDescription>
          </Alert>
        )}

        {/* Controles principales */}
        <div className="space-y-6 pt-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={micActive ? onDeactivateMic : onActivateMic}
                variant={micActive ? "destructive" : "default"}
                className="w-full py-8 text-lg flex items-center justify-center gap-3"
                size="lg"
              >
                {micActive ? (
                  <>
                    <MicOff className="h-5 w-5" />
                    Desactivar Micrófono
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5" />
                    Activar Micrófono
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{micActive ? 'Detener la captura de audio del micrófono' : 'Iniciar la captura de audio del micrófono seleccionado'}</p>
            </TooltipContent>
          </Tooltip>

          {micActive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={recording ? onStopRecording : onStartRecording}
                  variant={recording ? "destructive" : "default"}
                  className={`w-full py-8 text-lg flex items-center justify-center gap-3 ${
                    recording ? 'animate-pulse' : ''
                  }`}
                  size="lg"
                >
                  {recording ? (
                    <>
                      <Square className="h-5 w-5" />
                      Detener Grabación
                    </>
                  ) : (
                    <>
                      <Radio className="h-5 w-5" />
                      Iniciar Grabación
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{recording ? 'Finalizar y guardar la grabación actual' : 'Comenzar a grabar el audio capturado'}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardContent>
      </Card>
    </TooltipProvider>
  );
};