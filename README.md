# Lingrid 灵译

Lingrid 灵译是一个轻量、现代、本地优先的 PO / CSV 多语言并排编辑器。

它的核心目标不是复制传统单语言 PO 编辑器，而是把多个语言文件导入同一个窗口，用矩阵方式同时查看、搜索、编辑和保存一个 source 对应的多语言译文。

```text
source                zh-CN        en              ja             tag
Start Game            开始游戏      Start Game      ゲーム開始      #ui
Options               选项          Options         オプション      #review
```

## 项目概述

- 项目名称：Lingrid 灵译
- 一句话简介：轻量现代的 PO / CSV 多语言矩阵编辑器。
- 解决的问题：传统 PO 编辑器通常以单文件、单语言为主；Lingrid 优先解决游戏和软件本地化中“一个源文本对应多语言译文，需要并排查看和编辑”的问题。
- 目标用户：独立游戏开发者、小型软件团队、本地化负责人、外包翻译协作者、需要管理多语言 PO/CSV 文件的人。
- 当前状态：Phase 1（v0.1）可运行原型。已完成 P0 编辑器与 P1 轻量 AI 建议、批量替换。

## Phase 1（v0.1）目标能力

- 支持 `.po` 和 `.csv` 作为可编辑原文件输入。
- 支持 `.pot` 作为只读 source/template 输入。
- 多次追加导入文件，不必一次性导入完整项目。
- 自动合并为多语言矩阵视图。
- 支持调整语言列顺序，并为导入后的语言列设置显示名称。
- 直接在矩阵中编辑译文。
- 选中单元格后，在类似 Poedit 的详情编辑区进行更大的 1 对 1 编辑。
- 主保存按钮直接把修改写回原 `.po` / `.csv` 文件。
- 单独保存项目 JSON，用于记录打开的文件、语言列顺序、tag、筛选状态和 CSV 映射。
- 支持保存项目、项目另存、当前 PO 另存。
- 支持 source、任意语言译文和 tag 搜索。
- 支持完成情况、changed 和 tag 筛选。
- 支持 Obsidian 风格 tag，例如 `#todo`、`#ui`、`#review`。
- 支持简单统计：条目数、各语言完成率、未翻译数量、tag 数量、changed 数量。
- 支持简单 AI / 翻译 API 建议：配置 endpoint、key、model、prompt 后，对当前单元格请求翻译建议。
- 支持简单批量查找与替换。

## 文件处理边界

- Phase 1（v0.1）的可编辑原文件输入为 `.po` 和 `.csv`，允许直接保存回源文件。
- `.pot` 只作为 source/template 输入，默认不写入译文，不属于可编辑原文件。
- PO 在内部不能简化为普通表格。读取和保存时需要保留 `msgctxt`、`msgid`、`msgid_plural`、`msgstr[n]`、comments、references、flags、previous source 和 obsolete entries 等信息。
- 矩阵只是 PO 文档的 UI 投影。保存时尽量保持原始 entry 顺序和稳定格式，避免制造无意义 diff。
- CSV 不尝试兼容所有翻译表结构。导入时由用户映射 source 列、语言列和可选 id/key 列。
- 项目 JSON 只保存项目状态，不作为翻译正文的主数据库。

## 非目标范围

Phase 1（v0.1）暂不做：

- Excel 导入导出。
- 术语库。
- 翻译记忆。
- 多人协作。
- Git 集成。
- 复杂 QA 系统。
- 复杂项目管理。
- Crowdin / Lokalise / Weblate 级平台能力。

## 技术方向

- TypeScript 优先。
- 后续使用 Electron 打包桌面应用。
- UI 使用 React、shadcn/ui、Tailwind CSS。
- 视觉参考 Linear：现代、克制、高密度、低噪声。
- 核心逻辑与 UI 解耦：PO/CSV adapter、矩阵合并、保存、搜索筛选、统计、tag、AI 建议应尽量放在可测试的 core 层。
- Renderer 不直接访问 Node 文件系统；文件对话框、源文件读写和 API key 安全存储通过 Electron main/preload 暴露的受控 API 完成。

## 建议目录结构

```text
.
├── AGENTS.md
├── README.md
├── REQUIREMENTS.md
├── DESIGN.md
├── agent-log/
├── fixtures/
├── src/
│   ├── main/
│   ├── preload/
│   ├── renderer/
│   ├── core/
│   ├── adapters/
│   └── components/
└── tests/
```

## 快速开始

安装依赖并启动浏览器开发预览：

```bash
npm install
npm run dev
```

启动 Electron 桌面开发版本：

```bash
npm run build
npm run dev:electron
```

运行验证：

```bash
npm test
npm run build
```

当前使用 `npm`，因为本机 Node.js 20 与全局 `pnpm` 11 不兼容。Electron 安装包发布命令将在打包阶段补充。

## 文档入口

- Agent 协作规范：`AGENTS.md`
- 需求与验收追踪：`REQUIREMENTS.md`
- 视觉规范：`DESIGN.md`
- 执行日志：`agent-log/`

## 设计原则

- 并排编辑优先。
- 文件保存可靠性高于功能数量。
- 主保存按钮保存源文件，不隐藏真实文件流向。
- 项目 JSON 只保存项目状态，不替代 `.po` / `.csv`。
- 简单、轻量、本地优先。
- AI 是辅助建议，不是默认自动翻译流水线。
