import { defineComponent, h, markRaw } from 'vue'
import { type WidgetItem } from '@/widgets/index'
// 默认值 TS会自己类型推断
const DEFAULT_PROPS = {
  content: '请输入内容',
  size: 16,
} as const

const inputComponent = defineComponent({
  // 和外面的导出的props是两个东西，现阶段还是分开写好一点
  props: {
    content: String,
    size: Number,
  },
  setup(props) {
    // return () => h('span', { style: { fontSize: `${props.size}px` } }, props.content)
    return () => <input type="text" placeholder={props.content} size={props.size} />
  },
})

export default {
  key: 'input',
  label: '输入框',
  focus: false,
  component: markRaw(inputComponent),
  props: {
    content: {
      label: '默认文字提示',
      type: 'text',
      defaultValue: DEFAULT_PROPS.content,
    },
    size: {
      label: '输入框长度',
      type: 'number',
      defaultValue: DEFAULT_PROPS.size,
    },
  },
} satisfies WidgetItem
