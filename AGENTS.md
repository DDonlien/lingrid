# Agent 协作规范模板

本文件分为“标准内容”和“项目专用内容”。除非用户明确要求修改协作规范，否则只允许在“项目专用内容”下补充或调整，不修改标准内容。

## 标准内容

### 0. 文档缺失时先创建

- 如果当前仓库或当前子功能根目录没有 `AGENTS.md`，先阅读 `agent-template/AGENTS.md` ，并在根目录创建属于该目录自己的 `AGENTS.md` 。
- 如果没有 `REQUIREMENTS.md` ，先阅读 `agent-template/REQUIREMENTS.md` ，并在根目录属于该目录自己的`REQUIREMENTS.md` 。
- 如果没有 `DESIGN.md` ，先阅读 `agent-template/DESIGN.md` ，并在根目录属于该目录自己的 `DESIGN.md` 。
- 如果没有 `README.md`，先阅读 `agent-template/README.md` ，并在根目录属于该目录自己的 `README.md` 。
- 如果仓库内已有内容，或已经与当前agent进行过对话，基于仓库内的内容和对话的实际情况，填写上述文件，填写规则会在下文中写明。
- `AGENTS.md`、`REQUIREMENTS.md`、`DESIGN.md` 和 `README.md` 默认使用中文书写；除非用户特别说明，或术语、代码符号、专有名词本身应使用英文。
- `agent-template/` 中的 `README.md`、`REQUIREMENTS.md`、`DESIGN.md` 和 `agent-log/` 日志模板只保留演示内容；具体撰写规则统一以本 `AGENTS.md` 为准，阅读时需要注意分辨规则和示例的差异。
- 上述创建的文件的文件名必须全大写，其中AGENTS和REQUIREMENTS需要复数，即使用户临时写成小写或单数，也应该注意到该统一标准（除非用户数明确要求修改）。
- 由于本template也经由git管理，所以目录下会存在.git等相关文件，所有实际仓库在使用时，应该先删除agent-template下的git相关资产，移除其git仓库特征，避免上层仓库管理问题。

### 1. 每次任务开始前

- 确认当前分支是用户希望工作的分支；分支切换由用户手动完成，Agent 不主动切换分支。
- 如果当前目录属于 git 仓库，先执行 `git pull`，确保任务基准更新到最新。
- 如果 `git pull` 失败、发生冲突，或提示需要人工处理，停止执行并告知用户。
- 阅读用户本次原始 prompt。
- 阅读当前目录适用的 `AGENTS.md`、`README.md`、`REQUIREMENTS.md`、`DESIGN.md` 和 `agent-log/` 中的日志。日志的阅读规则如下：
  - 找到由当前agent/对话创建的最新日志。
  - 如果有任何日志比该日志更新，阅读所有更新。
  - 如果没有，则不阅读任何日志
- 检查 `REQUIREMENTS.md`，确认用户本次需求是否匹配已有需求、子需求、验收项或已标记的阻塞项。
- 如果仓库内有父级与子级 `AGENTS.md`，从父到子依次阅读；更具体目录的规则优先，但不得违反父级标准内容和用户明确要求。

### 2. 每次任务执行中

- 为每次任务执行创建一条新的执行日志，放在当前适用目录的 `agent-log/`。
- 日志命名规则：`YYYYMMDDHHMMSS-utcpN-model.md` 或 `YYYYMMDDHHMMSS-utcnN-model.md`。
- `utcpN` 表示 UTC 正偏移，`utcnN` 表示 UTC 负偏移；不要在文件名中使用 `+` 或 `-`，以确保不同系统和工具链的适配性，N由实际数字代替。
- 示例：`20260530174209-utcp8-gpt5.md`、`20260530094209-utcn8-gpt5.md`。
- 使用任务完成时间作为日志文件名中的时间；如果任务开始时先创建临时日志，交付前按完成时间重命名。
- 一次任务执行从 Agent 开始处理用户请求算起，到交付、提交、阻塞或明确暂停为止。
- 如果用户在同一次执行中补充或修正要求、引导对话，把补充 prompt 原文和时间追加到同一条日志。
- 如果上一次执行已经交付，用户提出新任务时创建新日志。
- 每条日志记录一次任务执行中的对话、行动和总结；中间过程可由 Agent 自行概括，但要足够支持后续接手。
- 每条日志开头必须包含：
  - 用户原始 prompt
  - 启动运行时的分支和版本，也就是 `git pull` 以后实际所在分支与提交版本
  - 任务开始时间
  - 任务结束时间
  - 任务结束时是否执行了提交
- 每条日志还应包含：
  - 已阅读上下文
  - 对话与行动记录
  - 完成工作
  - 更新的需求 ID
  - 更新的 README 或 DESIGN 章节
  - 验证方式
  - 备注
- 日志模板文件只保留演示内容；日志命名、必填字段、撰写规则以本 `AGENTS.md` 为准。

### 3. REQUIREMENTS.md 的维护标准

- `REQUIREMENTS.md` 使用 Obsidian 原生友好的 Markdown 格式：标题层级、缩进任务列表、稳定 ID、少量标签。
- 不使用复杂表格。
- 不使用 YAML 字段。
- 通过标题分级拆分阶段、模块和主题；阶段如何命名、是否使用 Phase、Phase 如何划分，由具体项目自行决定。
- 更频繁地通过缩进 checkbox 表达父子任务、子任务、验收项和检查点关系。
- 每个可执行需求必须有稳定 ID。
- 任务状态使用原生 Markdown checkbox：
  - `- [ ]` 表示未完成。
  - `- [x]` 表示已完成。
  - 阻塞、延后、取消在任务后追加 `#blocked`、`#deferred` 或 `#cut`。
  - 如果条目本身不适合涵盖已完成、未完成的信息，但确实需要被记录，则checkbox视作是否已读。
  - 如果条目本身既不适合记录是否已读、也不适合记录完成状态，但确实需要记录，则酌情使用有序、无序列表。
- 稳定 ID 不因排序、插入或移动而改变。
- 拆分任务时保留原 ID，并新增子 ID。
- 不静默删除需求；取消的需求保留并标记 `#cut`，附简短原因。
- 每次任务开始前，先检查 `REQUIREMENTS.md` 中是否已有匹配需求。
- 每次任务完成后，再根据本次记忆或重新检查 `REQUIREMENTS.md`，把已经完成的需求、子需求或验收项勾选为完成。
- 如果任务改变范围、状态、验收标准、优先级或阻塞条件，必须同步更新 `REQUIREMENTS.md`。
- 具体需求、验收标准、任务拆分、优先级、阻塞状态和完成状态只写入 `REQUIREMENTS.md`，不要写入 `README.md` 或 `DESIGN.md`。

### 4. README.md 的维护纪律

- `README.md` 记录系统、仓库或应用的整体说明，而不是视觉规范或具体任务清单。
- `README.md` 应说明项目是什么、解决什么问题、当前能力、目录结构、运行方式、文档入口和适用边界，可以视作对外的项目介绍文档，便于不了解项目的人用于第一时间了解项目。
- 当系统范围、仓库结构、应用能力、运行方式或用户入口发生变化时，同步更新 `README.md`。
- 不要把具体待办、验收项和任务状态写进 `README.md`；这些内容写入 `REQUIREMENTS.md`。

### 5. DESIGN 维护纪律

- `DESIGN.md` 不是系统整体设计文档；它是视觉规范和界面风格文档。
- `DESIGN.md` 参考 Google Stitch / DESIGN.md 的语义：用 Markdown 描述 AI 和开发者可执行的视觉设计系统，包括颜色、字体、间距、布局、组件样式、视觉语气、响应式规则和可访问性约束。
- 如果该文件在首次创建时仓库中已有内容、或者已有agent对话记录，则应该根据已有内容总结并创建符合实际情况的文件。
- `DESIGN.md` 用于让 AI 在实现 UI 时不猜测视觉风格；它不记录系统架构、数据模型、产品路线图或任务列表。
- 当品牌视觉、UI 风格、设计 token、组件外观、布局原则或可访问性规则变化时，同步更新 `DESIGN.md`。
- 如果项目没有 UI 或视觉界面，`DESIGN.md` 可只记录“不适用”和原因。
- 如果仓库中已有旧名 `DESIGNS.md` 且内容其实是系统/架构说明，后续整理时应迁移：系统/仓库/应用说明进入 `README.md`，视觉规范进入 `DESIGN.md`，具体需求进入 `REQUIREMENTS.md`。
- 如果项目的设计风格发生了大幅度、颠覆性的改变，应该将老版本的内容创建为一个DESIGN-yyyymmddhhmmss.md的文件，保存到根目录/archive/design/的地址，如果改地址不存在，创建。
- 针对更复杂的、存在“内容”和“系统”的项目，应当在agent-log下再创建2个文件夹，分别为agent-log/system和agent-log/content。每次实际执行任务时，应该针对性的记录log而非总是都记录。内容和系统改动任务的分类由ai自行判断，通常来说，web系统的数据、游戏的装备数值和技能等属于内容更新。

### 6. 父子文档关系

- 如果仓库内有明显的多个子功能、子应用、子游戏、工具包或独立模块，应在根目录和每一层子功能根目录创建一套文档：
  - `AGENTS.md`
  - `README.md`
  - `REQUIREMENTS.md`
  - `DESIGN.md`
  - `agent-log/`
- 根目录 `README.md` 描述全局目标、共享约束、目录索引和跨子功能关系。
- 子功能 `README.md` 只描述该子功能独有的用途、入口、命令和边界，避免复制父级已有内容。
- 子功能 `DESIGN.md` 只描述该子功能独有视觉规范；如果沿用父级视觉规范，写明继承关系即可。
- 父级 `AGENTS.md` 必须索引子功能目录，并说明每个子功能的文档入口。
- 当一个任务只影响某个子功能时，优先更新该子功能的 `README.md`、`REQUIREMENTS.md`、`DESIGN.md` 和 `agent-log/`；如影响全局规则或跨子功能关系，再同步更新父级文档。
- 如果仓库中存在 `reference/`、`references/`、`third_party/`、`vendor/`、`examples/`、`project/` 等目录，并且其中嵌套了外部 GitHub 仓库、参考项目、示例项目或只读资料，这些目录不需要创建本规范涉及的文档；更新 `README.md`、`REQUIREMENTS.md`、`DESIGN.md` 和 `agent-log/` 时也不把这些外部参考仓库纳入项目自身范围，除非用户明确要求整理或改造这些目录。

### 7. 工程默认规则

- 优先遵循仓库已有技术栈、目录结构、命名和风格。
- 保持改动聚焦在用户请求范围内。
- 不覆盖用户改动，不回滚无关文件。
- 行为、共享逻辑或用户可见流程发生变化时，补充或更新测试。
- 交付前运行相关验证命令；如果无法运行，说明原因并记录剩余风险。
- 搜索优先使用 `rg`。
- 手工编辑文件优先使用补丁方式，避免产生无关格式化或大范围重写。

## 项目专用内容

### 项目概况

- 项目名称：Lingrid 灵译
- 产品简介：轻量、现代、本地优先的 PO / CSV 多语言并排编辑器。核心界面以矩阵方式同时查看和编辑一个 source 对应的多语言译文。
- 主要用户：独立游戏开发者、小型软件团队、本地化外包协作者、需要在 PO 与 CSV 之间整理翻译内容的开发者。
- 当前阶段：Phase 1（v0.1）可运行原型；已实现 `.po` / `.csv` 原文件输入、矩阵编辑、直接保存回源文件、项目 JSON 状态保存，以及 P1 AI 建议和批量替换。

### 技术栈与命令

- 技术栈：TypeScript 优先；后续使用 Electron 打包桌面应用；UI 使用 React、shadcn/ui、Tailwind CSS，并参考 Linear 的现代化产品设计气质。
- 开发命令：`npm run dev`；Electron 桌面开发使用 `npm run dev:electron`。
- 测试命令：`npm test`。
- 构建命令：`npm run build`。
- 浏览器版本发布：推送 `main` 后由 GitHub Actions 自动部署 GitHub Pages。
- Electron 安装包发布：Phase 2（P2）封装阶段再定义。

### 文档入口

- 项目说明：`README.md`
- 需求追踪：`REQUIREMENTS.md`
- 视觉规范：`DESIGN.md`
- 执行日志：`agent-log/`

### 目录索引

- 根目录：项目文档、配置文件和应用入口。
- `src/`：TypeScript / React / Electron 源码。
- `src/main/`：Electron main process；负责窗口、系统菜单、原生文件对话框、安全文件读写和安全存储。
- `src/preload/`：Electron preload；只暴露经过定义的安全 API。
- `src/renderer/`：React UI；矩阵编辑器、详情编辑器、设置与统计界面。
- `src/core/`：与 UI 解耦的核心逻辑；PO/CSV adapter、矩阵合并、changed tracking、tag、搜索筛选、统计、批处理。
- `src/adapters/`：文件格式 adapter；Phase 1（v0.1）要求 `.po` / `.csv` 作为可编辑原文件输入，`.pot` 作为只读 source/template 输入。
- `src/components/`：shadcn/ui 派生组件和项目专用组件。
- `tests/`：核心逻辑与文件读写测试。
- `fixtures/`：PO/POT/CSV 示例文件，不放真实商业项目内容。
- `agent-log/`：AI 执行日志。

### 子功能文档入口

当前 Phase 1（v0.1）不拆分子功能文档。后续如果出现独立子应用、CLI、格式转换工具或插件系统，再为对应目录创建独立 `AGENTS.md`、`README.md`、`REQUIREMENTS.md`、`DESIGN.md` 和 `agent-log/`。

### 项目特殊约束

- 语言与命名：默认中文文档；代码、类型、字段、文件格式、API 名称使用英文。产品中文名为 `Lingrid 灵译`，英文名为 `Lingrid`。
- 产品原则：并排编辑是第一优先；文件保存可靠性高于功能数量；项目保持轻量，本地优先，不做 SaaS 化协作平台。
- Phase 1（v0.1）范围：支持 `.po` / `.csv` 作为可编辑原文件输入，支持 `.pot` 作为只读 source/template 输入；不做 Excel；不做术语库；不做复杂项目管理；不做复杂 QA；不做翻译记忆；不做 Git 集成。
- 文件原则：翻译正文以原 `.po` / `.csv` 为主，项目 JSON 只保存项目状态，例如打开的文件、语言列顺序、tag、视图状态、CSV 列映射等。不要把项目 JSON 当作主要翻译数据库。
- PO 原则：内部定位必须保留 `msgctxt`、`msgid`、`msgid_plural` 等信息；UI 中只有当 context/key 真实存在或用户启用时才显示，避免总显示空列。
- PO 保真原则：矩阵只是 PO 文档的 UI 投影。读取和保存时必须保留 plural、comments、references、flags、previous source 和 obsolete entries 等未必直接展示的结构，并尽量保持 entry 顺序和稳定格式，避免制造无意义 diff。
- POT 原则：`.pot` 只作为 source/template 使用，默认不写入译文，主保存流程不得覆盖 `.pot`。
- CSV 原则：Phase 1（v0.1）不尝试兼容所有翻译表结构；导入时通过用户映射 source 列、语言列和可选 id/key 列确定含义。
- 保存原则：主保存按钮应保存已修改的 `.po` / `.csv` 源文件；另设保存项目按钮；另设项目另存和当前 PO 另存。
- 架构限制：Renderer 不直接访问 Node 文件系统；文件读写通过 main/preload 暴露的受控 API；格式解析通过 adapter 层抽象，避免 UI 与具体格式耦合。
- AI/API 原则：Phase 1（v0.1）只做简单建议流；允许自定义 API endpoint、key、model 和 prompt；点击当前单元格生成建议，用户确认后应用；不要自动覆盖已有译文。
- 授权与引用边界：可以参考 Poedit、Lokalize、Weblate、gettext-parser、jsgettext 等开源项目的产品思路、数据模型和边界处理方式；不得直接复制不兼容许可代码或大段实现。
- 安全与隐私：API key 和翻译内容默认只在本地处理；不要写入日志；不要提交真实密钥、真实商业翻译内容或用户项目文件。
