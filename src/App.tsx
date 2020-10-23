import React from 'react'
import { Button, Space, Table } from 'antd'
import { ColumnProps } from 'antd/lib/table'
import './App.css'

interface Entity {
  id: number
  name: string
}
const data: Entity[] = [
  { id: 1, name: 'one' },
  { id: 2, name: 'two' },
]
const columns: ColumnProps<Entity>[] = [
  { dataIndex: 'id', title: 'id' },
  { dataIndex: 'name', title: 'name' },
  {
    render: () => (
      <Space>
        <Button type='text' size='small'>
          编辑
        </Button>
        <Button type='text' danger>
          删除
        </Button>
      </Space>
    ),
  },
]
function App() {
  return (
    <div>
      <h3>antd table crud</h3>
      <Table dataSource={data} columns={columns}></Table>
    </div>
  )
}

export default App
