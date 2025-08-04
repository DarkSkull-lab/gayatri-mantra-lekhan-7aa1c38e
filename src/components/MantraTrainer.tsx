import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Award, Star, Languages, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoImage from '@/assets/logo.png';
import AuthPopup from './AuthPopup';
import Leaderboard from './Leaderboard';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, User } from 'lucide-react';

// Mantra texts
const MANTRAS = {
  hindi: "ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यम् भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्",
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
  
  return corrected;
};

// Get typing suggestions
const getTypingSuggestion = (input: string, target: string): string => {
  const targetWords = target.split(' ');
  const inputWords = input.trim().split(' ');
  
  // If no input, suggest the first word
  if (!input.trim()) {
    return targetWords[0];
  }
  
  if (inputWords.length <= targetWords.length) {
    const currentWordIndex = inputWords.length - 1;
    const currentWord = inputWords[currentWordIndex] || '';
    const targetWord = targetWords[currentWordIndex] || '';
    
    if (targetWord.startsWith(currentWord) && currentWord.length > 0) {
      return targetWord;
    }
  }
  
  return '';
};

// Check if typing matches target (allowing for auto-corrections and minor mistakes)
const checkAccuracy = (input: string, target: string, language: string): number => {
  const corrected = autoCorrect(input, target, language);
  const targetNormalized = target.replace(/[।॥]/g, '').toLowerCase().trim();
  const inputNormalized = corrected.replace(/[।॥]/g, '').toLowerCase().trim();
  
  // Exact match
  if (inputNormalized === targetNormalized) return 100;
  
  // Allow minor mistakes - check if 90% of characters match
  const targetChars = targetNormalized.replace(/\s/g, '');
  const inputChars = inputNormalized.replace(/\s/g, '');
  
  if (inputChars.length >= targetChars.length * 0.8) {
    let matches = 0;
    const minLength = Math.min(targetChars.length, inputChars.length);
    
    for (let i = 0; i < minLength; i++) {
      if (targetChars[i] === inputChars[i]) matches++;
    }
    
    const similarity = (matches / targetChars.length) * 100;
    if (similarity >= 85) return 100; // Accept if 85% similar
  }
  
  // Calculate partial accuracy for incomplete typing
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
  const [suggestion, setSuggestion] = useState('');
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Check for first-time visit and load saved data
  useEffect(() => {
    const checkAuthStatus = () => {
      // First check for session persistence from Supabase login
      const userSession = localStorage.getItem('mantra-user-session');
      
      if (userSession) {
        // User has a Supabase session
        const userData = JSON.parse(userSession);
        setUserName(userData.name);
        setIsLoggedIn(true);
        setUserProgress({
          totalPoints: userData.totalPoints || 0,
          achievements: userData.achievements || [],
          completedSessions: userData.completedSessions || 0
        });
        return;
      }

      const savedUser = localStorage.getItem('mantra-user');
      
      if (savedUser) {
        // Local user (old format)
        const userData = JSON.parse(savedUser);
        setUserName(userData.name);
        setIsLoggedIn(false); // Not logged into Supabase
        setUserProgress({
          totalPoints: userData.totalPoints || 0,
          achievements: userData.achievements || [],
          completedSessions: userData.completedSessions || 0
        });
      } else {
        // Check for old system users and migrate them
        const oldUserName = localStorage.getItem('mantra-user-name');
        const oldProgress = localStorage.getItem('mantra-progress');
        
        if (oldUserName) {
          // Migrate old user to new system
          const progressData = oldProgress ? JSON.parse(oldProgress) : { totalPoints: 0, achievements: [], completedSessions: 0 };
          
          const migratedUser = {
            name: oldUserName,
            totalPoints: progressData.totalPoints || 0,
            achievements: progressData.achievements || [],
            completedSessions: progressData.completedSessions || 0
          };
          
          // Save in new format and mark as logged in (but without password)
          localStorage.setItem('mantra-user', JSON.stringify(migratedUser));
          localStorage.setItem('mantra-auth-skipped', 'true'); // Mark as skipped since they're migrated
          
          setUserName(oldUserName);
          setIsLoggedIn(false); // They can still use the app but won't have Supabase features
          setUserProgress(progressData);
          
          // Clean up old keys
          localStorage.removeItem('mantra-user-name');
          localStorage.removeItem('mantra-progress');
          localStorage.removeItem('mantra-name-skipped');
          localStorage.removeItem('mantra-leaderboard-intro');
        } else {
          // Truly new user
          const authSkipped = localStorage.getItem('mantra-auth-skipped');
          const hasSeenAuth = localStorage.getItem('mantra-auth-intro');
          
          // Show popup for first-time visitors who haven't skipped
          if (!authSkipped && !hasSeenAuth) {
            setShowAuthPopup(true);
            localStorage.setItem('mantra-auth-intro', 'true');
          }
        }
      }
    };

    checkAuthStatus();
  }, []);

  // Save progress to Supabase and localStorage
  useEffect(() => {
    if (isLoggedIn && userName) {
      // Update Supabase
      supabase
        .from('users')
        .update({
          total_points: userProgress.totalPoints,
          completed_sessions: userProgress.completedSessions,
          achievements: userProgress.achievements,
          last_active: new Date().toISOString()
        })
        .eq('name', userName)
        .then(({ error }) => {
          if (error) console.error('Error updating user progress:', error);
        });

      // Update session storage
      const sessionData = {
        id: '',
        name: userName,
        totalPoints: userProgress.totalPoints,
        completedSessions: userProgress.completedSessions,
        achievements: userProgress.achievements
      };
      localStorage.setItem('mantra-user-session', JSON.stringify(sessionData));
    } else if (userName) {
      // Update localStorage for non-logged-in users
      const userData = {
        name: userName,
        totalPoints: userProgress.totalPoints,
        completedSessions: userProgress.completedSessions,
        achievements: userProgress.achievements
      };
      localStorage.setItem('mantra-user', JSON.stringify(userData));
    }
  }, [userProgress, isLoggedIn, userName]);

  // Initialize suggestion on mount and language change
  useEffect(() => {
    if (!currentInput) {
      const target = MANTRAS[language];
      const initialSuggestion = getTypingSuggestion('', target);
      setSuggestion(initialSuggestion);
    }
  }, [language, currentInput]);

  const handleInputChange = (value: string) => {
    setCurrentInput(value);
    
    const target = MANTRAS[language];
    
    // Update suggestion
    const currentSuggestion = getTypingSuggestion(value, target);
    setSuggestion(currentSuggestion);
  };

  const handleSubmit = () => {
    const target = MANTRAS[language];
    const accuracy = checkAccuracy(currentInput, target, language);
    
    if (accuracy === 100) {
      // Completed one repetition
      const newCount = repetitionCount + 1;
      setRepetitionCount(newCount);
      setSuggestion(''); // Clear suggestion on completion
      
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
          setSuggestion('');
        }, 3000);
      } else {
        // Clear for next repetition
        toast({
          title: "✅ Repetition Complete!",
          description: `${newCount}/3 repetitions completed`,
        });
        setTimeout(() => {
          setCurrentInput('');
          setSuggestion('');
        }, 1000);
      }
    } else {
      toast({
        title: "Please complete the mantra",
        description: "Type the complete mantra before submitting",
        variant: "destructive"
      });
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

  const handleSuggestionClick = () => {
    if (suggestion) {
      const words = currentInput.trim().split(' ');
      if (!currentInput.trim()) {
        // If no input, just use the suggestion
        setCurrentInput(suggestion + ' ');
      } else {
        // Replace the last incomplete word with the suggestion
        words[words.length - 1] = suggestion;
        setCurrentInput(words.join(' ') + ' ');
      }
      
      // Update suggestion for next word
      const target = MANTRAS[language];
      const newSuggestion = getTypingSuggestion(words.join(' ') + ' ', target);
      setSuggestion(newSuggestion);
      
      // Keep focus on textarea
      textareaRef.current?.focus();
    }
  };

  const updateUserProgressInSupabase = async (progress: UserProgress) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          total_points: progress.totalPoints,
          completed_sessions: progress.completedSessions,
          achievements: progress.achievements,
          last_active: new Date().toISOString()
        })
        .eq('name', userName);
        
      if (error) {
        console.error('Error updating user progress:', error);
      }
    } catch (error) {
      console.error('Error updating user progress:', error);
    }
  };

  const handleAuthSuccess = (userData: { name: string; totalPoints: number; completedSessions: number; achievements: string[] }) => {
    setUserName(userData.name);
    setIsLoggedIn(true);
    
    // Merge local progress with database progress (keep the higher values)
    const mergedProgress = {
      totalPoints: Math.max(userData.totalPoints, userProgress.totalPoints),
      completedSessions: Math.max(userData.completedSessions, userProgress.completedSessions),
      achievements: [...new Set([...userData.achievements, ...userProgress.achievements])]
    };
    
    setUserProgress(mergedProgress);
    localStorage.setItem('mantra-user', JSON.stringify({
      name: userData.name,
      ...mergedProgress
    }));
    setShowAuthPopup(false);
    
    // If local progress was higher, update the database
    if (mergedProgress.totalPoints > userData.totalPoints || 
        mergedProgress.completedSessions > userData.completedSessions ||
        mergedProgress.achievements.length > userData.achievements.length) {
      updateUserProgressInSupabase(mergedProgress);
    }
  };

  const handleLogout = () => {
    setUserName('');
    setIsLoggedIn(false);
    setUserProgress({ totalPoints: 0, achievements: [], completedSessions: 0 });
    localStorage.removeItem('mantra-user');
    localStorage.removeItem('mantra-user-session');
    localStorage.removeItem('mantra-auth-skipped');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  const handleLogin = () => {
    setShowAuthPopup(true);
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
        {/* Logo Section */}
        <div className="absolute top-4 left-4">
          <img 
            src={logoImage} 
            alt="Gayatri Mantra Lekhan Logo" 
            className="h-12 w-12 object-contain rounded-lg shadow-lg"
          />
        </div>
        
        {/* Auth Status */}
        <div className="fixed top-6 right-6 z-50 flex flex-col items-end gap-2">
          {isLoggedIn ? (
            <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
              <User className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{userName}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLogout}
                className="h-6 w-6 p-0"
              >
                <LogOut className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleLogin}
              className="bg-primary/90 hover:bg-primary"
            >
              <User className="w-4 h-4 mr-1" />
              Login
            </Button>
          )}
          <div className="text-xs bg-gradient-sacred bg-clip-text text-transparent font-mantra text-right">
            <div>Creator - Kunj Thakur</div>
            <div>DOB - 21/05/2012</div>
            <div>Made in - 2025</div>
          </div>
        </div>


        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-sacred bg-clip-text text-transparent font-mantra">
            Gayatri Mantra Lekhan
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
          <Progress 
            value={progressPercentage} 
            className="h-4 mb-4 transition-all duration-1000 ease-out" 
          />
          <div className="text-xs text-muted-foreground text-center">
            {progressPercentage.toFixed(1)}% complete
          </div>
          
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
            
            {/* Suggestion Bar */}
            {suggestion && !isCompleted && (
              <div 
                className="p-3 bg-muted/50 rounded-md border-l-4 border-primary cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={handleSuggestionClick}
              >
                <p className="text-sm text-muted-foreground mb-1">💡 Tap to use suggestion:</p>
                <p className={`text-accent font-medium ${language === 'hindi' ? 'font-sanskrit' : 'font-mantra'}`}>
                  {suggestion}
                </p>
              </div>
            )}
            
            <Textarea
              ref={textareaRef}
              value={currentInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onPaste={handlePaste}
              placeholder={`Type the ${language} mantra here...`}
              className={`min-h-32 text-lg resize-none ${language === 'hindi' ? 'font-sanskrit' : 'font-mantra'} ${isCompleted ? 'bg-accent/20' : ''}`}
              disabled={isCompleted}
            />
            
            {/* Submit Button */}
            {!isCompleted && (
              <div className="flex justify-center">
                <Button 
                  onClick={handleSubmit}
                  disabled={!currentInput.trim()}
                  className="bg-gradient-spiritual hover:opacity-90"
                >
                  Submit Mantra
                </Button>
              </div>
            )}
            
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

        {/* Leaderboard - Moved to bottom */}
        {isLoggedIn && (
          <div className="mt-8">
            <Leaderboard
              currentUserName={userName}
              currentUserPoints={userProgress.totalPoints}
              currentUserSessions={userProgress.completedSessions}
              currentUserAchievements={userProgress.achievements}
            />
          </div>
        )}

        {/* Auth Popup */}
        <AuthPopup
          isOpen={showAuthPopup}
          onClose={() => setShowAuthPopup(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    </div>
  );
}