import React from 'react'
import { Form, Input, InputNumber, Modal, Radio } from 'antd'
import { CreatePostDto, Post, PostStatus, UpdatePostDto } from './service'

interface FormValues {
  title: string
  content: string
  status: PostStatus
  order: number
}
export function PostForm(props: {
  visible: boolean
  title: string
  loading: boolean
  onCancel: () => void
  onCreate?: (dto: CreatePostDto) => void
  onUpdate?: (dto: UpdatePostDto) => void
  record?: Post
}) {
  const {
    visible,
    onCancel,
    onCreate,
    onUpdate,
    loading,
    record,
    title,
  } = props
  const [form] = Form.useForm<FormValues>()
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (record) {
        onUpdate &&
          onUpdate({
            ...values,
            id: record.id,
          } as UpdatePostDto)
      } else {
        onCreate && onCreate(values as CreatePostDto)
      }
    })
  }

  // 初始化表单
  React.useEffect(() => {
    form.setFieldsValue({
      title: record?.title,
      content: record?.content,
      status: record ? record.status : PostStatus.Draft,
      order: record?.order || 1,
    })
  }, [record, form])

  return (
    <Modal
      // @see https://ant.design/components/form-cn/#FAQ
      forceRender
      title={title}
      visible={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okButtonProps={{ loading }}
    >
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
        <Form.Item
          name='title'
          label='title'
          rules={[
            {
              required: true,
              message: 'title is required',
            },
          ]}
        >
          <Input></Input>
        </Form.Item>
        <Form.Item
          name='content'
          label='content'
          rules={[
            {
              required: true,
              message: 'content is required',
            },
          ]}
        >
          <Input.TextArea></Input.TextArea>
        </Form.Item>
        <Form.Item name='status' label='status' required>
          <Radio.Group>
            <Radio value={PostStatus.Draft}>draft</Radio>
            <Radio value={PostStatus.Published}>published</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name='order'
          label='order'
          rules={[
            {
              required: true,
              message: 'order is required',
            },
          ]}
        >
          <InputNumber min={1}></InputNumber>
        </Form.Item>
      </Form>
    </Modal>
  )
}
