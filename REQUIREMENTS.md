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
    - [x] 保存基础视图状态
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
    - [x] 浏览器开发预览不伪装成主保存下载副本；支持 File System Access API 时保留句柄直接覆盖，否则提示使用 Electron
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

### TAG-A：Tag 与标记

- [x] [TAG-A-000] 实现 entry 级 tag 系统 #feature #P0
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
    - [x] 支持多选 tag；条目命中任一所选 tag 时显示
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

### QA-A：Phase 1（v0.1）验证

- [ ] [QA-A-000] 建立 Phase 1（v0.1）验证流程 #qa #P0
  - [x] [QA-A-001] 准备 PO/POT/CSV fixtures
  - [x] [QA-A-002] 测试多 PO 合并为矩阵
  - [x] [QA-A-003] 测试编辑单元格并保存回 PO
  - [x] [QA-A-004] 测试编辑单元格并保存回 CSV
  - [ ] [QA-A-005] 测试保存和重新打开项目 JSON
  - [x] [QA-A-006] 测试 tag 搜索和筛选
  - [ ] [QA-A-007] 测试 changed 筛选和保存后清除
  - [x] [QA-A-008] 测试统计数据正确
  - [x] [QA-A-009] 测试 PO 元数据保真
    - [x] 保存后 plural、comments、references、flags、previous source 和 obsolete entries 不丢失
    - [x] 保存后 entry 顺序稳定
  - [x] [QA-A-010] 测试 `.pot` 不被主保存流程覆盖
  - [ ] [QA-A-011] 完成桌面 UI 自动化验收 #blocked
    - [ ] 当前 Codex 内置 Browser 安全策略阻止访问本地预览地址，需在允许 localhost 的环境中补测

## 阶段 2：后续 Backlog

### BACK-A：格式与工作流扩展

- [ ] [BACK-A-001] 支持 Excel 导入导出 #P2
- [ ] [BACK-A-002] 支持术语库 #P2
- [ ] [BACK-A-009] 完成 Electron 桌面封装与安装包发布 #P2
  - [ ] 定义桌面安装包构建命令
  - [ ] 验证桌面文件对话框、受控读写和项目恢复
  - [ ] 定义桌面版本发布流程
- [ ] [BACK-A-003] 支持翻译记忆 #P3
- [ ] [BACK-A-004] 支持更复杂 QA 检查 #P3
- [ ] [BACK-A-005] 支持 plural forms 高级编辑 #P3
- [ ] [BACK-A-006] 支持 Git diff / 外部修改对比 #P3
- [ ] [BACK-A-007] 支持 JSON / i18next / XLIFF 等更多格式 #P3
- [ ] [BACK-A-008] 支持批量 AI 建议 #P2

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
