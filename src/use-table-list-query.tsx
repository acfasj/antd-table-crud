import React from 'react'
import { TableListResponse } from './service'

export function useTableListQuery<
  Query extends { page?: number; pageSize?: number },
  Entity
>(
  api: (query: Query) => Promise<TableListResponse<Entity>>,
  defaultQuery: Query
) {
  const [query, setQuery] = React.useState<Query>(defaultQuery)
  const [data, setData] = React.useState<TableListResponse<Entity>>({
    list: [],
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
    },
  })
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    let isCurrent = true
    setLoading(true)
    api(query)
      .then((res) => isCurrent && setData(res))
      .finally(() => isCurrent && setLoading(false))
    return () => {
      // 防止组件已经卸载的时候, 还会对已经卸载的组件setState
      isCurrent = false
    }
    // query每次变化的时候都会重新调用接口
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return {
    query,
    setQuery,
    data,
    loading,
  }
}
