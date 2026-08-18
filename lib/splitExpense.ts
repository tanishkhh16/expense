export function getDailyRate(totalAmount: number, startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return totalAmount / totalDays
}

export function getMonthPortion(totalAmount: number, startDate: string, endDate: string, year: number, month: number) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)

  const overlapStart = start > monthStart ? start : monthStart
  const overlapEnd = end < monthEnd ? end : monthEnd

  if (overlapStart > overlapEnd) return 0

  const overlapDays = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const dailyRate = getDailyRate(totalAmount, startDate, endDate)
  return dailyRate * overlapDays
}

export function getDayPortion(totalAmount: number, startDate: string, endDate: string, dateStr: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const day = new Date(dateStr)

  if (day < start || day > end) return 0

  return getDailyRate(totalAmount, startDate, endDate)
}