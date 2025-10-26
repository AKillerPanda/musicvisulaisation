import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AudioVisualizer from '@/components/AudioVisualizer';
import ControlPanel from '@/components/ControlPanel';
import KeyLegend from '@/components/KeyLegend';
import KeyDetectionDisplay from '@/components/KeyDetectionDisplay';

const queryClient = new QueryClient();

export default function App() {
    const [isRecording, setIsRecording] = useState(false);
    const [pointDuration, setPointDuration] = useState(10);
    const [audioData, setAudioData] = useState({
        loudnessDelta: 0,
        spectralCentroidDelta: 0,
        spectralFlux: 0,
        key: 'N/A',
        keyConfidence: 0
    });
    const [detectedNotes, setDetectedNotes] = useState<string[]>([]);

    const handleToggleRecording = () => {
        setIsRecording(!isRecording);
    };

    const handleAudioDataUpdate = (data: typeof audioData, notes: string[]) => {
        setAudioData(data);
        setDetectedNotes(notes);
    };

    const handlePointDurationChange = (duration: number) => {
        setPointDuration(duration);
    };

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <div className="flex min-h-screen flex-col">
                    <Header />
                    <main className="flex-1">
                        <div className="container mx-auto p-4">
                            <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
                                <div className="space-y-4">
                                    <AudioVisualizer
                                        isRecording={isRecording}
                                        audioData={audioData}
                                        onAudioDataUpdate={handleAudioDataUpdate}
                                        pointDuration={pointDuration}
                                    />
                                    <KeyDetectionDisplay
                                        isRecording={isRecording}
                                        currentKey={audioData.key}
                                        keyConfidence={audioData.keyConfidence}
                                        detectedNotes={detectedNotes}
                                    />
                                    <KeyLegend />
                                </div>
                                <ControlPanel
                                    isRecording={isRecording}
                                    onToggleRecording={handleToggleRecording}
                                    audioData={audioData}
                                    pointDuration={pointDuration}
                                    onPointDurationChange={handlePointDurationChange}
                                />
                            </div>
                        </div>
                    </main>
                    <Footer />
                </div>
                <Toaster />
            </ThemeProvider>
        </QueryClientProvider>
    );
}
