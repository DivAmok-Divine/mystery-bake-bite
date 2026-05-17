import React, { useMemo } from 'react'
import { getSVGCoordinates } from '@shared/utils/front-end-calculations/reportingAnalytics'

interface TopBitesChartProps {
  topBites: [string, number][]
}

export const TopBitesChart: React.FC<TopBitesChartProps> = ({ topBites }) => {
  const points = useMemo(() => {
    return topBites.map(([name, count]) => ({
      label: name,
      count
    }))
  }, [topBites])

  const maxCount = useMemo(() => {
    return Math.max(...points.map(p => p.count), 1)
  }, [points])

  const { svgPoints, pathD, areaD } = useMemo(() => {
    return getSVGCoordinates(points, maxCount)
  }, [points, maxCount])

  if (topBites.length === 0) {
    return (
      <div className="p-10 text-center bg-brand-chocolate/5 rounded-2xl border border-dashed border-brand-chocolate/10 text-brand-chocolate/40 text-sm font-bold">
        No sales recorded for this period yet.
      </div>
    )
  }

  return (
    <div className="relative h-44 pt-4 px-2 pb-6 border-b border-brand-chocolate/5">
      {/* SVG Trendline and Overlay */}
      <div className="absolute left-2 right-2 top-4 bottom-8 pointer-events-none z-10">
        <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="bites-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c5a880" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#c5a880" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Area under the line */}
          {areaD && (
            <path 
              d={areaD} 
              fill="url(#bites-gradient)" 
              className="transition-all duration-500" 
            />
          )}
          
          {/* The trend line */}
          {pathD && (
            <path 
              d={pathD} 
              fill="none" 
              stroke="#c5a880" 
              strokeWidth="3" 
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500"
            />
          )}

          {/* Glowing Peaks */}
          {svgPoints.map((pt, i) => (
            <g key={i}>
              <circle 
                cx={pt.x} 
                cy={pt.y} 
                r="6" 
                fill="#c5a880" 
                fillOpacity="0.2"
                className="animate-ping"
                style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
              />
              <circle 
                cx={pt.x} 
                cy={pt.y} 
                r="4" 
                fill="#c5a880" 
                stroke="#fff" 
                strokeWidth="1.5" 
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Histogram Bars */}
      <div className="flex items-end justify-between h-full gap-3 relative z-0">
        {points.map((p, i) => (
          <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5 relative group cursor-pointer">
            {/* Branded Crown Icon for Number 1 */}
            {i === 0 && p.count > 0 && (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm pointer-events-none z-20">👑</span>
            )}
            
            <div 
              className="w-full bg-brand-chocolate/[0.08] group-hover:bg-brand-dough/30 rounded-t-lg transition-all group-hover:scale-x-105 min-h-[8px] shadow-sm" 
              style={{ height: `${(p.count / maxCount) * 80}%` }}
            />
            {/* Tooltip positioned relative to the column, showing on group-hover */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-chocolate text-white text-[9px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-25">
              <div className="text-[8px] opacity-70 mb-0.5">{p.label}</div>
              <div>{p.count} sold</div>
            </div>
            
            <span className="text-[10px] font-bold text-brand-chocolate/40 truncate max-w-[65px]" title={p.label}>
              {p.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
