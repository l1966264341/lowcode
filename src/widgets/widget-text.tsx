import { defineComponent, h, markRaw } from 'vue'
import { type WidgetItem } from '@/widgets/index'
// 默认值 TS会自己类型推断
const DEFAULT_PROPS = {
  content: '你好，低代码',
  size: 18,
} as const

const textComponent = defineComponent({
  // 和外面的导出的props是两个东西，现阶段还是分开写好一点
  props: {
    content: { type: String, default: DEFAULT_PROPS.content },
    size: { type: Number, default: DEFAULT_PROPS.size },
  },
  setup(props) {
    // return () => h('span', { style: { fontSize: `${props.size}px` } }, props.content)
    return () => <span style={{ fontSize: props.size + 'px' }}>{props.content}</span>
  },
})

export default {
  key: 'text',
  label: '文本',
  focus: false,
  component: markRaw(textComponent),
  props: {
    content: {
      label: '文本内容',
      type: 'text',
      defaultValue: DEFAULT_PROPS.content,
    },
    size: {
      label: '字号',
      type: 'number',
      defaultValue: DEFAULT_PROPS.size,
    },
  },
} satisfies WidgetItem
