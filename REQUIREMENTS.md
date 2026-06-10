# Lingrid 灵译需求追踪

本文件记录 Lingrid 灵译的需求、任务与验收状态。使用 Obsidian 原生友好的 Markdown checkbox、层级缩进、稳定 ID 和少量标签。

## 阶段 0：项目协作与产品定义

### DOC-A：仓库文档基础

- [x] [DOC-A-000] 建立项目协作文档 #epic #docs #P0
  - [x] [DOC-A-001] 创建根目录 `AGENTS.md`
    - [x] 写入标准协作规范
    - [x] 补充 Lingrid 灵译项目专用内容
  - [x] [DOC-A-002] 创建根目录 `README.md`
    - [x] 说明项目是什么
    - [x] 说明 Phase 1（v0.1）当前能力与非目标范围
    - [x] 索引 `AGENTS.md`、`REQUIREMENTS.md`、`DESIGN.md` 和 `agent-log/`
  - [x] [DOC-A-003] 创建根目录 `REQUIREMENTS.md`
    - [x] 使用稳定 ID
    - [x] 使用缩进 checkbox 表达父子任务
    - [x] 记录 Phase 1（v0.1）范围和后续 Backlog
  - [x] [DOC-A-004] 创建根目录 `DESIGN.md`
    - [x] 记录 shadcn/ui + Linear 参考方向
    - [x] 记录色彩、字体、布局、组件和可访问性原则
  - [x] [DOC-A-005] 创建根目录 `agent-log/`
    - [x] 放入本次初始化日志
  - [x] [DOC-A-006] 根据已归档对话补全项目文档
    - [x] 将 PO 保真约束写入需求与项目说明
    - [x] 补充 `.pot` 只读语义、语言列配置和 CSV 映射边界
  - [x] [DOC-A-007] 更新 README 文档以反映最新功能与 AI prompt 语法 #docs #P1
    - [x] `README.md` 与 `README.zh-CN.md` 同步更新
    - [x] 新增 AI Prompt Template Variables 章节，说明 `{{source}}`、`{{language}}`、`{{OtherLan}}` / `{{OhterContent}}`、索引语法 `{{OtherLan_1}}`、语言代码后缀语法 `{{OtherLan_<lang>}}`
    - [x] 更新 Phase 1 能力列表，补充多 provider 支持、批量 AI 翻译、同源其他语言参考变量等已交付功能
    - [x] 更新 Current Status，反映 Phase 1.5 正在进行中的方向

### FOUND-A：产品边界

- [x] [FOUND-A-000] 定义 Phase 1（v0.1）产品方向 #epic #P0
  - [x] [FOUND-A-001] 产品命名为 `Lingrid 灵译`
  - [x] [FOUND-A-002] 定义产品定位
    - [x] 轻量、现代、本地优先
    - [x] PO / CSV 多语言并排编辑器
    - [x] 面向独立游戏与小型软件本地化流程
  - [x] [FOUND-A-003] 定义 Phase 1（v0.1）第一优先级
    - [x] 多语言矩阵视图
    - [x] 并排编辑
    - [x] 直接保存回 `.po` / `.csv`
  - [x] [FOUND-A-004] 定义 Phase 1（v0.1）非目标范围
    - [x] 不做 Excel
    - [x] 不做术语库
    - [x] 不做复杂项目管理
    - [x] 不做复杂 QA
    - [x] 不做翻译记忆
    - [x] 不做 Git 集成

## Phase 1：v0.1 最小可用编辑器

### CORE-A：核心数据模型

- [x] [CORE-A-000] 建立翻译矩阵核心模型 #epic #P0
  - [x] [CORE-A-001] 定义 `TranslationEntry`
    - [x] 支持 source 文本
    - [x] 支持每个语言的译文
    - [x] 支持 changed 状态
    - [x] 支持 entry 级 tag
    - [x] PO 文档模型与矩阵 UI 投影分离
  - [x] [CORE-A-002] 定义 PO 唯一定位方式
    - [x] 内部保留 `msgctxt`
    - [x] 内部保留 `msgid`
    - [x] 内部保留 `msgid_plural`
    - [x] 使用 `msgctxt + msgid + msgid_plural` 形成稳定 key
  - [x] [CORE-A-003] 定义 CSV 唯一定位方式
    - [x] 支持选择 source 列
    - [x] 支持选择语言列
    - [x] 支持选择可选 id/key 列
    - [x] 没有 id/key 时使用 source 作为初始定位依据
  - [x] [CORE-A-004] 定义项目状态模型
    - [x] 保存打开文件列表
    - [x] 保存文件类型
    - [x] 保存语言列名
    - [x] 保存列顺序
    - [x] 保存列宽
    - [x] 保存 tag
    - [x] 保存 CSV 列映射
    - [x] 搜索、筛选、排序和强制补齐开关仅作为当前会话状态，不写入项目 JSON
  - [x] [CORE-A-005] 确保项目 JSON 不替代源翻译文件
    - [x] 翻译正文以 `.po` / `.csv` 为准
    - [x] 项目 JSON 只保存项目状态
  - [x] [CORE-A-006] 保留 PO 文档结构与元数据
    - [x] 保留 `msgstr` 与 `msgstr[n]`
    - [x] 保留 translator comments 和 extracted comments
    - [x] 保留 references
    - [x] 保留 flags，例如 `fuzzy`
    - [x] 保留 previous source
    - [x] 保留 obsolete entries

### FILE-A：文件导入与保存

- [x] [FILE-A-000] 实现 PO/POT/CSV 文件工作流 #epic #P0
  - [x] [FILE-A-012] 支持 Phase 1（v0.1）原文件输入
    - [x] `.po` 作为可编辑原文件输入
    - [x] `.csv` 作为可编辑原文件输入
    - [x] `.pot` 作为只读 source/template 输入，不属于可编辑原文件
  - [x] [FILE-A-001] 导入 `.po`
    - [x] 读取 header 中的语言信息
    - [x] 读取 `msgid` / `msgstr`
    - [x] 读取 plural、comments、references、flags、previous source 和 obsolete entries
    - [x] 保留原始 entry 顺序
    - [x] 导入后生成或合并到矩阵列
  - [x] [FILE-A-002] 导入 `.pot`
    - [x] 作为 source/template 使用
    - [x] 默认不写入译文
    - [x] 可参与矩阵 source 对齐
    - [x] 主保存流程不覆盖 `.pot`
  - [x] [FILE-A-003] 导入 `.csv`
    - [x] 支持用户映射 source 列
    - [x] 支持用户映射语言列
    - [x] 支持用户映射可选 id/key 列
    - [x] 导入后生成或合并到矩阵
  - [x] [FILE-A-004] 支持多次追加导入
    - [x] 当前项目已打开文件时可继续导入新文件
    - [x] 新语言列追加到现有矩阵
    - [x] 重复 source/key 合并到已有行
    - [x] 从 PO header 的 `Language:` 精确识别语言，避免同名 PO 文件合并到错误列
    - [x] PO/POT 与 CSV 不允许混合到同一个项目
  - [x] [FILE-A-005] 保存修改到原 `.po`
    - [x] 只写回对应语言列的修改
    - [x] 尽量保留原文件顺序
    - [x] 尽量保持稳定格式，避免无意义 diff
    - [x] 不丢失未在矩阵中直接展示的 PO 元数据
    - [x] 保存后清除对应 changed 状态
    - [x] 写入后回读验证磁盘内容，只有落盘成功才清除 changed 状态
    - [x] 更新多行 `msgstr` 时移除旧续行，避免重开后旧译文残留
    - [x] 浏览器开发预览支持 File System Access API 时保留句柄直接覆盖；无法获得可写句柄时下载更新副本，明确提示原文件未覆盖，并保留未保存状态
    - [x] 浏览器项目恢复时以 `readwrite` 模式授权目录，并在写入前再次确认文件句柄具有写权限
    - [x] 主保存只写入序列化内容确实变化的源文件，避免未修改文件的权限问题阻止保存
    - [x] 主保存落盘流程防止重入；已有 PO/CSV 落盘尚未结束时复用正在运行的保存任务，不再启动第二组文件 preflight/write
    - [x] 多个同名 PO 文件保存报错时使用项目相对路径或完整路径，例如 `en/Game.po`
    - [x] 主保存与 PO/CSV 另存为都会先合并当前仍聚焦单元格的草稿，避免点击按钮时遗漏最后一次输入
    - [x] 浏览器直接覆盖多个源文件时，按文件串行执行权限/外部修改 preflight、写入和回读校验，避免不同保存事务交叠导致 `modifiedAt` 误判
    - [x] 提供可复制的浏览器诊断日志，记录项目加载、目录授权、文件匹配、权限预检、序列化、逐文件写入和回读校验，不记录译文正文或 API key
    - [x] 多语言 PO 条目集合不一致时，以 `msgctxt + msgid + msgid_plural` 合并为矩阵并集，但将目标语言源文件中不存在的单元格标记为不可用
    - [x] 默认灰置并禁止编辑源文件中不存在的语言单元格，且不纳入该语言完成度统计和完成度筛选
    - [x] 顶栏提供“强制补齐”开关；开启后允许编辑缺失单元格，保存时从已有语言克隆完整 PO block 元数据并追加到目标 PO
  - [x] [FILE-A-006] 保存修改到原 `.csv`
    - [x] 只写回对应 CSV 映射列
    - [x] 保存后清除对应 changed 状态
  - [x] [FILE-A-007] 保存项目 JSON
    - [x] 保存打开文件路径
    - [x] 保存语言列顺序
    - [x] 保存 tag
    - [x] 保存 CSV 映射
    - [x] 浏览器中重新打开项目时读取 JSON 状态，并要求用户授权一次项目目录后自动查找源文件
    - [x] Electron 桌面版本按 JSON 记录路径自动重新打开源文件
    - [x] 个别源文件缺失或不可读时跳过并提示，不阻止其余文件恢复
  - [x] [FILE-A-008] 支持项目另存
    - [x] 用户可将项目 JSON 保存到任意本地位置
  - [x] [FILE-A-009] 支持当前 PO 另存
    - [x] 当前语言列可另存为新的 `.po`
  - [x] [FILE-A-010] 保存前处理风险提示
    - [x] 文件缺失时提示
    - [x] 外部修改时提示或阻止覆盖
    - [x] 保存失败时保留 changed 状态
    - [x] 左下状态栏持续显示最近一次 PO/CSV 保存成功或失败；失败时使用错误色并展示具体原因
    - [x] 保存诊断日志区分重入复用事件，避免把 Lingrid 自己上一轮写入后的 `modifiedAt` 变化误报为外部修改
  - [x] [FILE-A-011] 配置语言列
    - [x] 支持调整语言列顺序
    - [x] 支持为导入后的语言列设置显示名称
    - [x] 顶栏提供 `Columns` 入口，支持左右移动语言列 #cut 已由更直接的表头拖拽重排替代
    - [x] 语言表头支持拖拽重排，并保存到项目 JSON

### UI-A：主界面与编辑体验

- [x] [UI-A-000] 实现主编辑界面 #epic #P0
  - [x] [UI-A-001] 创建应用外壳
    - [x] 顶部 toolbar
    - [x] 中央矩阵表格
    - [x] 底部或右侧详情编辑区
    - [x] 状态栏或统计入口
    - [x] 右上角提供应用界面语言切换，支持中文、日文和英文
    - [x] 界面语言切换使用与顶部筛选一致的标准轻量弹出菜单，不使用浏览器原生下拉样式
    - [x] 界面语言作为本地偏好保存，不写入 project JSON
  - [x] [UI-A-011] 默认演示项目按本地化语言选择 source #feature #P1
    - [x] 简体中文界面使用简体中文 demo source，英文界面使用英文 demo source，日文界面使用日文 demo source
    - [x] 简体中文、英文和日文 demo source 分别使用适合该本地化语境的独立演示文案，不直接复用同一套翻译文本
    - [x] 当前项目仍是 demo 时，切换网站语言会同步切换 demo source；导入真实项目后切换网站语言不影响项目数据
    - [x] 语言列自动排除当前 source 语言，避免 source 与后续列重复
    - [x] 演示语言增加韩语 `ko` 与俄语 `ru`
    - [x] 演示词条增加 `进入：地点` 与 `要使用“道具”吗？`，用于测试冒号、引号和问号等标点
    - [x] demo 矩阵表头使用短标签，并缩小默认 source / language / tag 列宽，避免默认窗口横滚
  - [x] [UI-A-002] 实现矩阵表格
    - [x] 行代表 source entry
    - [x] 列代表 source、语言和 tag
    - [x] 支持横向滚动
      - [x] 列宽超过可用区域时仅矩阵区域横向滚动，不挤出右侧详情区
    - [x] 支持高密度显示
    - [x] changed 单元格有轻量视觉提示
    - [x] 可按用户配置展示语言列顺序和显示名称
    - [x] 点击语言表头在未完成优先、完成优先、内容升序、内容降序间轮转
    - [x] 同时只有一个语言列激活排序；排序仅影响 UI 投影，不改变源文件 entry 顺序
    - [x] 支持拖动表头分隔线调整列宽
    - [x] 双击表头分隔线时按当前列内容自动适配宽度
    - [x] 列宽保存到项目 JSON
  - [x] [UI-A-003] 实现单元格编辑
    - [x] 用户可直接修改语言单元格
    - [x] 修改后标记 changed
    - [x] 空译文有轻量提示
    - [x] 输入过程中保留草稿，失焦、Enter 或 Tab 后再提交并重新计算筛选状态
    - [x] Enter 向下移动单元格，Tab 横向移动单元格，`Shift+Tab` 反向移动
  - [x] [UI-A-004] 实现详情编辑区
    - [x] 选中单元格后显示 source
    - [x] 显示当前语言译文大文本框
    - [x] 支持多行文本编辑
    - [x] 支持保存或应用修改
  - [x] [UI-A-005] 实现 context/key 的按需显示
    - [x] 默认不显示总是为空的 context 列
    - [x] 当 PO 中存在 `msgctxt` 时显示或允许展开
    - [x] 允许在详情区查看 key/context
  - [x] [UI-A-006] 实现文件操作入口
    - [x] Open PO/POT
    - [x] Import CSV
    - [x] Save
    - [x] Save Project
    - [x] Save Project As
    - [x] Save Current PO As
    - [x] `Save PO/CSV` 在译文未保存时显示橙色提示点
    - [x] `Save Project` 在项目状态未保存时显示橙色提示点
    - [x] 左下状态栏分别如实显示 `PO/CSV not saved` 和 `Project not saved`
    - [x] 左下状态栏显示最近一次源文件写入与回读校验结果，保存失败时不得回退为“已保存”

### TAG-A：Tag 与标记

- [x] [TAG-A-000] 实现两层 tag 系统 #feature #P0
  - [x] [TAG-A-001] 支持 Obsidian 风格 tag
    - [x] 例如 `#todo`
    - [x] 例如 `#ui`
    - [x] 例如 `#review`
  - [x] [TAG-A-002] tag 作用于 source entry
    - [x] 同一 source 的所有语言共享 tag
  - [x] [TAG-A-003] tag 保存到项目 JSON
    - [x] 不默认写入 `.po`
    - [x] 不默认写入 `.csv`
  - [x] [TAG-A-004] 支持在详情编辑区编辑 tag
  - [x] [TAG-A-005] 支持在矩阵 tag 单元格中直接编辑 tag
  - [x] [TAG-A-006] 将 entry 级 tag 明确为 Source Tag
    - [x] 同一 source 的所有语言共享 Source Tag
  - [x] [TAG-A-007] 支持 Word Tag
    - [x] Word Tag 作用于具体 source 的具体语言单元格
    - [x] 在详情侧栏 Source Tag 下方编辑当前单元格的 Word Tag
    - [x] Word Tag 保存到项目 JSON，不默认写入 `.po` 或 `.csv`
    - [x] 单元格右上角使用带 padding 的彩色竖条展示 Word Tag
    - [x] 多个 Word Tag 显示多个竖条，hover 展示该单元格全部 Word Tag
    - [x] 相同 Word Tag 使用稳定一致的颜色
- [x] [TAG-A-008] Tag 输入支持回车换行分隔多 Tag #feature #P1
  - [x] 矩阵 tag 单元格、详情区 Source Tag 和 Word Tag 的输入框统一改为 textarea
  - [x] 用户可在输入框中用回车（换行）分隔多个 tag，每行一个 tag
  - [x] 提交时按任意空白字符（含换行）拆分并逐个 normalize
  - [x] 矩阵 tag 单元格中 Tab 键保持提交并移动焦点的行为；Enter 键插入换行以继续输入下一个 tag
  - [x] 详情区 tag textarea 失焦时自动提交，Enter 键自由插入换行
  - [x] 显示时以换行符连接，保持每行一个 tag 的视觉呈现

### SEARCH-A：搜索、筛选与统计

- [x] [SEARCH-A-000] 实现基础检索与统计 #epic #P0
  - [x] [SEARCH-A-001] 搜索 source
  - [x] [SEARCH-A-002] 搜索任意语言译文
  - [x] [SEARCH-A-003] 搜索 tag
  - [x] [SEARCH-A-004] 筛选完成情况
    - [x] 所有目标语言有译文视为完成
    - [x] 任一目标语言缺译文视为未完成
    - [x] 支持按一个或多个已加载语言筛选完成或未完成状态
    - [x] 支持 `All languages`
  - [x] [SEARCH-A-005] 筛选 changed
  - [x] [SEARCH-A-006] 筛选 tag
    - [x] 点击筛选下拉框外部区域时自动收起菜单
    - [x] 支持多选 tag；条目命中任一所选 tag 时显示
    - [x] Source Tag 顶栏入口使用 `Source Tag` 名称
    - [x] `全部` 勾选时显式选中全部已知 tag 和 `空`
    - [x] `全部` 与具体选项之间使用虚线分隔
    - [x] 提供 `空` 选项，匹配没有 Source Tag 的条目
  - [x] [SEARCH-A-006-WORD] 筛选 Word Tag
    - [x] 顶栏增加 Word Tag 筛选入口
    - [x] 支持多选 Word Tag
    - [x] 支持按一个或多个语言限定 Word Tag 筛选范围
    - [x] 支持 `All languages`
    - [x] `全部` 勾选时显式选中全部已知 Word Tag 和 `空`
    - [x] `全部` 与具体选项之间使用虚线分隔
    - [x] 提供 `空` 选项，匹配指定语言范围内没有 Word Tag 的单元格
  - [x] [SEARCH-A-007] 统计条目信息
    - [x] 总条目数
    - [x] 当前筛选结果条目数
  - [x] [SEARCH-A-008] 统计各语言完成率
    - [x] 已翻译数量
    - [x] 未翻译数量
    - [x] 完成率
  - [x] [SEARCH-A-009] 统计 tag 数量
  - [x] [SEARCH-A-010] 统计 changed 数量

### AI-A：轻量 AI / 翻译 API 建议

- [x] [AI-A-000] 实现当前单元格翻译建议 #feature #P1
  - [x] [AI-A-001] 配置 API endpoint
  - [x] [AI-A-002] 配置 API key
  - [x] [AI-A-003] 配置 model
  - [x] [AI-A-004] 配置 prompt template
  - [x] [AI-A-005] 点击当前单元格生成翻译建议
  - [x] [AI-A-006] 显示建议结果
  - [x] [AI-A-007] 用户点击后应用建议到当前单元格
  - [x] [AI-A-008] 不自动覆盖已有译文
  - [x] [AI-A-009] API key 不写入日志
  - [x] [AI-A-010] strip reasoning 标签：reasoning 类模型（MiniMax-M2.7、DeepSeek-R1、o1/o3 等）的 `choices[0].message.content` 会包含 `<think>...</think>` 段落，应用前必须 strip，否则会污染 cell 与 `.po` 写入
    - [x] `ts/renderer/providers/openai-compatible.ts` 暴露 `stripThinkTags` 纯函数
    - [x] `generateSuggestion` 走 OpenAI 兼容 provider 时调用 strip，结果再 setSuggestion
    - [x] strip 命中时通过 `appendDiagnostic("ai.stripped_think", ...)` 留痕，不记录译文
    - [x] `ts/tests/providers.test.ts` 覆盖：单 think 块 / 多 think 块 / 无 think / 全 think fallback / 全空白
  - [x] [AI-A-011] 支持 provider 切换 #feature #P1
    - [x] `AiSettings` 加 `provider: "openai-compatible" | "deepl"` 字段
    - [x] AI 设置 Modal 顶部加 provider radio：`OpenAI 兼容 | DeepL`
    - [x] 切换 provider 时自动切显示字段：DeepL 模式隐藏 model 与 prompt
    - [x] DeepL 模式显示 region 选择（免费版 / 专业版），切换时自动填 endpoint
    - [x] `generateSuggestion` 按 provider 分发到对应适配器
    - [x] 保持现状：`apiKey` 仍只活在浏览器内存，不写入项目 JSON
  - [x] [AI-A-012] DeepL provider #feature #P1
    - [x] `ts/renderer/providers/deepl.ts` 实现 DeepL `/v2/translate` 协议：form-urlencoded、`DeepL-Auth-Key` header、响应 `{ translations: [{ detected_source_language, text }] }`
    - [x] `toDeepLTargetLanguage` 映射常见 PO 语言代码到 DeepL 期望大写（zh-CN→ZH-HANS、en-GB→EN-GB、pt-BR→PT-BR 等）
    - [x] `requestDeepLTranslation` 返回 `{ text, detectedSource? }`
    - [x] `ts/tests/providers.test.ts` 覆盖 DeepL 语言代码映射（zh / ja / en / pt / 大小写 / 空白 / 未知 fallback）
  - [x] [AI-A-013] AI 设置弹窗按视觉规范优化 #ui #P1
    - [x] provider 使用低噪声分段卡片，显示服务说明而不是裸 radio
    - [x] OpenAI 兼容与 DeepL 配置按卡片分区展示，避免表单堆叠感
    - [x] DeepL / DeepLX 服务选择沿用同一分段控件，并显示对应 endpoint
    - [x] prompt template 使用全宽输入区域，并说明 `{{language}}` 与 `{{source}}` 占位符
    - [x] 设置内容超过视口高度时，弹窗内容区可上下滚动，标题栏保持可见
  - [x] [AI-A-014] AI 翻译链路全量留痕到诊断日志 #feature #P1
    - [x] `providers/openai-compatible.ts` 与 `providers/deepl.ts` 引入 `ProviderHttpError`，非 2xx 响应抛带 `status` / `contentType` / `bodyPreview` 的 Error
    - [x] `requestAiTranslation` 接入诊断日志：每次调用打 `ai.request.start` / `ai.request.success` / `ai.request.error` 或 `deepl.request.start` / `deepl.request.success` / `deepl.request.error`
    - [x] 日志详情记录 endpoint / model / target_lang / sourceLength / 响应长度 / 检测到的源语言；**不**记录 `apiKey` / 译文正文
    - [x] 失败时 `extractServerMessage` 解析 DeepL / OpenAI 错误体的 `message` 字段，notice 显示 `HTTP <status>: <server message>` 摘要
    - [x] `generateBatchAi` 逐条失败时额外写 `ai.batch.item.error`，不再只 `failed += 1`
    - [x] body 预览截断到 600 字符并附 `truncated` 标记，避免诊断日志被巨大错误体撑爆
    - [x] `ts/tests/providers.test.ts` 新增 7 个用例：OpenAI 2xx / 4xx / 大 body 截断 + DeepL 2xx / 403 / 400 target_lang
  - [x] [AI-A-015] AI 设置 modal 体感修复（复制 + 持久化真值）#bug #P1
    - [x] `AI_DEFAULT.endpoint` / `AI_DEFAULT.model` 改为空字符串，避免初始默认值假象；用户手动填的 endpoint / model 切换预设时**不再被占位值覆盖**
    - [x] `selectOpenAiPreset` / `selectAnthropicPreset` 增加"endpoint 是否仍是上一预设占位"判断：仅当 endpoint 仍为占位（或空）时才覆盖；用户已填的真值保留
    - [x] 三个密码 input（OpenAI 兼容 / Anthropic / DeepL）加 `onCopy` 与 `onCut` 主动写 clipboardData，绕过浏览器对 password 字段的 Ctrl-C 默认安全策略
    - [x] AI 设置 modal 顶部加 "已记住：provider · endpoint · model · key ✓" 状态条，让用户能直观看到 localStorage 里的真值 #cut：2026-06-09 用户反馈该行冗余，改为仅保存时写诊断日志
    - [x] `ts/tests/providers.test.ts` 新增 3 个用例：AI_DEFAULT.endpoint 空 / AI_DEFAULT.model 空 / loadAiSettings 空存储返回空 endpoint+model
  - [x] [AI-A-016] 切 provider 后 form 字段未切回 #bug #P1
    - [x] 新建 `ts/renderer/providers/placeholder-detect.ts`，导出 `isKnownPlaceholderEndpoint` / `isKnownPlaceholderModel` 纯函数
    - [x] 占位判断覆盖**所有 provider** 的 preset.endpoint / modelPlaceholder + DeepL / DeepLX endpoint，不再只比对"上一预设"
    - [x] 修复"DeepL 自动填的 endpoint 切回 OpenAI 时仍残留"——DeepL endpoint 现在被识别成占位 → 切回 OpenAI 时覆盖成 OpenAI preset 默认
    - [x] DeepL radio onChange 也走同样的占位判断：当前 endpoint 是占位时切到 DeepL 才覆盖成 DeepL 默认；用户已填的真 endpoint 保留
    - [x] `ts/tests/providers.test.ts` 新增 7 个用例：endpoint 空 / undefined / null / DeepL / OpenAI preset / 用户真值 / model 同款
  - [x] [AI-A-017] 修复 AI 设置 provider / preset 配置串值 #bug #P1
    - [x] `AiSettings` 增加 `profiles`，按 `provider:preset-or-region` 保存独立 endpoint、model、apiKey 和 prompt
    - [x] 切换 OpenAI 兼容预设前先保存当前预设配置，切换后加载目标预设自己的配置；没有保存过才使用该预设默认值
    - [x] DeepL / DeepLX 与 OpenAI 兼容预设互相切换时不再共用同一组 endpoint、model 和 apiKey
    - [x] 旧版 localStorage 没有 `profiles` 时仍可加载，首次切换后自动补 profile
    - [x] `ts/tests/providers.test.ts` 新增回归测试：MiniMax 自定义 endpoint 不会显示到 OpenAI；DeepL endpoint 不会显示到 OpenAI
  - [x] [AI-A-018] AI 设置草稿保存与当前接口提示 #bug #P1
    - [x] AI 设置 modal 改为草稿态：输入、切 provider 或切 tab 不立即写入 localStorage，也不改变当前 AI 调用配置
    - [x] “完成”按钮在草稿与已保存配置不一致时显示橙色提示点；点击后才保存当前激活 tab 的 provider / preset / endpoint / model / prompt
    - [x] 点击 X 或遮罩关闭 AI 设置 modal 时丢弃草稿，恢复到打开 modal 前的已保存配置
    - [x] 保存 AI 设置时写入诊断日志 `ai.settings.save`，记录 provider / preset / endpoint / model / 是否有 key / prompt 长度，不记录 API key
    - [x] AI 建议区显示当前正在使用的接口或模型小字：OpenAI 兼容显示 preset + model，DeepL 显示 DeepL 或 DeepLX
    - [x] DeepL provider 选项由 Free / Pro 改为 DeepL / DeepLX，并兼容旧 localStorage 的 `free` / `pro` 值迁移到 DeepL
    - [x] `requestDeepLTranslation` 支持 DeepLX JSON 请求与常见 `data` / `translation` / `text` 响应格式
    - [x] `ts/tests/providers.test.ts` 增加旧 DeepL region 迁移与 DeepLX JSON 协议解析用例
- [x] [AI-A-020] 扩展 AI provider 设置结构 #feature #P1
  - [x] [AI-A-021] 保持顶层 provider 结构：`OpenAI 兼容`、`其他兼容`、`单独 Provider`，其中 `DeepL` 作为单独 Provider 保留
  - [x] [AI-A-022] `OpenAI 兼容` 下提供预设选项，至少覆盖：`OpenAI`、`Kimi / Moonshot`、`MiniMax`、`通义千问 / DashScope`、`豆包 / 火山方舟`、`Gemini`、`Claude OpenAI SDK compatibility`、`自定义 OpenAI 兼容`
    - [x] 每个预设应保存：显示名称、协议类型、默认 endpoint/baseURL、默认 model placeholder、API key placeholder、简短差异说明
    - [x] 预设切换时自动填入 endpoint/baseURL 与 model placeholder，但不覆盖用户已经输入的 API key
    - [x] `Claude OpenAI SDK compatibility` 必须提示：官方说明该兼容层主要用于测试/对比能力，长期生产优先使用 Claude native API
    - [x] MiniMax OpenAI-compatible 默认 endpoint 使用 `https://api.minimaxi.com/v1/chat/completions`
  - [x] [AI-A-023] `其他兼容` 下提供非 OpenAI 兼容路径，至少预留：`Anthropic / Claude native`、`MiniMax Anthropic-compatible`、`自定义 Anthropic-compatible`
    - [x] 这些路径在未实现 adapter 前应显示“待实现”或禁用状态，不允许用户误以为已经可调用
  - [x] [AI-A-024] provider 展开区沿用顶层 provider 的视觉结构，不再使用原生 radio 或未美化的按钮
  - [x] [AI-A-025] provider 来源调研基准记录：
    - [x] Kimi / Moonshot：官方文档说明支持 OpenAI-compatible HTTP API
    - [x] MiniMax：官方说明同时存在 OpenAI-Compatible API 与 Anthropic-Compatible API
    - [x] 通义千问 / DashScope：阿里云百炼提供 OpenAI 兼容 Chat Completions
    - [x] 豆包 / 火山方舟：火山方舟文档提供兼容 OpenAI SDK 的调用方式
    - [x] Gemini：Google Gemini API 提供 OpenAI compatibility endpoint
    - [x] Claude：Anthropic 提供 OpenAI SDK compatibility，同时也有 Claude native API
- [x] [AI-A-030] 确认 prompt template 变量真实生效 #qa #P1
  - [x] [AI-A-031] `{{language}}` 必须替换为当前目标单元格所在语言列的 language/display label，优先使用用户设置的语言显示名，缺失时使用内部 language id
  - [x] [AI-A-032] `{{source}}` 必须替换为当前行的 source 文本
  - [x] [AI-A-033] 单单元格 AI 建议、多选 AI 翻译、空单元格批量 AI 翻译都必须走同一套变量渲染逻辑
  - [x] [AI-A-034] 增加测试覆盖：不同语言列、不同 source 行、多选/批量场景下 `{{language}}` 与 `{{source}}` 渲染正确
  - [x] [AI-A-035] 默认 prompt 使用游戏本地化语境，要求按源语言游戏行业术语理解并输出自然的玩家可见目标语言译文；新增字母语言大写规范（引用 `{{source}}` 真实值）、间距标点结构保留、半角全角字符规范，以及同源其他语言参考（`{{OtherLan}}: {{OhterContent}}`）
- [x] [AI-A-050] 扩展 prompt template 的同源其他语言参考变量 #feature #P1.5
  - [x] [AI-A-051] 新增 `{{OtherLan}}` 与 `{{OhterContent}}` 变量；注意变量名按用户需求保留拼写 `OhterContent`
  - [x] [AI-A-052] 变量数据来自同一个 source entry 的其他语言单元格：排除当前被翻译/选中的目标语言单元格，排除空译文单元格，并按项目当前语言列顺序排序
  - [x] [AI-A-053] 支持后缀索引语法 `{{OtherLan_1}}`、`{{OhterContent_1}}`、`{{OtherLan_2}}`、`{{OhterContent_2}}` 等；索引从 1 开始，指向排序后第 N 个可用其他语言译文
  - [x] [AI-A-054] 后缀索引缺失对应其他语言时应渲染为空字符串，不抛错，不泄露 undefined/null
  - [x] [AI-A-055] 支持自动聚合语法：当 prompt 中使用无后缀的 `{{OtherLan}}` 与 `{{OhterContent}}` 时，应输出所有可用其他语言参考，并以逗号分隔成 `语言: 内容` 对；例如 EN 目标列为空、同一行 `ZH-HANS = 迷宫`、`KO = 미로` 时，`{{OtherLan}}: {{OhterContent}}` 渲染为 `ZH-HANS: 迷宫,KO: 미로`
  - [x] [AI-A-056] 自动聚合不得包含当前目标语言自身的值，即使该单元格已有草稿或旧译文；不得包含空值语言，以节省上下文
  - [x] [AI-A-057] 单单元格 AI 建议、多选 AI 翻译、空单元格批量 AI 翻译都必须为每个目标单元格独立计算 `OtherLan/OhterContent` 上下文
  - [x] [AI-A-058] 默认 prompt 改为：优先参考 `{{source}}`，同时一并参考同一行已翻译的其他语言内容（使用 `{{OtherLan}}: {{OhterContent}}` 一字排开）后给出目标语言译文
  - [x] [AI-A-059] 增加测试覆盖：索引变量、自动聚合变量、空值排除、当前目标语言排除、列顺序影响，以及批量 AI 时逐单元格上下文独立计算
  - [x] [AI-A-060] 支持语言代码后缀语法 `{{OtherLan_<lang>}}` 与 `{{OhterContent_<lang>}}` #feature #P1.5
    - [x] `<lang>` 为语言代码（如 `EN`、`zh-Hans`、`ja` 等），大小写不敏感匹配
    - [x] 在 `otherLanguages` 中查找语言代码匹配的项，返回对应语言显示名或单元格内容
    - [x] 未匹配到对应语言时渲染为空字符串，不抛错
    - [x] 单单元格 AI 建议、多选 AI 翻译、空单元格批量 AI 翻译均支持此语法
    - [x] 增加测试覆盖：精确匹配、大小写不敏感、未匹配返回空
- [x] [AI-A-040] 支持 AI 翻译批量填充 #feature #P1
  - [x] [AI-A-041] 当没有选中具体翻译单元格时，点击 AI 翻译/生成应翻译全部可编辑的空置译文单元格，并直接写入对应单元格
    - [x] 不处理 source 列、tag 列、不可编辑缺失条目、已有译文的单元格和 `.pot` 只读内容
    - [x] 批量写入后的单元格标记为 changed，便于用户通过已修改状态逐项检查
  - [x] [AI-A-042] 当选中了多个翻译单元格时，点击 AI 翻译/生成应只处理选中范围内可编辑的空置译文单元格，并直接写入对应单元格
    - [x] 选区内已有译文默认不覆盖；后续如需要覆盖，应另设明确开关
  - [x] [AI-A-043] 批量 AI 翻译需要显示进度、成功数、跳过数和失败数；失败不应中断已成功写入的单元格
  - [x] [AI-A-044] 批量 AI 翻译不得把 API key、source 原文或译文内容写入 agent-log 或诊断日志
  - [x] [AI-A-045] 批量 AI 翻译支持限流并发请求；默认可并发处理多个空单元格，成功结果立即写入对应单元格并标记 changed
  - [x] [AI-A-046] 批量 AI 翻译遇到 429 / quota exceeded 时解析 retry 提示，等待后重试，并将后续请求降为单并发，避免继续撞 API 上限
- [x] [AI-A-060] AI 生成任务可取消 #feature #P1.5
  - [x] [AI-A-061] 单条 AI 建议生成中，按钮进入 loading 动态状态，同时按钮保持可点击
    - [x] 点击 loading 状态下的按钮 → 取消当前正在进行的 AI 请求
    - [x] 取消后按钮恢复为普通状态，详情区显示"已取消"提示
    - [x] 取消后不应写入任何内容到单元格
  - [x] [AI-A-062] 全局/批量 AI 翻译生成中，按钮同样进入 loading 动态状态并保持可点击
    - [x] 点击 loading 状态下的按钮 → 取消整个批量 AI 任务
    - [x] 已完成的单元格保留已写入结果，未开始的单元格停止执行
    - [x] 取消后进度区显示"已取消"及已完成/已取消数量统计
  - [x] [AI-A-063] 取消实现需支持 AbortController 或等效机制
    - [x] 单条请求：fetch 传入 signal，取消时 abort 当前 HTTP 请求
    - [x] 批量任务：维护任务级取消标志，取消后阻止后续请求发起，同时 abort 正在进行的请求
    - [x] 取消后 provider 层应正确处理 abort 异常，不抛未捕获错误，不写入诊断日志为错误
- [x] [AI-A-070] AI 批量翻译 RATE 超限自动停止 #feature #P1.5
  - [x] [AI-A-071] RATE 超限响应分类判定
    - [x] 区分"降速（throttled / rate-limited with retry）"与"失败（failed / hard limit exceeded）"两种响应模式
    - [x] 降速判定：API 返回 429 且响应体包含 retry-after 或明确提示降速继续；或 provider 返回非致命 rate limit 提示
    - [x] 失败判定：API 返回 429/403/401 且响应体明确表示 quota 已耗尽、无 retry 可能，或连续请求均返回非 2xx 且无降速语义
  - [x] [AI-A-072] 降速模式处理与橙色日志
    - [x] 判定为降速时，当前请求按现有 retry 逻辑等待后重试，后续请求降为单并发
    - [x] 降速模式下，批量 AI 翻译进度区最下方日志条目使用橙色（orange/warning 色）标识，提示用户当前处于限速状态
    - [x] 降速期间任务继续执行，不自动停止
  - [x] [AI-A-073] 连续失败阈值与自动停止
    - [x] 维护一个连续失败计数器，仅当判定为"失败"（非降速）时递增
    - [x] 连续失败计数达到 10 时，自动停止整个批量 AI 任务
    - [x] 自动停止时，批量 AI 翻译进度区最下方日志条目使用红色（red/error 色）标识，提示"RATE 超限，任务已自动停止"
    - [x] 自动停止后，已完成的单元格保留已写入结果，未开始的单元格停止执行
    - [x] 连续失败计数在任意一次请求成功时重置为 0
  - [x] [AI-A-074] 手动停止的红色日志
    - [x] 用户手动点击取消/停止按钮时，进度区最下方日志条目同样使用红色标识，提示"任务已手动停止"
    - [x] 手动停止不依赖连续失败计数，立即生效
- [ ] [AI-A-080] 支持 AI 批量生成 Source Tag #feature #P1.5
  - [ ] [AI-A-081] 在 Tags 表头右侧增加 AI 生成按钮，点击后对所有空的 Source Tag 单元格进行 AI 生成
    - [ ] 生成依据包括：当前矩阵中已存在的所有 Source Tag（已有标签库）、已填写的翻译内容、Source 表头值、Source 下的代码（资产位置信息）
    - [ ] 生成逻辑优先判定已有 Source Tag 中是否有合适的标签；有则直接沿用，无则生成新 Tag
  - [ ] [AI-A-082] 并发执行：每行单独发起 AI 请求，与翻译批量填充采用相同并发控制策略
    - [ ] 支持限流并发请求，默认可并发处理多个空 Tag 单元格
    - [ ] 遇到 429 / quota exceeded 时解析 retry 提示，等待后重试，并将后续请求降为单并发
  - [ ] [AI-A-083] 支持选中多个 Tag 单元格后点击 AI 生成，仅对选中的空 Tag 单元格执行生成
    - [ ] 选区内已有 Source Tag 默认不覆盖；后续如需要覆盖，应另设明确开关
    - [ ] 批量写入后的单元格标记项目状态为未保存
  - [ ] [AI-A-084] 未选中任何 Tag 单元格时，点击 AI 建议/生成按钮仅生成翻译内容，不影响 Tag
    - [ ] 保持现有 AI 翻译建议行为不变：无选中或选中翻译单元格时，只处理翻译内容
    - [ ] Tag 生成按钮与翻译生成按钮在 UI 上分离，各自独立触发
- [x] [AI-A-090] AI 设置支持多模型并发与失败转发 #feature #P1.5
  - [x] [AI-A-091] AI 设置 TAB 中的模型/接口支持多选
    - [ ] 3 个 AI 设置 TAB（OpenAI 兼容 / 其他兼容 / 单独 Provider）中的模型或接口卡片支持点击选中，再次点击取消选中
    - [ ] 选中的模型/接口保存到 AiSettings 或项目状态，持久化到 localStorage
    - [ ] 视觉反馈：选中状态有清晰标识（如边框高亮、勾选标记），未选中保持常态
  - [x] [AI-A-092] 多选模型后的并发执行与 source 分配策略
    - [ ] 启动 AI 翻译任务时，将待翻译的 source 列表并发分配给所有选中的模型接口执行
    - [ ] 分配原则：同一个 source 优先不分配给不同接口（即一个 source 的所有目标语言单元格尽量由同一模型处理）
    - [ ] 并发优先例外：当选中的 source 数量 N 大于可用模型数量 M（N > M）时，允许一个 source 被拆分到多个模型，以最大化并发吞吐量
    - [ ] 只要选中的 source 数量大于模型数量，就优先按 source 数量均分或轮询分配，确保负载均衡
  - [x] [AI-A-093] 单接口失败时的 prompt 转发与容错
    - [ ] 某个模型接口返回 failed（非降速/非取消）时，将该失败的 prompt 转发到另一个当前可用的选中接口重新执行
    - [ ] 转发时不再遵循 source 分配原则，以完成翻译为优先
    - [ ] 单个接口的失败不造成整个 AI 任务终止；任务继续由其他接口处理剩余 source
    - [ ] 记录失败与转发事件到诊断日志，记录失败接口、目标接口、source 长度，不记录 API key 与译文正文
  - [x] [AI-A-094] 多模型并发任务的手动终止
    - [ ] 保留并兼容现有手动终止 AI 任务的能力（AI-A-060 / AI-A-070）
    - [ ] 手动终止时，所有正在进行的接口请求立即取消，已完成的单元格保留结果，未开始的单元格停止执行
    - [ ] 终止后进度区显示已完成/已取消数量统计，红色日志提示"任务已手动停止"
  - [ ] [AI-A-095] 多模型并发场景下的降速处理（待设计）
    - [ ] 多模型同时遭遇 rate limit / throttling 时的降级策略待定
    - [ ] 需考虑：全局并发降速、单模型独立降速、失败转发时降速模型的避让逻辑


### BATCH-A：轻量批处理

- [x] [BATCH-A-000] 实现批量查找与替换 #feature #P1
  - [x] [BATCH-A-001] 输入 Find 文本
  - [x] [BATCH-A-002] 输入 Replace 文本
  - [x] [BATCH-A-003] 选择作用范围
    - [x] 当前语言
    - [x] 所有语言
    - [x] source
    - [x] tag
  - [x] [BATCH-A-004] 显示匹配数量
  - [x] [BATCH-A-005] 应用替换后标记 changed

### BATCH-B：矩阵多选与批量填写

- [x] [BATCH-B-000] 实现类似 Excel 的矩阵多选与批量编辑 #feature #P1
  - [x] [BATCH-B-001] 按住 `Shift` 并点击鼠标左键时，可选中多个单元格
    - [x] 多选状态有清晰、低噪声的视觉反馈
    - [x] 点击未选中的其他位置时，退出原多选状态并切换当前单元格
  - [x] [BATCH-B-002] 支持对已选单元格批量复制和粘贴
    - [x] 复制和粘贴行为参考 Excel 的矩阵操作方式
    - [x] 粘贴后将实际发生变化的单元格标记为 changed
  - [x] [BATCH-B-003] 支持对已选单元格批量填写相同内容
    - [x] 在多选范围内任一单元格输入内容后，按 `Enter` 或 `Tab` 将相同内容填写到全部已选单元格
    - [x] 在多选范围内任一单元格输入内容后，点击其他位置时只提交当前编辑单元格，不批量填写
    - [x] 批量填写后将实际发生变化的单元格标记为 changed
  - [x] [BATCH-B-004] tag 单元格支持相同的多选、批量复制、批量粘贴和批量填写行为
    - [x] tag 批量修改后保持 entry 级共享语义
    - [x] tag 批量修改后标记项目状态为未保存
  - [x] [BATCH-B-005] 支持矩阵编辑撤销与重做
    - [x] `Ctrl/Cmd+Z` 撤销已提交的单元格、批量填写、批量粘贴、Source Tag 和 Word Tag 修改
    - [x] `Ctrl/Cmd+Shift+Z` 重做上述撤销操作
    - [x] 正在输入但尚未提交的译文草稿保留浏览器文本框自身的撤销行为
    - [x] 打开或导入新项目后清空上一项目的撤销/重做历史
- [ ] [BATCH-B-010] 点击矩阵单元格以外的位置时取消当前单元格选择 #ux #P1
  - [x] [BATCH-B-011] 点击空白表头、矩阵外空白区域或非单元格 UI 时，清空当前单元格 selection 与多选 selection
  - [x] [BATCH-B-012] 取消选择后，详情编辑器进入未选择状态
  - [ ] [BATCH-B-013] 取消选择后，AI 翻译/生成按钮进入“无单元格选中”的批量空单元格模式

### QA-A：Phase 1（v0.1）验证

- [ ] [QA-A-000] 建立 Phase 1（v0.1）验证流程 #qa #P0
  - [x] [QA-A-001] 准备 PO/POT/CSV fixtures
  - [x] [QA-A-002] 测试多 PO 合并为矩阵
  - [x] [QA-A-003] 测试编辑单元格并保存回 PO
  - [x] [QA-A-004] 测试编辑单元格并保存回 CSV
  - [ ] [QA-A-005] 测试保存和重新打开项目 JSON
  - [x] [QA-A-006] 测试 tag 搜索和筛选
  - [ ] [QA-A-007] 测试 changed 筛选和保存后清除
    - [x] 浏览器源文件写入会请求 `readwrite` 权限并回读校验；权限拒绝或校验失败时抛出明确错误
  - [x] [QA-A-008] 测试统计数据正确
  - [x] [QA-A-009] 测试 PO 元数据保真
    - [x] 保存后 plural、comments、references、flags、previous source 和 obsolete entries 不丢失
    - [x] 保存后 entry 顺序稳定
  - [x] [QA-A-010] 测试 `.pot` 不被主保存流程覆盖
  - [ ] [QA-A-011] 完成桌面 UI 自动化验收 #blocked
    - [ ] 当前 Codex 内置 Browser 安全策略阻止访问本地预览地址，需在允许 localhost 的环境中补测

## Phase 1.5：工作流与状态优化

### EDIT-A：单元格编辑状态追踪 #epic #P1.5

- [x] [EDIT-A-000] 实现单元格“从未修改”状态追踪与持久化 #feature #P1.5
  - [x] [EDIT-A-001] 在项目 JSON 文件中持久化每个语言单元格的编辑历史/状态（已编辑过 vs 从未编辑过）
  - [x] [EDIT-A-002] 首次导入新 PO 时，所有翻译单元格默认为“从未修改”状态
  - [x] [EDIT-A-003] 单元格在实际发生编辑后，自动且永久从项目 JSON 中移除“从未修改”状态，并标记为已编辑过
- [x] [EDIT-A-010] 实现“从未修改”状态的视觉呈现与详情显示 #ui #P1.5
  - [x] [EDIT-A-011] 矩阵单元格上以类似 word tag 的轻量角标/标记呈现“从未修改”状态（但不作为 word tag 处理）
  - [x] [EDIT-A-012] 在详情侧栏/编辑区中，于字段名称右侧以特殊样式显示“从未修改”状态
  - [x] [EDIT-A-013] 当单元格被实际编辑后，自动删除该角标和详情页中的状态显示
- [x] [EDIT-A-020] 重构“修改状态”筛选功能 #feature #P1.5
  - [x] [EDIT-A-021] 将原 “changed” (已修改) 筛选重构为 “修改状态” 筛选
  - [x] [EDIT-A-022] 筛选器提供多选下拉菜单，包含：`从未修改`、`已修改` (当前会话有未保存修改)、`未修改` (当前会话无未保存修改)
  - [x] [EDIT-A-023] 默认选项为全选 (全部勾选)

### EDIT-B：外部 PO 变更检测与"新增"状态 #epic #P1.5

- [ ] [EDIT-B-000] 实现外部 PO 文件变更检测与"新增"词条标记 #feature #P1.5
  - [ ] [EDIT-B-001] 项目打开时检测 PO 文件外部更新
    - [ ] 对比上一次关闭时记录的 PO 文件状态（如 hash、modified time、或条目级指纹）与当前磁盘上 PO 文件的实际内容
    - [ ] 识别出新增或变更的词条：包括全新 source（`msgctxt + msgid + msgid_plural` 组合）、同一 source 的新增语言译文、以及已有译文的 source 其译文内容被外部修改
    - [ ] 游戏引擎或其他工具在外部修改 PO 文件后，Lingrid 重新打开项目时应能识别这些变更
  - [ ] [EDIT-B-002] 运行时外部修改检测
    - [ ] 项目保持打开状态时，若 PO 文件在磁盘上被外部修改，应能识别出新增/变更的词条
    - [ ] 可通过文件系统监听、定时轮询、或保存前/聚焦时检测等方式实现
  - [ ] [EDIT-B-003] "新增"词条的视觉标记
    - [ ] 被识别为新增的词条在矩阵中以绿色标点/标记显示
    - [ ] 绿色标记应轻量、低噪声，不干扰正常编辑
  - [ ] [EDIT-B-004] "修改状态"筛选增加"新增"选项
    - [ ] 在 EDIT-A-020 重构后的"修改状态"筛选下拉菜单中，增加"新增"选项
    - [ ] "新增"与"已修改"（当前会话用户手动修改未保存）互斥：同一词条不可能同时标记为新增和已修改
    - [ ] 用户手动编辑一个被标记为新增的词条后，该词条从"新增"状态转为"已修改"状态
  - [ ] [EDIT-B-006] **明确区分"新增"与"从未修改"**
    - [ ] "新增"（EDIT-B）是**外部 PO 文件变更检测**的结果：表示"相对于 Lingrid 上一次已知状态，外部世界新增/修改了词条"。它的触发源是**外部文件变化**（游戏引擎、其他编辑器、Git pull 等）。
    - [ ] "从未修改"（EDIT-A）是**用户在 Lingrid 内的编辑历史追踪**：表示"用户自导入以来是否在这个单元格上做过任何手动编辑"。它的触发源是**用户行为**，一旦编辑过就永久标记为"已编辑过"。
    - [ ] 两者**概念正交、可以同时存在**：一个词条完全可以同时是"外部新增的"（新增）且"用户从未在 Lingrid 中编辑过"（从未修改）。
    - [ ] 两者**视觉标记独立**："新增"使用绿色标点（EDIT-B-003），"从未修改"使用独立角标（EDIT-A-011），不得混用同一视觉元素。
    - [ ] 两者**筛选逻辑独立**："修改状态"筛选（EDIT-A-022）中的"从未修改"与"已修改"/"未修改"是用户编辑历史维度；"新增"（EDIT-B-004）是外部变更维度。实现时不得将"新增"词条错误归类为"从未修改"或"已修改"。
    - [ ] 两者**持久化位置独立**："从未修改"状态随单元格编辑历史持久化（EDIT-A-001），"新增"状态随外部变更快照持久化（EDIT-B-005）。

### PERF-A：矩阵大工程性能优化 #epic #P1.5

- [x] [PERF-A-000] 实现矩阵视图的性能重构 #feature #P1.5
  - [x] [PERF-A-001] 引入虚拟滚动（Virtual Scroll / Windowing）机制，只渲染可视区域内的行，以**解决打开数千条翻译的大工程时，DOM 节点数过载导致的滚动和布局卡顿问题**。
    - [x] 确保多选状态完全保存在 JavaScript 内存中（非 DOM 绑定），以保证跨视口多选（Shift+Click）和复制/粘贴能正常执行
    - [ ] 确保键盘导航（使用 `Enter` / `Tab` 移动到屏幕外的未渲染行）能配合虚拟列表 API（如 `scrollToItem`）自动滚动对齐，待目标单元格 DOM 挂载后再安全执行聚焦（`.focus()`）
  - [ ] [PERF-A-002] 实现输入框状态下放（Local State），用户打字时由单元格局部状态管理，失焦（onBlur）、回车或 Tab 时再同步至全局，以**避免打字时每一次按键都触发 App 顶层组件全量重渲染导致的输入卡顿**。
  - [ ] [PERF-A-003] 将行和单元格拆分为独立的 memo 组件（如 `MatrixRow`, `MatrixCell`），结合 `useCallback` 稳定回调引用，以**阻止选中或更新单个单元格时，让其他未发生变化的数千个单元格进行无谓的 Virtual DOM Diff 计算**。

### FILE-B：隐藏式项目文件与文件夹一站式加载 #epic #P1.5

- [x] [FILE-B-000] 隐藏式项目管理与合并授权自动加载 #feature #P1.5
  - [x] [FILE-B-001] 项目配置文件改名/重构为隐藏文件样式（如 `.lingrid.json`，存储于目标翻译文件夹中）
  - [x] [FILE-B-002] 合并文件夹选择与目录授权：加载项目时直接要求选择并一次性以 `readwrite` 权限授权目标项目文件夹，应用自动在根目录下搜寻并读取 `.lingrid.json` 配置文件，匹配成功即直接载入项目
  - [x] [FILE-B-003] 新建项目或保存项目时，在目标已授权目录根节点下自动静默写入/更新 `.lingrid.json` 配置文件
  - [x] [FILE-B-004] 保留完整的目录授权状态与句柄引用，以便在快速打开历史（已有项目）时能够自动重用句柄或引导顺畅授权

### FILE-C：最近项目历史记录列表 #epic #P1.5

- [x] [FILE-C-000] 基于 localStorage 的已知项目快速访问 #feature #P1.5
  - [x] [FILE-C-001] 在 `localStorage` 中记录已打开项目的历史工程列表
    - [x] 记录项目路径（或文件夹名称）、上次访问时间
    - [x] 每次成功打开项目时更新该记录，将最近访问的项目置顶
    - [x] 历史列表上限待定（建议 10–20 条），超出时淘汰最旧的记录
  - [x] [FILE-C-002] "打开项目"按钮改为 split button（主按钮 + 下拉箭头）
    - [x] 点击主按钮（左侧"打开项目"文字区域）→ 保持现有行为，弹出文件夹/项目选择器
    - [x] 点击右侧下拉箭头 → 展开最近项目下拉菜单
    - [x] 下拉菜单中列出最近打开过的项目记录，每条显示文件夹名称、路径摘要、上次访问时间
    - [x] 点击下拉菜单中的某条记录 → 直接打开对应项目，不再弹出选择器
    - [x] 下拉菜单支持点击外部区域自动收起
  - [x] [FILE-C-003] 最近项目列表的交互与边界处理
    - [x] 支持单条移除：hover 某条记录时显示移除按钮，点击后从 localStorage 删除该条历史
    - [x] 支持清空全部历史：列表底部提供"清空历史"入口，点击后确认再清除
    - [x] 空状态：当没有历史记录时，下拉菜单显示"暂无最近项目"提示
    - [x] 失效项目处理：若记录中的项目路径已不存在或不可访问，打开时提示用户并询问是否从列表中移除该记录
    - [x] 浏览器版与桌面版共用同一套 localStorage 历史记录格式，但路径语义各自兼容（浏览器存目录句柄标识或路径，桌面版存绝对路径）

## Phase 2：品牌网站与产品落地页 #P2

### SITE-A：Lingrid 介绍网站（Marketing Site / Landing Page）

- [x] [SITE-A-000] 搭建独立介绍网站 #epic #P2
  - [x] [SITE-A-001] 创建 `website/` 目录作为静态站点源码根目录
    - [x] 使用纯静态 HTML + CSS + JS，不引入额外构建工具，保持轻量可维护
    - [x] 视觉风格沿用 Lingrid 品牌：蓝紫主色 `#635BFF`、深色背景 `#1F1742`、现代极简、参考 Linear 气质
    - [x] 响应式布局，适配桌面端与移动端
  - [x] [SITE-A-002] 网站核心区块
    - [x] 7 个卖点纵向平铺：矩阵编辑、导入合并、PO 元数据保真、本地优先、AI 建议、标签系统、批量编辑
    - [x] 每个卖点包含编号、标题、描述和 CSS 动画演示面板
    - [x] 演示面板 hover 时触发动画，展示该特性的动态效果
    - [x] 演示内容支持多语言切换（中文/英文）
    - [x] Hero 区保留：产品名称、一句话定位、双 CTA 按钮
    - [x] 使用方式区：Web 浏览器版与 Electron 桌面版
    - [x] 技术亮点区：本地优先、PO 元数据保真、Obsidian 风格标签、批量查找替换、撤销重做
    - [x] 文档与社区入口：链接到 README、GitHub 仓库、问题反馈（Issues）
    - [x] Footer：版权、GitHub 链接、许可证信息
  - [x] [SITE-A-003] 品牌资产复用
    - [x] 网站 favicon 复用 `public/favicon.ico` 与 `public/apple-touch-icon.png`
    - [x] 品牌图标复用 `assets/icon-*.png` 系列
    - [x] 网站 manifest / theme-color 与主应用保持一致 `#1F1742`
  - [x] [SITE-A-004] 多语言支持（网站界面）
    - [x] 网站提供英文（默认）与简体中文两种语言切换
    - [x] 语言切换使用轻量按钮组，不引入复杂 i18n 框架；内容以静态文案方式维护
  - [x] [SITE-A-005] SEO 与分享优化
    - [x] 每个语言版本包含独立的 `<title>`、`<meta name="description">`、Open Graph 标签
    - [x] 提供 `og:image` 使用品牌图标或网站截图

### SITE-B：网站构建与部署

- [x] [SITE-B-000] 集成网站到现有构建与部署流程 #epic #P2
  - [x] [SITE-B-001] 保持现有应用构建不变：`npm run build` 仍输出应用到 `dist/`
  - [x] [SITE-B-002] 网站构建脚本
    - [x] 新增 `npm run build:site`：将 `website/` 内容处理并输出到 `dist-site/` 或合并到 `dist/`
    - [x] 网站构建流程复制必要品牌资产（favicon、图标）到输出目录
  - [x] [SITE-B-003] GitHub Actions 部署策略（二选一或组合）
    - [x] 方案 A：应用与网站共存——`dist/` 根目录放网站入口，`dist/app/` 子目录放应用；Vite 应用 base 改为 `/lingrid/app/`，网站首页提供 "Launch App" 入口跳转
    - [ ] 方案 B：独立分支/仓库部署——网站单独部署到 `ddonlien.github.io` 根域名，应用保持 `/lingrid/` 子路径不变
    - [x] 选定方案后更新 `.github/workflows/deploy-pages.yml` 和 `ts/vite.config.ts`
  - [x] [SITE-B-004] 本地预览网站
    - [x] 新增 `npm run dev:site`：使用轻量静态服务器（如 `npx serve website/` 或 Vite 的 `publicDir` 模式）本地预览网站

### SITE-C：网站验收标准

- [x] [SITE-C-000] 网站质量验收 #qa #P2
  - [x] [SITE-C-001] 网站在桌面端（Chrome、Firefox、Safari、Edge）正常显示，无布局错位
  - [x] [SITE-C-002] 网站在移动端（iOS Safari、Android Chrome）正常显示，触控友好
  - [x] [SITE-C-003] 所有 CTA 按钮链接有效：在线试用指向应用地址、GitHub 指向仓库、下载指向 Release 页
  - [x] [SITE-C-004] 语言切换功能正常，切换后文案、标题、OG 标签对应更新
  - [ ] [SITE-C-005] Lighthouse 性能评分 ≥ 80，可访问性评分 ≥ 90
  - [x] [SITE-C-006] 构建与部署流程通过 GitHub Actions 验证

## 阶段 2：后续 Backlog

### BACK-A：格式与工作流扩展

- [ ] [BACK-A-001] 支持 Excel 导入导出 #P2
- [ ] [BACK-A-002] 支持术语库 #P2
- [x] [BACK-A-009] 完成 Electron 桌面封装与安装包发布 #P2
  - [x] 定义桌面安装包构建命令：`npm run package:electron` 与 `npm run dist:electron`
  - [x] 验证桌面文件对话框、受控读写和项目恢复：已通过 Electron main/preload 受控 API 编译与 unpacked 应用打包验证，实际交互可用 `npm run dev:electron` 或 `release/mac-arm64/Lingrid.app` 复测
  - [x] 定义桌面版本发布流程：先运行 `npm test`、`npm run build`，再运行 `npm run dist:electron` 生成 `release/` 产物
  - [x] 补充应用图标：原始 1254x1254 源图存于 `assets/icon-source.png`，`assets/icon-{16,32,48,64,128,180,192,256,512,1024}.png` 覆盖常用尺寸，`package.json` 的 `build.icon` 指向 1024 版本，electron-builder 自动为各平台生成 .icns / .ico
  - [ ] 补充 Developer ID 证书与 notarization 配置（macOS 正式发布前）
- [ ] [BACK-A-003] 支持翻译记忆 #P3
- [ ] [BACK-A-004] 支持更复杂 QA 检查 #P3
- [ ] [BACK-A-005] 支持 plural forms 高级编辑 #P3
- [ ] [BACK-A-006] 支持 Git diff / 外部修改对比 #P3
- [ ] [BACK-A-007] 支持 JSON / i18next / XLIFF 等更多格式 #P3
- [ ] [BACK-A-008] 支持批量 AI 建议 #P2

### BRAND-A：品牌与图标资产

- [x] [BRAND-A-001] 落地应用图标与浏览器 favicon #brand #P1
  - [x] 保留原始源图（1254x1254 PNG）于 `assets/icon-source.png`，作为以后重新生成所有尺寸的 source of truth
  - [x] 落地常用 PNG 尺寸到 `assets/`，覆盖 16 / 32 / 48 / 64 / 128 / 180 / 192 / 256 / 512 / 1024
  - [x] 浏览器 favicon 资源放到 `public/`，让 Vite 原样 copy 到 dist/
  - [x] 拼合多尺寸 `public/favicon.ico`（含 16 / 32 / 48 / 64 / 128 / 256）
  - [x] 提供 `public/apple-touch-icon.png`（180x180）和 `public/site.webmanifest`
  - [x] `index.html` 引入 favicon / apple-touch-icon / manifest / theme-color / description
  - [x] `package.json` 的 `build.icon` 指向 `assets/icon-1024.png`，electron-builder 自动生成 macOS .icns 与 Windows .ico
  - [x] README 与 DESIGN 引用图标资源位置
  - [ ] 替换未来 DESIGN 改版时的旧 logo；旧 logo 归档到 `archive/brand/`

### RELEASE-A：浏览器版本发布

- [x] [RELEASE-A-001] 使用 GitHub Actions 部署 GitHub Pages #P0
  - [x] 推送 `main` 时执行测试与构建
  - [x] 使用 Pages artifact 发布 `dist/`
  - [x] Vite 在 GitHub Actions 中使用 `/lingrid/` 子路径

## 持续约束

### X-A：AI 可追踪协作

- [ ] [X-A-000] 保持 AI 协作可追踪 #qa #P0
  - [ ] [X-A-001] 每次任务开始前执行 `git pull`
  - [ ] [X-A-002] 每次任务开始前检查 `REQUIREMENTS.md` 是否已有匹配需求
  - [ ] [X-A-003] 每次任务执行创建一条 `agent-log/` 日志
  - [ ] [X-A-004] 每次任务完成后更新已完成需求的 checkbox
  - [ ] [X-A-005] 日志包含用户原始 prompt、启动运行时分支和版本、开始时间、结束时间、对话与行动记录、需求更新、设计更新和验证记录

### X-B：完成定义

- [ ] [X-B-000] 满足任务完成定义 #qa #P0
  - [ ] [X-B-001] 用户请求的行为、内容或文档已经完成
  - [ ] [X-B-002] UI、API、文档或流程可以用于目标场景
  - [ ] [X-B-003] 测试、构建或检查通过；无法通过时记录已知问题
  - [ ] [X-B-004] `README.md`、`REQUIREMENTS.md`、相关 `DESIGN.md` 和 `agent-log/` 已更新
