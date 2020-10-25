import React from 'react'
import { Form, Input, Modal, Radio } from 'antd'
import { BatchUpdatePostsStatusDto, Post, PostStatus } from './service'

interface FormValues {
  status: PostStatus
  remark: string
}
export function BatchUpdatePostsStatusForm(props: {
  visible: boolean
  loading: boolean
  records: Post[]
  onCancel: () => void
  onSubmit: (dto: BatchUpdatePostsStatusDto) => Promise<void>
}) {
  const { visible, onCancel, onSubmit, loading, records } = props
  const [form] = Form.useForm<FormValues>()
  const handleSubmit = () => {
    form.validateFields().then(async (values) => {
      await onSubmit({
        ...values,
        ids: records.map((item) => item.id),
      } as BatchUpdatePostsStatusDto)
      // 更新完重置表单
      form.resetFields()
    })
  }

  return (
    <Modal
      // @see https://ant.design/components/form-cn/#FAQ
      forceRender
      title='批量更新文章状态'
      visible={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okButtonProps={{ loading }}
    >
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
        <Form.Item
          name='remark'
          label='remark'
          rules={[
            {
              required: true,
              message: 'remark is required',
            },
          ]}
        >
          <Input.TextArea placeholder='填写备注'></Input.TextArea>
        </Form.Item>
        <Form.Item
          name='status'
          label='status'
          required
          initialValue={PostStatus.Draft}
        >
          <Radio.Group>
            <Radio value={PostStatus.Draft}>draft 0</Radio>
            <Radio value={PostStatus.Published}>published 1</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  )
}
