import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music } from 'lucide-react';
import { getNoteColor } from '@/lib/audioAnalysis';

// Note names for display
const NOTE_NAMES: Record<string, string> = {
    'C': 'C',
    'C#': 'C#/Db',
    'D': 'D',
    'D#': 'D#/Eb',
    'E': 'E',
    'F': 'F',
    'F#': 'F#/Gb',
    'G': 'G',
    'G#': 'G#/Ab',
    'A': 'A',
    'A#': 'A#/Bb',
    'B': 'B'
};

const NOTES_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export default function KeyLegend() {
    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Music className="h-4 w-4" />
                    Musical Note Color Legend
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="text-xs text-muted-foreground">
                        Each musical note is represented by a unique color evenly distributed across the full spectrum. 
                        These colors are used for both individual note detection and the 3D visualization.
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {NOTES_ORDER.map((note) => {
                            const noteName = NOTE_NAMES[note];
                            const noteColor = getNoteColor(note);

                            return (
                                <div key={note} className="flex items-center gap-2">
                                    <div
                                        className="h-8 w-8 shrink-0 rounded-md border-2 border-border shadow-sm"
                                        style={{ backgroundColor: noteColor }}
                                        title={noteName}
                                    />
                                    <span className="text-sm font-medium">
                                        {noteName}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 space-y-2 rounded-md bg-muted/30 p-3 text-xs">
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5 h-3 w-3 shrink-0 rounded-sm" style={{ background: getNoteColor('C') }} />
                            <span className="text-muted-foreground">
                                <span className="font-semibold text-foreground">Each note has a distinct color</span> evenly spaced across the color spectrum (30° intervals)
                            </span>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5 h-3 w-3 shrink-0 rounded-sm" style={{ background: getNoteColor('F#') }} />
                            <span className="text-muted-foreground">
                                <span className="font-semibold text-foreground">Colors are consistent</span> across the 3D visualization, note badges, and this legend
                            </span>
                        </div>
                        <div className="mt-2 rounded-md bg-primary/10 border border-primary/30 p-2">
                            <p className="text-xs font-semibold text-primary">
                                When multiple notes are detected simultaneously, each will appear in its own unique color!
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
