import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NamePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onNameSubmit: (name: string) => void;
}

export default function NamePopup({ isOpen, onClose, onNameSubmit }: NamePopupProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const checkNameExists = (inputName: string): boolean => {
    const leaderboard = JSON.parse(localStorage.getItem('mantra-leaderboard') || '[]');
    return leaderboard.some((entry: any) => entry.name.toLowerCase() === inputName.toLowerCase());
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to continue",
        variant: "destructive"
      });
      return;
    }

    if (name.trim().length < 2) {
      toast({
        title: "Name Too Short",
        description: "Please enter at least 2 characters",
        variant: "destructive"
      });
      return;
    }

    if (checkNameExists(name.trim())) {
      toast({
        title: "Name Already Taken",
        description: "This name is already in use. Please choose a different name.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate a brief loading for better UX
    setTimeout(() => {
      onNameSubmit(name.trim());
      setIsLoading(false);
      toast({
        title: "Welcome!",
        description: `Hello ${name.trim()}! Start practicing to climb the leaderboard.`,
      });
    }, 500);
  };

  const handleSkip = () => {
    localStorage.setItem('mantra-name-skipped', 'true');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold bg-gradient-sacred bg-clip-text text-transparent">
              Welcome to Gayatri Mantra Lekhan
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-muted-foreground">
            Enter your name to track your progress and compete on the leaderboard. You can also skip this step.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Your Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 bg-gradient-spiritual hover:opacity-90"
            >
              {isLoading ? "Joining..." : "Join Leaderboard"}
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              className="border-accent"
            >
              Skip
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Your name will be visible on the leaderboard. Choose wisely!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}