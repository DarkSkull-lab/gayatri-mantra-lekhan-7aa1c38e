import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Award, Star, Languages, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mantra texts
const MANTRAS = {
  hindi: "ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यम्। भर्गो देवस्य धीमहि। धियो यो नः प्रचोदयात्॥",
  hinglish: "Om bhur bhuvah swah tat savitur varenyam bhargo devasya dheemahi dhiyo yo nah prachodayat"
};

// Achievement levels
const ACHIEVEMENTS = [
  { points: 100, title: "Sanskrit Learner", icon: Star, badge: "Beginner" },
  { points: 500, title: "Bronze Mantra Medal", icon: Award, badge: "Bronze" },
  { points: 1000, title: "Divine Devotee Certificate", icon: Trophy, badge: "Divine" }
];

// Auto-correction function
const autoCorrect = (input: string, target: string, language: string): string => {
  let corrected = input;
  
  // Handle ॐ variations
  if (language === 'hindi') {
    corrected = corrected.replace(/\b(om|aum|OM|AUM)\b/g, 'ॐ');
  } else {
    corrected = corrected.replace(/\b(aum|AUM)\b/g, 'Om');
  }
  
  // Simple character-level corrections for common typos
  const targetWords = target.split(' ');
  const inputWords = corrected.split(' ');
  
  for (let i = 0; i < Math.min(targetWords.length, inputWords.length); i++) {
    const targetWord = targetWords[i];
    const inputWord = inputWords[i];
    
    if (inputWord.length >= 2 && targetWord.length >= 2) {
      // If first 2 characters match, accept the word
      if (inputWord.substring(0, 2) === targetWord.substring(0, 2)) {
        inputWords[i] = targetWord;
      }
    }
  }
  
  return inputWords.join(' ');
};

// Check if typing matches target (allowing for auto-corrections)
const checkAccuracy = (input: string, target: string, language: string): number => {
  const corrected = autoCorrect(input, target, language);
  const targetNormalized = target.replace(/[।॥]/g, '').toLowerCase().trim();
  const inputNormalized = corrected.replace(/[।॥]/g, '').toLowerCase().trim();
  
  if (inputNormalized === targetNormalized) return 100;
  
  // Calculate partial accuracy
  const words = targetNormalized.split(' ');
  const inputWords = inputNormalized.split(' ');
  let correct = 0;
  
  for (let i = 0; i < Math.min(words.length, inputWords.length); i++) {
    if (words[i] === inputWords[i]) correct++;
  }
  
  return Math.floor((correct / words.length) * 100);
};

interface UserProgress {
  totalPoints: number;
  achievements: string[];
  completedSessions: number;
}

export default function MantraTrainer() {
  const [language, setLanguage] = useState<'hindi' | 'hinglish'>('hindi');
  const [currentInput, setCurrentInput] = useState('');
  const [repetitionCount, setRepetitionCount] = useState(0);
  const [userProgress, setUserProgress] = useState<UserProgress>({ totalPoints: 0, achievements: [], completedSessions: 0 });
  const [isCompleted, setIsCompleted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mantra-progress');
    if (saved) {
      setUserProgress(JSON.parse(saved));
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('mantra-progress', JSON.stringify(userProgress));
  }, [userProgress]);

  const handleInputChange = (value: string) => {
    setCurrentInput(value);
    
    const target = MANTRAS[language];
    const accuracy = checkAccuracy(value, target, language);
    
    if (accuracy === 100) {
      // Completed one repetition
      const newCount = repetitionCount + 1;
      setRepetitionCount(newCount);
      
      if (newCount === 3) {
        // Completed 3 repetitions - award points
        const newProgress = {
          ...userProgress,
          totalPoints: userProgress.totalPoints + 10,
          completedSessions: userProgress.completedSessions + 1
        };
        
        // Check for new achievements
        const newAchievements = [...userProgress.achievements];
        ACHIEVEMENTS.forEach(achievement => {
          if (newProgress.totalPoints >= achievement.points && !newAchievements.includes(achievement.title)) {
            newAchievements.push(achievement.title);
            toast({
              title: "🏆 Achievement Unlocked!",
              description: `${achievement.title} - ${achievement.points} points reached!`,
            });
          }
        });
        
        newProgress.achievements = newAchievements;
        setUserProgress(newProgress);
        setIsCompleted(true);
        
        toast({
          title: "🎉 Session Complete!",
          description: "You earned 10 points for completing 3 repetitions!",
        });
        
        setTimeout(() => {
          setCurrentInput('');
          setRepetitionCount(0);
          setIsCompleted(false);
        }, 3000);
      } else {
        // Clear for next repetition
        setTimeout(() => setCurrentInput(''), 1000);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    toast({
      title: "Typing Only Please",
      description: "Please type the mantra to gain the full spiritual benefit.",
      variant: "destructive"
    });
  };

  const resetSession = () => {
    setCurrentInput('');
    setRepetitionCount(0);
    setIsCompleted(false);
  };

  const progressPercentage = Math.min((userProgress.totalPoints / 1000) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-divine relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center"
        style={{ backgroundImage: `url('/src/assets/spiritual-bg.jpg')` }}
      />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-sacred bg-clip-text text-transparent font-mantra">
            Mantra Harmony Trainer
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Practice the sacred Gayatri Mantra with devotion
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex justify-center mb-6">
          <Select value={language} onValueChange={(value: 'hindi' | 'hinglish') => setLanguage(value)}>
            <SelectTrigger className="w-48 bg-card border-accent">
              <Languages className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hindi">Hindi (देवनागरी)</SelectItem>
              <SelectItem value="hinglish">Hinglish (Roman)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Progress Section */}
        <Card className="mb-6 p-6 bg-card/80 backdrop-blur-sm shadow-peaceful">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold">Journey to 1,000 Points</h3>
            <p className="text-sm text-muted-foreground">Current: {userProgress.totalPoints} points</p>
          </div>
          <Progress value={progressPercentage} className="h-3 mb-4" />
          
          {/* Achievements */}
          <div className="flex flex-wrap gap-2 justify-center">
            {ACHIEVEMENTS.map((achievement) => {
              const isEarned = userProgress.achievements.includes(achievement.title);
              const IconComponent = achievement.icon;
              return (
                <Badge 
                  key={achievement.title}
                  variant={isEarned ? "default" : "secondary"}
                  className={`flex items-center gap-1 ${isEarned ? 'bg-gradient-spiritual' : ''}`}
                >
                  <IconComponent className="w-3 h-3" />
                  {achievement.title}
                  {isEarned && " ✓"}
                </Badge>
              );
            })}
          </div>
        </Card>

        {/* Mantra Display */}
        <Card className="mb-6 p-6 bg-card/80 backdrop-blur-sm shadow-peaceful">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-3">Gayatri Mantra</h3>
            <p className={`text-xl leading-relaxed ${language === 'hindi' ? 'font-sanskrit' : 'font-mantra'}`}>
              {MANTRAS[language]}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Repetition {repetitionCount}/3
            </p>
          </div>
        </Card>

        {/* Typing Area */}
        <Card className="mb-6 p-6 bg-card/80 backdrop-blur-sm shadow-peaceful">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Type the Mantra</h3>
              <p className="text-sm text-muted-foreground">
                Complete 3 repetitions to earn 10 points
              </p>
            </div>
            
            <Textarea
              ref={textareaRef}
              value={currentInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onPaste={handlePaste}
              placeholder={`Type the ${language} mantra here...`}
              className={`min-h-32 text-lg resize-none ${language === 'hindi' ? 'font-sanskrit' : 'font-mantra'} ${isCompleted ? 'bg-accent/20' : ''}`}
              disabled={isCompleted}
            />
            
            {isCompleted && (
              <div className="text-center text-accent font-semibold">
                🎉 Excellent! Session completed successfully!
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button onClick={resetSession} variant="outline" className="border-accent">
            Reset Session
          </Button>
          <Button className="bg-gradient-spiritual hover:opacity-90">
            <Volume2 className="w-4 h-4 mr-2" />
            Play Chant (Coming Soon)
          </Button>
        </div>

        {/* Stats */}
        <Card className="mt-8 p-4 bg-card/60 backdrop-blur-sm">
          <div className="text-center grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-primary">{userProgress.totalPoints}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">{userProgress.completedSessions}</div>
              <div className="text-sm text-muted-foreground">Sessions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">{userProgress.achievements.length}</div>
              <div className="text-sm text-muted-foreground">Achievements</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}