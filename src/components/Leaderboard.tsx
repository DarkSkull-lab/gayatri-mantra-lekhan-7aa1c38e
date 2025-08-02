import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, Crown, Users, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface LeaderboardEntry {
  name: string;
  points: number;
  sessions: number;
  achievements: string[];
  lastActive: string;
}

interface LeaderboardProps {
  currentUserName?: string;
  currentUserPoints: number;
  currentUserSessions: number;
  currentUserAchievements: string[];
}

export default function Leaderboard({ 
  currentUserName, 
  currentUserPoints, 
  currentUserSessions, 
  currentUserAchievements 
}: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const updateLeaderboard = async () => {
    try {
      const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (isSupabaseConfigured) {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('users')
          .select('name, total_points, completed_sessions, achievements, last_active')
          .order('total_points', { ascending: false })
          .order('completed_sessions', { ascending: false });

        if (error) {
          console.error('Error fetching leaderboard:', error);
          return;
        }

        const leaderboardData: LeaderboardEntry[] = (data || []).map(user => ({
          name: user.name,
          points: user.total_points,
          sessions: user.completed_sessions,
          achievements: user.achievements || [],
          lastActive: user.last_active
        }));

        setLeaderboard(leaderboardData);
      } else {
        // Fallback to localStorage
        const localUsers = JSON.parse(localStorage.getItem('local-users') || '[]');
        const leaderboardData: LeaderboardEntry[] = localUsers
          .map((user: any) => ({
            name: user.name,
            points: user.totalPoints || 0,
            sessions: user.completedSessions || 0,
            achievements: user.achievements || [],
            lastActive: new Date().toISOString()
          }))
          .sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
            if (b.points !== a.points) return b.points - a.points;
            return b.sessions - a.sessions;
          });

        setLeaderboard(leaderboardData);
      }
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  };

  useEffect(() => {
    updateLeaderboard();
    
    // Update leaderboard every 5 seconds for live updates
    const interval = setInterval(updateLeaderboard, 5000);
    
    return () => clearInterval(interval);
  }, [currentUserName, currentUserPoints, currentUserSessions, currentUserAchievements]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 1: return <Trophy className="w-5 h-5 text-gray-400" />;
      case 2: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <Award className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0: return "🥇 Champion";
      case 1: return "🥈 Runner-up";
      case 2: return "🥉 Third Place";
      default: return `#${index + 1}`;
    }
  };

  const displayedLeaderboard = isExpanded ? leaderboard : leaderboard.slice(0, 5);
  const currentUserRank = currentUserName ? 
    leaderboard.findIndex(entry => entry.name.toLowerCase() === currentUserName.toLowerCase()) + 1 : 0;

  return (
    <Card className="p-6 bg-card/80 backdrop-blur-sm shadow-peaceful">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-semibold">Leaderboard</h3>
          <Badge variant="secondary" className="ml-2">
            <Users className="w-3 h-3 mr-1" />
            {leaderboard.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4" />
          Live Updates
        </div>
      </div>

      {currentUserName && currentUserRank > 0 && (
        <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Your Rank:</span>
              <Badge variant="default" className="bg-gradient-spiritual">
                {getRankBadge(currentUserRank - 1)}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {currentUserPoints} points
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {displayedLeaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No entries yet. Be the first to join!</p>
          </div>
        ) : (
          displayedLeaderboard.map((entry, index) => (
            <div
              key={entry.name}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                entry.name.toLowerCase() === currentUserName?.toLowerCase()
                  ? 'bg-primary/20 border border-primary/30'
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {getRankIcon(index)}
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {entry.name}
                    {entry.name.toLowerCase() === currentUserName?.toLowerCase() && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {entry.sessions} sessions • {entry.achievements.length} achievements
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary">{entry.points}</div>
                <div className="text-xs text-muted-foreground">points</div>
              </div>
            </div>
          ))
        )}
      </div>

      {leaderboard.length > 5 && (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm"
          >
            {isExpanded ? 'Show Less' : `Show All ${leaderboard.length} Players`}
          </Button>
        </div>
      )}

      {leaderboard.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            🏆 Compete by earning points through mantra practice
          </div>
        </div>
      )}
    </Card>
  );
}