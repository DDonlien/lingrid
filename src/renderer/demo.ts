import type { LingridProject } from "../core/types";
import { createProject } from "../core/project";

export function createDemoProject(): LingridProject {
  const project = createProject();
  project.columnOrder = ["zh-CN", "en", "ja"];
  project.columnLabels = { "zh-CN": "简体中文", en: "English", ja: "日本語" };
  project.entries = [
    ["menu.start", "Start Game", "开始游戏", "Start Game", "ゲーム開始", ["#ui"]],
    ["menu.options", "Options", "选项", "Options", "オプション", ["#ui"]],
    ["menu.continue", "Continue", "继续", "Continue", "", ["#todo", "#ui"]],
    ["menu.quit", "Quit to Desktop", "退出到桌面", "Quit to Desktop", "デスクトップに戻る", ["#ui"]],
    ["save.success", "Game saved successfully.", "游戏已保存。", "Game saved successfully.", "ゲームを保存しました。", ["#system"]],
    ["dialog.confirm", "Are you sure you want to continue?", "确定要继续吗？", "Are you sure you want to continue?", "", ["#review"]],
    ["inventory.empty", "Your inventory is empty.", "背包为空。", "Your inventory is empty.", "所持品は空です。", ["#gameplay"]],
    ["settings.language", "Language", "语言", "Language", "言語", ["#settings"]],
  ].map(([key, source, zh, en, ja, tags]) => ({
    key: `demo\u0000${key}`,
    context: String(key),
    source: String(source),
    translations: {
      "zh-CN": { value: String(zh), changed: false },
      en: { value: String(en), changed: false },
      ja: { value: String(ja), changed: false },
    },
    tags: tags as string[],
  }));
  return project;
}
