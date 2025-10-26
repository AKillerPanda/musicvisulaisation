import { Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="border-t border-border/40 bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-6">
                <p className="text-center text-sm text-muted-foreground">
                    © 2025. Built with{' '}
                    <Heart className="inline h-4 w-4 fill-destructive text-destructive" /> using{' '}
                    <a
                        href="https://caffeine.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                        caffeine.ai
                    </a>
                </p>
            </div>
        </footer>
    );
}
