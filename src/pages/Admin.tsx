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
  custom_message?: string;
  custom_theme?: any;
  is_featured?: boolean;
}

interface GlobalSetting {
  id: string;
  setting_key: string;
  setting_value: any;
}

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: { 
    points: string; 
    sessions: string; 
    message: string;
    featured: boolean;
  } }>({});
  const [newGlobalSetting, setNewGlobalSetting] = useState({ key: '', value: '' });
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
      const initialEditValues: { [key: string]: { 
        points: string; 
        sessions: string; 
        message: string;
        featured: boolean;
      } } = {};
      data?.forEach(user => {
        initialEditValues[user.id] = {
          points: user.total_points.toString(),
          sessions: user.completed_sessions.toString(),
          message: user.custom_message || '',
          featured: user.is_featured || false
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

  const fetchGlobalSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('global_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setGlobalSettings(data || []);
    } catch (error) {
      console.error('Error fetching global settings:', error);
    }
  };

  const updateUserProgress = async (userId: string, points: number, sessions: number, message: string, featured: boolean) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          total_points: points,
          completed_sessions: sessions,
          custom_message: message || null,
          is_featured: featured,
          last_active: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User data updated successfully"
      });

      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user data",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const addGlobalSetting = async () => {
    if (!newGlobalSetting.key || !newGlobalSetting.value) return;
    
    try {
      const { error } = await supabase
        .from('global_settings')
        .upsert({
          setting_key: newGlobalSetting.key,
          setting_value: JSON.parse(newGlobalSetting.value)
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Global setting saved successfully"
      });

      setNewGlobalSetting({ key: '', value: '' });
      fetchGlobalSettings();
    } catch (error) {
      console.error('Error saving global setting:', error);
      toast({
        title: "Error",
        description: "Failed to save global setting",
        variant: "destructive"
      });
    }
  };

  const deleteGlobalSetting = async (id: string) => {
    try {
      const { error } = await supabase
        .from('global_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Global setting deleted successfully"
      });

      fetchGlobalSettings();
    } catch (error) {
      console.error('Error deleting global setting:', error);
      toast({
        title: "Error",
        description: "Failed to delete global setting",
        variant: "destructive"
      });
    }
  };

  const handleUpdateClick = (userId: string) => {
    const values = editValues[userId];
    if (!values) return;

    const points = parseInt(values.points) || 0;
    const sessions = parseInt(values.sessions) || 0;
    const message = values.message;
    const featured = values.featured;

    updateUserProgress(userId, points, sessions, message, featured);
  };

  const updateEditValue = (userId: string, field: 'points' | 'sessions' | 'message' | 'featured', value: string | boolean) => {
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
      fetchGlobalSettings();
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
            className="text-black border-black/20 hover:bg-black/10 bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to App
          </Button>
          <h1 className="text-3xl font-bold text-black">Admin Panel</h1>
        </div>

        <div className="grid gap-6">
          <Card className="bg-white/90 border-black/20 text-black">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black">
                <Users className="h-5 w-5" />
                User Management & Customization
              </CardTitle>
              <CardDescription className="text-black/70">
                Manage user data, custom messages, and individual features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {users.map((user) => (
                  <div key={user.id} className="bg-black/10 rounded-lg p-6 border border-black/20">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2 text-black">
                            {user.name}
                            {user.is_featured && <Badge variant="secondary">Featured</Badge>}
                          </h3>
                          <p className="text-sm text-black/70">
                            Created: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-black/70">
                            Last Active: {new Date(user.last_active).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-black" />
                            <Input
                              type="number"
                              value={editValues[user.id]?.points || '0'}
                              onChange={(e) => updateEditValue(user.id, 'points', e.target.value)}
                              className="w-20 bg-white border-black/20 text-black"
                              placeholder="Points"
                            />
                            <span className="text-sm text-black/70">pts</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-black" />
                            <Input
                              type="number"
                              value={editValues[user.id]?.sessions || '0'}
                              onChange={(e) => updateEditValue(user.id, 'sessions', e.target.value)}
                              className="w-20 bg-white border-black/20 text-black"
                              placeholder="Sessions"
                            />
                            <span className="text-sm text-black/70">sessions</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-sm text-black">
                            <input
                              type="checkbox"
                              checked={editValues[user.id]?.featured || false}
                              onChange={(e) => updateEditValue(user.id, 'featured', e.target.checked)}
                              className="rounded"
                            />
                            Featured User
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-black">Custom Message for {user.name}:</label>
                        <Input
                          value={editValues[user.id]?.message || ''}
                          onChange={(e) => updateEditValue(user.id, 'message', e.target.value)}
                          className="bg-white border-black/20 text-black"
                          placeholder="Enter custom message to display for this user..."
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        <span className="text-sm text-black/70">Achievements:</span>
                        {user.achievements.map((achievement, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {achievement}
                          </Badge>
                        ))}
                        {user.achievements.length === 0 && (
                          <span className="text-sm text-black/50">No achievements</span>
                        )}
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleUpdateClick(user.id)}
                          disabled={updating === user.id}
                          className="bg-primary hover:bg-primary/80"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updating === user.id ? 'Updating...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-black/20 text-black">
            <CardHeader>
              <CardTitle className="text-black">Global Website Settings</CardTitle>
              <CardDescription className="text-black/70">
                Control site-wide settings, colors, messages, and features for all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    value={newGlobalSetting.key}
                    onChange={(e) => setNewGlobalSetting(prev => ({ ...prev, key: e.target.value }))}
                    className="bg-white border-black/20 text-black"
                    placeholder="Setting key (e.g., theme_color, banner_text)"
                  />
                  <Input
                    value={newGlobalSetting.value}
                    onChange={(e) => setNewGlobalSetting(prev => ({ ...prev, value: e.target.value }))}
                    className="bg-white border-black/20 text-black"
                    placeholder='Setting value (JSON: "red" or {"color": "blue"})'
                  />
                  <Button onClick={addGlobalSetting} className="bg-primary hover:bg-primary/80">
                    Add Setting
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-black">Current Global Settings:</h4>
                  {globalSettings.map((setting) => (
                    <div key={setting.id} className="bg-black/10 rounded-lg p-4 border border-black/20">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-medium text-black">{setting.setting_key}</h5>
                          <p className="text-sm text-black/70">
                            {JSON.stringify(setting.setting_value)}
                          </p>
                        </div>
                        <Button
                          onClick={() => deleteGlobalSetting(setting.id)}
                          variant="destructive"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  {globalSettings.length === 0 && (
                    <p className="text-black/50">No global settings configured yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-black/20 text-black">
            <CardHeader>
              <CardTitle className="text-black">Admin Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-black">
                <h4 className="font-semibold text-black">User Management:</h4>
                <p>• Restore points for users who lost progress during authentication</p>
                <p>• Set custom messages that display for specific users</p>
                <p>• Mark users as "Featured" to highlight them</p>
                
                <h4 className="font-semibold text-black mt-4">Global Settings Examples:</h4>
                <p>• <code>site_banner</code>: "Welcome to our spiritual platform!"</p>
                <p>• <code>theme_color</code>: "#ff6b35"</p>
                <p>• <code>maintenance_mode</code>: true</p>
                <p>• <code>announcement</code>: {"{"}"text": "New features coming soon!", "color": "gold"{"}"}</p>
                
                <div className="bg-black/5 p-3 rounded mt-4">
                  <p className="text-sm text-black"><strong>Note:</strong> Changes save immediately to database and persist across reloads. All users will see global changes instantly.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;