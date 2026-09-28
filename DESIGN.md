---
name: "键帽试衣间"
description: "以深色阳极氧化外壳、PBT 键帽和状态灯构成的键帽试装界面。"
colors:
  desk-ground: "oklch(0.165 0.004 260)"
  bone-text: "oklch(0.95 0.008 85)"
  case-graphite: "oklch(0.215 0.005 260)"
  socket-well: "oklch(0.125 0.004 260)"
  bone-keycap: "oklch(0.925 0.018 88)"
  bone-legend: "oklch(0.22 0.012 70)"
  graphite-keycap: "oklch(0.3 0.006 260)"
  graphite-legend: "oklch(0.93 0.01 85)"
  muted-surface: "oklch(0.25 0.005 260)"
  muted-text: "oklch(0.7 0.008 260)"
  destructive: "oklch(0.72 0.18 25)"
  subtle-border: "oklch(1 0 0 / 8%)"
  field-edge: "oklch(1 0 0 / 12%)"
  focus-ring: "oklch(0.925 0.018 88 / 75%)"
  led-busy: "oklch(0.82 0.16 75)"
  led-done: "oklch(0.8 0.17 150)"
  led-error: "oklch(0.68 0.21 25)"
typography:
  title:
    fontFamily: "Geist Variable, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist Variable, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4286
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Variable, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.3333
    letterSpacing: "normal"
  measurement:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.3333
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  case: "20px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
components:
  button-action:
    backgroundColor: "{colors.bone-keycap}"
    textColor: "{colors.bone-legend}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 20px"
    height: "44px"
  button-modifier:
    backgroundColor: "{colors.graphite-keycap}"
    textColor: "{colors.graphite-legend}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "44px"
  image-socket:
    backgroundColor: "{colors.socket-well}"
    textColor: "{colors.muted-text}"
    rounded: "{rounded.lg}"
    height: "56px"
    width: "96px"
  case-bar:
    backgroundColor: "{colors.case-graphite}"
    textColor: "{colors.bone-text}"
    rounded: "{rounded.case}"
    padding: "16px"
  image-stage:
    backgroundColor: "{colors.socket-well}"
    textColor: "{colors.bone-text}"
    rounded: "{rounded.2xl}"
---

# Design System: 键帽试衣间

## Overview

**Creative North Star: "桌面上的客制化键盘"**

这是一个始终处于深色模式的工具界面。页面把常规上传和执行控件做成一块俯视的客制化键盘：石墨色外壳承载凹入的轴座，骨白色主操作键和石墨色辅助键保留真实键帽的顶面、侧壁与按压行程。图片始终是舞台中最醒目的内容，界面本身只用低彩度中性色围合和解释它。

彩色信息仅由锁定指示灯式状态点承担；其余界面维持骨白与石墨灰。中文正文紧凑直接，尺寸、耗时和秒数才切换到等宽字体。代码中的浅色 `:root` 变量是未改动的 shadcn 默认值；`html` 固定使用 `.dark` 和 `color-scheme: dark`，因此浅色变量不属于这个视觉世界。

**Key Characteristics:**
- 始终深色、图片优先的单页操作界面。
- 俯视键帽、凹入轴座和 MX 十字轴心组成统一的硬件隐喻。
- 骨白只用于主操作与高优先级文字，石墨用于外壳、辅助键和背景层级。
- 状态色被限制在一个 8px 发光指示灯及错误文字。
- 动效模拟按键、换帽与结果显影，并为减少动态偏好提供静止版本。

## Colors

色彩主体是带极轻冷暖偏移的石墨与骨白；琥珀、绿色和红色只承担运行、完成和错误状态。

### Primary
- **骨白 PBT**：主执行键、选择高亮和就绪指示灯；深色画面中的最亮实体。
- **深色键帽字面**：骨白键帽上的图标与文字，维持实体键帽的高对比刻字。

### Secondary
- **阳极石墨**：顶部机壳与承载型表面。
- **石墨键帽**：重置、下载等辅助动作；比机壳略亮以保留可按性。

### Tertiary
- **琥珀灯**：仅在生成运行时脉冲。
- **完成绿灯**：仅标记结果可用。
- **错误红灯**：错误状态点和可操作的错误文案。

### Neutral
- **桌面深黑**：页面底色，建立最低层级。
- **轴座黑**：上传槽与图片舞台的凹陷底面。
- **骨白正文**：主要文字和图形线条。
- **静音灰**：说明、计时和非主导图形。
- **微光边线**：用低透明白勾勒表面，不形成常规描边框。

### Named Rules

**The Single LED Rule.** 彩色状态只出现在锁定指示灯式状态点及紧邻的错误文字；普通控件不借状态色装饰。

**The Dark-Only Rule.** 新界面只扩展 `.dark` 令牌；不要从未使用的浅色 `:root` 默认值推导品牌色。

## Typography

**Display Font:** Geist Variable（中文依次回退至 PingFang SC、Hiragino Sans GB、Noto Sans SC、Microsoft YaHei）  
**Body Font:** Geist Variable（相同中文回退栈）  
**Label/Mono Font:** 系统等宽字体栈，仅用于计时、像素尺寸和秒数

**Character:** 单一无衬线家族让界面保持工具感与低噪声。层级主要依靠 12px、14px、16px 三档字号和 400/500/600 字重，而不是夸张标题。

### Hierarchy
- **Title**（600，16px，24px 行高，-0.025em）：应用名称；页面没有大型展示标题。
- **Control label**（500，14px，20px 行高）：上传槽名称与按键文字。
- **Body / status**（400，14px，20px 行高）：状态句、空槽操作说明。
- **Metadata**（400，12px，16px 行高）：上传提示、张数和辅助动作。
- **Measurement**（400，12–14px，等宽且使用表格数字）：运行时间、结果尺寸与生成耗时。

### Named Rules

**The Instrument Readout Rule.** 只有可比较的数字读数使用等宽字体；名称、按钮与叙述继续使用 Geist。

## Layout

页面是最大 1280px 的居中单列，桌面边距与顶部间距为 24px，窄屏缩至 16px。主要区域以 24px 分隔：上方机壳工具条、40px 最小高度的状态行、下方图片舞台。机壳内边距从 16px 增至 20px。

在 1280px 断点以上，品牌、三个输入槽和操作键排成一行；每个紧凑槽为 96×56px。更窄时机壳改为纵向三段，输入槽保持三列并随列宽缩放，操作区横跨可用宽度。结果状态在小于 640px 时换成全宽行。空舞台采用 2:1 比例，真实图片则保留自身比例并占满宽度。

间距以 4px 基准递进，常用节奏为 8、12、16、20、24px。不要在照片和结果周围增加第二层卡片或侧栏。

## Elevation & Depth

深度来自结构而非悬浮卡片。机壳有顶缘高光、紧贴桌面的暗边和宽而低的环境阴影；轴座与空舞台用上缘内阴影表现凹陷；键帽以不等宽边框、顶部渐变和底部投影表现侧壁。普通文字与状态行保持平面。

### Shadow Vocabulary
- **机壳环境深度** (`inset 0 1px 0 oklch(1 0 0 / 7%), 0 1px 0 oklch(0 0 0 / 40%), 0 24px 48px -28px oklch(0 0 0 / 90%)`)：只用于承载整组控件的顶部机壳。
- **轴座凹槽** (`inset 0 2px 5px oklch(0 0 0 / 55%), inset 0 0 0 1px oklch(1 0 0 / 6%)`)：上传槽默认态；悬停将末项透明度提高到 16%。
- **键帽抬升** (`0 1px 0 oklch(0 0 0 / 45%), 0 10px 18px -10px oklch(0 0 0 / 85%)`)：骨白和石墨实体键帽。
- **空舞台凹槽** (`inset 0 2px 8px oklch(0 0 0 / 50%), inset 0 0 0 1px oklch(1 0 0 / 6%)`)：没有键盘照片时的主舞台。

### Named Rules

**The Hardware Depth Rule.** 阴影必须解释一个实体关系：机壳凸起、轴座凹入或键帽行程；不要给普通文案和状态条添加通用卡片阴影。

## Shapes

外轮廓使用连续但克制的圆角：机壳 20px、图片舞台 18px、轴座与标准键帽 10px、品牌小键帽 8px。键帽不是均匀描边：上边 1px、左右 3px、前壁默认 5px，按下时前壁缩短 2px。图片与预览始终裁入所属轴座或舞台轮廓。

60% 键盘线稿遵循 ANSI 行列宽度，用 1.5px 圆角线、14px 外壳角和 5px 键位角。空上传槽使用带圆角外壳的 MX 十字轴心，而不是通用上传图标。

## Components

### Buttons

- **Shape:** 默认与次要按钮都是俯视键帽（10px 圆角、5px 前壁），以顶部高光、侧壁和前壁区别于平面按钮。
- **Primary:** 骨白 PBT 表面配深色字面；页面主执行键为 44px 高、水平内边距 20px，并以回车图标提示实体 Enter 快捷键。
- **Secondary:** 石墨键帽配骨白字面；重置键为 44px 高，下载键为 40px 高。
- **Hover / Focus:** 悬停把键帽表面向白色混合 6%；键盘焦点使用 2px 外轮廓并偏移 2px。
- **Pressed / Disabled:** 按下向下移动 2px、前壁减薄、阴影收紧；生成期间主键保持按下。禁用保持同一材质并降至 50% 不透明度。
- **Other variants:** outline、ghost、destructive 与 link 保持平面 8px 圆角；它们不模拟键帽。

### Cards / Containers

- **Case bar:** 20px 圆角的阳极石墨承载面，移动端 16px、宽屏 20px 内边距。
- **Image stage:** 18px 圆角的轴座黑舞台；有图时只保留 1px 内缘高光，无图时增加凹槽阴影。
- **Border:** 不使用虚线投放框；结构边界由内阴影和半透明高光表达。

### Inputs / Fields

- **Image socket:** 紧凑模式在宽屏为 96×56px，10px 圆角、轴座黑底；空态显示 24px MX 轴心。
- **Filled state:** 单图完整包含，多图用两列 1px 间隔的缩略图拼贴。
- **Hover / Focus / Drag:** 悬停增强内缘并把轴心放大至 110%；焦点使用 2px 骨白外轮廓；拖入时内缘和字色切换为骨白。

### Status Indicator

8px 圆点带 10px 同色辉光。缺少输入时为 20% 骨白且无辉光；就绪为骨白；运行以琥珀色在 1.4s 内于 100% 与 35% 不透明度间脉冲；完成为绿色；失败为红色并把状态文案同步为错误色。

### Keyboard Illustration

60% ANSI 线稿用于空舞台和运行覆盖层。运行时每颗键帽按位置延迟，在 3.6s 循环中上移 16px、消失、落回并恢复骨白，形成逐列换帽波；底下的十字轴心在键帽离开时可见。运行中的原图同时放大至 102%、降至 40% 不透明度并使用中等模糊；结果以 700ms 去除滤镜、透明度和缩放过渡显现。

### Spinner

16px Lucide Loader2 线性图标只嵌在保持按下的主操作键中。它承担运行反馈，不独立形成居中加载卡片。

## Do's and Don'ts

### Do:
- **Do** 让照片占据状态行以下的完整内容宽度，让控件留在顶部机壳。
- **Do** 将新主操作做成骨白键帽，将辅助操作做成石墨键帽。
- **Do** 用凹槽、轴心、前壁和按压行程表达键盘硬件，而不是添加说明性装饰。
- **Do** 为所有 90ms 按键、150ms 槽位、700ms 结果和循环动画保留减少动态的静止表现。
- **Do** 使用 Lucide 线性图标或代码内的专用 SVG，并保持图标服务于动作含义。

### Don't:
- **Don't** 使用浅色主题、明亮大色块或把状态色扩展为普通控件配色。
- **Don't** 使用虚线投放框、药丸按钮或独立居中的加载卡片。
- **Don't** 把像素尺寸、耗时之外的正文切换为等宽字体。
- **Don't** 给舞台外再套通用卡片，也不要让界面材质与用户照片争夺注意力。
- **Don't** 把未使用的 shadcn 浅色 `:root` 默认变量记录成品牌系统。
