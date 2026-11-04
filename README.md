# 音乐播放器（@local/dsh-music-player）

一个运行在 DSH Web UI 中的本地音乐播放器插件：

- 侧边栏面板导入、管理和播放本地音频
- 32 根实时音频频谱柱
- 播放器界面与工作区背景中的频谱柱
- 全屏播放器设置
- 可自定义键盘快捷键
- 全部数据保存在本地，不上传音频

> 当前版本：`1.0.0`  
> 当前 Profile：`desktop`  
> 文档更新：2026-11-04

---

## 功能特性

### 音乐库

- 通过文件选择器导入音频
- 支持把文件直接拖到播放器面板
- 曲库搜索与单曲删除
- 自动恢复上次播放的曲目（不会自动开始播放）
- 音频数据保存在 IndexedDB，刷新页面后仍然保留
- 切换 DSH 面板时音乐继续播放

支持的扩展名：

`MP3`、`M4A`、`AAC`、`WAV`、`FLAC`、`OGG`、`OGA`、`Opus`、`WEBA`、`WebM`、`AIFF/AIF`、`ALAC`、`WMA`

> 实际能否解码取决于当前 Chromium/Web Audio 对编码格式的支持。

### 播放控制

- 播放 / 暂停
- 上一首 / 下一首
- 拖动进度条跳转
- 音量滑杆
- 静音 / 取消静音
- 循环模式：不循环、列表循环、单曲循环
- 当前时间 / 总时长显示

### 频谱柱

- 固定 32 根频谱柱
- 使用 Web Audio `AnalyserNode` 读取实时频谱
- 播放器面板中的频谱柱位于内容层下方
- 工作区中的频谱柱位于文字层下方，不拦截交互
- 支持颜色、最大高度、跳动速度、透明度调节
- 播放器背景卡片透明度可调
- 颜色预设：蓝、紫、绿、橙、红、粉

### 设置与快捷键

- 全屏播放器设置面板
- 所有设置自动保存
- 快捷键可自定义，自动处理按键冲突
- 设置全屏打开时不会误触播放器快捷键
- 输入框、搜索框、文本域和可编辑区域内不会触发快捷键

---

## 快速开始

### 前置条件

- 已安装并启用 DSH
- 当前 DSH 使用 Web UI
- 浏览器支持 IndexedDB、Web Audio、`backdrop-filter` 和 `color-mix`

### 安装

当前工作区已经以本地目录方式安装到 `desktop` Profile：

- 源码目录：
  `C:\Users\39211\Documents\deepseek-harness\default-workspace\music-player`
- 安装路径：
  `C:\Users\39211\.dsh\profiles\desktop\node_modules\@local\dsh-music-player`
- 安装路径是指向源码目录的 Junction 链接

Profile 注册文件：

`C:\Users\39211\.dsh\profiles\desktop\package.json`

其中包含：

```json
"@local/dsh-music-player": "link:C:/Users/39211/Documents/deepseek-harness/default-workspace/music-player"
```

并在 `dsh.profile.bundles` 中启用了：

```text
@local/dsh-music-player
```

如需在其他 Profile 安装，可使用 DSH 的插件管理器从本地目录安装，`target` 指向本目录，然后启用 `@local/dsh-music-player`。本插件没有单独的构建产物，安装后直接运行 `client.js`。

### 打开播放器

刷新 DSH 页面后，点击左侧边栏中的音乐图标即可打开播放器面板。

---

## 使用说明

### 导入音乐

有两种方式：

1. 点击“导入音乐”，选择一个或多个音频文件
2. 将音频文件拖到播放器面板中

导入后，音轨会出现在音乐库中。点击音轨即可切换并播放。

### 播放

底部“正在播放”区域提供：

- 上一首
- 播放 / 暂停
- 下一首
- 循环模式
- 进度条
- 音量与静音

当前曲目会随播放器状态更新，音频在切换 DSH 其他面板时不会中断。

### 默认快捷键

| 快捷键 | 功能 |
|---|---|
| `Space` | 播放 / 暂停 |
| `A` | 上一首 |
| `D` | 下一首 |

快捷键只在音乐播放器面板打开时生效。

补充行为：

- 焦点在输入框、文本域、下拉框或可编辑内容中时，快捷键不会触发
- 焦点在按钮、链接或 `role="button"` 元素上时，`Space` 保留按钮原生行为
- `A` / `D` 在按钮获得焦点时仍可切换歌曲
- 按住按键不会连续触发
- 带 `Ctrl`、`Alt`、`Meta` 或 `Shift` 的组合键不会触发
- 设置全屏面板打开时不会触发播放器快捷键

### 自定义快捷键

播放器设置中打开“键盘快捷键”区域：

1. 点击需要修改的快捷键按钮
2. 按下新的按键
3. 立即保存

规则：

- `Esc` 取消捕获
- 不支持的按键会提示，并继续等待输入
- 如果新按键已被另一项使用，会自动交换两项快捷键
- 支持：字母、数字、`Space`、方向键、`Home`、`End`、`PageUp`、`PageDown`、`F1`–`F12`
- 暂不支持组合键（例如 `Ctrl+Space`）
- 按键按物理键位识别

---

## 设置项

点击播放器右上角齿轮打开全屏设置。设置会自动保存，无需手动应用。

| 设置 | 默认值 | 范围 / 选项 | 说明 |
|---|---:|---|---|
| 律动频谱 | 开启 | 开 / 关 | 控制播放器面板内的频谱柱 |
| 在工作区显示频谱柱 | 开启 | 开 / 关 | 控制工作区背景中的频谱柱 |
| 工作区频谱柱位置 | 输入框上方 | 输入框上方 / 紧贴底部 | 控制工作区频谱柱的底部对齐位置 |
| 频谱柱最大高度 | `200` | `0–300` | 播放器中的最大高度；工作区上限为 `180px` |
| 频谱柱跳动速度 | `35` | `10–100` | `10` 最慢，`100` 最快 |
| 频谱柱透明度 | `64%` | `0–100` | `0` 全透明，`100` 不透明 |
| 背景卡片透明度 | `64%` | `0–100` | 播放器左右背景卡片；`0` 全透明，`100` 不透明 |
| 频谱柱颜色 | `#4f8cff` | 颜色选择器 / 预设 | 所有频谱柱共用 |
| 键盘快捷键 | `Space` / `A` / `D` | 自定义 | 播放 / 暂停、上一首、下一首 |

### 关于两个频谱开关

- “律动频谱”控制播放器面板内的频谱柱
- “在工作区显示频谱柱”独立控制工作区背景频谱柱
- 两个开关可以分别关闭
- 工作区频谱柱只在存在当前曲目且处于会话工作区时显示
- 暂停时频谱柱保持空闲低柱状态

### 关于透明度

- “频谱柱透明度”只影响频谱柱
- “背景卡片透明度”只影响播放器背景卡片
- 两者互相独立
- `0` 表示完全透明，`100` 表示完全不透明

### 频谱柱速度

频谱柱每帧向目标高度靠近：

```text
缓动系数 = 速度值 / 100
```

因此在约 60fps 下：

- `10`：最慢，约 22 帧达到目标高度的 90%
- `35`：默认，约 6 帧达到 90%
- `100`：下一帧直接到位

---

## 频谱柱的位置与层级

### 播放器面板

- 频谱柱位于播放器内容层下方
- 使用 `position: absolute` 和负层级
- 不占用布局空间
- `pointer-events: none`
- 播放器左右卡片带有半透明磨砂背景，频谱柱从卡片后方透出
- 卡片透明度可单独调整

### 工作区

- 频谱柱渲染在会话内容容器的背景层
- 位于文字、消息和输入框所在图层下方（z 轴）
- `pointer-events: none`
- 不占用布局空间
- 不会阻止文字选择、点击或输入
- 位置可选：
  - 输入框上方
  - 紧贴工作区底部

工作区频谱柱通过 `react-dom` Portal 挂载到 `[data-conversation-content]`，并通过 CSS 隔离层确保位于内容下方。

---

## 数据与隐私

### 音乐文件

导入的音频保存在浏览器的 **IndexedDB**：

- 数据库：`dsh-music-player`
- 版本：`1`
- 对象仓库：`tracks`
- 主键：`id`

每条记录包含：

```text
id, name, ext, blob, type, size, addedAt, duration
```

其中 `blob` 是原始 `File` / `Blob`，不是可执行文件或外部链接。

### Electron 桌面版磁盘位置

当前桌面版的 IndexedDB 数据位于：

```text
C:\Users\39211\AppData\Roaming\@deepseek-ai\dsh-desktop\IndexedDB\dsh-app_app_0.indexeddb.leveldb
```

较大的音频 Blob 可能位于同级的：

```text
C:\Users\39211\AppData\Roaming\@deepseek-ai\dsh-desktop\IndexedDB\dsh-app_app_0.indexeddb.blob
```

这些文件由 Chromium/Electron 管理，不能直接作为普通 MP3 文件播放，也不建议在应用运行时手动修改。

如果使用普通浏览器打开 Web GUI，数据保存在该浏览器自己的 IndexedDB 中，并按页面来源隔离。

### localStorage

以下轻量状态保存在 localStorage：

| Key | 内容 |
|---|---|
| `dsh-music-player:settings` | 播放器设置 |
| `dsh-music-player:volume` | 音量 |
| `dsh-music-player:repeat` | 循环模式 |
| `dsh-music-player:last` | 上次播放的曲目 ID |

### 隐私

- 不连接音乐服务
- 不上传音频
- 不读取音频内容以外的文件
- 音频只在当前浏览器/应用进程内解码播放

清除站点数据、清除 Profile 或删除 IndexedDB 目录会导致音乐库丢失。

---

## 目录结构

```text
music-player/
├── package.json          # 插件清单与 DSH bundle 声明
├── cordis.patch.yml      # 注册插件行
├── index.js              # Host 侧空实现
├── client.js             # 全部客户端逻辑、UI 与样式
├── icon.svg              # 侧边栏图标
├── locale/
│   ├── en.json           # 插件管理元数据（英文）
│   └── zh.json           # 插件管理元数据（中文）
└── README.md
```

没有构建步骤。`client.js` 通过 `window.__ModuleLoader__.load` 注册，使用普通 JavaScript 和 `React.createElement`，没有 JSX 编译产物。

---

## 技术实现

### 插件注册

`client.js` 注入 `slots` 和 `locale`，注册以下界面：

| Slot | 注册项 | 用途 |
|---|---|---|
| `sidebar.panellist` | `music`（order 20） | 侧边栏音乐入口 |
| `main` | `music` | 播放器主面板 |
| `shell.overlay` | `music-settings`（order 1100） | 全屏设置浮层 |
| `conversation.input.dock` | `music-workspace-bars` | 工作区频谱柱背景层 |

Host 侧 `index.js` 不包含业务逻辑。

### 音频链路

```text
HTMLAudioElement
  → MediaElementAudioSourceNode
  → AnalyserNode
  → AudioContext.destination
```

- `AnalyserNode.fftSize = 128`
- `smoothingTimeConstant = 0.35`
- 使用 32 个低频频率区间驱动 32 根频谱柱
- 使用 `requestAnimationFrame` 逐帧更新
- 不使用 CSS transition，避免动画与音频状态不同步

### 设置状态

播放器设置由一个插件级 Settings Store 统一管理：

- 播放器面板订阅
- 全屏设置面板订阅
- 工作区频谱层订阅

设置变更会同时更新 UI、频谱参数和持久化数据。

### 全屏设置

设置面板位于 `shell.overlay`，使用 `position: fixed` 覆盖整个 DSH 界面。

- 右上角关闭
- `Esc` 关闭
- 自动聚焦设置面板
- 快捷键捕获期间 `Esc` 只取消捕获，不关闭设置

---

## 开发与调试

### 修改代码

直接编辑：

```text
C:\Users\39211\Documents\deepseek-harness\default-workspace\music-player\client.js
```

当前 Profile 的安装路径是 Junction，编辑源码即可同步到安装路径。修改后需要重新加载插件：

1. 在插件管理中禁用 `@local/dsh-music-player`
2. 再启用
3. 刷新 DSH 页面

### 语法检查

```powershell
node --check client.js
```

### 样式

所有样式都定义在 `client.js` 的 `CSS` 模板字符串中，并由常驻的 `shell.overlay` 设置入口插入页面。这样播放器面板卸载后，工作区频谱柱和设置面板仍然有样式。

### 当前没有自动化测试

本项目目前没有测试套件。修改后建议至少检查：

- 导入、播放、暂停、上一首、下一首
- 刷新后曲库与设置是否保留
- 播放器与工作区频谱是否同步
- 两个透明度设置是否即时生效
- 快捷键与输入框焦点是否冲突
- 切换面板后音乐是否继续

---

## 故障排查

### 工作区看不到频谱柱

依次检查：

1. “在工作区显示频谱柱”是否开启
2. 是否有当前曲目
3. 是否处于会话工作区，而不是音乐播放器面板
4. “频谱柱透明度”是否为 `0`
5. “频谱柱最大高度”是否为 `0`
6. 当前设置的工作区位置是否被输入框遮挡
7. 是否需要刷新页面以加载最新客户端代码

### 播放器面板看不到频谱柱

检查：

- “律动频谱”是否开启
- “频谱柱透明度”是否大于 `0`
- “频谱柱最大高度”是否大于 `0`
- “背景卡片透明度”是否过高，导致频谱柱被卡片遮住

### 音乐库为空或导入丢失

可能原因：

- IndexedDB 被清除
- 使用了无痕/隐私窗口
- 换用了另一个浏览器或另一个页面来源
- 清除了 DSH Profile 或站点数据

IndexedDB 数据不会自动同步到其他浏览器或机器。

### 快捷键无效

检查：

- 音乐播放器面板是否处于打开状态
- 是否正在编辑输入框或文本
- 设置全屏面板是否打开
- 快捷键是否被修改为其他按键
- 焦点是否在按钮上（此时 `Space` 会执行按钮原生行为）

### 设置没有变化

- 设置是自动保存的，没有“应用”按钮
- 刷新页面后确认设置值
- 如果使用普通浏览器，检查是否清除了 localStorage 或切换了页面来源

---

## 已知限制

- 只有一个本地音乐库，不支持多播放列表
- 不读取音频标签、封面或歌手信息
- 不支持导出/导入音乐库
- 不支持组合键快捷键
- 工作区频谱柱只在带输入框的会话工作区渲染
- 音频格式支持取决于浏览器解码能力
- 没有自动化测试

---

## License

当前 `package.json` 标记为 `private`，未声明开源许可证。对外分发前请补充 `LICENSE` 文件。

---

## 版本

- `1.0.0`
- 私有本地插件，包名 `@local/dsh-music-player`
