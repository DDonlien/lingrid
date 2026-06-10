// Lingrid Website — Language Switcher, Mobile Menu & App Screenshot Localization
(function() {
  'use strict';

  const translations = {
    en: {
      'nav.features': 'Features',
      'nav.tryOnline': 'Try Online',
      'hero.badge': 'Open Source & Local-First',
      'hero.title': 'Lingrid <span class="hero-title-accent">灵译</span>',
      'hero.subtitle': 'A lightweight, modern, local-first PO / CSV multilingual side-by-side matrix editor. Built for indie game developers, small software teams, and freelance translators.',
      'hero.cta.try': 'Try in Browser',
      'hero.cta.download': 'Download Desktop App',
      'feature.1.title': 'Side-by-Side Matrix Editing',
      'feature.1.desc': 'See all language translations for a single source text in one unified view. No more switching between files.',
      'feature.2.title': 'Import & Merge Multiple Files',
      'feature.2.desc': 'Import multiple PO or CSV files and merge them into a single side-by-side matrix. One row per source text, one column per language.',
      'feature.3.title': 'PO Metadata Fidelity',
      'feature.3.desc': 'msgctxt, msgid_plural, comments, references, flags, and obsolete entries are fully preserved. The matrix is just a UI projection — your files stay intact.',
      'feature.4.title': 'Local-First',
      'feature.4.desc': 'No cloud lock-in, no SaaS subscriptions. Your translation files stay on your machine. Direct overwrite saving with read-verify integrity checks.',
      'feature.5.title': 'AI Suggestions',
      'feature.5.desc': 'Connect your own OpenAI-compatible or DeepL API. Get translation suggestions for the active cell — suggestions, not automatic overwrites.',
      'feature.6.title': 'Obsidian-Style Tags',
      'feature.6.desc': 'Two-tier tagging: Source Tags shared across all languages per entry, and Word Tags bound to individual cells. Filter, search, and organize with #ui, #review, #todo.',
      'feature.7.title': 'Batch & Excel-Like Edit',
      'feature.7.desc': 'Multi-select cells, bulk copy-paste, batch fill, find & replace across languages. Full undo/redo support. Edit directly in cells or in a spacious detail panel.',
      'download.title': 'Use It Your Way',
      'download.desc': 'Browser or desktop — your choice. Both share the same core engine.',
      'download.web.title': 'Browser Version',
      'download.web.item1': 'No installation required',
      'download.web.item2': 'File System Access API for direct file overwrite (Chrome/Edge)',
      'download.web.item3': 'Falls back to download when API unavailable',
      'download.web.item4': 'Perfect for quick edits and demos',
      'download.web.cta': 'Launch Web App',
      'download.desktop.title': 'Desktop App',
      'download.desktop.badge': 'Electron',
      'download.desktop.item1': 'Native file dialogs and auto-save',
      'download.desktop.item2': 'Automatic project reopening',
      'download.desktop.item3': 'Windows, macOS, and Linux',
      'download.desktop.item4': 'Full filesystem access without browser sandbox',
      'download.desktop.cta': 'Get Desktop App',
      'tech.stack': 'Tech Stack',
      'tech.license': 'License',
      'tech.platforms': 'Platforms',
      'tech.formats': 'Formats',
      'cta.title': 'Start Localizing Smarter',
      'cta.desc': 'Free, open source, and ready for your next project.',
      'cta.btn.try': 'Try in Browser',
      'cta.btn.github': 'View on GitHub',
      'footer.desc': 'Lightweight PO/CSV multilingual matrix editor for game and software localization.',
      'footer.col.product': 'Product',
      'footer.col.resources': 'Resources',
      'footer.col.connect': 'Connect',
      'footer.link.web': 'Web App',
      'footer.link.desktop': 'Desktop Releases',
      'footer.link.features': 'Features',
      'footer.link.docs': 'Documentation',
      'footer.link.roadmap': 'Roadmap',
      'footer.link.issues': 'Issues',
      'footer.copyright': '© 2026 Lingrid. Open source project.'
    },
    zh: {
      'nav.features': '功能特性',
      'nav.tryOnline': '在线试用',
      'hero.badge': '开源 & 本地优先',
      'hero.title': 'Lingrid <span class="hero-title-accent">灵译</span>',
      'hero.subtitle': '轻量、现代、本地优先的 PO / CSV 多语言并排矩阵编辑器。为独立游戏开发者、小型软件团队和自由译者打造。',
      'hero.cta.try': '浏览器中试用',
      'hero.cta.download': '下载桌面版',
      'feature.1.title': '并排矩阵编辑',
      'feature.1.desc': '在同一视图中查看单条原文的所有语言译文。告别在多个文件间来回切换。',
      'feature.2.title': '导入并合并多文件',
      'feature.2.desc': '导入多个 PO 或 CSV 文件，合并为统一的并排矩阵。每行一条原文，每列一种语言。',
      'feature.3.title': 'PO 元数据保真',
      'feature.3.desc': '完整保留 msgctxt、msgid_plural、注释、引用、标记和废弃条目。矩阵只是 UI 投影——您的文件保持原样。',
      'feature.4.title': '本地优先',
      'feature.4.desc': '无云锁定，无 SaaS 订阅。翻译文件始终留在您的设备上。直接覆盖保存，带读写校验完整性检查。',
      'feature.5.title': 'AI 翻译建议',
      'feature.5.desc': '接入您自己的 OpenAI 兼容或 DeepL API。为当前单元格获取翻译建议——建议，而非自动覆盖。',
      'feature.6.title': 'Obsidian 风格标签',
      'feature.6.desc': '双层标签系统：Source Tag 按条目跨语言共享，Word Tag 绑定到具体单元格。用 #ui、#review、#todo 过滤、搜索和组织。',
      'feature.7.title': '批量与类 Excel 编辑',
      'feature.7.desc': '多选单元格、批量复制粘贴、批量填充、跨语言查找替换。完整支持撤销/重做。直接在单元格或宽敞详情面板中编辑。',
      'download.title': '选择您的方式',
      'download.desc': '浏览器或桌面端——由您选择。两者共享相同的核心引擎。',
      'download.web.title': '浏览器版',
      'download.web.item1': '无需安装',
      'download.web.item2': 'File System Access API 直接覆盖保存（Chrome/Edge）',
      'download.web.item3': 'API 不可用时自动降级为下载',
      'download.web.item4': '适合快速编辑和演示',
      'download.web.cta': '启动网页版',
      'download.desktop.title': '桌面应用',
      'download.desktop.badge': 'Electron',
      'download.desktop.item1': '原生文件对话框与自动保存',
      'download.desktop.item2': '自动重新打开项目',
      'download.desktop.item3': '支持 Windows、macOS 和 Linux',
      'download.desktop.item4': '不受浏览器沙箱限制，完整文件系统访问',
      'download.desktop.cta': '获取桌面版',
      'tech.stack': '技术栈',
      'tech.license': '许可证',
      'tech.platforms': '平台',
      'tech.formats': '支持格式',
      'cta.title': '更智能地开始本地化',
      'cta.desc': '免费、开源，已为您的下一个项目做好准备。',
      'cta.btn.try': '浏览器中试用',
      'cta.btn.github': '在 GitHub 上查看',
      'footer.desc': '面向游戏与软件本地化的轻量 PO/CSV 多语言矩阵编辑器。',
      'footer.col.product': '产品',
      'footer.col.resources': '资源',
      'footer.col.connect': '联系',
      'footer.link.web': '网页版',
      'footer.link.desktop': '桌面版发布',
      'footer.link.features': '功能特性',
      'footer.link.docs': '文档',
      'footer.link.roadmap': '路线图',
      'footer.link.issues': '问题反馈',
      'footer.copyright': '© 2026 Lingrid. 开源项目。'
    }
  };

  let currentLang = 'en';

  function applyLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    if (!t) return;

    // Update data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) {
        if (key === 'hero.title') {
          el.innerHTML = t[key];
        } else {
          el.textContent = t[key];
        }
      }
    });

    // Update data-text-en/zh elements (app screenshot content)
    document.querySelectorAll('[data-text-en][data-text-zh]').forEach(el => {
      const text = lang === 'zh' ? el.getAttribute('data-text-zh') : el.getAttribute('data-text-en');
      if (text === null) return;
      
      // For elements with child elements (tags, icons), preserve children and update text
      const hasChildren = el.querySelector('.tags, .tag, .word-tag-markers, svg, .button-dirty');
      if (hasChildren) {
        // Find and update text nodes only
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.trim() && node.parentElement === el) {
            textNodes.push(node);
          }
        }
        if (textNodes.length > 0) {
          textNodes[0].textContent = text;
        }
      } else {
        el.textContent = text;
      }
    });

    // Update HTML lang attribute
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans-CN' : 'en';

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = lang === 'zh'
        ? 'Lingrid 灵译 — 轻量、现代、本地优先的 PO / CSV 多语言并排矩阵编辑器，面向游戏与软件本地化。'
        : 'Lingrid is a lightweight, modern, local-first PO/CSV multilingual side-by-side matrix editor for game and software localization.';
    }

    // Update title
    document.title = lang === 'zh'
      ? 'Lingrid 灵译 — 轻量 PO/CSV 多语言矩阵编辑器'
      : 'Lingrid — Lightweight PO/CSV Multilingual Matrix Editor';

    // Update lang toggle UI
    document.querySelectorAll('.lang-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.lang === lang);
    });

    // Save preference
    try { localStorage.setItem('lingrid-site-lang', lang); } catch(e) {}
  }

  // Initialize
  function init() {
    // Load saved preference or detect browser language
    let saved = 'en';
    try { saved = localStorage.getItem('lingrid-site-lang'); } catch(e) {}
    if (!saved) {
      const browserLang = navigator.language || navigator.userLanguage || '';
      if (browserLang.toLowerCase().startsWith('zh')) saved = 'zh';
      else saved = 'en';
    }
    applyLanguage(saved || 'en');

    // Language toggle click
    document.querySelectorAll('.lang-option').forEach(opt => {
      opt.addEventListener('click', () => applyLanguage(opt.dataset.lang));
    });

    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const navMobile = document.getElementById('navMobile');
    if (mobileToggle && navMobile) {
      mobileToggle.addEventListener('click', () => {
        navMobile.classList.toggle('open');
      });
      // Close mobile menu on link click
      navMobile.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => navMobile.classList.remove('open'));
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
