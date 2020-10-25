import React from 'react'
import { Form, Input, InputNumber, Modal, Radio } from 'antd'
import { CreatePostDto, PostStatus } from './service'

export function CreateForm(props: {
  visible: boolean
  onCreate: (dto: CreatePostDto) => void
  onCancel: () => void
  loading: boolean
}) {
  const { visible, onCancel, onCreate, loading } = props
  const [form] = Form.useForm()
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onCreate(values as CreatePostDto)
    })
  }
  return (
    <Modal
      title='Create Post'
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
        <Form.Item name='status' label='status' initialValue={PostStatus.Draft} required>
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
          initialValue={1}
        >
          <InputNumber min={1}></InputNumber>
        </Form.Item>
      </Form>
    </Modal>
  )
}
