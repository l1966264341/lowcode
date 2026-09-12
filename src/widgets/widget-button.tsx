import { defineComponent, markRaw } from 'vue'
import type { WidgetItem } from '@/widgets/index'
const DEFAULT_PROPS = {
  content: '按钮',
  width: 50,
  height: 30,
} as const

const buttonComponent = defineComponent({
  props: {
    content: String,
    width: Number,
    height: Number,
  },
  setup(props) {
    return () => (
      <button style={{ width: `${props.width}px`, height: `${props.height}px` }}>
        {props.content}
      </button>
    )
  },
})

export default {
  key: 'button',
  label: '按钮',
  component: markRaw(buttonComponent),
  focus: false,
  props: {
    content: {
      label: '按钮内容',
      type: 'text',
      defaultValue: DEFAULT_PROPS.content,
    },
    width: {
      label: '按钮宽度',
      type: 'number',
      defaultValue: DEFAULT_PROPS.width,
    },
    height: {
      label: '按钮高度',
      type: 'number',
      defaultValue: DEFAULT_PROPS.height,
    },
  },
} satisfies WidgetItem
