import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Medal, Award, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface LeaderboardUser {
  username: string
  total_points: number
  completed_sessions: number
}

interface LeaderboardProps {
  onClose: () => void
}

const Leaderboard = ({ onClose }: LeaderboardProps) => {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('username, total_points, completed_sessions')
        .order('total_points', { ascending: false })
        .limit(10)

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load leaderboard",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />
    if (index === 2) return <Award className="h-6 w-6 text-amber-600" />
    return <span className="h-6 w-6 flex items-center justify-center text-sm font-bold">{index + 1}</span>
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4">Loading leaderboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold text-orange-800 dark:text-orange-200 flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Leaderboard
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-auto max-h-[60vh]">
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found. Be the first to start training!
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user, index) => (
                <div
                  key={user.username}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    index === 0 ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20' :
                    index === 1 ? 'bg-gray-50 border-gray-200 dark:bg-gray-800/20' :
                    index === 2 ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20' :
                    'bg-background border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(index)}
                    <div>
                      <div className="font-semibold">{user.username}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.completed_sessions} sessions completed
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {user.total_points} points
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Leaderboard