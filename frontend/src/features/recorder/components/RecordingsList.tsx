import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Trash2, Radio, Volume2 } from "lucide-react";
import type { AudioRecording } from '../hooks/useAudioRecorder';

interface RecordingsListProps {
  recordings: AudioRecording[];
  onDelete: (id: string) => void;
}

export const RecordingsList: React.FC<RecordingsListProps> = ({
  recordings,
  onDelete,
}) => {
  return (
    <TooltipProvider>
      <Card className="h-full">
      <CardHeader className="pb-8">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <Volume2 className="h-6 w-6" />
          Grabaciones ({recordings.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {recordings.length === 0 ? (
          <Alert className="py-8">
            <AlertDescription className="text-center text-lg text-muted-foreground">
              No hay grabaciones disponibles
            </AlertDescription>
          </Alert>
        ) : (
          recordings.map((recording) => (
            <div
              key={recording.id}
              className="border rounded-lg p-6 space-y-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-3">
                  <Radio className="h-5 w-5 text-primary" />
                  {recording.name}
                </h3>
                <div className="flex gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        asChild
                      >
                        <a
                          href={recording.url}
                          download={`${recording.name}.webm`}
                          className="hover:text-primary p-2"
                        >
                          <Download className="h-5 w-5" />
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Descargar grabación</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => onDelete(recording.id)}
                        className="hover:text-destructive p-2"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Eliminar grabación</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <audio 
                controls 
                src={recording.url} 
                className="w-full"
              />
              <p className="text-base text-muted-foreground pt-2">
                {new Date(recording.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </CardContent>
      </Card>
    </TooltipProvider>
  );
};