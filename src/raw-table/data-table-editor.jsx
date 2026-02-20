import {
  useState,
  useReducer,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  memo,
} from "react";
import { downloadCSV } from "../utils/csv-download";
import { Button } from "antd";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 100;
const GENDERS = ["M", "F"];

// ─── VALIDATION ENGINE (pure, runs outside React) ─────────────────────────────
function buildIndexes(records) {
  const nicIndex = new Map(); // nic -> [rowIds]
  const nameIndex = new Map(); // "first|last" -> [rowIds]

  records.forEach((r) => {
    const nic = r.nic.trim().toLowerCase();
    const nameKey = `${r.firstName.trim().toLowerCase()}|${r.lastName.trim().toLowerCase()}`;

    if (nic) {
      if (!nicIndex.has(nic)) nicIndex.set(nic, []);
      nicIndex.get(nic).push(r.id);
    }
    if (r.firstName.trim() || r.lastName.trim()) {
      if (!nameIndex.has(nameKey)) nameIndex.set(nameKey, []);
      nameIndex.get(nameKey).push(r.id);
    }
  });

  return { nicIndex, nameIndex };
}

function validateRow(row, nicIndex, nameIndex) {
  const errors = {};

  // NIC
  const nic = row.nic.trim();
  if (!nic) {
    errors.nic = "NIC is required";
  } else {
    const key = nic.toLowerCase();
    const dupes = nicIndex.get(key) || [];
    if (dupes.length > 1) errors.nic = "NIC must be unique";
  }

  // Names
  const fn = row.firstName.trim();
  const ln = row.lastName.trim();
  if (!fn) errors.firstName = "First name is required";
  if (!ln) errors.lastName = "Last name is required";
  if (fn && ln) {
    const nameKey = `${fn.toLowerCase()}|${ln.toLowerCase()}`;
    const dupes = nameIndex.get(nameKey) || [];
    if (dupes.length > 1) {
      errors.firstName = "Name combination must be unique";
      errors.lastName = "Name combination must be unique";
    }
  }

  // Gender
  if (!row.gender) errors.gender = "Gender is required";
  else if (!GENDERS.includes(row.gender)) errors.gender = "Must be M or F";

  // Age
  const age = Number(row.age);
  if (row.age === "" || row.age === null || row.age === undefined) {
    errors.age = "Age is required";
  } else if (isNaN(age) || age <= 0 || !Number.isInteger(age)) {
    errors.age = "Must be a whole number > 0";
  }

  return errors;
}

function runFullValidation(records) {
  const { nicIndex, nameIndex } = buildIndexes(records);
  return records.map((r) => ({
    ...r,
    errors: validateRow(r, nicIndex, nameIndex),
  }));
}

function isRowValid(errors) {
  return Object.keys(errors).length === 0;
}

// ─── CSV PARSER ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const rows = [];
  // skip header
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 5 && cols.every((c) => !c)) continue;
    rows.push({
      id: `row-${i}`,
      nic: cols[0] || "",
      firstName: cols[1] || "",
      lastName: cols[2] || "",
      gender: cols[3] || "",
      age: cols[4] || "",
      errors: {},
      selected: false,
    });
  }
  return rows;
}

// ─── REDUCER ─────────────────────────────────────────────────────────────────
function tableReducer(state, action) {
  switch (action.type) {
    case "LOAD": {
      const validated = runFullValidation(action.records);
      return {
        records: validated,
        currentPage: 0,
        selectedIds: new Set(),
      };
    }
    case "UPDATE_CELL": {
      const { id, field, value } = action;
      // Update the single record
      const updated = state.records.map((r) =>
        r.id === id ? { ...r, [field]: value } : r,
      );
      // Re-run full validation (indexes rebuild) — O(n) but fast for 2000 records
      const validated = runFullValidation(updated);

      // Fix selection: deselect any newly invalid rows
      const newSelected = new Set(state.selectedIds);
      validated.forEach((r) => {
        if (!isRowValid(r.errors)) newSelected.delete(r.id);
      });

      return { ...state, records: validated, selectedIds: newSelected };
    }
    case "SET_PAGE":
      return { ...state, currentPage: action.page };
    case "TOGGLE_SELECT": {
      const { id, valid } = action;
      if (!valid) return state;
      const newSelected = new Set(state.selectedIds);
      if (newSelected.has(id)) newSelected.delete(id);
      else newSelected.add(id);
      return { ...state, selectedIds: newSelected };
    }
    case "SELECT_PAGE_ALL": {
      const { ids } = action; // only valid ids on page
      const allSelected = ids.every((id) => state.selectedIds.has(id));
      const newSelected = new Set(state.selectedIds);
      if (allSelected) ids.forEach((id) => newSelected.delete(id));
      else ids.forEach((id) => newSelected.add(id));
      return { ...state, selectedIds: newSelected };
    }
    case "DESELECT_ALL":
      return { ...state, selectedIds: new Set() };
    default:
      return state;
  }
}

const initialState = { records: [], currentPage: 0, selectedIds: new Set() };

// ─── ROW COMPONENT (memoized) ─────────────────────────────────────────────────
const TableRow = memo(function TableRow({
  row,
  selected,
  onCellChange,
  onToggleSelect,
  onAction,
}) {
  const valid = isRowValid(row.errors);

  const handleChange = useCallback(
    (field) => (e) => onCellChange(row.id, field, e.target.value),
    [row.id, onCellChange],
  );

  return (
    <tr
      className={`trow ${selected ? "trow--selected" : ""} ${!valid ? "trow--invalid" : ""}`}
    >
      {/* Checkbox */}
      <td className="td td--check">
        <input
          type="checkbox"
          checked={selected}
          disabled={!valid}
          onChange={() => onToggleSelect(row.id, valid)}
          className="cb"
        />
      </td>

      {/* NIC */}
      <td className="td">
        <input
          className={`cell-input ${row.errors.nic ? "cell-input--err" : ""}`}
          value={row.nic}
          onChange={handleChange("nic")}
          placeholder="NIC"
        />
        {row.errors.nic && <span className="err-msg">{row.errors.nic}</span>}
      </td>

      {/* First Name */}
      <td className="td">
        <input
          className={`cell-input ${row.errors.firstName ? "cell-input--err" : ""}`}
          value={row.firstName}
          onChange={handleChange("firstName")}
          placeholder="First name"
        />
        {row.errors.firstName && (
          <span className="err-msg">{row.errors.firstName}</span>
        )}
      </td>

      {/* Last Name */}
      <td className="td">
        <input
          className={`cell-input ${row.errors.lastName ? "cell-input--err" : ""}`}
          value={row.lastName}
          onChange={handleChange("lastName")}
          placeholder="Last name"
        />
        {row.errors.lastName && (
          <span className="err-msg">{row.errors.lastName}</span>
        )}
      </td>

      {/* Gender */}
      <td className="td">
        <select
          className={`cell-select ${row.errors.gender ? "cell-input--err" : ""}`}
          value={row.gender}
          onChange={handleChange("gender")}
        >
          <option value="">—</option>
          <option value="M">M</option>
          <option value="F">F</option>
        </select>
        {row.errors.gender && (
          <span className="err-msg">{row.errors.gender}</span>
        )}
      </td>

      {/* Age */}
      <td className="td">
        <input
          type="number"
          className={`cell-input cell-input--sm ${row.errors.age ? "cell-input--err" : ""}`}
          value={row.age}
          onChange={handleChange("age")}
          placeholder="Age"
          min="1"
        />
        {row.errors.age && <span className="err-msg">{row.errors.age}</span>}
      </td>

      {/* Action */}
      <td className="td td--action">
        <button
          className="btn-action"
          disabled={!valid}
          onClick={() => onAction(row)}
        >
          Add
        </button>
      </td>
    </tr>
  );
});

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DataTableEditor() {
  const [state, dispatch] = useReducer(tableReducer, initialState);
  const [actionLog, setActionLog] = useState([]);
  const fileRef = useRef();

  const { records, currentPage, selectedIds } = state;

  // ── Pagination ──
  const totalPages = Math.ceil(records.length / PAGE_SIZE);
  const pageRecords = useMemo(
    () => records.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [records, currentPage],
  );

  // ── Page-level valid IDs (for header checkbox) ──
  const pageValidIds = useMemo(
    () => pageRecords.filter((r) => isRowValid(r.errors)).map((r) => r.id),
    [pageRecords],
  );

  const pageAllSelected =
    pageValidIds.length > 0 && pageValidIds.every((id) => selectedIds.has(id));

  // ── Bulk selection count ──
  const bulkCount = selectedIds.size;

  // ── Callbacks ──
  const handleCellChange = useCallback((id, field, value) => {
    dispatch({ type: "UPDATE_CELL", id, field, value });
  }, []);

  const handleToggleSelect = useCallback((id, valid) => {
    dispatch({ type: "TOGGLE_SELECT", id, valid });
  }, []);

  const handleSelectPageAll = useCallback(() => {
    dispatch({ type: "SELECT_PAGE_ALL", ids: pageValidIds });
  }, [pageValidIds]);

  const handleAction = useCallback((row) => {
    setActionLog((prev) => [
      `Added: ${row.firstName} ${row.lastName} (${row.nic})`,
      ...prev.slice(0, 9),
    ]);
  }, []);

  const handleBulkAction = useCallback(() => {
    const selected = records.filter((r) => selectedIds.has(r.id));
    setActionLog((prev) => [
      `Bulk added ${selected.length} records`,
      ...prev.slice(0, 9),
    ]);
    dispatch({ type: "DESELECT_ALL" });
  }, [records, selectedIds]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      dispatch({ type: "LOAD", records: parsed });
    };
    reader.readAsText(file);
  }, []);

  // Stats
  const validCount = useMemo(
    () => records.filter((r) => isRowValid(r.errors)).length,
    [records],
  );
  const invalidCount = records.length - validCount;

  return (
    <div className="app">
      <style>{CSS}</style>

      <header className="header">
        <div className="header-brand">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#6366f1" />
            <path
              d="M7 14h14M14 7l7 7-7 7"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="header-title">DataGrid Pro</span>
        </div>
        <Button
          className="btn-upload"
          onClick={() => downloadCSV("/data/data_2.csv", "data_2.csv")}
          style={{ marginRight: 16 }}
        >
          Download CSV
        </Button>
        <div className="header-actions">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          <button
            className="btn-upload"
            onClick={() => fileRef.current.click()}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Upload CSV
          </button>
        </div>
      </header>

      {records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6366f1"
              strokeWidth="1.5"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          </div>
          <h2 className="empty-title">No data loaded</h2>
          <p className="empty-sub">
            Upload a CSV file with columns: NIC, First Name, Last Name, Gender,
            Age
          </p>
          <button
            className="btn-upload btn-upload--lg"
            onClick={() => fileRef.current.click()}
          >
            Choose CSV File
          </button>
          <p className="empty-hint">
            Supports 1,000 – 2,000 records with real-time validation
          </p>
        </div>
      ) : (
        <div className="content">
          {/* Stats bar */}
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-num">{records.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat stat--ok">
              <span className="stat-num">{validCount}</span>
              <span className="stat-label">Valid</span>
            </div>
            <div className="stat stat--err">
              <span className="stat-num">{invalidCount}</span>
              <span className="stat-label">Invalid</span>
            </div>
            <div className="stat stat--sel">
              <span className="stat-num">{bulkCount}</span>
              <span className="stat-label">Selected</span>
            </div>

            <div className="spacer" />

            <button
              className="btn-bulk"
              disabled={bulkCount < 2}
              onClick={handleBulkAction}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
              Bulk Add ({bulkCount})
            </button>
          </div>

          {/* Table */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr className="thead-row">
                  <th className="th th--check">
                    <input
                      type="checkbox"
                      className="cb"
                      checked={pageAllSelected}
                      onChange={handleSelectPageAll}
                      disabled={pageValidIds.length === 0}
                      title="Select all valid on this page"
                    />
                  </th>
                  <th className="th">NIC</th>
                  <th className="th">First Name</th>
                  <th className="th">Last Name</th>
                  <th className="th">Gender</th>
                  <th className="th">Age</th>
                  <th className="th th--action">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageRecords.map((row) => (
                  <TableRow
                    key={row.id}
                    row={row}
                    selected={selectedIds.has(row.id)}
                    onCellChange={handleCellChange}
                    onToggleSelect={handleToggleSelect}
                    onAction={handleAction}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <span className="page-info">
              Page {currentPage + 1} of {totalPages} &nbsp;·&nbsp; Rows{" "}
              {currentPage * PAGE_SIZE + 1}–
              {Math.min((currentPage + 1) * PAGE_SIZE, records.length)} of{" "}
              {records.length}
            </span>
            <div className="page-btns">
              <button
                className="page-btn"
                disabled={currentPage === 0}
                onClick={() => dispatch({ type: "SET_PAGE", page: 0 })}
              >
                «
              </button>
              <button
                className="page-btn"
                disabled={currentPage === 0}
                onClick={() =>
                  dispatch({ type: "SET_PAGE", page: currentPage - 1 })
                }
              >
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pg =
                  totalPages <= 7
                    ? i
                    : Math.max(0, Math.min(currentPage - 3, totalPages - 7)) +
                      i;
                return (
                  <button
                    key={pg}
                    className={`page-btn ${pg === currentPage ? "page-btn--active" : ""}`}
                    onClick={() => dispatch({ type: "SET_PAGE", page: pg })}
                  >
                    {pg + 1}
                  </button>
                );
              })}
              <button
                className="page-btn"
                disabled={currentPage === totalPages - 1}
                onClick={() =>
                  dispatch({ type: "SET_PAGE", page: currentPage + 1 })
                }
              >
                ›
              </button>
              <button
                className="page-btn"
                disabled={currentPage === totalPages - 1}
                onClick={() =>
                  dispatch({ type: "SET_PAGE", page: totalPages - 1 })
                }
              >
                »
              </button>
            </div>
          </div>

          {/* Action log */}
          {actionLog.length > 0 && (
            <div className="log">
              <p className="log-title">Action Log</p>
              {actionLog.map((msg, i) => (
                <div
                  key={i}
                  className={`log-item ${i === 0 ? "log-item--new" : ""}`}
                >
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .app {
    font-family: 'DM Sans', sans-serif;
    background: #0f1117;
    min-height: 100vh;
    color: #e2e8f0;
  }

  /* Header */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 24px;
    background: #161821;
    border-bottom: 1px solid #2d2f3e;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .header-brand { display: flex; align-items: center; gap: 10px; }
  .header-title { font-size: 17px; font-weight: 600; letter-spacing: -0.3px; color: #fff; }

  .btn-upload {
    display: flex; align-items: center; gap: 7px;
    padding: 8px 16px;
    background: #6366f1;
    color: white;
    border: none; border-radius: 8px;
    font-family: inherit; font-size: 13px; font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
  }
  .btn-upload:hover { background: #4f52d8; }
  .btn-upload:active { transform: scale(0.98); }
  .btn-upload--lg { margin-top: 20px; padding: 11px 24px; font-size: 14px; }

  /* Empty state */
  .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: calc(100vh - 60px);
    text-align: center; padding: 40px;
  }
  .empty-icon { margin-bottom: 20px; opacity: 0.8; }
  .empty-title { font-size: 22px; font-weight: 600; color: #e2e8f0; margin-bottom: 8px; }
  .empty-sub { color: #64748b; font-size: 14px; max-width: 400px; line-height: 1.6; }
  .empty-hint { margin-top: 12px; color: #475569; font-size: 12px; }

  /* Content */
  .content { padding: 20px 24px; }

  /* Stats */
  .stats-bar {
    display: flex; align-items: center; gap: 4px;
    margin-bottom: 16px;
    padding: 10px 16px;
    background: #161821;
    border: 1px solid #2d2f3e;
    border-radius: 10px;
  }
  .stat { display: flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 6px; }
  .stat-num { font-family: 'DM Mono', monospace; font-size: 16px; font-weight: 500; }
  .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .stat--ok .stat-num { color: #34d399; }
  .stat--err .stat-num { color: #f87171; }
  .stat--sel .stat-num { color: #818cf8; }
  .spacer { flex: 1; }

  .btn-bulk {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 16px;
    background: #1e2030;
    border: 1px solid #3b3d52;
    border-radius: 8px;
    color: #a5b4fc;
    font-family: inherit; font-size: 13px; font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-bulk:hover:not(:disabled) { background: #272a3d; border-color: #6366f1; color: #818cf8; }
  .btn-bulk:disabled { opacity: 0.35; cursor: not-allowed; }

  /* Table */
  .table-wrap {
    overflow-x: auto;
    border: 1px solid #2d2f3e;
    border-radius: 10px;
    background: #161821;
  }
  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .thead-row { background: #1a1d2e; }
  .th {
    padding: 11px 12px;
    text-align: left;
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.6px;
    color: #64748b;
    border-bottom: 1px solid #2d2f3e;
    white-space: nowrap;
  }
  .th--check { width: 44px; text-align: center; }
  .th--action { width: 80px; text-align: center; }

  .trow { border-bottom: 1px solid #1e2030; transition: background 0.1s; }
  .trow:hover { background: #1a1d2e; }
  .trow--selected { background: #1c1f35 !important; }
  .trow--invalid { }
  .trow:last-child { border-bottom: none; }

  .td { padding: 6px 8px; vertical-align: top; }
  .td--check { text-align: center; padding-top: 12px; }
  .td--action { text-align: center; padding-top: 8px; }

  .cb {
    width: 16px; height: 16px;
    accent-color: #6366f1;
    cursor: pointer;
  }
  .cb:disabled { opacity: 0.3; cursor: not-allowed; }

  .cell-input, .cell-select {
    width: 100%;
    padding: 6px 8px;
    background: #0f1117;
    border: 1px solid #2d2f3e;
    border-radius: 6px;
    color: #e2e8f0;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
  }
  .cell-input:focus, .cell-select:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99,102,241,0.15);
  }
  .cell-input--err {
    border-color: #ef4444 !important;
    background: #1a0f0f;
  }
  .cell-input--sm { max-width: 80px; }
  .cell-select { cursor: pointer; }

  .err-msg {
    display: block;
    margin-top: 3px;
    font-size: 10px;
    color: #f87171;
    line-height: 1.3;
    font-family: 'DM Mono', monospace;
  }

  .btn-action {
    padding: 5px 12px;
    background: transparent;
    border: 1px solid #3b3d52;
    border-radius: 6px;
    color: #a5b4fc;
    font-family: inherit; font-size: 12px; font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .btn-action:hover:not(:disabled) {
    background: #272a3d; border-color: #6366f1;
  }
  .btn-action:disabled { opacity: 0.25; cursor: not-allowed; }

  /* Pagination */
  .pagination {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 16px;
    padding: 10px 4px;
  }
  .page-info { font-size: 12px; color: #475569; font-family: 'DM Mono', monospace; }
  .page-btns { display: flex; gap: 4px; }
  .page-btn {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    background: #161821;
    border: 1px solid #2d2f3e;
    border-radius: 6px;
    color: #94a3b8;
    font-family: inherit; font-size: 12px;
    cursor: pointer;
    transition: all 0.1s;
  }
  .page-btn:hover:not(:disabled):not(.page-btn--active) {
    border-color: #6366f1; color: #a5b4fc;
  }
  .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .page-btn--active {
    background: #6366f1; border-color: #6366f1;
    color: white; font-weight: 600;
  }

  /* Action log */
  .log {
    margin-top: 20px;
    padding: 14px 16px;
    background: #161821;
    border: 1px solid #2d2f3e;
    border-radius: 10px;
  }
  .log-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: #475569; margin-bottom: 8px; }
  .log-item {
    padding: 5px 0;
    font-size: 12px; font-family: 'DM Mono', monospace;
    color: #64748b;
    border-bottom: 1px solid #1e2030;
  }
  .log-item:last-child { border-bottom: none; }
  .log-item--new { color: #34d399; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0f1117; }
  ::-webkit-scrollbar-thumb { background: #2d2f3e; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #3b3d52; }
`;
