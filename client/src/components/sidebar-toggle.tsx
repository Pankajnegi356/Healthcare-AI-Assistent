import React from 'react';
import { Menu, Brain, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface SidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

const SidebarToggle: React.FC<SidebarToggleProps> = ({ 
  isOpen, 
  onToggle, 
  className = "" 
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onToggle}
            className={`fixed top-20 right-4 z-[60] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg transition-all duration-300 sidebar-toggle-btn ${
              isOpen ? 'translate-x-[-320px]' : 'translate-x-0'
            } ${className}`}
            size="sm"
          >
            <div className="flex items-center gap-2">
              {isOpen ? (
                <Menu className="w-4 h-4" />
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <Sparkles className="w-3 h-3" />
                </>
              )}
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{isOpen ? 'Close AI Features' : 'Open AI Features Panel'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SidebarToggle;
