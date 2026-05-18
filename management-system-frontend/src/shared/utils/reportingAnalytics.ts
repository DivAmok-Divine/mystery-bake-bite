import { isSameDay, isWithinInterval, format, differenceInDays, startOfDay, addDays, eachDayOfInterval } from 'date-fns'
import type { Order, Customer } from '@backend/lib/db'

export type TimeView = 'Today' | 'All'
export interface DateRange {
  start: Date | null
  end: Date | null
}

/**
 * Filter orders based on a timeframe
 */
export const filterOrdersByTimeframe = (orders: Order[], timeView: TimeView, dateRange: DateRange) => {
  const now = new Date()
  return orders.filter(order => {
    const orderDate = new Date(order.createdAt)
    
    if (timeView === 'Today') {
      return isSameDay(orderDate, now)
    }

    if (dateRange.start && dateRange.end) {
      return isWithinInterval(orderDate, { 
        start: dateRange.start, 
        end: new Date(new Date(dateRange.end).setHours(23, 59, 59)) 
      })
    } else if (dateRange.start) {
      return isSameDay(orderDate, dateRange.start)
    }
    
    return true
  })
}

/**
 * Filter customers based on a timeframe (by their creation date)
 */
export const filterCustomersByTimeframe = (customers: Customer[], timeView: TimeView, dateRange: DateRange) => {
  const now = new Date()
  return customers.filter(customer => {
    const customerDate = new Date(customer.createdAt)
    
    if (timeView === 'Today') {
      return isSameDay(customerDate, now)
    }

    if (dateRange.start && dateRange.end) {
      return isWithinInterval(customerDate, { 
        start: dateRange.start, 
        end: new Date(new Date(dateRange.end).setHours(23, 59, 59)) 
      })
    } else if (dateRange.start) {
      return isSameDay(customerDate, dateRange.start)
    }
    
    return true
  })
}

/**
 * Calculate activity pulse (order counts dynamically grouped by active timeframe)
 */
export const calculateActivityPulse = (orders: Order[], timeView?: TimeView, dateRange?: DateRange) => {
  let points: { label: string; count: number; tooltipLabel?: string }[] = []
  
  if (timeView === 'Today') {
    // Show hourly pulse for today! (8am, 10am, 12pm, 2pm, 4pm, 6pm, 8pm)
    const hours = [8, 10, 12, 14, 16, 18, 20]
    const now = new Date()
    points = hours.map(hr => {
      const count = orders.filter(o => {
        const orderDate = new Date(o.createdAt)
        return isSameDay(orderDate, now) && orderDate.getHours() >= hr - 1 && orderDate.getHours() < hr + 1
      }).length
      const label = hr > 12 ? `${hr - 12}pm` : hr === 12 ? '12pm' : `${hr}am`
      return { 
        label, 
        count,
        tooltipLabel: `${format(now, 'MMMM d, yyyy')} @ ${label}`
      }
    })
  } else if (dateRange && dateRange.start && dateRange.end) {
    const start = startOfDay(new Date(dateRange.start))
    const end = startOfDay(new Date(dateRange.end))
    const daysDiff = differenceInDays(end, start)
    
    if (daysDiff <= 10) {
      // Show every day in the range
      const days = eachDayOfInterval({ start, end })
      points = days.map(d => {
        const count = orders.filter(o => isSameDay(new Date(o.createdAt), d)).length
        return { 
          label: format(d, 'E'), 
          count,
          tooltipLabel: format(d, 'MMMM d, yyyy')
        }
      })
    } else {
      // Group into 7 equal bins
      const binSize = Math.ceil((daysDiff + 1) / 7)
      points = Array.from({ length: 7 }, (_, i) => {
        const binStart = addDays(start, i * binSize)
        const binEnd = addDays(binStart, binSize - 1)
        const count = orders.filter(o => {
          const orderDate = new Date(o.createdAt)
          return orderDate >= binStart && orderDate <= new Date(new Date(binEnd).setHours(23, 59, 59))
        }).length
        return {
          label: `${format(binStart, 'MMM d')}`,
          count,
          tooltipLabel: `${format(binStart, 'MMM d, yyyy')} - ${format(binEnd, 'MMM d, yyyy')}`
        }
      })
    }
  } else if (dateRange && dateRange.start) {
    // Single day selected - show hourly breakdown for that specific day
    const hours = [8, 10, 12, 14, 16, 18, 20]
    const day = new Date(dateRange.start)
    points = hours.map(hr => {
      const count = orders.filter(o => {
        const orderDate = new Date(o.createdAt)
        return isSameDay(orderDate, day) && orderDate.getHours() >= hr - 1 && orderDate.getHours() < hr + 1
      }).length
      const label = hr > 12 ? `${hr - 12}pm` : hr === 12 ? '12pm' : `${hr}am`
      return { 
        label, 
        count,
        tooltipLabel: `${format(day, 'MMMM d, yyyy')} @ ${label}`
      }
    })
  } else {
    // "All Time" view: Group orders dynamically so they tally 100% with the totals!
    if (orders.length > 0) {
      const dates = orders.map(o => new Date(o.createdAt).getTime())
      const minDate = new Date(Math.min(...dates))
      const maxDate = new Date()
      
      const minYear = minDate.getFullYear()
      const maxYear = maxDate.getFullYear()
      const yearDiff = maxYear - minYear
      
      if (yearDiff >= 2) {
        // Multi-year data: group by Year
        const yearsMap: { [key: number]: number } = {}
        for (let y = minYear; y <= maxYear; y++) {
          yearsMap[y] = 0
        }
        
        orders.forEach(o => {
          const y = new Date(o.createdAt).getFullYear()
          if (yearsMap[y] !== undefined) {
            yearsMap[y]++
          }
        })
        
        points = Object.keys(yearsMap).map(y => ({
          label: y,
          count: yearsMap[Number(y)],
          tooltipLabel: `Year ${y}`
        }))
      } else {
        // Less than 2 years: group by Month
        const monthsMap: { [key: string]: number } = {}
        const monthStartDates: { [key: string]: Date } = {}
        
        let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
        const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
        
        while (current <= endMonth) {
          const key = format(current, 'yyyy-MM')
          monthsMap[key] = 0
          monthStartDates[key] = new Date(current)
          current.setMonth(current.getMonth() + 1)
        }
        
        orders.forEach(o => {
          const orderDate = new Date(o.createdAt)
          const key = format(orderDate, 'yyyy-MM')
          if (monthsMap[key] !== undefined) {
            monthsMap[key]++
          }
        })
        
        points = Object.keys(monthsMap).sort().map(key => ({
          label: format(monthStartDates[key], 'MMM'),
          count: monthsMap[key],
          tooltipLabel: format(monthStartDates[key], 'MMMM yyyy')
        }))
      }
    } else {
      // Fallback if no orders exist yet
      const now = new Date()
      points = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        return { 
          label: format(d, 'MMM'), 
          count: 0,
          tooltipLabel: format(d, 'MMMM yyyy')
        }
      })
    }
  }

  const maxCount = Math.max(...points.map(p => p.count), 1)
  return { points, maxCount }
}

/**
 * Calculate SVG line and area chart coordinates from raw pulse data points
 */
export const getSVGCoordinates = (pulsePoints: { label: string; count: number }[], maxCount: number) => {
  const pointsCount = pulsePoints.length
  if (pointsCount === 0) {
    return { svgPoints: [], pathD: '', areaD: '' }
  }

  const svgPoints = pulsePoints.map((p, i) => {
    const x = ((i + 0.5) / pointsCount) * 1000
    const y = 90 - (p.count / maxCount) * 80
    return { x, y, count: p.count, label: p.label }
  })

  const pathD = svgPoints.reduce((acc, p, i) => {
    return acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  }, "")

  const areaD = pathD ? `${pathD} L ${svgPoints[svgPoints.length - 1].x} 100 L ${svgPoints[0].x} 100 Z` : ""

  return { svgPoints, pathD, areaD }
}
