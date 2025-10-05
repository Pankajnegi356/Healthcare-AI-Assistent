import { Button } from "@/components/ui/button";
import { UserCheck, Users, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AppMode } from "../types/medical";

interface ModeToggleProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex bg-muted rounded-lg p-1">
        <Button
          variant={mode === 'doctor' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('doctor')}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            mode === 'doctor' 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground hover:bg-background'
          }`}
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Professional
        </Button>
        <Button
          variant={mode === 'patient' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('patient')}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            mode === 'patient' 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground hover:bg-background'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          Personal
        </Button>
      </div>
      <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
        <Stethoscope className="w-3 h-3" />
        Unified Interface
      </Badge>
    </div>
  );
}
