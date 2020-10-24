import React from 'react'
import { Space, Table } from 'antd'
import { ColumnProps } from 'antd/lib/table'
import './App.css'
import { Post, getPosts, TableListResponse, GetPostsDto } from './service'
import { antdPaginationAdapter } from './utils'
import { SearchForm } from './search-form'

const columns: ColumnProps<Post>[] = [
  { dataIndex: 'id', title: 'id' },
  { dataIndex: 'title', title: 'title' },
  { dataIndex: 'content', title: 'content' },
  {
    dataIndex: 'status',
    title: 'status',
    filters: [
      { text: '0', value: 0 },
      { text: '1', value: 1 },
    ],
    filterMultiple: false,
  },
  { dataIndex: 'order', title: 'order', sorter: true },
  { dataIndex: 'createdAt', title: 'createdAt', sorter: true },
  { dataIndex: 'updatedAt', title: 'updatedAt' },
  {
    title: '操作',
    render: () => (
      <Space>
        <span>编辑</span>
        <span style={{ color: 'red' }}>删除</span>
      </Space>
    ),
  },
]
function App() {
  const [query, setQuery] = React.useState<GetPostsDto>({})
  const [data, setData] = React.useState<TableListResponse<Post>>({
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
    getPosts(query)
      .then((res) => isCurrent && setData(res))
      .finally(() => isCurrent && setLoading(false))
    return () => {
      // 防止组件已经卸载的时候, 还会对已经卸载的组件setState
      isCurrent = false
    }
    // query每次变化的时候都会重新调用接口
  }, [query])

  return (
    <div>
      <h1>antd table crud</h1>
      <SearchForm
        onSubmit={(values) =>
          setQuery((prev) => ({
            ...prev,
            ...values,
            page: 1, // 重置分页
          }))
        }
        onReset={(values) =>
          setQuery((prev) => ({
            ...prev,
            ...values,
            page: 1, // 重置分页
          }))
        }
      />
      <Table
        rowKey='id'
        dataSource={data.list}
        columns={columns}
        loading={loading}
        pagination={{ ...antdPaginationAdapter(data.pagination) }}
        onChange={(pagination, filters, sorter) => {
          setQuery((prev) => ({
            ...prev,
            page: pagination.current || 1,
            pageSize: pagination.pageSize || 20,
            status:
              filters.status && filters.status.length > 0 ? Number(filters.status[0]) : undefined,
            order:
              !Array.isArray(sorter) && !!sorter.order && sorter.field === 'order'
                ? ({ ascend: 0, descend: 1 } as const)[sorter.order]
                : undefined,
          }))
        }}
      ></Table>
    </div>
  )
}

export default App
