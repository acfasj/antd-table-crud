import { APIPagination } from './service'

export function antdPaginationAdapter(apiPagination: APIPagination) {
  return {
    current: apiPagination.page,
    total: apiPagination.total,
    pageSize: apiPagination.pageSize,
    showTotal: () => {
      return `每页${apiPagination.pageSize}条数据，共${apiPagination.total}条`
    },
  }
}

export function validIntOrUndefined(value: any) {
  const num = Number.parseInt(value, 10)
  return !Number.isNaN(num) ? num : undefined
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
