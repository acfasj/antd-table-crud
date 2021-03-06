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
export enum PostStatus {
  /** 草稿 */
  Draft = 0,
  /** 已发布 */
  Published = 1,
}
/** 后端接口 */
export interface API<Response = unknown> {
  (...args: any[]): Promise<Response>
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function delay(timeout?: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout ? timeout : randomInt(100, 1200))
  })
}
function ceateMockPosts(): Post[] {
  const len = 200
  return new Array(len).fill(0).map((_, index) => ({
    id: len - index,
    title: `post - ${len - index}`,
    content: 'abcdefghijklmnopqrstuvwxyz'.slice(
      randomInt(0, 8),
      randomInt(14, 25)
    ),
    status: randomInt(0, 1) as PostStatus,
    order: randomInt(1, 20),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }))
}
let allPosts = ceateMockPosts()
export interface GetPostsDto {
  /** @default 1 */
  page?: number
  /** @default 20 */
  pageSize?: number
  /** 0升序 1降序 */
  order?: 0 | 1
  status?: PostStatus
  title?: string
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
function log(msg: string, ...args: any[]) {
  console.log(`%c ${msg}`, 'background: #222; color: #bada55', ...args)
}
function logRequest(...args: any[]) {
  log('=================== Request => ', ...args)
}
function logResponse(...args: any[]) {
  log('=================== Response => ', ...args)
}

export async function getPosts(
  dto: GetPostsDto = {}
): Promise<TableListResponse<Post>> {
  const { page = 1, pageSize = 20, title, status, order } = dto
  logRequest('getPosts', dto)
  await delay()
  const start = (page - 1) * pageSize
  const end = start + pageSize
  let filteredList = allPosts.concat()
  if (title) {
    filteredList = filteredList.filter((item) => item.title.includes(title))
  }
  if (status || status === 0) {
    filteredList = filteredList.filter((item) => item.status === status)
  }
  if (order || order === 0) {
    filteredList.sort((a, b) =>
      order === 0 ? a.order - b.order : b.order - a.order
    )
  }
  const ret = {
    list: filteredList.slice(start, end),
    pagination: {
      total: filteredList.length,
      page,
      pageSize,
    },
  }
  logResponse('getPosts', ret)
  return ret
}

export async function getPostById(id: number) {
  await delay()
  return allPosts.find((item) => item.id === id)
}

export async function deletePost(id: number) {
  logRequest('deletePost', id)
  await delay()
  allPosts = allPosts.filter((item) => item.id !== id)
  logResponse('deletePost')
}

export type CreatePostDto = Omit<Post, 'id' | 'createdAt' | 'updatedAt'>
export async function createPost(dto: CreatePostDto) {
  logResponse('createPost', dto)
  await delay()
  const id = allPosts[0].id + 1
  allPosts.unshift({ ...dto, id, createdAt: Date.now(), updatedAt: Date.now() })
  logResponse('createPost', allPosts)
  return { id }
}

export type UpdatePostDto = Partial<Post> & { id: number }
export async function updatePost(dto: UpdatePostDto) {
  logRequest('updatePost', dto)
  await delay()
  allPosts = allPosts.map((item) => {
    if (item.id === dto.id) {
      return {
        ...item,
        // 过滤掉undefined
        ...JSON.parse(JSON.stringify(dto)),
      }
    }
    return item
  })
  logResponse('updatePost')
}

export type BatchUpdatePostsStatusDto = {
  ids: number[]
  status: PostStatus
  remark: string
}
export async function batchUpdatePostsStatus(dto: BatchUpdatePostsStatusDto) {
  logRequest('batchUpdatePost', dto)
  await delay()
  const { ids, status } = dto
  allPosts = allPosts.map((item) => {
    if (ids.includes(item.id)) {
      return {
        ...item,
        status,
      }
    }
    return item
  })
  logResponse('batchUpdatePost')
}
