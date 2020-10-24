import React from 'react'
import { Form, Input, Button } from 'antd'
import { GetPostsDto } from './service'

interface FormValues {
  title?: string
}
export function SearchForm(props: {
  onSubmit: (values: FormValues) => any
  onReset: (values: FormValues) => any
  defaultQuery?: GetPostsDto
}) {
  const { onSubmit, onReset, defaultQuery } = props
  const [form] = Form.useForm<FormValues>()
  const handleReset = () => {
    form.resetFields()
    onReset({ title: undefined })
  }
  React.useEffect(() => {
    if (!defaultQuery) {
      return
    }
    const { title } = defaultQuery
    if (title) {
      form.setFieldsValue({ title })
    }
  }, [form, defaultQuery])
  return (
    <Form form={form} layout='inline' onFinish={onSubmit}>
      <Form.Item name='title' label='标题'>
        <Input placeholder='文章标题' maxLength={10} />
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
