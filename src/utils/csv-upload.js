import Papa from "papaparse";

export function uploadCSV(file, onComplete) {
  if (!file) return;
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      // Add a unique key for each row
      const parsed = results.data.map((row, idx) => ({ ...row, key: idx }));
      onComplete(parsed);
    },
    transformHeader: (header) => {
      const normalized = header.trim().toLowerCase().replace(/ /g, "_");
      return normalized === "frist_name" ? "first_name" : normalized;
    },
  });
}
