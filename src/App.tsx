import React from 'react'
import { Button, message, Modal, Space, Table } from 'antd'
import { ColumnProps } from 'antd/lib/table'
import qs from 'qs'
import './App.css'
import {
  Post,
  getPosts,
  GetPostsDto,
  createPost,
  updatePost,
  deletePost,
  batchUpdatePostsStatus,
} from './service'
import { antdPaginationAdapter, clamp, validIntOrUndefined } from './utils'
import { SearchForm } from './search-form'
import { PostForm } from './post-form'
import { BatchUpdatePostsStatusForm } from './batch-update-posts-status-form'
import { useTableListQuery } from './use-table-list-query'
import { useStateSyncToUrl } from './use-state-sync-to-url'

function getDefaultQuery() {
  // 先不考虑服务端渲染
  const urlSearchParams = qs.parse(window.location.search, {
    ignoreQueryPrefix: true,
  })
  const { page, pageSize, title, status, order } = urlSearchParams
  const dto: GetPostsDto = {}
  if (typeof page === 'string') {
    dto.page = validIntOrUndefined(page) || 1
  }
  if (typeof pageSize === 'string') {
    dto.pageSize = validIntOrUndefined(pageSize) || 20
  }
  if (typeof title === 'string') {
    dto.title = title
  }
  if (typeof status === 'string') {
    dto.status = validIntOrUndefined(status)
  }
  if (typeof order === 'string') {
    const orderNum = validIntOrUndefined(order)
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
type ModalActionType = '' | 'create' | 'update' | 'batchUpdateStatus'
type ModalActionFactory = <
  API extends (...args: any[]) => Promise<unknown>
>(options: {
  api: API
  successMessage?: string
  errorMessage?: string
}) => (...args: Parameters<API>) => Promise<void>
function App() {
  const [defaultQuery] = React.useState<GetPostsDto>(getDefaultQuery)
  const { data, query, setQuery, loading } = useTableListQuery(
    getPosts,
    defaultQuery
  )
  const [selectedRecord, setSelectedRecord] = React.useState<Post>()
  const [selectedRows, setSelectedRows] = React.useState<Post[]>([])
  const [modalActionType, setModalActionType] = React.useState<ModalActionType>(
    ''
  )
  const [modalActionLoading, setModalActionLoading] = React.useState(false)
  const clean = () => {
    setSelectedRecord(undefined)
    setSelectedRows([])
  }
  const handleModalCancel = () => {
    setModalActionType('')
    clean()
  }
  const modalActionFactory: ModalActionFactory = (options) => {
    const {
      api,
      successMessage = '操作成功',
      errorMessage = '操作失败',
    } = options
    return async (...args: any[]) => {
      setModalActionLoading(true)
      try {
        await api(...args)
        message.success(successMessage)
        // 刷新列表
        setQuery((prev) => ({
          ...prev,
        }))
        handleModalCancel()
      } catch (e) {
        message.error(errorMessage)
      } finally {
        setModalActionLoading(false)
      }
    }
  }

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
      filteredValue:
        query.status === undefined ? undefined : [query.status.toString()],
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
              setModalActionType('update')
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
                    page:
                      data.list.length === 1
                        ? clamp(prevPage - 1, 1, prevPage)
                        : prevPage,
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

  useStateSyncToUrl(query)

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
        <Space>
          <Button type='primary' onClick={() => setModalActionType('create')}>
            Create
          </Button>

          <Button
            type='primary'
            disabled={selectedRows.length <= 0}
            onClick={() => {
              setModalActionType('batchUpdateStatus')
            }}
          >
            批量更新文章状态
          </Button>
        </Space>
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
              filters.status && filters.status.length > 0
                ? Number(filters.status[0])
                : undefined,
            order:
              !Array.isArray(sorter) &&
              !!sorter.order &&
              sorter.field === 'order'
                ? ({ ascend: 0, descend: 1 } as const)[sorter.order]
                : undefined,
          }))
        }}
        rowSelection={{
          selectedRowKeys: selectedRows.map((item) => item.id),
          onChange: (_, rows) => setSelectedRows(rows),
        }}
      ></Table>
      <PostForm
        title='Create Post'
        visible={modalActionType === 'create'}
        onCreate={modalActionFactory({
          api: createPost,
          successMessage: '创建成功',
          errorMessage: '创建失败',
        })}
        onCancel={handleModalCancel}
        loading={modalActionLoading}
      />
      <PostForm
        title='Update Post'
        record={selectedRecord}
        visible={modalActionType === 'update'}
        onUpdate={modalActionFactory({
          api: updatePost,
          successMessage: '编辑成功',
          errorMessage: '编辑失败',
        })}
        onCancel={handleModalCancel}
        loading={modalActionLoading}
      />
      <BatchUpdatePostsStatusForm
        visible={modalActionType === 'batchUpdateStatus'}
        records={selectedRows}
        loading={modalActionLoading}
        onCancel={handleModalCancel}
        onSubmit={modalActionFactory({
          api: batchUpdatePostsStatus,
          successMessage: '批量编辑成功',
          errorMessage: '批量编辑失败',
        })}
      />
    </div>
  )
}

export default App
