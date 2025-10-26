import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, TrendingUp, Waves, Activity, Key, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';

interface ControlPanelProps {
    isRecording: boolean;
    onToggleRecording: () => void;
    audioData: {
        loudnessDelta: number;
        spectralCentroidDelta: number;
        spectralFlux: number;
        key: string;
        keyConfidence?: number;
    };
    pointDuration: number;
    onPointDurationChange: (duration: number) => void;
}

export default function ControlPanel({
    isRecording,
    onToggleRecording,
    audioData,
    pointDuration,
    onPointDurationChange
}: ControlPanelProps) {
    const [previousKey, setPreviousKey] = useState<string>('N/A');
    const [keyChangeAnimation, setKeyChangeAnimation] = useState(false);

    useEffect(() => {
        if (audioData.key !== previousKey && audioData.key !== 'Detecting...' && audioData.key !== 'N/A') {
            setKeyChangeAnimation(true);
            setPreviousKey(audioData.key);
            
            const timer = setTimeout(() => {
                setKeyChangeAnimation(false);
            }, 1000);
            
            return () => clearTimeout(timer);
        }
    }, [audioData.key, previousKey]);

    const formatLoudnessDelta = (delta: number) => {
        const sign = delta > 0 ? '+' : '';
        return delta !== 0 ? `${sign}${delta.toFixed(2)} dB` : 'N/A';
    };

    const formatSpectralCentroidDelta = (delta: number) => {
        const sign = delta > 0 ? '+' : '';
        return delta !== 0 ? `${sign}${delta.toFixed(1)} Hz` : 'N/A';
    };

    const formatSpectralFlux = (flux: number) => {
        const sign = flux > 0 ? '+' : '';
        return flux !== 0 ? `${sign}${flux.toFixed(2)}` : 'N/A';
    };

    const getLoudnessDeltaColor = (delta: number) => {
        const absDelta = Math.abs(delta);
        if (absDelta >= 10) return 'text-red-500';
        if (absDelta >= 5) return 'text-orange-500';
        if (absDelta >= 2) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getSpectralCentroidDeltaColor = (delta: number) => {
        const absDelta = Math.abs(delta);
        if (absDelta >= 1000) return 'text-red-500';
        if (absDelta >= 500) return 'text-orange-500';
        if (absDelta >= 100) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getSpectralFluxColor = (flux: number) => {
        const absFlux = Math.abs(flux);
        if (absFlux >= 20) return 'text-red-500';
        if (absFlux >= 10) return 'text-orange-500';
        if (absFlux >= 5) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getKeyBadgeVariant = (key: string) => {
        if (key === 'Detecting...') return 'secondary';
        if (key === 'N/A') return 'outline';
        return 'default';
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.7) return 'text-green-500';
        if (confidence >= 0.4) return 'text-yellow-500';
        return 'text-orange-500';
    };

    const confidence = audioData.keyConfidence ?? 0;
    const confidencePercent = Math.round(confidence * 100);

    return (
        <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Audio Controls
                </CardTitle>
                <CardDescription>
                    Real-time audio analysis with automatic live streaming
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <Button
                        onClick={onToggleRecording}
                        variant={isRecording ? 'destructive' : 'default'}
                        size="lg"
                        className="w-full"
                    >
                        {isRecording ? (
                            <>
                                <MicOff className="mr-2 h-5 w-5" />
                                Stop Recording
                            </>
                        ) : (
                            <>
                                <Mic className="mr-2 h-5 w-5" />
                                Start Recording
                            </>
                        )}
                    </Button>

                    {isRecording && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                                Recording in progress
                            </div>
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                                Streaming live via Livepeer
                            </div>
                        </div>
                    )}
                </div>

                <Separator />

                <div className="space-y-3 rounded-lg border-2 border-border/50 bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="point-duration" className="flex items-center gap-2 text-sm font-semibold">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            Point Visibility Duration
                        </Label>
                        <Badge variant="outline" className="font-mono">
                            {pointDuration}s
                        </Badge>
                    </div>
                    <Slider
                        id="point-duration"
                        min={1}
                        max={10}
                        step={1}
                        value={[pointDuration]}
                        onValueChange={(values) => onPointDurationChange(values[0])}
                        className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                        Adjust how long each point remains visible on the 3D graph before fading out
                    </p>
                </div>

                <Separator />

                <div className={`space-y-3 rounded-lg border-2 p-4 transition-all duration-500 ${
                    keyChangeAnimation 
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' 
                        : 'border-border/50 bg-muted/30'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Key className={`h-5 w-5 transition-transform duration-500 ${
                                keyChangeAnimation ? 'scale-125 text-primary' : 'text-muted-foreground'
                            }`} />
                            <span className="text-sm font-semibold">Detected Key</span>
                        </div>
                        <Badge 
                            variant={getKeyBadgeVariant(audioData.key)}
                            className={`text-base font-bold transition-all duration-500 ${
                                keyChangeAnimation ? 'scale-110 shadow-md' : ''
                            }`}
                        >
                            {audioData.key}
                        </Badge>
                    </div>
                    
                    {audioData.key !== 'Detecting...' && audioData.key !== 'N/A' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Confidence</span>
                                <span className={`font-semibold ${getConfidenceColor(confidence)}`}>
                                    {confidencePercent}%
                                </span>
                            </div>
                            <Progress 
                                value={confidencePercent} 
                                className="h-2"
                            />
                        </div>
                    )}
                    
                    {audioData.key === 'Detecting...' && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                            Analyzing audio patterns...
                        </div>
                    )}
                </div>

                <Separator />

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Audio Metrics</h3>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <TrendingUp className="h-4 w-4" />
                                ΔLoudness
                            </div>
                            <span className={`font-mono text-sm font-medium ${getLoudnessDeltaColor(audioData.loudnessDelta)}`}>
                                {formatLoudnessDelta(audioData.loudnessDelta)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Waves className="h-4 w-4" />
                                ΔSpectral Centroid
                            </div>
                            <span className={`font-mono text-sm font-medium ${getSpectralCentroidDeltaColor(audioData.spectralCentroidDelta)}`}>
                                {formatSpectralCentroidDelta(audioData.spectralCentroidDelta)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Activity className="h-4 w-4" />
                                Spectral Flux
                            </div>
                            <span className={`font-mono text-sm font-medium ${getSpectralFluxColor(audioData.spectralFlux)}`}>
                                {formatSpectralFlux(audioData.spectralFlux)}
                            </span>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Visualization Guide</h3>
                    <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">X-Axis:</span>
                            <span>ΔLoudness - change in loudness in decibels</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">Y-Axis:</span>
                            <span>ΔSpectral Centroid - change in spectral brightness (Hz)</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">Z-Axis:</span>
                            <span>Spectral Flux - rate of change in power spectrum (signed)</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">Color:</span>
                            <span>Balanced mapping across all audio features for maximum vibrancy</span>
                        </div>
                        <div className="mt-3 rounded-md bg-muted/50 p-2">
                            <p className="text-xs">
                                Each point represents a moment in time and fades out after the configured duration. 
                                Audio is automatically encoded and streamed in real-time using Livepeer when recording is active.
                                The visualization tracks changes in loudness, spectral brightness, and spectral energy.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
