// ==================== ECharts 按需引入 ====================
// 只注册本项目用到的图表 + 组件 + 渲染器，替代 `import * as echarts from 'echarts'`
// 好处：打包产物只含用到的模块，首屏体积显著下降
// 未来新增图表类型/组件时，只需在这里追加对应模块并 use() 一下即可
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer
])

// 作为 echarts 命名空间整体默认导出，用法与原全量引入一致：
//   import echarts from '@/utils/echarts'
//   echarts.init(el)
//   new echarts.graphic.LinearGradient(...)
export default echarts
