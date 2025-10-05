import { Brain, Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message = "AI Analysis in Progress" }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-lg z-50 flex items-center justify-center">
      <div className="glass-card p-8 max-w-sm mx-4 text-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">{message}</h3>
            <p className="text-sm text-muted-foreground">
              AI is analyzing symptoms and generating diagnostic insights...
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing medical data</span>
          </div>
        </div>
      </div>
    </div>
  );
}
