import type { Equipment } from '@backend/lib/db'

/**
 * Calculates equipment status distribution
 */
export const getEquipmentStatusCounts = (equipment: Equipment[]) => {
  return {
    Operational: equipment.filter(e => e.status === 'Operational').length,
    Maintenance: equipment.filter(e => e.status === 'Maintenance').length,
    Broken: equipment.filter(e => e.status === 'Broken').length,
  }
}

/**
 * Calculates total asset value and kitchen health score
 */
export const calculateEquipmentMetrics = (equipment: Equipment[]) => {
  const statusCounts = getEquipmentStatusCounts(equipment)
  const totalValue = equipment.reduce((sum, e) => sum + (e.price || 0), 0)
  const healthScore = equipment.length > 0 ? (statusCounts.Operational / equipment.length) * 100 : 0
  
  return { statusCounts, totalValue, healthScore }
}
