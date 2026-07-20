import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import type { AppData } from "../types";

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(fields: (string | number)[]): string {
  return fields.map(escapeCsvField).join(",");
}

/** Builds one combined CSV covering workouts, steps, hydration, and weight — each in its own labeled section. */
export function buildCsv(data: AppData): string {
  const lines: string[] = [];

  lines.push("# Workouts");
  lines.push(toCsvRow(["date", "type", "durationMinutes", "calories", "note"]));
  for (const w of data.workouts) {
    lines.push(toCsvRow([w.date, w.type, w.durationMinutes, w.calories, w.note ?? ""]));
  }

  lines.push("");
  lines.push("# Steps");
  lines.push(toCsvRow(["date", "steps", "source"]));
  for (const s of data.steps) {
    lines.push(toCsvRow([s.date, s.steps, s.source]));
  }

  lines.push("");
  lines.push("# Hydration");
  lines.push(toCsvRow(["date", "amountMl", "time"]));
  for (const h of data.hydration) {
    lines.push(toCsvRow([h.date, h.amountMl, new Date(h.timestamp).toISOString()]));
  }

  lines.push("");
  lines.push("# Body Weight");
  lines.push(toCsvRow(["date", "weightKg"]));
  for (const w of data.weights) {
    lines.push(toCsvRow([w.date, w.weightKg]));
  }

  return lines.join("\n");
}

/** Exports the CSV: triggers a browser download on web, or opens the native share sheet on mobile. */
export async function exportCsv(data: AppData): Promise<void> {
  const csv = buildCsv(data);
  const filename = `vital-export-${new Date().toISOString().slice(0, 10)}.csv`;

  if (Platform.OS === "web") {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const fileUri = FileSystem.cacheDirectory + filename;
  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: "Export Vital data" });
  }
}

export interface ParsedCsvSections {
  workouts: { date: string; type: string; durationMinutes: number; calories: number; note: string }[];
  steps: { date: string; steps: number; source: string }[];
  hydration: { date: string; amountMl: number; time: string }[];
  weights: { date: string; weightKg: number }[];
}

/** Parses a CSV produced by buildCsv back into its sections, for the CSV Import feature. */
export function parseCsv(csv: string): ParsedCsvSections {
  const result: ParsedCsvSections = { workouts: [], steps: [], hydration: [], weights: [] };
  const lines = csv.split("\n");
  let section: keyof ParsedCsvSections | null = null;
  let header: string[] = [];

  function splitCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current);
    return fields;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line === "# Workouts") {
      section = "workouts";
      header = [];
      continue;
    }
    if (line === "# Steps") {
      section = "steps";
      header = [];
      continue;
    }
    if (line === "# Hydration") {
      section = "hydration";
      header = [];
      continue;
    }
    if (line === "# Body Weight") {
      section = "weights";
      header = [];
      continue;
    }
    if (!section) continue;

    const fields = splitCsvLine(line);
    if (header.length === 0) {
      header = fields;
      continue;
    }

    if (section === "workouts") {
      result.workouts.push({
        date: fields[0],
        type: fields[1],
        durationMinutes: Number(fields[2]) || 0,
        calories: Number(fields[3]) || 0,
        note: fields[4] || "",
      });
    } else if (section === "steps") {
      result.steps.push({ date: fields[0], steps: Number(fields[1]) || 0, source: fields[2] || "manual" });
    } else if (section === "hydration") {
      result.hydration.push({ date: fields[0], amountMl: Number(fields[1]) || 0, time: fields[2] || "" });
    } else if (section === "weights") {
      result.weights.push({ date: fields[0], weightKg: Number(fields[1]) || 0 });
    }
  }

  return result;
}

/**
 * Opens a file picker (native document picker / web file input) and returns the parsed CSV
 * sections, or null if the user cancelled or the file couldn't be read.
 */
export async function pickAndParseCsv(): Promise<ParsedCsvSections | null> {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv,text/csv";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(parseCsv(String(reader.result ?? "")));
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
      };
      input.click();
    });
  }

  const result = await DocumentPicker.getDocumentAsync({ type: "text/csv", copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.[0]) return null;
  const content = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
  return parseCsv(content);
}
