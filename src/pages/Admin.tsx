import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Users, Award, Clock } from 'lucide-react';

interface User {
  id: string;
  name: string;
  total_points: number;
  completed_sessions: number;
  achievements: string[];
  created_at: string;
  last_active: string;
}

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: { points: string; sessions: string } }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user has admin access
  const checkAdminAccess = () => {
    const userData = localStorage.getItem('mantra-user');
    if (!userData) {
      navigate('/');
      return false;
    }
    
    const user = JSON.parse(userData);
    const allowedAdmins = ['Kunj thakur', 'Darkskull'];
    
    if (!allowedAdmins.includes(user.name)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel",
        variant: "destructive"
      });
      navigate('/');
      return false;
    }
    
    return true;
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('total_points', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      
      // Initialize edit values
      const initialEditValues: { [key: string]: { points: string; sessions: string } } = {};
      data?.forEach(user => {
        initialEditValues[user.id] = {
          points: user.total_points.toString(),
          sessions: user.completed_sessions.toString()
        };
      });
      setEditValues(initialEditValues);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserProgress = async (userId: string, points: number, sessions: number) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          total_points: points,
          completed_sessions: sessions,
          last_active: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User progress updated successfully"
      });

      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user progress",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateClick = (userId: string) => {
    const values = editValues[userId];
    if (!values) return;

    const points = parseInt(values.points) || 0;
    const sessions = parseInt(values.sessions) || 0;

    updateUserProgress(userId, points, sessions);
  };

  const updateEditValue = (userId: string, field: 'points' | 'sessions', value: string) => {
    setEditValues(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value
      }
    }));
  };

  useEffect(() => {
    if (checkAdminAccess()) {
      fetchUsers();
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-divine flex items-center justify-center">
        <div className="text-white text-xl">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-divine p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to App
          </Button>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
        </div>

        <div className="grid gap-6">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription className="text-white/70">
                Restore points for users who lost their progress during authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      <div className="md:col-span-2">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <p className="text-sm text-white/70">
                          Created: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-white/70">
                          Last Active: {new Date(user.last_active).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        <Input
                          type="number"
                          value={editValues[user.id]?.points || '0'}
                          onChange={(e) => updateEditValue(user.id, 'points', e.target.value)}
                          className="w-20 bg-white/10 border-white/20 text-white"
                          placeholder="Points"
                        />
                        <span className="text-sm text-white/70">pts</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <Input
                          type="number"
                          value={editValues[user.id]?.sessions || '0'}
                          onChange={(e) => updateEditValue(user.id, 'sessions', e.target.value)}
                          className="w-20 bg-white/10 border-white/20 text-white"
                          placeholder="Sessions"
                        />
                        <span className="text-sm text-white/70">sessions</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {user.achievements.map((achievement, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {achievement}
                          </Badge>
                        ))}
                        {user.achievements.length === 0 && (
                          <span className="text-sm text-white/50">No achievements</span>
                        )}
                      </div>
                      
                      <div>
                        <Button
                          onClick={() => handleUpdateClick(user.id)}
                          disabled={updating === user.id}
                          className="bg-primary hover:bg-primary/80"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updating === user.id ? 'Updating...' : 'Update'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle>Recovery Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-white/80">
                <p>• Users may have lost points during login/signup due to authentication issues</p>
                <p>• Manually restore points based on what you remember or user reports</p>
                <p>• Common point values: 10-50 for new users, 100+ for active users</p>
                <p>• Sessions typically range from 1-10 depending on user activity</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;