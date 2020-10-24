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
