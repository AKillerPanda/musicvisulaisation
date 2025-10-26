import { Music } from 'lucide-react';

export default function Header() {
    return (
        <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                        <Music className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Audio Spectrum Analyzer</h1>
                        <p className="text-sm text-muted-foreground">Real-time 3D visualization</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
