import { Story, Meta } from '@storybook/react'
import { SharedUi, SharedUiProps } from './shared-ui'

export default {
  component: SharedUi,
  title: 'SharedUi',
} as Meta

const Template: Story<SharedUiProps> = (args) => <SharedUi {...args} />

export const Primary = Template.bind({})
Primary.args = {}
