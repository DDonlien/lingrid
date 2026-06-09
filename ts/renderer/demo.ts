import type { LingridProject } from "../core/types";
import { createProject } from "../core/project";

export type DemoSourceLanguage = "zh-CN" | "en" | "ja";

type DemoLanguage = "zh-CN" | "en" | "ja" | "ko" | "ru";
type DemoText = Record<DemoLanguage, string>;
type DemoRow = { key: string; tags: string[]; targets: DemoText; source: Record<DemoSourceLanguage, string> };

const DEMO_LANGUAGE_LABELS: Record<DemoLanguage, string> = {
  "zh-CN": "简体中文",
  en: "English",
  ja: "日本語",
  ko: "한국어",
  ru: "Русский",
};

const DEMO_TRANSLATION_LANGUAGES: DemoLanguage[] = ["zh-CN", "en", "ja", "ko", "ru"];

const DEMO_ROWS: DemoRow[] = [
  {
    key: "menu.start",
    tags: ["#ui"],
    source: {
      "zh-CN": "开始游戏",
      en: "Start Game",
      ja: "ゲーム開始",
    },
    targets: {
      "zh-CN": "开始游戏",
      en: "Start Game",
      ja: "ゲーム開始",
      ko: "게임 시작",
      ru: "Начать игру",
    },
  },
  {
    key: "menu.options",
    tags: ["#ui"],
    source: {
      "zh-CN": "设置",
      en: "Options",
      ja: "設定",
    },
    targets: {
      "zh-CN": "设置",
      en: "Options",
      ja: "設定",
      ko: "설정",
      ru: "Настройки",
    },
  },
  {
    key: "menu.continue",
    tags: ["#todo", "#ui"],
    source: {
      "zh-CN": "继续冒险",
      en: "Continue",
      ja: "つづきから",
    },
    targets: {
      "zh-CN": "继续冒险",
      en: "Continue",
      ja: "つづきから",
      ko: "",
      ru: "",
    },
  },
  {
    key: "menu.quit",
    tags: ["#ui"],
    source: {
      "zh-CN": "返回桌面",
      en: "Quit to Desktop",
      ja: "ゲームを終了",
    },
    targets: {
      "zh-CN": "返回桌面",
      en: "Quit to Desktop",
      ja: "ゲームを終了",
      ko: "데스크톱으로 나가기",
      ru: "Выйти на рабочий стол",
    },
  },
  {
    key: "save.success",
    tags: ["#system"],
    source: {
      "zh-CN": "保存完成。",
      en: "Game saved successfully.",
      ja: "セーブしました。",
    },
    targets: {
      "zh-CN": "保存完成。",
      en: "Game saved successfully.",
      ja: "セーブしました。",
      ko: "게임이 저장되었습니다.",
      ru: "Игра сохранена.",
    },
  },
  {
    key: "dialog.confirm",
    tags: ["#review"],
    source: {
      "zh-CN": "继续前进吗？",
      en: "Continue?",
      ja: "先へ進みますか？",
    },
    targets: {
      "zh-CN": "继续前进吗？",
      en: "Continue?",
      ja: "先へ進みますか？",
      ko: "",
      ru: "",
    },
  },
  {
    key: "npc.arrow",
    tags: ["#npc", "#review"],
    source: {
      "zh-CN": "我以前也和你一样是个冒险者，直到我的膝盖中了一箭。",
      en: "I used to be an adventurer like you, then I took an arrow in the knee.",
      ja: "昔は君のような冒険者だったが、膝に矢を受けてしまってな。",
    },
    targets: {
      "zh-CN": "我以前也和你一样是个冒险者，直到我的膝盖中了一箭。",
      en: "I used to be an adventurer like you, then I took an arrow in the knee.",
      ja: "昔は君のような冒険者だったが、膝に矢を受けてしまってな。",
      ko: "",
      ru: "",
    },
  },
  {
    key: "inventory.empty",
    tags: ["#gameplay"],
    source: {
      "zh-CN": "背包里什么都没有。",
      en: "Your inventory is empty.",
      ja: "持ち物はありません。",
    },
    targets: {
      "zh-CN": "背包里什么都没有。",
      en: "Your inventory is empty.",
      ja: "持ち物はありません。",
      ko: "소지품이 비어 있습니다.",
      ru: "Инвентарь пуст.",
    },
  },
  {
    key: "settings.language",
    tags: ["#settings"],
    source: {
      "zh-CN": "语言",
      en: "Language",
      ja: "言語",
    },
    targets: {
      "zh-CN": "语言",
      en: "Language",
      ja: "言語",
      ko: "언어",
      ru: "Язык",
    },
  },
  {
    key: "location.enter",
    tags: ["#gameplay", "#punctuation"],
    source: {
      "zh-CN": "进入：地点",
      en: "Enter: Location",
      ja: "入る：場所",
    },
    targets: {
      "zh-CN": "进入：地点",
      en: "Enter: Location",
      ja: "入る：場所",
      ko: "입장: 장소",
      ru: "Войти: место",
    },
  },
  {
    key: "item.use.confirm",
    tags: ["#gameplay", "#punctuation"],
    source: {
      "zh-CN": "要使用“道具”吗？",
      en: "Use \"Item\"?",
      ja: "「道具」を使いますか？",
    },
    targets: {
      "zh-CN": "要使用“道具”吗？",
      en: "Use \"Item\"?",
      ja: "「道具」を使いますか？",
      ko: "\"아이템\"을 사용하시겠습니까?",
      ru: "Использовать «предмет»?",
    },
  },
];

export function createDemoProject(sourceLanguage: DemoSourceLanguage = "en"): LingridProject {
  const project = createProject();
  const columnOrder = DEMO_TRANSLATION_LANGUAGES.filter((language) => language !== sourceLanguage);
  project.columnOrder = columnOrder;
  project.columnLabels = DEMO_LANGUAGE_LABELS;
  project.entries = DEMO_ROWS.map((row) => ({
    key: `demo\u0000${row.key}`,
    context: row.key,
    source: row.source[sourceLanguage],
    translations: Object.fromEntries(
      columnOrder.map((language) => [
        language,
        { value: row.targets[language], changed: false },
      ]),
    ),
    tags: [...row.tags],
  }));
  return project;
}
