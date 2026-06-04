import { useQuery } from '@tanstack/react-query'
import { db, supabase, isCloudMode, generateUUID, type SystemLog } from '@backend/lib/db'

export const logSystemAction = async (action: string, details: string) => {
  try {
    const userStr = localStorage.getItem('mbb_user')
    if (!userStr) return; // Cannot log if no user
    const user = JSON.parse(userStr);

    const log: SystemLog = {
      id: generateUUID(),
      userId: user.id,
      userName: user.name,
      action,
      details,
      createdAt: new Date()
    };

    if (isCloudMode()) {
      await supabase.from('system_logs').insert([{
        id: log.id,
        user_id: log.userId,
        user_name: log.userName,
        action: log.action,
        details: log.details,
        created_at: log.createdAt.toISOString()
      }]);
    } else {
      await db.systemLogs.add(log as any);
    }
  } catch (err) {
    console.error('Failed to log system action:', err);
  }
};

export const useSystemLogs = () => {
  const cloud = isCloudMode()

  const logsQuery = useQuery({
    queryKey: ['systemLogs', cloud ? 'cloud' : 'local'],
    queryFn: async () => {
      try {
        if (cloud) {
          const { data, error } = await supabase.from('system_logs').select('*')
          if (error) throw error
          return (data || []).map((l: any) => ({
            id: l.id,
            userId: l.user_id,
            userName: l.user_name,
            action: l.action,
            details: l.details,
            createdAt: new Date(l.created_at)
          })).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
        } else {
          const data = await db.systemLogs.toArray()
          return data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        }
      } catch (e) {
        console.error('Error fetching logs:', e);
        return [];
      }
    }
  })

  return {
    logs: logsQuery.data || [],
    isLoading: logsQuery.isLoading
  }
}
