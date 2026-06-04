import React from 'react'
import { useSystemLogs } from '../../api/useSystemLogs'
import { Activity, Clock, User } from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

export const LogsTab: React.FC = () => {
  const { logs, isLoading } = useSystemLogs()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-10 items-center justify-center text-brand-chocolate/40">
        <div className="w-8 h-8 border-2 border-brand-chocolate/20 border-t-brand-chocolate rounded-full animate-spin" />
        <p className="text-xs font-bold tracking-wider">Loading logs...</p>
      </div>
    )
  }

  if (!logs.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-brand-chocolate/40">
        <Activity size={32} strokeWidth={1.5} />
        <p className="text-xs font-bold tracking-wider">No activity logs found.</p>
      </div>
    )
  }

  // Group logs by day
  const groupedLogs = logs.reduce((acc, log) => {
    const day = format(log.createdAt, 'MMM dd, yyyy')
    if (!acc[day]) acc[day] = []
    acc[day].push(log)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="flex flex-col gap-4 pb-20">
      {Object.entries(groupedLogs).map(([day, dayLogs]) => (
        <div key={day} className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-brand-chocolate/40 tracking-wider sticky top-[125px] bg-brand-cream/95 backdrop-blur-md py-2 z-10">
            {day}
          </h3>
          
          <div className="flex flex-col gap-2">
            {dayLogs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-brand-chocolate/10 rounded-md p-3 flex flex-col gap-2 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      log.action === 'Login' || log.action === 'Logout' ? 'bg-blue-50 text-blue-600' :
                      log.action === 'Session TimeOut' ? 'bg-amber-50 text-amber-600' :
                      log.action === 'Create' ? 'bg-green-50 text-green-600' :
                      log.action === 'Edit' ? 'bg-purple-50 text-purple-600' :
                      log.action === 'Delete' ? 'bg-red-50 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {log.action}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-brand-chocolate/40">
                    <Clock size={12} />
                    {format(log.createdAt, 'h:mm a')}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  <p className="text-sm text-brand-chocolate font-medium leading-snug">
                    {log.details}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-brand-chocolate/50 bg-brand-chocolate/5 self-start px-2 py-1 rounded">
                    <User size={12} />
                    {log.userName}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
