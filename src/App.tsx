import React from 'react'
import { Button, message, Modal, Space, Table } from 'antd'
import { ColumnProps } from 'antd/lib/table'
import qs from 'qs'
import './App.css'
import {
  Post,
  getPosts,
  TableListResponse,
  GetPostsDto,
  CreatePostDto,
  createPost,
  UpdatePostDto,
  updatePost,
  deletePost,
} from './service'
import { antdPaginationAdapter, clamp, validIntOrUndefiend } from './utils'
import { SearchForm } from './search-form'
import { PostForm } from './post-form'

function getDefaultQuery() {
  // 先不考虑服务端渲染
  const urlSearchParams = qs.parse(window.location.search, { ignoreQueryPrefix: true })
  const { page, pageSize, title, status, order } = urlSearchParams
  const dto: GetPostsDto = {}
  if (typeof page === 'string') {
    dto.page = validIntOrUndefiend(page) || 1
  }
  if (typeof pageSize === 'string') {
    dto.pageSize = validIntOrUndefiend(pageSize) || 20
  }
  if (typeof title === 'string') {
    dto.title = title
  }
  if (typeof status === 'string') {
    dto.status = validIntOrUndefiend(status)
  }
  if (typeof order === 'string') {
    const orderNum = validIntOrUndefiend(order)
    dto.order = orderNum ? (clamp(orderNum, 0, 1) as 0 | 1) : undefined
  }
  return dto
}

function handleDelete(record: Post, onSuccess: () => void) {
  Modal.confirm({
    title: 'Delete Post',
    content: <p>确定删除 {record.title} 吗?</p>,
    onOk: async () => {
      try {
        await deletePost(record.id)
        message.success('删除成功')
        onSuccess()
      } catch (e) {
        message.error('删除失败')
      }
    },
  })
}

function App() {
  const [defaultQuery] = React.useState<GetPostsDto>(getDefaultQuery)
  const [query, setQuery] = React.useState<GetPostsDto>(defaultQuery)
  const [data, setData] = React.useState<TableListResponse<Post>>({
    list: [],
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
    },
  })
  const [loading, setLoading] = React.useState(false)
  const [selectedRecord, setSelectedRecord] = React.useState<Post>()

  const [createVisible, setCreateVisible] = React.useState(false)
  const [createLoading, setCreateLoading] = React.useState(false)
  const [updateVisible, setUpdateVisible] = React.useState(false)
  const [updateLoading, setUpdateLoading] = React.useState(false)

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
      filteredValue: query.status === undefined ? undefined : [query.status.toString()],
    },
    {
      dataIndex: 'order',
      title: 'order',
      sorter: true,
      sortOrder:
        query.order === undefined
          ? undefined
          : ({ 0: 'ascend', 1: 'descend' } as const)[query.order],
    },
    { dataIndex: 'createdAt', title: 'createdAt', sorter: true },
    { dataIndex: 'updatedAt', title: 'updatedAt' },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setSelectedRecord(record)
              setUpdateVisible(true)
            }}
          >
            编辑
          </span>
          <span
            style={{ color: 'red', cursor: 'pointer' }}
            onClick={() =>
              handleDelete(record, () =>
                setQuery((prev) => {
                  const prevPage = prev.page || 1
                  return {
                    ...prev,
                    page: data.list.length === 1 ? clamp(prevPage - 1, 1, prevPage) : prevPage,
                  }
                })
              )
            }
          >
            删除
          </span>
        </Space>
      ),
    },
  ]

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

  React.useEffect(() => {
    const { protocol, host, pathname } = window.location
    const newurl = `${protocol}//${host}${pathname}?${qs.stringify(query)}`
    window.history.replaceState(null, '', newurl)
    // query每次变化的时候同步参数到url
  }, [query])

  return (
    <div>
      <h1>antd table crud</h1>
      <SearchForm
        defaultQuery={defaultQuery}
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
      <div style={{ margin: '15px 0' }}>
        <Button type='primary' onClick={() => setCreateVisible(true)}>
          Create
        </Button>
      </div>
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
      <PostForm
        title='Create Post'
        visible={createVisible}
        onCreate={async (values: CreatePostDto) => {
          setCreateLoading(true)
          try {
            await createPost(values)
            message.success('创建成功')
            // 刷新列表
            setQuery((prev) => ({
              ...prev,
            }))
            setCreateVisible(false)
          } catch (e) {
            message.error('创建失败')
          } finally {
            setCreateLoading(false)
          }
        }}
        onCancel={() => setCreateVisible(false)}
        loading={createLoading}
      />
      <PostForm
        title='Update Post'
        record={selectedRecord}
        visible={updateVisible}
        onUpdate={async (values: UpdatePostDto) => {
          setUpdateLoading(true)
          try {
            await updatePost(values)
            message.success('编辑成功')
            // 刷新列表
            setQuery((prev) => ({
              ...prev,
            }))
            setUpdateVisible(false)
          } catch (e) {
            message.error('编辑失败')
          } finally {
            setUpdateLoading(false)
          }
        }}
        onCancel={() => setUpdateVisible(false)}
        loading={updateLoading}
      />
    </div>
  )
}

export default App
