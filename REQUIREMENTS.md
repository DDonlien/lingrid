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
    - [x] 主保存与 PO/CSV 另存为都会先合并当前仍聚焦单元格的草稿，避免点击按钮时遗漏最后一次输入
    - [x] 浏览器直接覆盖多个源文件前统一预检全部待写句柄的写权限与外部修改状态，避免部分语言文件已经写入后才发现后续文件失败
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

- [ ] [BATCH-B-000] 实现类似 Excel 的矩阵多选与批量编辑 #feature #P1
  - [ ] [BATCH-B-001] 按住 `Shift` 并点击鼠标左键时，可选中多个单元格
    - [ ] 多选状态有清晰、低噪声的视觉反馈
    - [ ] 点击未选中的其他位置时，退出原多选状态并切换当前单元格
  - [ ] [BATCH-B-002] 支持对已选单元格批量复制和粘贴
    - [ ] 复制和粘贴行为参考 Excel 的矩阵操作方式
    - [ ] 粘贴后将实际发生变化的单元格标记为 changed
  - [ ] [BATCH-B-003] 支持对已选单元格批量填写相同内容
    - [ ] 在多选范围内任一单元格输入内容后，按 `Enter` 或 `Tab` 将相同内容填写到全部已选单元格
    - [ ] 在多选范围内任一单元格输入内容后，点击其他位置时只提交当前编辑单元格，不批量填写
    - [ ] 批量填写后将实际发生变化的单元格标记为 changed
  - [ ] [BATCH-B-004] tag 单元格支持相同的多选、批量复制、批量粘贴和批量填写行为
    - [ ] tag 批量修改后保持 entry 级共享语义
    - [ ] tag 批量修改后标记项目状态为未保存

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

- [ ] [EDIT-A-000] 实现单元格“从未修改”状态追踪与持久化 #feature #P1.5
  - [ ] [EDIT-A-001] 在项目 JSON 文件中持久化每个语言单元格的编辑历史/状态（已编辑过 vs 从未编辑过）
  - [ ] [EDIT-A-002] 首次导入新 PO 时，所有翻译单元格默认为“从未修改”状态
  - [ ] [EDIT-A-003] 单元格在实际发生编辑后，自动且永久从项目 JSON 中移除“从未修改”状态，并标记为已编辑过
- [ ] [EDIT-A-010] 实现“从未修改”状态的视觉呈现与详情显示 #ui #P1.5
  - [ ] [EDIT-A-011] 矩阵单元格上以类似 word tag 的轻量角标/标记呈现“从未修改”状态（但不作为 word tag 处理）
  - [ ] [EDIT-A-012] 在详情侧栏/编辑区中，于字段名称右侧以特殊样式显示“从未修改”状态
  - [ ] [EDIT-A-013] 当单元格被实际编辑后，自动删除该角标和详情页中的状态显示
- [ ] [EDIT-A-020] 重构“修改状态”筛选功能 #feature #P1.5
  - [ ] [EDIT-A-021] 将原 “changed” (已修改) 筛选重构为 “修改状态” 筛选
  - [ ] [EDIT-A-022] 筛选器提供多选下拉菜单，包含：`从未修改`、`已修改` (当前会话有未保存修改)、`未修改` (当前会话无未保存修改)
  - [ ] [EDIT-A-023] 默认选项为全选 (全部勾选)

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
