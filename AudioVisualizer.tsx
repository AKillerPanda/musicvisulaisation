import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import AudioPoints from './AudioPoints';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyzeAudio, resetAudioAnalysis } from '@/lib/audioAnalysis';
import { toast } from 'sonner';
import { useStartLivepeerStream } from '@/hooks/useQueries';
import { Music } from 'lucide-react';

interface AudioVisualizerProps {
    isRecording: boolean;
    audioData: {
        loudnessDelta: number;
        spectralCentroidDelta: number;
        spectralFlux: number;
        key: string;
        keyConfidence?: number;
    };
    onAudioDataUpdate: (data: { 
        loudnessDelta: number; 
        spectralCentroidDelta: number; 
        spectralFlux: number; 
        key: string;
        keyConfidence: number;
    }, detectedNotes: string[]) => void;
    pointDuration: number;
}

export interface AudioPoint {
    x: number;
    y: number;
    z: number;
    color: string;
    timestamp: number;
}

export default function AudioVisualizer({
    isRecording,
    audioData,
    onAudioDataUpdate,
    pointDuration
}: AudioVisualizerProps) {
    const [points, setPoints] = useState<AudioPoint[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentKey, setCurrentKey] = useState<string>('N/A');
    const [keyChangeFlash, setKeyChangeFlash] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamIdRef = useRef<string | null>(null);
    const detectedNotesRef = useRef<Map<string, number>>(new Map());

    const startLivepeerStreamMutation = useStartLivepeerStream();

    // Monitor key changes for visual feedback
    useEffect(() => {
        if (audioData.key !== currentKey && audioData.key !== 'Detecting...' && audioData.key !== 'N/A') {
            setCurrentKey(audioData.key);
            setKeyChangeFlash(true);
            
            const timer = setTimeout(() => {
                setKeyChangeFlash(false);
            }, 1500);
            
            return () => clearTimeout(timer);
        }
    }, [audioData.key, currentKey]);

    useEffect(() => {
        if (isRecording) {
            startRecording();
        } else {
            stopRecording();
        }

        return () => {
            stopRecording();
        };
    }, [isRecording]);

    // Clean up points based on user-defined duration
    useEffect(() => {
        if (points.length === 0) return;

        const interval = setInterval(() => {
            const currentTime = Date.now();
            const durationMs = pointDuration * 1000;
            
            setPoints((prev) => 
                prev.filter(point => (currentTime - point.timestamp) <= durationMs)
            );
        }, 100);

        return () => clearInterval(interval);
    }, [points.length, pointDuration]);

    // Clean up old detected notes
    useEffect(() => {
        if (!isRecording) return;

        const interval = setInterval(() => {
            const currentTime = Date.now();
            const noteTimeout = 500; // Notes expire after 500ms of not being detected
            
            detectedNotesRef.current.forEach((timestamp, note) => {
                if (currentTime - timestamp > noteTimeout) {
                    detectedNotesRef.current.delete(note);
                }
            });
        }, 100);

        return () => clearInterval(interval);
    }, [isRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 4096;
            analyser.smoothingTimeConstant = 0.75;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            resetAudioAnalysis();
            setCurrentKey('N/A');
            detectedNotesRef.current.clear();

            processAudio();
            
            await startStreaming();
            
            toast.success('Recording and streaming started');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast.error('Failed to access microphone. Please grant permission.');
        }
    };

    const stopRecording = () => {
        stopStreaming();

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        analyserRef.current = null;
        setPoints([]);
        setCurrentKey('N/A');
        detectedNotesRef.current.clear();
        
        resetAudioAnalysis();
    };

    const startStreaming = async () => {
        if (!streamRef.current) {
            return;
        }

        try {
            const streamName = `audio-stream-${Date.now()}`;
            
            const result = await startLivepeerStreamMutation.mutateAsync(streamName);

            try {
                const streamData = JSON.parse(result);
                streamIdRef.current = streamData.id || null;
                setIsStreaming(true);
            } catch (e) {
                console.error('Failed to parse stream response:', e);
                setIsStreaming(true);
            }

            const mediaRecorder = new MediaRecorder(streamRef.current, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    console.log('Audio chunk encoded:', event.data.size, 'bytes');
                }
            };

            mediaRecorder.start(1000);
        } catch (error) {
            console.error('Error starting Livepeer stream:', error);
            toast.error('Failed to start streaming');
        }
    };

    const stopStreaming = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }
        streamIdRef.current = null;
        setIsStreaming(false);
    };

    const processAudio = () => {
        if (!analyserRef.current) return;

        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const timeDataArray = new Float32Array(bufferLength);

        const analyze = () => {
            if (!analyserRef.current) return;

            analyser.getByteFrequencyData(dataArray);
            analyser.getFloatTimeDomainData(timeDataArray);

            const analysis = analyzeAudio(dataArray, timeDataArray, analyser.context.sampleRate);

            // Track detected notes
            if (analysis.note && analysis.note !== 'N/A') {
                detectedNotesRef.current.set(analysis.note, Date.now());
            }

            // Get current active notes
            const activeNotes = Array.from(detectedNotesRef.current.keys());

            onAudioDataUpdate({
                loudnessDelta: analysis.loudnessDelta,
                spectralCentroidDelta: analysis.spectralCentroidDelta,
                spectralFlux: analysis.spectralFlux,
                key: analysis.key,
                keyConfidence: analysis.keyConfidence
            }, activeNotes);

            const hasSignificantAudio = Math.abs(analysis.loudnessDelta) > 0.5 || 
                                       Math.abs(analysis.spectralCentroidDelta) > 10 || 
                                       Math.abs(analysis.spectralFlux) > 1;
            
            if (hasSignificantAudio) {
                const xPosition = Math.max(-10, Math.min(10, analysis.loudnessDelta / 2));
                const yPosition = Math.max(-10, Math.min(10, analysis.spectralCentroidDelta / 200));
                const zPosition = Math.max(-10, Math.min(10, analysis.spectralFlux / 5));

                const newPoint: AudioPoint = {
                    x: xPosition,
                    y: yPosition,
                    z: zPosition,
                    color: analysis.color,
                    timestamp: Date.now()
                };

                setPoints((prev) => [...prev, newPoint]);
            }

            animationFrameRef.current = requestAnimationFrame(analyze);
        };

        analyze();
    };

    const getKeyDisplayColor = () => {
        if (audioData.key === 'Detecting...') return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
        if (audioData.key === 'N/A') return 'bg-muted/50 text-muted-foreground border-border';
        if (audioData.key.includes('major')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
    };

    return (
        <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="relative h-[600px] w-full">
                <Canvas>
                    <PerspectiveCamera makeDefault position={[0, 0, 15]} />
                    <OrbitControls
                        enableDamping
                        dampingFactor={0.05}
                        rotateSpeed={0.5}
                        enablePan={true}
                        enableZoom={true}
                    />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} />
                    <AudioPoints points={points} pointDuration={pointDuration} />
                </Canvas>
                {!isRecording && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                        <p className="text-lg text-muted-foreground">
                            Click "Start Recording" to begin visualization and streaming
                        </p>
                    </div>
                )}
                {isStreaming && (
                    <div className="absolute right-4 top-4 flex items-center gap-2 rounded-md bg-background/90 px-3 py-2 text-sm backdrop-blur-sm">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                        <span className="font-medium">Live Streaming</span>
                    </div>
                )}
                {isRecording && audioData.key !== 'N/A' && (
                    <div className={`absolute left-4 top-4 transition-all duration-500 ${
                        keyChangeFlash ? 'scale-110' : 'scale-100'
                    }`}>
                        <Badge 
                            variant="outline" 
                            className={`flex items-center gap-2 border-2 px-4 py-2 text-base font-bold shadow-lg backdrop-blur-sm transition-all duration-500 ${
                                getKeyDisplayColor()
                            } ${keyChangeFlash ? 'shadow-2xl' : ''}`}
                        >
                            <Music className={`h-4 w-4 transition-transform duration-500 ${
                                keyChangeFlash ? 'rotate-12 scale-125' : ''
                            }`} />
                            {audioData.key}
                        </Badge>
                    </div>
                )}
            </div>
        </Card>
    );
}
