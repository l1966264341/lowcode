# 低代码平台完整教程（讲义版）

> 面向：会 Vue3 + Element Plus + Pinia + JS（vue3-manage-system 水平）的同学。
> 用法：在 `mini-vue-lowcode` 里从零敲，这份文档是"课程讲义"。
> 阅读方式：一个阶段一个阶段来。先读"目标"，再看"代码 + 逐行解释"，写完对照"验收标准"。
> 卡住先查第 5 章"报错对照表"，再对照 `vue-lowcode-platform` 的参考文件（第 7 章有索引）。

## 目录

0. 怎么用这份文档
1. 项目全景（它是什么、核心思想、两张图纸、数据流总图）
2. 技术准备（TS 速查 / 组件两种写法 / 动态组件 / props-emit / Pinia / 拖拽）
3. 五个阶段任务（完整代码 + 解释 + 验收）
4. 四条数据线（阶段 1、2 完成后回来看）
5. 常见报错对照表
6. 术语表
7. 附录：参考文件索引 + 面试准备

---

# 0. 怎么用这份文档

- 你的工作目录：`D:\VScode\Vue\Vue-System-Project\mini-vue-lowcode`（依赖已装好）。
- 参考项目：`D:\VScode\Vue\Vue-Project\vue-lowcode-platform`（完整版，卡住时打开对照）。
- 文件名可以不一样（比如你叫 `CanvasDesign`，参考项目叫 `DesignCanvas`），**重要的是职责**。
- 类型名同理：你叫 `BlockItem`，参考项目叫 `BlockData`，是同一个东西（组件在画布上的实例）。
- 每个阶段做完，先自己跑一遍验收标准，再进下一个阶段。不要跳阶段。

---

# 1. 项目全景

## 1.1 它和 vue-manage-system 差在哪

你在 vue-manage-system 里写的是"页面写死"：

```vue
<el-table :data="tableData">   <!-- 组件固定，变的只是数据 -->
```

低代码反过来：**组件本身也变成数据**。页面上"放了什么组件、配了什么参数"全部存进一个数组，页面运行时遍历这个数组渲染出来。

```ts
// 一份"页面数据"长这样：一个数组，每一项代表画布上的一个组件
const blocks = [
  { _vid: 'vid_1', widgetKey: 'text', label: '文本', props: { content: '你好' }, focus: false },
  { _vid: 'vid_2', widgetKey: 'button', label: '按钮', props: { text: '点我' }, focus: false },
]
```

**做页面 = 往数组里加数据。** 这是整个项目唯一需要记住的一句话。

## 1.2 核心思想：页面 = 数据 + 注册表

- **数据**（`blocks` 数组）：页面上现在有哪些组件、每个配置了什么。
- **注册表**（`widgetList`）：这个平台"支持哪些组件"。想支持新组件，就在注册表里加一项。

数据负责"有什么"，注册表负责"能放什么"。两者一配合，界面就出来了。

## 1.3 整个项目只有两张"图纸"（interface）

**图纸 1：可添加组件本身（注册表项 `WidgetItem`）**

```ts
export interface WidgetItem {
  key: string        // 唯一标识，比如 'text'
  label: string      // 组件库显示的名字，比如 '文本'
  component: Component // 真正渲染的 Vue 组件本体
  props: Record<string, PropConfig> // 可配置的属性（阶段 2 才加）
}
```

**图纸 2：组件在画布上的实例（`BlockItem`）**

```ts
export interface BlockItem {
  _vid: string                    // 唯一 id，同一个组件放两个也不混
  widgetKey: string               // 指向注册表里的哪个组件
  label: string
  props: Record<string, any>      // 当前配置值（属性面板改这里）
  focus: boolean                  // 是否被选中
}
```

两者的关系：**条目是"模板"，一份就够；实例是"成品"，可以放十个。** 十个按钮共享同一个 `WidgetItem`，但各有各的 `_vid` 和 `props`。这就是实例里不存组件本体、只存 `widgetKey` 的原因。

## 1.4 数据流总图（先看个印象，不用背）

```
添加：  组件库点击 ──emit('add')──> 页面 addWidget ──createBlock──> blocks.push
渲染：  blocks ──v-for──> <component :is="getWidget(block).component" v-bind="block.props" />
选中：  画布点击 ──emit('select')──> 更新 focus + selected ──:selected──> 属性面板
改属性：属性面板 v-model 写回 block.props ──> 画布自动重渲染
保存：  watch(blocks) ──> localStorage
```

---

# 2. 技术准备（遇到再看，别背）

## 2.1 TypeScript 速查

你之前写 JS，这里写 TS。真正需要认识的只有 7 个点：

| #   | 写法                  | 是什么                  | 例子                                            |
| --- | ------------------- | -------------------- | --------------------------------------------- |
| 1   | `: 类型`              | 给变量/参数标注"长什么样"       | `const name: string = '文本'`                   |
| 2   | `interface`         | 定义一张"图纸"，规定对象必须有这些字段 | `export interface BlockItem { _vid: string }` |
| 3   | `import { type X }` | 只导入类型，不导入真代码（打包时删掉）  | `import { type BlockItem } from '@/widgets'`  |
| 4   | `satisfies 类型`      | 检查对象符合图纸，同时保留字面量类型   | `export default { ... } satisfies WidgetItem` |
| 5   | `!`                 | "我保证它不是空，别检查了"       | `widgetList.find(...)!`                       |
| 6   | `A \| B`            | 联合类型：要么 A 要么 B       | `ref<BlockItem \| null>(null)`                |
| 7   | `Record<string, X>` | 键都是字符串、值都是 X 的对象     | `Record<string, PropConfig>`                  |

其中 4 号（`satisfies`）最容易踩坑，先解释清楚：如果你直接写 `export default { type: 'text' }`，TS 会把 `type` 推断成 `string`（太宽），赋值给要求 `'text' | 'number'` 的地方就报错。加上 `satisfies WidgetItem`，TS 会拿图纸去检查，同时保留 `'text'` 这个精确的字面量类型。

#### 综合小示例（把 7 个点串起来）

假设我们写一个**组件配置系统**：

```ts
// 1. 定义图纸（interface）
export interface WidgetConfig {
 _vid: string;
 props: Record<string, PropConfig>; // 7. Record
 visible?: boolean; // 可选
}
// 辅助类型
export interface PropConfig {
 type: 'text' | 'number';
 default?: string | number;
}
// 2. 工厂函数，参数带类型注解
function createWidget(config: WidgetConfig): string {
 return `Widget ${config._vid} created`;
}
// 3. 某个具体配置（使用 satisfies 保留精确字面量）
const myWidget = {
 _vid: 'widget-001',
 props: {
  title: { type: 'text', default: '默认标题' },
  count: { type: 'number', default: 0 }
 }
} satisfies WidgetConfig; // 检查符合图纸
// 4. 使用非空断言（假设某个查找一定存在）
const widgetList: WidgetConfig[] = [myWidget];
const found = widgetList.find(w => w._vid === 'widget-001')!; // !
console.log(found.props.title.type); // 'text'（保留精确类型）
// 5. 导入类型（在另一个文件里）：
// import { type WidgetConfig, type PropConfig } from './this-file';
// 只导入类型，不影响打包体积
```

## 2.2 组件的两种写法

**写法 A：`.vue` 文件（你熟的）**

```vue
<script setup>
const props = defineProps({ content: String })
</script>
<template>
  <span>{{ content }}</span>
</template>
```

**写法 B：`defineComponent` + `h`（低代码项目用的）**

```ts
const TextWidget = defineComponent({
  props: { content: { type: String, default: '文本' } },
  setup(props) {
    return () => h('span', props.content)
  },
})
```

为什么用写法 B？因为组件要**作为数据**存进注册表（`widgetList` 数组里的一项），而 `.vue` 文件不能直接塞进数组。`h` 就是"用代码创建元素"：`h('span', 样式, 内容)` 等价于 `<span :style="样式">内容</span>`。

`markRaw(TextWidget)`：告诉 Vue"这个对象别做成响应式"。组件定义对象被 Vue 代理会出问题，`markRaw` 就是给它贴"别动我"标签。

**写法 C：`defineComponent` + JSX（`.tsx` 文件，本讲义采用的写法）**

```tsx
const TextWidget = defineComponent({
  props: { content: { type: String, default: '文本' } },
  setup(props) {
    return () => <span style={{ fontSize: props.size + 'px' }}>{props.content}</span>
  },
})
```

和写法 B 等价：`h('span', { style: {...} }, content)` ≡ `<span style={{...}}>{content}</span>`。
JSX 四个规则：

- style 是对象，要双大括号：`style={{ fontSize: ... }}`；
- 字符串要自己拼：`props.size + 'px'`；
- 文件后缀必须是 `.tsx`，且 `vite.config.ts` 里配了 `@vitejs/plugin-vue-jsx`（本项目已配）；
- `.tsx` 文件里没有 `<script setup>`，组件用 `defineComponent` 写，`setup` 返回箭头函数。

## 2.3 动态组件 `<component :is>`

模板里有一个特殊的组件标签 `<component>`：

```vue
<component :is="某个组件" v-bind="属性对象" />
```

`is` 给谁就渲染谁，`v-bind` 把属性对象展开传进去。这相当于"变量版"的组件标签——这就是低代码"数据驱动界面"的实现关键。

## 2.4 props 向下 / emit 向上（单向数据流）

- 父组件把数据传给子组件：`:blocks="blocks"`（子组件用 `defineProps` 接收）。
- 子组件把事件告诉父组件：`emit('add', w)`（父组件用 `@add` 监听）。

**规则：数据只有一个老板（页面组件），子组件只"领数据、喊事件"，不能自己改数据。** 这样项目再大也不会改乱。

## 2.5 Pinia（setup 写法）

```ts
export const useEditorStore = defineStore('editor', () => {
  // ref 就是 state
  const blocks = ref<BlockItem[]>([])
  // 函数就是 action
  function addWidget(widget: WidgetItem) { blocks.value.push(createBlock(widget)) }
  return { blocks, addWidget }
})
```

和你 vue-manage-system 里写的一样，只是用函数式写法（setup store）代替了 options 写法。阶段 3 再用，现在不用管。

## 2.6 HTML5 拖拽 API（阶段 4 用）

拖拽一共三个事件，缺一不可：

1. **dragstart**（被拖的东西上）：`e.dataTransfer.setData('key', value)` 记下拖的是什么；
2. **dragover**（目标区域上）：必须 `e.preventDefault()`，否则 drop 不会触发；顺便计算插入位置；
3. **drop**（松手时）：`e.dataTransfer.getData('key')` 读出数据，执行插入。

注意：`getData` 只能在 `drop` 里读，`dragover` 里读不到。

---

# 3. 五个阶段任务（核心）

---

## 阶段 1：点"文本" → 画布出现字

**目标**：打通"数据 + 添加 + 渲染"最小闭环。5 个文件，按顺序写。

### 1.1 `src/widgets/widget-text.tsx` —— 定义第一个组件

```ts
import { defineComponent, markRaw } from 'vue'
import type { WidgetItem } from '@/widgets/index'

// 组件本体：文本组件接受什么输入、怎么画
const TextWidget = defineComponent({
  props: {
    content: { type: String, default: '你好，低代码' },
    size: { type: Number, default: 18 },
  },
  setup(props) {
    // JSX 写法：等价于 <span :style="...">内容</span>
    return () => <span style={{ fontSize: props.size + 'px' }}>{props.content}</span>
  },
})

// 注册表项：组件库里叫"文本"，用 TextWidget 渲染
export default {
  key: 'text',
  label: '文本',
  component: markRaw(TextWidget),
} satisfies WidgetItem
```

逐行解释：

- `defineComponent({ props, setup })`：props 声明输入，setup 返回"怎么画"（一个函数，执行后得到界面）。
- JSX 的 `style` 是对象（双大括号），`props.size + 'px'` 是字符串拼接；它和 `h('span', { style }, content)` 完全等价。
- 默认导出对象就是"注册表项"，结构对应 `WidgetItem` 图纸（key / label / component）。

### 1.2 `src/widgets/index.ts` —— 图纸 + 注册表 + 工具函数

```ts
import { type Component } from 'vue'

// 图纸 1：可添加组件本身
export interface WidgetItem {
  key: string
  label: string
  component: Component
}

// 图纸 2：组件在画布上的实例
export interface BlockItem {
  _vid: string
  widgetKey: string
  label: string
}

// 注册表：所有可用组件（想加组件就在这里加一项）
import widgetText from './widget-text'
export const widgetList: WidgetItem[] = [widgetText]

let seed = 0

// 条目 → 实例：生成唯一 id，记住它指向哪个组件
export const createBlock = (widget: WidgetItem): BlockItem => ({
  _vid: `vid_${seed++}_${Date.now()}`,
  widgetKey: widget.key,
  label: widget.label,
})

// 实例 → 条目：拿 widgetKey 反查注册表，找到组件本体
export const getWidget = (block: BlockItem) =>
  widgetList.find((w) => w.key === block.widgetKey)!
```

提示：

- `_vid` 用"自增序号 + 时间戳"拼接，保证同一毫秒点两次也不会重复。
- `getWidget` 结尾的 `!`：因为 widgetKey 一定来自注册表，肯定找得到；`!` 是告诉 TS"别担心，我保证它不是空"。
- 为什么实例不直接存组件本体？——同一个组件会被放很多个实例，存本体既浪费又混乱；存个 key 字符串，渲染时再反查。

### 1.3 `src/components/ComponentLibrary.vue` —— 组件库

```vue
<script setup lang="ts">
import { widgetList, type WidgetItem } from '@/widgets'

// 自己不存数据，点按钮时喊一声"add"，让父组件去添加
const emit = defineEmits<{ (e: 'add', widget: WidgetItem): void }>()
// 新写法（推荐，好读）
/*
const emit = defineEmits<{
  add: [widget: WidgetItem]  // 键是事件名，值是参数元组
  // delete: [id: string]
  // update: []
}>()
*/
</script>

<template>
  <aside class="left">
    <h3>组件库</h3>
    <el-button v-for="w in widgetList" :key="w.key" @click="emit('add', w)">
      {{ w.label }}
    </el-button>
  </aside>
</template>
```

解释：`v-for` 遍历注册表生成按钮；点按钮把整个 `widget` 对象交给父组件。`defineEmits` 是声明"我这个组件会喊哪些事件"。

### 1.4 `src/components/CanvasDesign.vue` —— 画布

```.vue
<script setup lang="ts">
import { getWidget, type BlockItem } from '@/widgets'

// 父组件把画布数据传下来
defineProps<{ blocks: BlockItem[] }>()

</script>

<template>
  <section class="canvas">
    <p v-if="blocks.length === 0" class="empty">点左边按钮添加组件</p>
    <div
      v-for="block in blocks"
      :key="block._vid"
      class="block"
      :class="{ focus: block.focus }"
    >
      <!-- 全项目最重要的一行：数据变成界面 -->
      <component :is="getWidget(block).component" />
    </div>
  </section>
</template>
```

解释：

- 遍历 `blocks`，每个实例用 `:key="block._vid"` 区分。
- `getWidget(block)` 拿着 `widgetKey` 反查注册表 → 拿到组件本体 → `<component :is>` 渲染。

### 1.5 `src/views/PageEditor.vue` —— 接线（数据老板）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { createBlock, type BlockItem, type WidgetItem } from '@/widgets'
import ComponentLibrary from '@/components/ComponentLibrary.vue'
import CanvasDesign from '@/components/CanvasDesign.vue'

// 数据在这里：画布上的所有组件
const blocks = ref<BlockItem[]>([])

// 子组件喊"add"：把条目变成实例，加进数组
const addWidget = (widget: WidgetItem) => {
  blocks.value.push(createBlock(widget))
}
</script>

<template>
  <div class="editor">
    <ComponentLibrary @add="addWidget" />
    <CanvasDesign :blocks="blocks" />
  </div>
</template>
```

**验收标准：**

1. `npm run build` 不报错；
2. 点"文本"按钮，画布出现"你好，低代码"。

**常见坑：**

- 报 `Cannot find module '@/widgets'`：检查 `vite.config.ts` 里有没有 `@` 别名（有），和文件路径对不对。
- 画布没反应：检查 `PageEditor` 有没有把 `blocks` 传下去、`CanvasDesign` 有没有接收。

---

## 阶段 2：选中 + 删除 + 属性面板

**目标**：点画布组件高亮；右侧面板按"属性说明书"自动生成表单，改完画布实时变。

### 2.1 `widgets/index.ts` 加"属性说明书"

在图纸 1、2 上加字段，并新增 `PropConfig`：

```ts
// 一个属性的说明书：面板根据它生成输入框
export interface PropConfig {
  label: string           // 面板上显示的名字
  defaultValue: string | number  // 默认值
  type: 'text' | 'number' // text=输入框 number=数字框
}

export interface WidgetItem {
  key: string
  label: string
  component: Component
  props: Record<string, PropConfig>  // 新增：这个组件能配置哪些属性
}

export interface BlockItem {
  _vid: string
  widgetKey: string
  label: string
  props: Record<string, any>  // 新增：当前配置值（面板改这里）
  focus: boolean
}
```

同时改 `createBlock`，把每个属性的默认值抄进实例：

```ts
export const createBlock = (widget: WidgetItem): BlockItem => ({
  _vid: `vid_${seed++}_${Date.now()}`,
  widgetKey: widget.key,
  label: widget.label,
  props: Object.fromEntries(
    Object.entries(widget.props).map(([key, cfg]) => [key, cfg.defaultValue]),
  ),
  focus: false,
})
```

解释：`Object.entries` 把 `{ content: {...}, size: {...} }` 变成数组，`map` 抽出每个默认值，`Object.fromEntries` 再拼回对象——结果就是 `{ content: '你好，低代码', size: 16 }`。

### 2.2 `widgets/widget-text.tsx` 加属性配置

```ts
export default {
  key: 'text',
  label: '文本',
  component: markRaw(TextWidget),
  props: {
    content: { label: '文本内容', defaultValue: '你好，低代码', type: 'text' },
    size: { label: '字号', defaultValue: 16, type: 'number' },
  },
} satisfies WidgetItem
```

**注意结尾的 `satisfies WidgetItem`**：不加它会报"type 是 string，不是 'text' | 'number'"（见 2.1 节）。

### 2.3 画布：选中高亮

`src/components/CanvasDesign.vue` —— 画布

```.vue
<script setup lang="ts">
import { getWidget, type BlockItem } from '@/widgets'

defineProps<{ blocks: BlockItem[] }>()

// const emit = defineEmits<{ (e: 'select', block: BlockItem): void }>()
const emit = defineEmits<{
    select: [block: BlockItem]
}>()
</script>

<template>
  <section class="canvas">
    <p v-if="blocks.length === 0" class="empty">点左边按钮添加组件</p>
    <div
      v-for="block in blocks"
      :key="block._vid"
      class="block"
      :class="{ focus: block.focus }"
      @click="emit('select', block)"
    >
      <component :is="getWidget(block).component" />
    </div>
  </section>
</template>
```

上面 `select` 事件已经接了；现在让"点谁谁高亮"的逻辑生效——这个逻辑放在父组件`PageEditor.vue`：

```ts
const selected = ref<BlockItem | null>(null)    // 被选中的组件

const select = (b: BlockItem) => {
  blocks.value.forEach((b2) => (b2.focus = false))  // 先取消所有人的高亮
  b.focus = true                                // 再点亮被点的那个
  selected.value = b                            // 记住选中的是谁
}
```

### 2.4 `PropertyPanel.vue` —— 属性面板（自动生成表单）

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { getWidget, type BlockItem } from '@/widgets'

const props = defineProps<{ selected: BlockItem | null }>()

// 根据实例反查注册表，拿到"属性说明书"
const currentWidget = computed(() => (props.selected ? getWidget(props.selected) : null))

// const emit = defineEmits<{ (e: 'remove', block: BlockItem): void }>()
const emit = defineEmits<{
  remove: [block: BlockItem]
}>()
</script>

<template>
  <aside class="right">
    <h3>属性</h3>
    <template v-if="selected && currentWidget">
      <p class="current-name">当前：{{ selected.label }}</p>
      <!-- 关键：表单不是手写的，是遍历"属性说明书"生成的 -->
      <div v-for="(cfg, propKey) in currentWidget.props" :key="propKey" class="field">
        <label>{{ cfg.label }}</label>
        <el-input v-if="cfg.type === 'text'" v-model="selected.props[propKey]" size="small" />
        <el-input-number v-else v-model="selected.props[propKey]" size="small" />
      </div>
      <el-button type="danger" size="small" @click="emit('remove', selected)">删除</el-button>
    </template>
    <p v-else class="empty">点击画布中的组件</p>
  </aside>
</template>
```

解释：

- `v-for="(cfg, propKey) in currentWidget.props"`：遍历说明书，自动生成输入框。
- `v-model="selected.props[propKey]"`：**直接改实例的配置数据**。数据一变，画布 `<component :is>` 的 `v-bind` 就重新渲染。
- 画布记得加上 `v-bind="block.props"`（阶段 1 没加）。

**验收标准：**

1. 点画布里的文本，出现蓝框高亮；
2. 右侧面板显示"文本内容 / 字号"两个输入框；
3. 改"文本内容"，画布上的字实时变；
4. 点删除，组件从画布消失。

**常见坑：**

- 改了没反应：检查画布的 `<component>` 有没有 `v-bind="block.props"`。
- 报"type 类型不匹配"：`satisfies WidgetItem` 忘加了。

---

## 阶段 3：数据搬进 Pinia + 自动保存

**目标**：把 `blocks` / `selected` 和所有操作搬进 `stores/editor.ts`，刷新页面数据不丢。

### 3.1 `src/stores/editor.ts`

```ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { createBlock, type BlockItem, type WidgetItem } from '@/widgets'

const STORAGE_KEY = 'lowcode-page-blocks'

// 从 localStorage 恢复（没有就返回空数组）
function loadBlocks(): BlockItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as BlockItem[]) : []
  } catch {
    return []   // 数据坏了也不崩，直接空着
  }
}

export const useEditorStore = defineStore('editor', () => {
  const blocks = ref<BlockItem[]>(loadBlocks())
  const selected = ref<BlockItem | null>(null)

  // 数据一变，自动存 localStorage
  watch(
    blocks,
    (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)),
    { deep: true },   // deep：数组里的对象改了也要触发
  )

  const addWidget = (widget: WidgetItem) => {
    const block = createBlock(widget)
    blocks.value.push(block)
    select(block)
  }

  const select = (block: BlockItem) => {
    blocks.value.forEach((b) => (b.focus = false))
    block.focus = true
    selected.value = block
  }

  const remove = (block: BlockItem) => {
    const index = blocks.value.indexOf(block)
    if (index !== -1) blocks.value.splice(index, 1)
    selected.value = null
  }

  const clearAll = () => {
    blocks.value = []
    selected.value = null
  }

  return { blocks, selected, addWidget, select, remove, clearAll }
})
```

### 3.2 页面改用 store

`PageEditor.vue` 里删掉本地 `ref`，改成：

```ts
import { useEditorStore } from '@/stores/editor'
const store = useEditorStore()
```

模板里：`:blocks="store.blocks"`、`@add="store.addWidget"`、`@select="store.select"`、`@remove="store.remove"`。

`main.ts` 里确认已经 `app.use(pinia)`（脚手架自带）。

**验收标准：** 添加几个组件，刷新浏览器，数据还在。

**常见坑：**

- 忘写 `deep: true`：只改 `block.props` 里的值时不触发保存。
- `JSON.parse` 报错页面崩：用 `try/catch` 兜底（上面代码已有）。

---

## 阶段 4：拖拽（组件库 → 画布 + 画布内排序）

**目标**：不点按钮，直接拖。两个文件。

### 4.1 组件库（拖拽起点）

```vue
<script setup lang="ts">
import { widgetList, type WidgetItem } from '@/widgets'

const emit = defineEmits<{
  add: [w: widgetItem]
}>()

// 拖动开始时，把组件的 key 写进拖拽数据
const onDragStart = (event: DragEvent, widget: WidgetItem) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('widget-key', widget.key)
    event.dataTransfer.effectAllowed = 'copy'  // 改变鼠标拖拽时的光标样式
  }
}
</script>

<template>
  <aside class="left">
    <h3>组件库</h3>
    <div
      v-for="w in widgetList"
      :key="w.key"
      class="widget-item"
      draggable="true"
      @dragstart="onDragStart($event, w)"
      @click="emit('add', w)"
    >
      {{ w.label }}
    </div>
  </aside>
</template>
```

注意：拖拽要求元素有 `draggable="true"`，按钮上不好使，所以这里用 `div` 当拖拽源（点击功能保留）。

### 4.2 画布（接收 + 排序）

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { getWidget, type BlockItem } from '@/widgets'

const props = defineProps<{ blocks: BlockItem[] }>()

const emit = defineEmits<{
  (e: 'focus', block: BlockItem): void
  (e: 'insert', widgetKey: string, index: number): void
  (e: 'move', from: number, to: number): void
}>()

const canvasRef = ref<HTMLElement | null>(null)
// 当前拖拽悬停的位置（-1 = 没有悬停）
const dragOverIndex = ref(-1)

// 拖过画布：按鼠标 y 和每个块的中线比较，算出插到第几个位置
const onDragOver = (event: DragEvent) => {
  event.preventDefault()   // 必须！否则 drop 不触发 (默认是阻止触发drop)
  const els = canvasRef.value?.querySelectorAll('.block') ?? []
  let index = els.length
  for (let i = 0; i < els.length; i++) {
    const el = els[i]!
    // if (!el) continue
    const rect = el.getBoundingClientRect()
    if (event.clientY < rect.top + rect.height / 2) {
      index = i
      break
    }
  }
  dragOverIndex.value = index
}

// 松手：判断拖的是组件库（widget-key）还是画布里的块（block-index）
const onDrop = (event: DragEvent) => {
  event.preventDefault()
  // 防御性编程，出问题就插到最后一个
  const target = dragOverIndex.value >= 0 ? dragOverIndex.value : props.blocks.length
  const widgetKey = event.dataTransfer?.getData('widget-key')
  if (widgetKey) {
    emit('insert', widgetKey, target)
  } else {
    const from = Number(event.dataTransfer?.getData('block-index'))
    if (!Number.isNaN(from) && from >= 0) {
      emit('move', from, target)
    }
  }
  dragOverIndex.value = -1
}

const onBlockDragStart = (event: DragEvent, index: number) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('block-index', String(index))
    event.dataTransfer.effectAllowed = 'move'
  }
}
</script>

<template>
  <section ref="canvasRef" class="canvas" @dragover="onDragOver" @drop="onDrop">
    <p v-if="blocks.length === 0 && dragOverIndex === -1" class="empty">点左边按钮，或拖一个组件进来</p>
    <template v-for="(block, index) in blocks" :key="block._vid">
      <div v-if="dragOverIndex === index" class="drop-line"></div>
      <div
        class="block"
        :class="{ focus: block.focus }"
        draggable="true"
        @dragstart="onBlockDragStart($event, index)"
        @click="emit('select', block)"
      >
        <component :is="getWidget(block).component" v-bind="block.props" />
      </div>
    </template>
    <div v-if="dragOverIndex === blocks.length" class="drop-line"></div>
  </section>
</template>
```

页面组件加两个处理函数：

```ts
// 拖入新组件：拿 widgetKey 找到注册表项，插到指定位置
const insertWidget = (widgetKey: string, index: number) => {
  const widget = widgetList.find((w) => w.key === widgetKey)
  if (widget) store.insertWidget(widget, index)
}

// 画布内排序
const moveBlock = (from: number, to: number) => store.moveBlock(from, to)
```

store 里补两个 action：

```ts
const insertWidget = (widget: WidgetItem, index: number) => {
  const block = createBlock(widget)
  blocks.value.splice(index, 0, block)
  select(block)
}

const moveBlock = (from: number, to: number) => {
  if (from === to) return
  const block = blocks.value.splice(from, 1)[0]
  if (!block) return
  blocks.value.splice(to, 0, block)
}
```

**验收标准：**

1. 从左侧拖"文本"到画布，松手后组件出现在那个位置；
2. 拖动画布里的组件，能换顺序；
3. 点击仍然能选中。

**常见坑：**

- ****drop 不触发：`dragover` 里没写 `event.preventDefault()`。
- `getData` 读不到：`getData` 只能在 `drop` 里读。

##### 代码改善点

蓝线显示：ref

未设置类名，querySelector拿不到

**`onDrop` 里缺少“兜底保护”**

---

## 阶段 5：导入导出 + 预览 + 新组件

**目标**：让这个平台"像个产品"。

### 5.1 页面加工具按钮（预览 / 导出 / 导入 / 清空）

```ts
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const importDialog = ref(false)
const importText = ref('')

const exportJson = () => {
  const jsonStr = JSON.stringify(store.blocks, null, 2)

  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'page.json'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('已导出 page.json')
}

const doImport = () => {
  try {
    store.importJson(importText.value)
    importDialog.value = false
    ElMessage.success('导入成功')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '导入失败，请检查 JSON 格式')
  }
}
```

模板加一个头部工具栏（`el-button` + `el-dialog` 放一个 textarea 粘贴 JSON）。

store 补两个方法：

```ts
const importJson = (text: string) => {
  const data: unknown = JSON.parse(text)
  if (!Array.isArray(data) ||
      !data.every((item) => item && typeof item === 'object' && '_vid' in item && 'widgetKey' in item)) {
    throw new Error('格式不对：应该是一个由组件实例组成的数组')
  }
  blocks.value = data as BlockItem[]
  selected.value = null
}
```

### 5.2 预览页 `views/Preview.vue` + 路由

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useEditorStore } from '@/stores/editor'
import { getWidget } from '@/widgets'

const store = useEditorStore()
const router = useRouter()
</script>

<template>
  <div class="preview">
    <header class="bar">
      <span>预览模式</span>
      <el-button size="small" @click="router.push('/')">返回编辑</el-button>
    </header>
    <main class="page">
      <component
        v-for="block in store.blocks"
        :key="block._vid"
        :is="getWidget(block).component"
        v-bind="block.props"
      />
    </main>
  </div>
</template>
```

路由加一条：

```ts
{
  path: '/preview',
  component: () => import('@/views/Preview.vue'),
}
```

### 5.3 再加 2 个组件（链接 / 文本域）

`widgets/link.ts`：

```ts
import { defineComponent, markRaw } from 'vue'
import type { WidgetItem } from '@/widgets/index'
import type { WidgetItem } from '@/widgets'

const LinkWidget = defineComponent({
  props: {
    text: { type: String, default: '链接' },
    href: { type: String, default: 'https://example.com' },
  },
  setup(props) {
    return () => h('a', { href: props.href, target: '_blank' }, props.text)
  },
})

export default {
  key: 'link',
  label: '链接',
  component: markRaw(LinkWidget),
  props: {
    text: { label: '链接文字', defaultValue: '点我打开', type: 'text' },
    href: { label: '链接地址', defaultValue: 'https://example.com', type: 'text' },
  },
} satisfies WidgetItem
```

`widgets/textarea.ts` 同理（用 `h(ElInput, { type: 'textarea', rows: 3, ... })` 包装）。

最后在 `widgets/index.ts` 的注册表里加两项：

```ts
import link from '@/widgets/link'
import textarea from '@/widgets/textarea'
export const widgetList: WidgetItem[] = [text, button, input, link, textarea]
```

**验收标准：**

1. 导出 JSON → 清空 → 导入，页面还原；
2. `/preview` 能看纯渲染结果；
3. 组件库 5 个组件，新组件也能配置属性。

---

# 4. 四条数据线（阶段 1、2 完成后回来看）

1. **添加**：组件库 emit('add', w) → 页面 addBlock → createBlock（条目→实例，默认值抄进去）→ blocks.push。原理：**往数组 push 一个对象**。
2. **渲染**：`<component :is="getWidget(b).component" v-bind="b.props" />`。原理：**动态组件，is 给谁就渲染谁**。
3. **选中**：画布 emit('select', block) → 更新 focus 和 selected → 面板 `:selected` 显示。原理：**记住你点了谁，再通知面板**。
4. **改属性**：面板遍历"属性说明书"自动生成表单，v-model 写回 block.props。原理：**改的是数据，画面自动重渲染**。

---

# 5. 常见报错对照表

| 报错                                                             | 原因                                      | 解决                                                          |
| -------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------- |
| `Cannot find module '@/widgets'`                               | 路径写错 / 文件不存在                            | 检查 `@` 别名配置和文件路径                                            |
| 找不到模块 'vue' / 'element-plus'                                   | 依赖没装 / TS 服务没重启                         | `pnpm install`，然后 VSCode 里 Ctrl+Shift+P → Restart TS Server |
| `Type 'string' is not assignable to type '"text" \| "number"'` | 字面量类型被拓宽                                | 组件文件的 default export 加 `satisfies WidgetItem`               |
| `Object is possibly 'undefined'`                               | 数组取值可能越界（noUncheckedIndexedAccess）      | 取值后判断：`const el = els[i]; if (!el) continue`                |
| 画布改了属性没反应                                                      | `<component>` 没写 `v-bind="block.props"` | 补上 v-bind                                                   |
| drop 不触发                                                       | dragover 没 preventDefault               | `event.preventDefault()`                                    |
| getData 读不到值                                                   | 在 drop 以外的地方读                           | 只在 drop 里读                                                  |
| 刷新数据丢了                                                         | watch 没写 `deep: true` 或没存               | watch 加 `{ deep: true }`                                    |
| JSON.parse 崩页面                                                 | localStorage 数据坏了                       | try/catch 兜底返回空数组                                           |
| 拖拽没反应                                                          | 元素没写 `draggable="true"`                 | 补上                                                          |

---

# 6. 术语表

| 词                  | 意思                   |
| ------------------ | -------------------- |
| 注册表 widgetList     | 可添加组件的清单             |
| WidgetItem         | 可添加组件本身（条目）          |
| BlockItem          | 组件在画布上的实例            |
| PropConfig         | 一个属性的说明书（面板靠它生成表单）   |
| createBlock        | 条目 → 实例（生成 id、抄默认值）  |
| getWidget          | 实例 → 条目（反查组件本体）      |
| props 向下 / emit 向上 | 数据流方向                |
| `<component :is>`  | 动态组件标签               |
| satisfies          | TS：检查对象符合图纸并保留字面量    |
| Pinia store        | 数据仓库（state + action） |
| localStorage       | 浏览器本地存储（JSON 字符串）    |

---

# 7. 附录：参考文件索引 + 面试准备

## 7.1 参考文件索引（vue-lowcode-platform 完整版）

| 想找什么               | 去哪个文件                                       |
| ------------------ | ------------------------------------------- |
| 组件怎么定义             | `widgets/widget-text.tsx`、`widgets/link.ts` |
| 类型 / 注册表 / 工具函数    | `widgets/index.ts`                          |
| 组件库（点击+拖拽）         | `components/ComponentLibrary.vue`           |
| 画布（渲染+选中+排序）       | `components/DesignCanvas.vue`               |
| 属性面板（自动表单）         | `components/PropertyPanel.vue`              |
| 数据仓库（Pinia + 自动保存） | `stores/editor.ts`                          |
| 编辑器页面 / 工具按钮       | `views/TheEditor.vue`                       |
| 预览页                | `views/Preview.vue`                         |

## 7.2 面试准备

**一句话介绍项目：** "我做了一个低代码页面搭建器：组件库里的组件拖到画布，生成 JSON 数据，页面根据 JSON 渲染；属性面板根据组件配置自动生成表单。"

**可能被问的问题（先自己想，再看提示）：**

1. 低代码的核心思想是什么？→ 页面 = 数据 + 注册表，做页面 = 改数据。
2. 为什么实例不存组件本体，只存 widgetKey？→ 组件本体一份够用，实例可以多个；存引用会冗余混乱。
3. `<component :is>` 是干什么的？→ 动态组件，运行时决定渲染哪个。
4. 属性面板为什么不用手写表单？→ 遍历属性说明书（PropConfig）自动生成。
5. Pinia 里怎么做到刷新不丢？→ watch 深度监听 + localStorage。
6. 拖拽是怎么实现的？→ HTML5 三件套：dragstart / dragover / drop，setData/getData 传数据。
7. 导出导入怎么做的？→ JSON.stringify / JSON.parse + 校验 + Blob 下载。
8. 遇到版本问题怎么排查？→ 看报错表、看官方文档、最小复现。
9. 这个项目哪里最难？→ 真诚地说一个你实际卡过的地方（比如拖拽插入位置计算），并说你怎么解决的。
10. 还能怎么扩展？→ 撤销/重做、嵌套容器、更多组件、接入后端保存。

**简历项目描述（可直接抄，改自己的话）：**

```
低代码页面搭建平台（Vue3 + TypeScript + Element Plus + Pinia）
- 设计"组件注册表"：组件即数据，新增组件只需添加一个文件并注册
- 实现拖拽式页面编辑：组件库拖入画布、画布内排序、选中高亮
- 属性面板根据组件配置自动生成表单，修改实时生效
- Pinia 管理数据并自动持久化到 localStorage，支持页面 JSON 导入导出与预览
```

---

完。现在回到阶段 1，从 1.1 开始敲。