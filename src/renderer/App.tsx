import { useDeferredValue, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  FileText,
  Filter,
  FolderOpen,
  Hash,
  Languages,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { defaultCsvMapping, parseCsv, parseCsvRows, updateCsv } from "../adapters/csv";
import { detectPoLanguage, parsePo, updatePo } from "../adapters/po";
import { createProject, filteredEntries, mergeEntries, normalizeTag, serializeProject } from "../core/project";
import type { AiSettings, LingridProject, SourceDocument, TranslationEntry } from "../core/types";
import { createDemoProject } from "./demo";

type Modal = "ai" | "batch" | "files" | "csv" | null;
type Selection = { key: string; language: string } | null;
const AI_DEFAULT: AiSettings = {
  endpoint: "",
  apiKey: "",
  model: "",
  prompt: "Translate the following source text into {{language}}. Return only the translation:\\n\\n{{source}}",
};

function documentType(name: string): SourceDocument["type"] {
  if (/\.pot$/i.test(name)) return "pot";
  if (/\.csv$/i.test(name)) return "csv";
  return "po";
}

function download(name: string, content: string) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function createDocument(name: string, path: string, raw: string, modifiedAt?: number): SourceDocument {
  const type = documentType(name);
  const headers = type === "csv" ? parseCsvRows(raw)[0] ?? [] : [];
  return {
    id: crypto.randomUUID(),
    path,
    name,
    type,
    raw,
    writable: type !== "pot",
    modifiedAt,
    language: type === "po" ? detectPoLanguage(raw, name) : undefined,
    csvMapping: type === "csv" ? defaultCsvMapping(headers) : undefined,
  };
}

function Button({
  children,
  onClick,
  variant = "ghost",
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "ghost" | "primary" | "soft";
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button className={`button ${variant}`} onClick={onClick} title={title} disabled={disabled}>
      {children}
    </button>
  );
}

function ModalFrame({ title, children, close }: { title: string; children: React.ReactNode; close: () => void }) {
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <section className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <header><h2>{title}</h2><button className="icon-button" onClick={close}><X size={16} /></button></header>
        {children}
      </section>
    </div>
  );
}

export function App() {
  const [project, setProject] = useState<LingridProject>(() => createDemoProject());
  const [selection, setSelection] = useState<Selection>({ key: "demo\u0000menu.start", language: "ja" });
  const [modal, setModal] = useState<Modal>(null);
  const [notice, setNotice] = useState("Demo workspace loaded");
  const [ai, setAi] = useState<AiSettings>(AI_DEFAULT);
  const [suggestion, setSuggestion] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [batch, setBatch] = useState({ find: "", replace: "", scope: "current" });
  const [csvDraft, setCsvDraft] = useState({ documentId: "", sourceColumn: "", keyColumn: "", languages: "" });
  const fileInput = useRef<HTMLInputElement>(null);
  const projectInput = useRef<HTMLInputElement>(null);
  const deferredSearch = useDeferredValue(project.view.search);
  const visible = useMemo(
    () => filteredEntries({ ...project, view: { ...project.view, search: deferredSearch } }),
    [project, deferredSearch],
  );
  const current = project.entries.find((entry) => entry.key === selection?.key);
  const currentCell = selection && current?.translations[selection.language];
  const changedCount = project.entries.reduce(
    (count, entry) => count + (entry.sourceChanged ? 1 : 0) + Object.values(entry.translations).filter((cell) => cell.changed).length,
    0,
  );
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    project.entries.forEach((entry) => entry.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [project.entries]);

  function patchProject(patch: Partial<LingridProject>) {
    setProject((value) => ({ ...value, ...patch }));
  }

  function updateCell(entryKey: string, language: string, value: string) {
    setProject((state) => ({
      ...state,
      entries: state.entries.map((entry) =>
        entry.key === entryKey
          ? { ...entry, translations: { ...entry.translations, [language]: { value, changed: true } } }
          : entry,
      ),
    }));
  }

  function importDocuments(files: Array<{ name: string; path: string; content: string; modifiedAt?: number }>) {
    let next = { ...project, documents: [...project.documents], entries: [...project.entries] };
    if (next.documents.length === 0 && next.entries[0]?.key.startsWith("demo")) next = createProject();
    for (const file of files) {
      const document = createDocument(file.name, file.path, file.content, file.modifiedAt);
      const entries = document.type === "csv" ? parseCsv(document) : parsePo(document);
      const languages =
        document.type === "csv"
          ? Object.keys(document.csvMapping ?? {}).length
            ? Object.keys(document.csvMapping!.languageColumns)
            : Object.keys(entries[0]?.translations ?? {})
          : document.language
            ? [document.language]
            : [];
      next.documents.push(document);
      next.entries = mergeEntries(next.entries, entries);
      for (const language of languages) {
        if (!next.columnOrder.includes(language)) next.columnOrder.push(language);
        next.columnLabels[language] ??= language;
      }
    }
    setProject(next);
    setNotice(`Imported ${files.length} file${files.length === 1 ? "" : "s"}`);
  }

  async function openFiles() {
    if (window.lingrid) {
      const files = await window.lingrid.openFiles(["po", "pot", "csv"]);
      importDocuments(files);
    } else fileInput.current?.click();
  }

  async function openProject() {
    if (!window.lingrid) {
      projectInput.current?.click();
      return;
    }
    const [projectFile] = await window.lingrid.openFiles(["json"]);
    if (!projectFile) return;
    const config = JSON.parse(projectFile.content) as {
      files?: Array<{ path: string }>;
      columnOrder?: string[];
      columnLabels?: Record<string, string>;
      tags?: Record<string, string[]>;
      view?: LingridProject["view"];
    };
    const files = await window.lingrid.readFiles((config.files ?? []).map((file) => file.path));
    let next = createProject();
    for (const file of files) {
      const document = createDocument(file.name, file.path, file.content, file.modifiedAt);
      const entries = document.type === "csv" ? parseCsv(document) : parsePo(document);
      next.documents.push(document);
      next.entries = mergeEntries(next.entries, entries);
    }
    next.entries = next.entries.map((entry) => ({ ...entry, tags: config.tags?.[entry.key] ?? [] }));
    next.columnOrder = config.columnOrder ?? [...new Set(next.entries.flatMap((entry) => Object.keys(entry.translations)))];
    next.columnLabels = config.columnLabels ?? Object.fromEntries(next.columnOrder.map((language) => [language, language]));
    next.view = config.view ?? next.view;
    next.projectPath = projectFile.path;
    setProject(next);
    setSelection(next.entries[0] && next.columnOrder[0] ? { key: next.entries[0].key, language: next.columnOrder[0] } : null);
    setNotice(`Opened project with ${files.length} source files`);
  }

  async function saveSources() {
    try {
      const documents = await Promise.all(project.documents.map(async (document) => {
        if (!document.writable) return document;
        const raw = document.type === "csv" ? updateCsv(document, project.entries) : updatePo(document, project.entries);
        const modifiedAt = window.lingrid && document.path
          ? await window.lingrid.writeFile(document.path, raw, document.modifiedAt)
          : (download(document.name, raw), document.modifiedAt);
        return { ...document, raw, modifiedAt };
      }));
      setProject({
        ...project,
        documents,
        entries: project.entries.map((entry) => ({
          ...entry,
          sourceChanged: false,
          translations: Object.fromEntries(
            Object.entries(entry.translations).map(([language, cell]) => [language, { ...cell, changed: false }]),
          ),
        })),
      });
      setNotice(`Saved ${changedCount} changed cell${changedCount === 1 ? "" : "s"}`);
    } catch {
      setNotice("Save stopped: a source file changed outside Lingrid or could not be written.");
    }
  }

  async function saveProject(asNew = false) {
    const content = serializeProject(project);
    if (window.lingrid) {
      const path = asNew || !project.projectPath
        ? await window.lingrid.saveAs("lingrid-project.json", content)
        : (await window.lingrid.writeFile(project.projectPath, content), project.projectPath);
      if (path) patchProject({ projectPath: path });
    } else download("lingrid-project.json", content);
    setNotice("Project state saved");
  }

  async function saveCurrentPoAs() {
    const document = project.documents.find((item) => item.type === "po" && item.language === selection?.language);
    if (!document) return setNotice("Select a language loaded from a PO file first");
    const content = updatePo(document, project.entries);
    if (window.lingrid) await window.lingrid.saveAs(document.name, content);
    else download(document.name, content);
  }

  function updateTags(raw: string) {
    if (!current) return;
    const tags = raw.split(/\s+/).map(normalizeTag).filter(Boolean);
    setProject((state) => ({
      ...state,
      entries: state.entries.map((entry) => (entry.key === current.key ? { ...entry, tags } : entry)),
    }));
  }

  function openCsvMapping() {
    const document = project.documents.find((item) => item.type === "csv");
    if (!document?.csvMapping) return setNotice("Import a CSV file to configure its mapping");
    setCsvDraft({
      documentId: document.id,
      sourceColumn: document.csvMapping.sourceColumn,
      keyColumn: document.csvMapping.keyColumn ?? "",
      languages: Object.keys(document.csvMapping.languageColumns).join(", "),
    });
    setModal("csv");
  }

  function applyCsvMapping() {
    const documents = project.documents.map((document) => {
      if (document.id !== csvDraft.documentId) return document;
      const headers = parseCsvRows(document.raw)[0] ?? [];
      const languages = csvDraft.languages.split(",").map((value) => value.trim()).filter((value) => headers.includes(value));
      return {
        ...document,
        csvMapping: {
          sourceColumn: csvDraft.sourceColumn,
          keyColumn: csvDraft.keyColumn || undefined,
          languageColumns: Object.fromEntries(languages.map((language) => [language, language])),
        },
      };
    });
    const tags = new Map(project.entries.map((entry) => [entry.key, entry.tags]));
    const entries = documents.reduce<TranslationEntry[]>((all, document) => {
      const parsed = document.type === "csv" ? parseCsv(document) : parsePo(document);
      return mergeEntries(all, parsed);
    }, []).map((entry) => ({ ...entry, tags: tags.get(entry.key) ?? [] }));
    const discoveredLanguages = [...new Set(entries.flatMap((entry) => Object.keys(entry.translations)))];
    setProject({ ...project, documents, entries, columnOrder: discoveredLanguages, columnLabels: { ...project.columnLabels, ...Object.fromEntries(discoveredLanguages.map((language) => [language, project.columnLabels[language] ?? language])) } });
    setModal(null);
    setNotice("CSV mapping updated");
  }

  async function generateSuggestion() {
    if (!current || !selection) return;
    if (!ai.endpoint || !ai.model) {
      setModal("ai");
      return;
    }
    setAiBusy(true);
    try {
      const prompt = ai.prompt.replaceAll("{{language}}", selection.language).replaceAll("{{source}}", current.source);
      const response = await fetch(ai.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ai.apiKey}` },
        body: JSON.stringify({ model: ai.model, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await response.json();
      setSuggestion(data.choices?.[0]?.message?.content ?? data.translation ?? "");
    } catch {
      setNotice("AI request failed. Check endpoint and model settings.");
    } finally {
      setAiBusy(false);
    }
  }

  function applyBatch() {
    if (!batch.find) return;
    setProject((state) => ({
      ...state,
      entries: state.entries.map((entry) => {
        const replace = (value: string) => value.split(batch.find).join(batch.replace);
        if (batch.scope === "source") {
          const source = replace(entry.source);
          return { ...entry, source, sourceChanged: entry.sourceChanged || source !== entry.source };
        }
        if (batch.scope === "tag") return { ...entry, tags: entry.tags.map(replace) };
        return {
          ...entry,
          translations: Object.fromEntries(
            Object.entries(entry.translations).map(([language, cell]) => {
              const inScope = batch.scope === "all" || language === selection?.language;
              const value = inScope ? replace(cell.value) : cell.value;
              return [language, { value, changed: cell.changed || value !== cell.value }];
            }),
          ),
        };
      }),
    }));
    setModal(null);
    setNotice("Batch replacement applied");
  }

  const batchMatches = project.entries.reduce((count, entry) => {
    if (!batch.find) return 0;
    if (batch.scope === "source") return count + entry.source.split(batch.find).length - 1;
    if (batch.scope === "tag") return count + entry.tags.join(" ").split(batch.find).length - 1;
    return count + Object.entries(entry.translations)
      .filter(([language]) => batch.scope === "all" || language === selection?.language)
      .reduce((sum, [, cell]) => sum + cell.value.split(batch.find).length - 1, 0);
  }, 0);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Languages size={16} /></div><strong>Lingrid</strong><span>灵译</span></div>
        <nav className="toolbar">
          <Button onClick={openFiles}><FolderOpen size={15} />Open</Button>
          <Button onClick={openFiles}><FilePlus2 size={15} />Import CSV</Button>
          <Button onClick={openProject}><FileText size={15} />Open Project</Button>
          <span className="separator" />
          <Button variant="primary" onClick={saveSources}><Save size={15} />Save</Button>
          <Button onClick={() => saveProject(false)}><FileText size={15} />Save Project</Button>
          <Button onClick={() => saveProject(true)}>Save Project As</Button>
          <Button onClick={saveCurrentPoAs}>Save Current PO As</Button>
        </nav>
        <div className="toolbar right">
          <Button onClick={() => setModal("batch")}><ArrowDownUp size={15} />Batch Replace</Button>
          <Button variant="soft" onClick={() => setModal("ai")}><Bot size={15} />AI Settings</Button>
        </div>
      </header>

      <section className="filterbar">
        <label className="search"><Search size={15} /><input value={project.view.search} onChange={(event) => patchProject({ view: { ...project.view, search: event.target.value } })} placeholder="Search source, translation or #tag" /></label>
        <select value={project.view.completion} onChange={(event) => patchProject({ view: { ...project.view, completion: event.target.value as LingridProject["view"]["completion"] } })}>
          <option value="all">All entries</option><option value="incomplete">Incomplete</option><option value="complete">Complete</option>
        </select>
        <button className={`filter-toggle ${project.view.changedOnly ? "active" : ""}`} onClick={() => patchProject({ view: { ...project.view, changedOnly: !project.view.changedOnly } })}><Filter size={14} />Changed only</button>
        <select value={project.view.tag} onChange={(event) => patchProject({ view: { ...project.view, tag: event.target.value } })}>
          <option value="">All tags</option>{tagCounts.map(([tag]) => <option key={tag}>{tag}</option>)}
        </select>
        <span className="filter-result">{visible.length} of {project.entries.length} entries</span>
      </section>

      <div className="workspace">
        <section className="matrix-wrap">
          <table className="matrix">
            <thead><tr><th className="source-col">Source</th>{project.columnOrder.map((language) => <th key={language}>{project.columnLabels[language] ?? language}</th>)}<th>Tags</th></tr></thead>
            <tbody>{visible.map((entry) => (
              <tr key={entry.key} className={entry.key === selection?.key ? "selected-row" : ""}>
                <td className="source-col"><strong>{entry.source}</strong>{entry.context ? <small>{entry.context}</small> : null}</td>
                {project.columnOrder.map((language) => {
                  const cell = entry.translations[language] ?? { value: "", changed: false };
                  const selected = entry.key === selection?.key && language === selection.language;
                  return <td key={language} className={`translation-cell ${selected ? "selected-cell" : ""} ${cell.changed ? "changed" : ""}`} onClick={() => setSelection({ key: entry.key, language })}>
                    <input value={cell.value} onChange={(event) => updateCell(entry.key, language, event.target.value)} placeholder="Missing translation" />
                  </td>;
                })}
                <td><div className="tags">{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></td>
              </tr>
            ))}</tbody>
          </table>
        </section>

        <aside className="detail-panel">
          <header><div><span>DETAIL EDITOR</span><h2>{selection ? project.columnLabels[selection.language] ?? selection.language : "No selection"}</h2></div><Settings2 size={16} /></header>
          {current && selection ? <>
            <label className="field-label">Source</label><div className="source-preview">{current.source}</div>
            {current.context ? <><label className="field-label">Key / context</label><code>{current.context}</code></> : null}
            <label className="field-label">Translation</label>
            <textarea className="translation-area" value={currentCell?.value ?? ""} onChange={(event) => updateCell(current.key, selection.language, event.target.value)} placeholder="Enter translation…" />
            <label className="field-label">Tags</label>
            <input className="text-input" value={current.tags.join(" ")} onChange={(event) => updateTags(event.target.value)} placeholder="#ui #review" />
            <section className="ai-panel"><div className="panel-heading"><span><Sparkles size={14} />AI Suggestion</span><Button onClick={generateSuggestion} disabled={aiBusy}>{aiBusy ? <RefreshCw className="spin" size={14} /> : <Sparkles size={14} />}Generate</Button></div>
              <p>{suggestion || "Generate a suggestion for the selected cell. Existing translation is never overwritten automatically."}</p>
              <Button variant="soft" disabled={!suggestion} onClick={() => { updateCell(current.key, selection.language, suggestion); setSuggestion(""); }}><Check size={14} />Apply suggestion</Button>
            </section>
          </> : <div className="empty-detail">Select a translation cell to edit it.</div>}
          <section className="stats">
            <div className="panel-heading"><span>Completion</span><button className="link" onClick={() => setModal("files")}>Manage columns</button></div>
            {project.columnOrder.map((language) => {
              const done = project.entries.filter((entry) => entry.translations[language]?.value.trim()).length;
              const percentage = project.entries.length ? Math.round((done / project.entries.length) * 100) : 0;
              return <div className="stat" key={language}><div><span>{project.columnLabels[language] ?? language}</span><b>{percentage}%</b></div><div className="progress"><i style={{ width: `${percentage}%` }} /></div><small>{done} / {project.entries.length} translated</small></div>;
            })}
            <div className="tag-summary"><span><Hash size={12} />Tags</span>{tagCounts.map(([tag, count]) => <small key={tag}>{tag} <b>{count}</b></small>)}</div>
          </section>
        </aside>
      </div>
      <footer className="statusbar"><span><i className={changedCount ? "unsaved" : "saved"} />{changedCount ? `${changedCount} unsaved changes` : "All changes saved"}</span><span>{notice}</span><span>{project.documents.length} source files · Phase 1 / v0.1</span></footer>

      <input hidden multiple ref={fileInput} type="file" accept=".po,.pot,.csv" onChange={async (event) => importDocuments(await Promise.all([...event.target.files ?? []].map(async (file) => ({ name: file.name, path: "", content: await file.text() }))))} />
      <input hidden ref={projectInput} type="file" accept=".json" onChange={() => setNotice("Project files reopen source paths in the Electron desktop app")} />

      {modal === "ai" ? <ModalFrame title="AI suggestion settings" close={() => setModal(null)}><div className="form-grid">
        <label>API endpoint<input value={ai.endpoint} onChange={(event) => setAi({ ...ai, endpoint: event.target.value })} placeholder="https://api.example.com/v1/chat/completions" /></label>
        <label>Model<input value={ai.model} onChange={(event) => setAi({ ...ai, model: event.target.value })} placeholder="model-name" /></label>
        <label>API key<input type="password" value={ai.apiKey} onChange={(event) => setAi({ ...ai, apiKey: event.target.value })} placeholder="Stored only in this local session" /></label>
        <label>Prompt template<textarea value={ai.prompt} onChange={(event) => setAi({ ...ai, prompt: event.target.value })} /></label>
        <Button variant="primary" onClick={() => setModal(null)}>Done</Button>
      </div></ModalFrame> : null}

      {modal === "batch" ? <ModalFrame title="Batch replace" close={() => setModal(null)}><div className="form-grid">
        <label>Find<input value={batch.find} onChange={(event) => setBatch({ ...batch, find: event.target.value })} /></label>
        <label>Replace with<input value={batch.replace} onChange={(event) => setBatch({ ...batch, replace: event.target.value })} /></label>
        <label>Scope<select value={batch.scope} onChange={(event) => setBatch({ ...batch, scope: event.target.value })}><option value="current">Current language</option><option value="all">All languages</option><option value="source">Source</option><option value="tag">Tags</option></select></label>
        <p className="match-count">{batchMatches} matches found</p>
        <Button variant="primary" onClick={applyBatch}>Apply replacement</Button>
      </div></ModalFrame> : null}

      {modal === "files" ? <ModalFrame title="Language columns" close={() => setModal(null)}><div className="column-list">{project.columnOrder.map((language, index) => <div className="column-row" key={language}><Languages size={15} /><input value={project.columnLabels[language] ?? language} onChange={(event) => patchProject({ columnLabels: { ...project.columnLabels, [language]: event.target.value } })} /><code>{language}</code><button disabled={index === 0} onClick={() => { const order = [...project.columnOrder]; [order[index - 1], order[index]] = [order[index], order[index - 1]]; patchProject({ columnOrder: order }); }}><ChevronLeft size={15} /></button><button disabled={index === project.columnOrder.length - 1} onClick={() => { const order = [...project.columnOrder]; [order[index], order[index + 1]] = [order[index + 1], order[index]]; patchProject({ columnOrder: order }); }}><ChevronRight size={15} /></button></div>)}{project.documents.some((document) => document.type === "csv") ? <Button variant="soft" onClick={openCsvMapping}>Configure CSV mapping</Button> : null}</div></ModalFrame> : null}
      {modal === "csv" ? <ModalFrame title="CSV column mapping" close={() => setModal(null)}><div className="form-grid">
        <label>Source column<input value={csvDraft.sourceColumn} onChange={(event) => setCsvDraft({ ...csvDraft, sourceColumn: event.target.value })} /></label>
        <label>Optional id/key column<input value={csvDraft.keyColumn} onChange={(event) => setCsvDraft({ ...csvDraft, keyColumn: event.target.value })} /></label>
        <label>Language columns, comma separated<input value={csvDraft.languages} onChange={(event) => setCsvDraft({ ...csvDraft, languages: event.target.value })} /></label>
        <Button variant="primary" onClick={applyCsvMapping}>Apply mapping</Button>
      </div></ModalFrame> : null}
    </main>
  );
}
