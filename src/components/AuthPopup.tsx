import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userData: { name: string; totalPoints: number; completedSessions: number; achievements: string[] }) => void;
}

export default function AuthPopup({ isOpen, onClose, onAuthSuccess }: AuthPopupProps) {
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!name.trim() || !password.trim()) {
      toast({
        title: "Please fill all fields",
        description: "Both name and password are required",
        variant: "destructive"
      });
      return;
    }

    if (name.trim().length < 2) {
      toast({
        title: "Name too short",
        description: "Name must be at least 2 characters long",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 3) {
      toast({
        title: "Password too short",
        description: "Password must be at least 3 characters long",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Use Supabase
      if (isLogin) {
        // Login existing user
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('name', name.trim())
          .eq('password', password)
          .single();

        if (error || !data) {
          toast({
            title: "Login failed",
            description: "Invalid username or password",
            variant: "destructive"
          });
          return;
        }

        // Update last active
        await supabase
          .from('users')
          .update({ last_active: new Date().toISOString() })
          .eq('id', data.id);

        // Store user session in localStorage for persistence
        localStorage.setItem('mantra-user-session', JSON.stringify({
          id: data.id,
          name: data.name,
          totalPoints: data.total_points,
          completedSessions: data.completed_sessions,
          achievements: data.achievements || []
        }));

        onAuthSuccess({
          name: data.name,
          totalPoints: data.total_points,
          completedSessions: data.completed_sessions,
          achievements: data.achievements || []
        });

        toast({
          title: "Welcome back!",
          description: `Logged in as ${data.name}`,
        });
      } else {
        // Register new user
        const { error } = await supabase
          .from('users')
          .insert([{
            name: name.trim(),
            password: password,
            total_points: 0,
            completed_sessions: 0,
            achievements: []
          }]);

        if (error) {
          if (error.code === '23505') {
            toast({
              title: "Username already taken",
              description: "Please choose a different username",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Registration failed",
              description: "Please try again",
              variant: "destructive"
            });
          }
          return;
        }

        // Get the created user
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('name', name.trim())
          .single();

        if (userData) {
          // Store user session in localStorage for persistence
          localStorage.setItem('mantra-user-session', JSON.stringify({
            id: userData.id,
            name: userData.name,
            totalPoints: userData.total_points,
            completedSessions: userData.completed_sessions,
            achievements: userData.achievements || []
          }));

          onAuthSuccess({
            name: userData.name,
            totalPoints: userData.total_points,
            completedSessions: userData.completed_sessions,
            achievements: userData.achievements || []
          });
        }

        toast({
          title: "Welcome!",
          description: `Account created for ${name.trim()}`,
        });
      }

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('mantra-auth-skipped', 'true');
    onClose();
  };

  const resetForm = () => {
    setName('');
    setPassword('');
    setIsLogin(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isLogin ? 'Login to Continue' : 'Join the Leaderboard'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              disabled={loading}
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setIsLogin(!isLogin);
                resetForm();
              }}
              disabled={loading}
              className="w-full"
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleSkip}
              disabled={loading}
              className="w-full"
            >
              Skip for now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}