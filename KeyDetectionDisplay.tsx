import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getKeyBasedColor, getNoteColor } from '@/lib/audioAnalysis';

interface KeyDetectionDisplayProps {
    isRecording: boolean;
    currentKey: string;
    keyConfidence: number;
    detectedNotes: string[];
}

export default function KeyDetectionDisplay({
    isRecording,
    currentKey,
    keyConfidence,
    detectedNotes
}: KeyDetectionDisplayProps) {
    const [previousKey, setPreviousKey] = useState<string>('N/A');
    const [keyChangeFlash, setKeyChangeFlash] = useState(false);

    useEffect(() => {
        if (currentKey !== previousKey && currentKey !== 'Detecting...' && currentKey !== 'N/A') {
            setKeyChangeFlash(true);
            setPreviousKey(currentKey);
            
            const timer = setTimeout(() => {
                setKeyChangeFlash(false);
            }, 1500);
            
            return () => clearTimeout(timer);
        }
    }, [currentKey, previousKey]);

    const getKeyBadgeClasses = (key: string): string => {
        if (key === 'Detecting...') {
            return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
        }
        if (key === 'N/A') {
            return 'bg-muted/50 text-muted-foreground border-border';
        }
        if (key.includes('major')) {
            return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
        }
        return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
    };

    if (!isRecording) {
        return null;
    }

    const keyColor = getKeyBasedColor(currentKey);

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4" />
                    Real-Time Key Detection
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Key Display */}
                <div className={`rounded-lg border-2 p-4 transition-all duration-500 ${
                    keyChangeFlash 
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.02]' 
                        : 'border-border/50 bg-muted/30'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Music className={`h-6 w-6 transition-transform duration-500 ${
                                keyChangeFlash ? 'scale-125 rotate-12 text-primary' : 'text-muted-foreground'
                            }`} />
                            <span className="text-sm font-semibold">Overall Key</span>
                        </div>
                        <Badge 
                            className={`border-2 px-4 py-2 text-lg font-bold shadow-md transition-all duration-500 ${
                                getKeyBadgeClasses(currentKey)
                            } ${keyChangeFlash ? 'scale-110 shadow-xl' : ''}`}
                            style={{
                                backgroundColor: currentKey !== 'Detecting...' && currentKey !== 'N/A' 
                                    ? keyColor + '40' 
                                    : undefined,
                                borderColor: currentKey !== 'Detecting...' && currentKey !== 'N/A' 
                                    ? keyColor 
                                    : undefined,
                                color: currentKey !== 'Detecting...' && currentKey !== 'N/A' 
                                    ? keyColor 
                                    : undefined
                            }}
                        >
                            {currentKey}
                        </Badge>
                    </div>
                    
                    {currentKey !== 'Detecting...' && currentKey !== 'N/A' && (
                        <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Confidence Level</span>
                                <span className={`font-semibold ${
                                    keyConfidence >= 0.7 ? 'text-green-400' :
                                    keyConfidence >= 0.4 ? 'text-yellow-400' :
                                    'text-orange-400'
                                }`}>
                                    {Math.round(keyConfidence * 100)}%
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div 
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${keyConfidence * 100}%`,
                                        backgroundColor: keyColor
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    
                    {currentKey === 'Detecting...' && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                            Analyzing audio patterns to identify the musical key...
                        </div>
                    )}
                </div>

                {/* Detected Notes Display */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Currently Detected Notes</span>
                        {detectedNotes.length > 1 && (
                            <Badge variant="secondary" className="animate-pulse bg-primary/20 text-primary border-primary/50 text-xs font-bold">
                                {detectedNotes.length} notes active
                            </Badge>
                        )}
                        {detectedNotes.length === 1 && (
                            <Badge variant="outline" className="text-xs">
                                1 note
                            </Badge>
                        )}
                    </div>
                    
                    {detectedNotes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {detectedNotes.map((note, index) => {
                                const noteColor = getNoteColor(note);
                                return (
                                    <Badge
                                        key={`${note}-${index}`}
                                        className="animate-in fade-in zoom-in border-2 px-3 py-1.5 text-sm font-bold shadow-sm transition-all duration-200 hover:scale-105"
                                        style={{
                                            backgroundColor: noteColor + '30',
                                            borderColor: noteColor,
                                            color: noteColor
                                        }}
                                    >
                                        {note}
                                    </Badge>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-md border border-dashed border-border/50 bg-muted/20 p-4 text-center">
                            <p className="text-xs text-muted-foreground">
                                {isRecording ? 'Listening for musical notes...' : 'No notes detected'}
                            </p>
                        </div>
                    )}
                </div>

                <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
                    <p>
                        <span className="font-semibold text-foreground">Overall Key:</span> The primary musical key detected from the audio analysis.
                    </p>
                    <p className="mt-1">
                        <span className="font-semibold text-foreground">Detected Notes:</span> Individual notes currently being played or sung. Each note has its own distinct color from the legend below.
                    </p>
                    {detectedNotes.length > 1 && (
                        <p className="mt-1 font-semibold text-primary">
                            Multiple notes detected! Each is shown in its unique color.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
