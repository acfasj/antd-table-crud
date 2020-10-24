做了蛮多的后台管理页面, 几乎都是 table+弹窗表单. 所以总结一下自己 CRUD 的套路

假设这次要做一个关于文章 Post 的增删改查的需求

## 类型定义

```tsx
/** 文章 */
export interface Post {
  /** 主键 */
  id: number
  /** 标题 */
  title: string
  /** 内容 */
  content: string
  /** 状态 */
  status: PostStatus
  /** 排序字段 */
  order: number
  /** 创建时间, 时间戳 */
  createdAt: number
  /** 更新时间,时间戳 */
  updatedAt: number
}
/** 文章状态 */
enum PostStatus {
  /** 草稿 */
  Draft = 0,
  /** 已发布 */
  Published = 1,
}
```

假设所有后端接口都满足 `API` 这个类型的定义

```tsx
/** 后端接口 */
export interface API<Response = unknown> {
  (...args: any): Promise<Response>
}
```

## 基本数据分页展示

首先, 我们要有一个获取文章列表的接口, 并且可以进行分页查询.
那么就来模拟一个接口, 取名为`getPosts`. 类型如下

```tsx
export interface GetPostsDto {
  /** @default 1 */
  page?: number
  /** @default 20 */
  pageSize?: number
}
export interface APIPagination {
  page: number
  total: number
  pageSize: number
}
export interface TableListResponse<T = unknown> {
  list: T[]
  pagination: APIPagination
}
// getPosts 的类型
type GetPosts = (dto?: GetPostsDto) => Promise<TableListResponse<Post>>
```

接口有了就可以写页面了

装好 antd 以后, 引入 Table 组件, 然后先一股脑地定义好 columns

```tsx
const columns: ColumnProps<Post>[] = [
  { dataIndex: 'id', title: 'id' },
  { dataIndex: 'title', title: 'name' },
  { dataIndex: 'content', title: 'content' },
  { dataIndex: 'status', title: 'status' },
  { dataIndex: 'order', title: 'order' },
  { dataIndex: 'createdAt', title: 'createdAt' },
  { dataIndex: 'updatedAt', title: 'updatedAt' },
  {
    render: () => (
      <Space>
        <span>编辑</span>
        <span style={{ color: 'red' }}>删除</span>
      </Space>
    ),
  },
]

export default function App() {
  return (
    <div className='App'>
      <h1>antd table curd</h1>
      <Table rowKey='id' dataSource={[]} columns={columns}></Table>
    </div>
  )
}
```

这样 table 就渲染出来了

接下来就想着怎么调用`getPosts`接口. 重新来看看 getPosts 的类型

```tsx
type GetPosts = (dto?: GetPostsDto) => Promise<TableListResponse<Post>>
```

我们需要一个 state 来存储查询参数`GetPostsDto`

```tsx
const [query, setQuery] = React.useState<GetPostsDto>({})
```

同时, 需要一个 state 来存储接口返回的数据 `TableListResponse<Post>`

```tsx
const [data, setData] = React.useState<TableListResponse<Post>>({
  list: [],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
  },
})
```

加个 loding

```tsx
const [loading, setLoading] = React.useState(false)
```

那就可以在 `React.useEffect` 调用接口了

```tsx
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
```

这样的话, table 里就已经有数据了, 大概长这样
![](./screenshots/121603509085_.pic.jpg)

然后, 我们要在切换分页的时候, 重新发起请求调用接口. 只需要监听 table 的 onChange 函数, setQuery 即可(因为 query 每次变化的时候都会重新调用接口)

```tsx
onChange={(pagination) => {
  setQuery({
    page: pagination.current || 1,
    pageSize: pagination.pageSize || 20
  });
}}
```

当然, 如果只是关心分页的变化的话, 也可以在 Table 组件的 pagination 配置里监听分页的 onChange 函数, 而不是整个 table 的 onChange 函数

到这里, 页面的基本展示就完成了, 可以访问[https://codesandbox.io/s/smoosh-bash-pe3l3?file=/src/App.tsx](https://codesandbox.io/s/smoosh-bash-pe3l3?file=/src/App.tsx)来查看在线的 demo
