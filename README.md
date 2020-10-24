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
  { dataIndex: 'title', title: 'title' },
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

## 顶部搜索表单

假设我们可以根据文章标题来进行模糊搜索, 需要在 table 上方添加一个输入框
更新搜索参数 `GetPostsDto`的类型定义为

```tsx
export interface GetPostsDto {
  /** @default 1 */
  page?: number
  /** @default 20 */
  pageSize?: number
  title?: string
}
```

接着使用 antd 的 Form 组件来创建一个业务表单组件, 取名为 SearchForm

```tsx
interface FormValues {
  title?: string
}
export function SearchForm(props: {
  onSubmit: (values: FormValues) => any
  onReset: (values: FormValues) => any
}) {
  const { onSubmit, onReset } = props
  const [form] = Form.useForm<FormValues>()
  const handleReset = () => {
    form.resetFields()
    onReset({ title: undefined })
  }
  return (
    <Form form={form} layout='inline' onFinish={onSubmit}>
      <Form.Item name='title' label='标题'>
        <Input placeholder='文章标题' />
      </Form.Item>
      <Button htmlType='submit' type='primary'>
        搜索
      </Button>
      <Button htmlType='button' onClick={handleReset}>
        重置
      </Button>
    </Form>
  )
}
```

我们希望用户点击搜索或者重置的时候, 都重新发起请求来刷新 table 的数据. 显然我们又需要修改 `query` 这个 state

```tsx
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
```

注意这里, 我们用了 setQuery 传递了一个函数, 同时结合展开运算符, 达到了 Class Component 里 this.setState 合并更新对象的效果, 参考[React 文档](https://zh-hans.reactjs.org/docs/hooks-reference.html#usestate)
因为, 我们不希望点击搜索传递了`title`参数时, 就把之前可能已经存在的 `pageSize` 等参数丢掉

同理, table 里的 onChange 函数也要进行同样的操作, 不能因为切换分页就把可能已经存在的`title`参数丢了

```tsx
onChange={(pagination) => {
  setQuery((prev) => ({
    ...prev,
    page: pagination.current || 1,
    pageSize: pagination.pageSize || 20
  }));
}}
```

这个时候给表格大概是长这样的
![](./screenshots/141603520105_.pic.jpg)
查看在线 demo [https://codesandbox.io/s/great-black-6mvm2?file=/src/App.tsx](https://codesandbox.io/s/great-black-6mvm2?file=/src/App.tsx)

### 表单校验

接着, 来思考一个有趣的问题. 假设这个 title 的输入框, 用户输入一个超长的字符串, 那么前端要做一些限制吗? 不同的应用可能有不同的答案

- 像谷歌的搜索框, 我试了最多只能输入 2048 个字符, 因为它会把这个搜索的字符串加到 url 里, url 显然是有长度限制的(具体看实现), 所以也很合理.B 站的搜索框也做了类似的处理, 但是限制在了 100 个字符
- 阿里云的用户中心里, 对于订单号这个 input, 前端并没有做长度上的校验/过滤, 而是直接丢给后端, 然后后管返回系统异常前端弹窗提示
- 我平时的工作里, 后台管理系统中, 产品要求直接崩掉这次操作, 给用户提示字符过长之类的

个人来看的话, 我觉得直接过滤掉用户的输入/限制用户的输入, 但是不崩掉用户的请求会比较好. 比如说 “输入框输入 n 个字符串就不能再输入”, “数字 id 输入框就只能输入数字”, “antd 的 InputNumber 可以输入别的字符, 但是 blur 或者提交的时候会清掉”, “合理的情况下使用可以选择的空间而不是输入框(Select, Picker, 带搜索的 Select 等)”.

### 输入了, 但是没有点击搜索

假设一个用户更新了输入框, 但是没有点击搜索按钮, 这时候用户点击下一页等时候, 我应该带上视觉上已经更新了的 title 参数吗?
纠结过一下后我还是觉得这是用户傻逼, 你不点击搜索来提交我为什么要带, 而且带的话我是不是又要考虑一下表单校验怎么处理? 带了以后页码溢出怎么处理(下面会讨论页码溢出的情况)? 但是还是得看产品选择怎么搞了

## 筛选和排序

假设我们可以根据文章状态来在表格列进行筛选, 并且可以根据 Post 的 order 字段来排序
更新搜索参数 `GetPostsDto`的类型定义为

```tsx
export interface GetPostsDto {
  /** @default 1 */
  page?: number
  /** @default 20 */
  pageSize?: number
  title?: string
  /** 0升序 1降序 */
  order?: 0 | 1
  status?: PostStatus
}
```

可以看到, 对于接口来说 , 没有上面不同的, 就是加了两个字段而已; 那么对于前端来讲, 也没什么不同的, 就是搜索参数来自于不同的 UI 控件而已, 对于到代码还是那一句 `setQuery`

更新 columns status 那一栏

```tsx
  {
    dataIndex: "status",
    title: "status",
    filters: [
      { text: "0", value: 0 },
      { text: "1", value: 1 },
    ],
    filterMultiple: false,
  },
```

同时, 对应的 table 的 onChange 函数也更新一下. 同时因为这里使用了 antd 的 table, 得对它给我们的一些数据结构进行一下处理, 让它符合接口的规范

```tsx
  onChange={(pagination, filters) => {
  setQuery((prev) => ({
    ...prev,
    page: pagination.current || 1,
    pageSize: pagination.pageSize || 20,
    status:
      filters.status && filters.status.length > 0 ? Number(filters.status[0]) : undefined,
  }))
}}
```

排序也差不多

```tsx
{ dataIndex: 'order', title: 'order', sorter: true },


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
```

这时候数据结构就有点恶心了, 要转来转去. 没办法, ui 要用的数据接口和接口要用的数据结构, 用途都不一样那就很难一致. 至于多列排序也是类似的, 就是处理的 sorter 变成一个数组而已

这个时候表格大概是长这个样子的

![](./screenshots/151603526159_.pic.jpg)

查看在线 demo [https://codesandbox.io/s/async-moon-vjllu?file=/src/App.tsx](https://codesandbox.io/s/async-moon-vjllu?file=/src/App.tsx)
