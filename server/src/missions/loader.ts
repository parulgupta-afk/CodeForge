/**
 * Mission loader – Phase 5.
 * Missions live as YAML-like structured files under /missions (JSON-compatible
 * subset parsed without an external YAML dependency).
 */

import * as fs from "fs";
import * as path from "path";

export type PlayMode = "solo" | "ai_partner" | "agent_arena";

export interface Mission {
  id: string;
  title: string;
  story: string;
  modeDefault: PlayMode;
  skillTags: string[];
  language: string;
  starter: Record<string, string>;
  visibleTests: string;
  hiddenTests: string;
  hints: string[];
  defect: { file: string; lines: number[]; summary: string };
}

const MISSIONS_DIR =
  process.env.MISSIONS_DIR ||
  path.resolve(__dirname, "../../../missions");

/** Minimal YAML subset parser for our mission files (no external dep). */
function parseSimpleYaml(text: string): any {
  // Prefer JSON if the file is actually JSON
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }

  // Very small indentation-based parser for our fixed schema
  const lines = text.split(/\r?\n/);
  const root: any = {};
  let i = 0;

  function parseBlock(indent: number): any {
    const obj: any = {};
    let listKey: string | null = null;
    let list: any[] | null = null;
    let multilineKey: string | null = null;
    let multiline: string[] = [];
    let multilineIndent = 0;

    const flushMulti = () => {
      if (multilineKey) {
        obj[multilineKey] = multiline.join("\n").replace(/^\n/, "");
        multilineKey = null;
        multiline = [];
      }
    };

    while (i < lines.length) {
      const raw = lines[i];
      const m = raw.match(/^(\s*)(.*)$/);
      if (!m) {
        i++;
        continue;
      }
      const ind = m[1].length;
      const content = m[2];

      if (content === "" || content.startsWith("#")) {
        if (multilineKey) multiline.push("");
        i++;
        continue;
      }

      if (ind < indent) {
        flushMulti();
        return obj;
      }

      if (multilineKey) {
        if (ind >= multilineIndent) {
          multiline.push(raw.slice(multilineIndent));
          i++;
          continue;
        }
        flushMulti();
      }

      // list item
      if (content.startsWith("- ")) {
        if (!list) {
          list = [];
          // attach to previous key if listKey set
        }
        if (listKey) {
          if (!Array.isArray(obj[listKey])) obj[listKey] = [];
          (obj[listKey] as any[]).push(content.slice(2).trim());
        }
        i++;
        continue;
      }

      const colon = content.indexOf(":");
      if (colon === -1) {
        i++;
        continue;
      }

      const key = content.slice(0, colon).trim();
      let val = content.slice(colon + 1).trim();
      listKey = null;

      if (val === "|" || val === ">") {
        multilineKey = key;
        multilineIndent = ind + 2;
        multiline = [];
        i++;
        continue;
      }

      if (val === "") {
        // nested object or list follows
        i++;
        // peek
        if (i < lines.length && /^\s*-\s/.test(lines[i])) {
          const arr: string[] = [];
          while (i < lines.length && /^\s*-\s/.test(lines[i])) {
            arr.push(lines[i].replace(/^\s*-\s*/, "").trim());
            i++;
          }
          obj[key] = arr;
          listKey = key;
        } else {
          obj[key] = parseBlock(ind + 2);
        }
        continue;
      }

      // scalar
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      obj[key] = val;
      i++;
    }
    flushMulti();
    return obj;
  }

  i = 0;
  return parseBlock(0);
}

function mapMission(raw: any): Mission {
  return {
    id: String(raw.id),
    title: String(raw.title || raw.id),
    story: String(raw.story || "").trim(),
    modeDefault: (raw.mode_default || raw.modeDefault || "solo") as PlayMode,
    skillTags: Array.isArray(raw.skill_tags)
      ? raw.skill_tags
      : Array.isArray(raw.skillTags)
        ? raw.skillTags
        : [],
    language: String(raw.language || "python"),
    starter: raw.starter && typeof raw.starter === "object" ? raw.starter : {},
    visibleTests: String(raw.visible_tests || raw.visibleTests || ""),
    hiddenTests: String(raw.hidden_tests || raw.hiddenTests || ""),
    hints: Array.isArray(raw.hints) ? raw.hints.map(String) : [],
    defect: {
      file: String(raw.defect?.file || ""),
      lines: Array.isArray(raw.defect?.lines)
        ? raw.defect.lines.map(Number)
        : [],
      summary: String(raw.defect?.summary || ""),
    },
  };
}

export function loadAllMissions(): Mission[] {
  if (!fs.existsSync(MISSIONS_DIR)) {
    console.warn("[missions] directory missing:", MISSIONS_DIR);
    return [];
  }
  const files = fs
    .readdirSync(MISSIONS_DIR)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml") || f.endsWith(".json"))
    .sort();
  const out: Mission[] = [];
  for (const f of files) {
    try {
      const text = fs.readFileSync(path.join(MISSIONS_DIR, f), "utf8");
      const raw = parseSimpleYaml(text);
      out.push(mapMission(raw));
    } catch (err: any) {
      console.warn(`[missions] failed to load ${f}:`, err?.message);
    }
  }
  return out;
}

export function getMission(id: string): Mission | undefined {
  return loadAllMissions().find((m) => m.id === id);
}
