import type { Meta, StoryObj } from "@storybook/react"
import { withRouter } from "storybook-addon-remix-react-router"

import { Component } from "./index"

const meta = {
  title: "pages/Home",
  component: Component,
  parameters: {
    layout: "centered",
  },
  decorators: [withRouter],
} satisfies Meta<typeof Component>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
