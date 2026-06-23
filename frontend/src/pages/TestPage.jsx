import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Keyboard,
  MousePointer2,
  Upload,
} from "lucide-react";
import Header from "../components/Header";

/* ----------------------------- Section helpers ---------------------------- */

const Section = ({ id, title, hint, children }) => (
  <section
    data-testid={`section-${id}`}
    id={id}
    className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md"
  >
    <header className="mb-4">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
        {title}
      </h2>
      {hint && <p className="mt-0.5 text-sm text-zinc-500">{hint}</p>}
    </header>
    <div className="space-y-3">{children}</div>
  </section>
);

const Result = ({ testId, label = "Result", value }) => (
  <div
    data-testid={testId}
    className="flex items-start gap-2 rounded-md bg-zinc-50 px-3 py-2 text-sm"
  >
    <span className="font-medium text-zinc-500">{label}:</span>
    <code className="break-all font-mono text-zinc-900">
      {value === "" || value === null || value === undefined ? "—" : String(value)}
    </code>
  </div>
);

const Btn = ({ testId, onClick, children, variant = "primary", ...rest }) => {
  const styles = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]",
    outline:
      "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 active:scale-[0.98]",
    danger:
      "border border-red-200 bg-white text-red-700 hover:bg-red-50 active:scale-[0.98]",
  };
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-semibold transition ${styles[variant]}`}
      {...rest}
    >
      {children}
    </button>
  );
};

/* --------------------------------- Page ----------------------------------- */

const SECTIONS = [
  ["click", "Click actions"],
  ["typing", "Typing & clear"],
  ["hover", "Hover"],
  ["select", "Dropdown / select"],
  ["checkbox", "Checkbox"],
  ["radio", "Radio button"],
  ["keyboard", "Keyboard actions"],
  ["mouse", "Mouse / drag-drop"],
  ["upload", "File upload"],
  ["date", "Date / range / color"],
  ["dialogs", "Native dialogs"],
  ["wait", "Wait conditions"],
  ["state", "Disabled / visibility"],
  ["table", "Table & selection"],
  ["iframe", "Iframe & new tab"],
  ["scroll", "Scroll"],
];

const TestPage = () => {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <PageHeader />
        <nav
          data-testid="test-toc"
          className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm"
        >
          {SECTIONS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              data-testid={`toc-${id}`}
              className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ClickSection />
          <TypingSection />
          <HoverSection />
          <SelectSection />
          <CheckboxSection />
          <RadioSection />
          <KeyboardSection />
          <MouseSection />
          <UploadSection />
          <DateColorRangeSection />
          <DialogsSection />
          <WaitSection />
          <StateSection />
          <TableSection />
          <IframeAndNewTabSection />
          <ScrollSection />
        </div>
      </main>
    </div>
  );
};

const PageHeader = () => (
  <header className="mb-6">
    <h1
      data-testid="test-page-title"
      className="text-3xl font-semibold tracking-tight text-zinc-900"
    >
      Automation Playground
    </h1>
    <p
      data-testid="test-page-subtitle"
      className="mt-1 text-sm text-zinc-500"
    >
      A single page with stable <code>data-testid</code> selectors for every
      common browser automation control. Use the &ldquo;Result&rdquo; boxes for assertions.
    </p>
  </header>
);

/* ------------------------------ 1. Click ---------------------------------- */

const ClickSection = () => {
  const [count, setCount] = useState(0);
  const [dblCount, setDblCount] = useState(0);
  const [right, setRight] = useState("");

  return (
    <Section
      id="click"
      title="Click actions"
      hint="Single click, double click, right click (context menu)."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Btn testId="test-click-button" onClick={() => setCount((c) => c + 1)}>
          Click me
        </Btn>
        <Btn
          testId="test-doubleclick-button"
          variant="outline"
          onDoubleClick={() => setDblCount((c) => c + 1)}
        >
          Double-click me
        </Btn>
        <Btn
          testId="test-rightclick-button"
          variant="outline"
          onContextMenu={(e) => {
            e.preventDefault();
            setRight(new Date().toLocaleTimeString());
          }}
        >
          Right-click me
        </Btn>
      </div>
      <Result testId="test-click-result" value={`clicks=${count}`} />
      <Result testId="test-doubleclick-result" value={`double-clicks=${dblCount}`} />
      <Result testId="test-rightclick-result" value={right} />
    </Section>
  );
};

/* ------------------------- 2. Typing & Clear ------------------------------ */

const TypingSection = () => {
  const [text, setText] = useState("");
  const [textarea, setTextarea] = useState("");
  const [clearable, setClearable] = useState("");

  return (
    <Section id="typing" title="Typing & clear" hint="Type, paste, clear inputs.">
      <label className="block text-sm font-medium text-zinc-700">
        Single-line input
        <input
          data-testid="test-type-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-1 block h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </label>
      <Result testId="test-type-result" value={text} />

      <label className="block text-sm font-medium text-zinc-700">
        Textarea
        <textarea
          data-testid="test-textarea"
          value={textarea}
          onChange={(e) => setTextarea(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </label>
      <Result testId="test-textarea-result" value={textarea} />

      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
        <label className="block text-sm font-medium text-zinc-700">
          Clearable input
          <div className="mt-1 flex gap-2">
            <input
              data-testid="test-clear-input"
              value={clearable}
              onChange={(e) => setClearable(e.target.value)}
              className="block h-10 flex-1 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <Btn
              testId="test-clear-button"
              variant="danger"
              onClick={() => setClearable("")}
            >
              Clear
            </Btn>
          </div>
        </label>
        <div className="mt-3">
          <Result testId="test-clear-result" value={clearable} />
        </div>
      </div>
    </Section>
  );
};

/* ----------------------------- 3. Hover ----------------------------------- */

const HoverSection = () => {
  const [hovering, setHovering] = useState(false);
  return (
    <Section id="hover" title="Hover" hint="Reveal a tooltip on mouse-enter.">
      <div
        data-testid="test-hover-target"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="relative inline-flex h-12 cursor-pointer items-center rounded-md border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
      >
        Hover over me
        {hovering && (
          <span
            data-testid="test-hover-tooltip"
            role="tooltip"
            className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg"
          >
            Tooltip is visible
          </span>
        )}
      </div>
      <Result
        testId="test-hover-result"
        value={hovering ? "hovering" : "idle"}
      />
    </Section>
  );
};

/* ------------------------ 4. Dropdown / select ---------------------------- */

const SelectSection = () => {
  const [single, setSingle] = useState("");
  const [multi, setMulti] = useState([]);
  return (
    <Section
      id="select"
      title="Dropdown / select"
      hint="Single-select and multi-select native dropdowns."
    >
      <label className="block text-sm font-medium text-zinc-700">
        Country (single)
        <select
          data-testid="test-select-dropdown"
          value={single}
          onChange={(e) => setSingle(e.target.value)}
          className="mt-1 block h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">— pick one —</option>
          <option value="india">India</option>
          <option value="usa">United States</option>
          <option value="uk">United Kingdom</option>
          <option value="japan">Japan</option>
          <option value="germany">Germany</option>
        </select>
      </label>
      <Result testId="test-select-result" value={single} />

      <label className="block text-sm font-medium text-zinc-700">
        Languages (multi — Ctrl/Cmd-click)
        <select
          data-testid="test-multiselect-dropdown"
          multiple
          value={multi}
          onChange={(e) =>
            setMulti(Array.from(e.target.selectedOptions).map((o) => o.value))
          }
          className="mt-1 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
          size={4}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="csharp">C#</option>
          <option value="go">Go</option>
          <option value="ruby">Ruby</option>
        </select>
      </label>
      <Result testId="test-multiselect-result" value={multi.join(",")} />
    </Section>
  );
};

/* ----------------------------- 5. Checkbox -------------------------------- */

const CheckboxSection = () => {
  const [single, setSingle] = useState(false);
  const [group, setGroup] = useState({ react: false, vue: false, svelte: false });

  return (
    <Section id="checkbox" title="Checkbox" hint="Single & group checkboxes.">
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          data-testid="test-checkbox-single"
          type="checkbox"
          checked={single}
          onChange={(e) => setSingle(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
        />
        I accept the demo terms
      </label>
      <Result
        testId="test-checkbox-single-result"
        value={single ? "checked" : "unchecked"}
      />

      <fieldset className="rounded-md border border-zinc-200 p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Favorite frameworks
        </legend>
        {Object.keys(group).map((key) => (
          <label key={key} className="flex items-center gap-2 py-0.5 text-sm text-zinc-700">
            <input
              data-testid={`test-checkbox-${key}`}
              type="checkbox"
              checked={group[key]}
              onChange={(e) =>
                setGroup((g) => ({ ...g, [key]: e.target.checked }))
              }
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </label>
        ))}
      </fieldset>
      <Result
        testId="test-checkbox-group-result"
        value={Object.entries(group)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(",")}
      />
    </Section>
  );
};

/* ----------------------------- 6. Radio ----------------------------------- */

const RadioSection = () => {
  const [value, setValue] = useState("");
  return (
    <Section id="radio" title="Radio button" hint="Mutually-exclusive choice.">
      {["small", "medium", "large"].map((opt) => (
        <label key={opt} className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            data-testid={`test-radio-${opt}`}
            type="radio"
            name="size"
            value={opt}
            checked={value === opt}
            onChange={(e) => setValue(e.target.value)}
            className="h-4 w-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          />
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </label>
      ))}
      <Result testId="test-radio-result" value={value} />
    </Section>
  );
};

/* --------------------------- 7. Keyboard ---------------------------------- */

const KeyboardSection = () => {
  const [last, setLast] = useState("");
  const [combo, setCombo] = useState("");
  const [enterCount, setEnterCount] = useState(0);

  return (
    <Section
      id="keyboard"
      title="Keyboard actions"
      hint="Capture key presses, modifiers, Enter."
    >
      <label className="block text-sm font-medium text-zinc-700">
        <span className="flex items-center gap-1.5">
          <Keyboard className="h-3.5 w-3.5" />
          Focus & press any key
        </span>
        <input
          data-testid="test-key-target"
          onKeyDown={(e) => {
            setLast(e.key);
            const mods = [];
            if (e.ctrlKey) mods.push("Ctrl");
            if (e.shiftKey) mods.push("Shift");
            if (e.altKey) mods.push("Alt");
            if (e.metaKey) mods.push("Meta");
            setCombo([...mods, e.key].join("+"));
            if (e.key === "Enter") setEnterCount((c) => c + 1);
          }}
          placeholder="Click here, then press a key…"
          className="mt-1 block h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </label>
      <Result testId="test-key-last" label="last key" value={last} />
      <Result testId="test-key-combo" label="combo" value={combo} />
      <Result testId="test-key-enter-count" label="enter count" value={enterCount} />
    </Section>
  );
};

/* ------------------------ 8. Mouse / drag-drop ---------------------------- */

const MouseSection = () => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dropped, setDropped] = useState(false);
  const [dragging, setDragging] = useState(false);

  return (
    <Section
      id="mouse"
      title="Mouse actions"
      hint="Track coordinates, drag a tile into the drop zone."
    >
      <div
        data-testid="test-mouse-track"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({
            x: Math.round(e.clientX - r.left),
            y: Math.round(e.clientY - r.top),
          });
        }}
        className="flex h-24 items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500"
      >
        <span className="flex items-center gap-2">
          <MousePointer2 className="h-4 w-4" />
          Move your mouse here
        </span>
      </div>
      <Result testId="test-mouse-position" label="position" value={`${pos.x},${pos.y}`} />

      <div className="grid grid-cols-2 gap-3">
        <div
          data-testid="test-drag-source"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "TILE");
            setDragging(true);
          }}
          onDragEnd={() => setDragging(false)}
          className={`flex h-20 cursor-move items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700 transition ${
            dragging ? "opacity-50" : ""
          }`}
        >
          Drag me
        </div>
        <div
          data-testid="test-drop-target"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.getData("text/plain") === "TILE") {
              setDropped(true);
            }
          }}
          className={`flex h-20 items-center justify-center rounded-md border-2 border-dashed text-sm font-medium transition ${
            dropped
              ? "border-emerald-500 bg-emerald-100 text-emerald-700"
              : "border-zinc-300 bg-white text-zinc-500"
          }`}
        >
          {dropped ? "Tile dropped ✓" : "Drop here"}
        </div>
      </div>
      <Result testId="test-drop-result" value={dropped ? "dropped" : "empty"} />
    </Section>
  );
};

/* --------------------------- 9. File upload ------------------------------- */

const UploadSection = () => {
  const [info, setInfo] = useState(null);
  const [multi, setMulti] = useState([]);
  return (
    <Section
      id="upload"
      title="File upload"
      hint="Single & multiple file inputs."
    >
      <label className="block text-sm font-medium text-zinc-700">
        <span className="flex items-center gap-1.5">
          <Upload className="h-3.5 w-3.5" /> Single file
        </span>
        <input
          data-testid="test-file-upload"
          type="file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setInfo(f ? { name: f.name, size: f.size, type: f.type || "—" } : null);
          }}
          className="mt-1 block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700"
        />
      </label>
      <Result
        testId="test-file-name"
        label="file"
        value={info ? `${info.name} (${info.size} bytes, ${info.type})` : ""}
      />

      <label className="block text-sm font-medium text-zinc-700">
        Multiple files
        <input
          data-testid="test-file-multi"
          type="file"
          multiple
          onChange={(e) =>
            setMulti(Array.from(e.target.files || []).map((f) => f.name))
          }
          className="mt-1 block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border file:border-zinc-200 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-50"
        />
      </label>
      <Result testId="test-file-multi-result" value={multi.join(",")} />
    </Section>
  );
};

/* --------------------- 10. Date / range / color --------------------------- */

const DateColorRangeSection = () => {
  const [date, setDate] = useState("");
  const [range, setRange] = useState(50);
  const [color, setColor] = useState("#10b981");
  return (
    <Section id="date" title="Date, range & color">
      <label className="block text-sm font-medium text-zinc-700">
        Date
        <input
          data-testid="test-date-picker"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
        />
      </label>
      <Result testId="test-date-result" value={date} />

      <label className="block text-sm font-medium text-zinc-700">
        Range (0–100)
        <input
          data-testid="test-range-slider"
          type="range"
          min={0}
          max={100}
          value={range}
          onChange={(e) => setRange(Number(e.target.value))}
          className="mt-2 block w-full accent-emerald-600"
        />
      </label>
      <Result testId="test-range-result" value={range} />

      <label className="block text-sm font-medium text-zinc-700">
        Color
        <input
          data-testid="test-color-picker"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="mt-1 h-10 w-20 cursor-pointer rounded-md border border-zinc-200 bg-white"
        />
      </label>
      <Result testId="test-color-result" value={color} />
    </Section>
  );
};

/* ---------------------------- 11. Dialogs --------------------------------- */

const DialogsSection = () => {
  const [last, setLast] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <Section
      id="dialogs"
      title="Native & custom dialogs"
      hint="window.alert / confirm / prompt + an in-page modal."
    >
      <div className="flex flex-wrap gap-2">
        <Btn
          testId="test-alert-button"
          variant="outline"
          onClick={() => {
            window.alert("This is a native alert.");
            setLast("alert-acknowledged");
          }}
        >
          Trigger alert
        </Btn>
        <Btn
          testId="test-confirm-button"
          variant="outline"
          onClick={() => {
            const ok = window.confirm("Confirm this action?");
            setLast(ok ? "confirm-ok" : "confirm-cancel");
          }}
        >
          Trigger confirm
        </Btn>
        <Btn
          testId="test-prompt-button"
          variant="outline"
          onClick={() => {
            const val = window.prompt("Type something:");
            setLast(val == null ? "prompt-cancel" : `prompt:${val}`);
          }}
        >
          Trigger prompt
        </Btn>
        <Btn testId="test-modal-open" onClick={() => setModalOpen(true)}>
          Open modal
        </Btn>
      </div>
      <Result testId="test-dialog-result" value={last} />

      {modalOpen && (
        <div
          data-testid="test-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3
              data-testid="test-modal-title"
              className="text-lg font-semibold text-zinc-900"
            >
              Custom modal
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              In-page modal for testing focus traps & overlays.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Btn
                testId="test-modal-cancel"
                variant="outline"
                onClick={() => {
                  setLast("modal-cancel");
                  setModalOpen(false);
                }}
              >
                Cancel
              </Btn>
              <Btn
                testId="test-modal-confirm"
                onClick={() => {
                  setLast("modal-confirm");
                  setModalOpen(false);
                }}
              >
                Confirm
              </Btn>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
};

/* ---------------------- 12. Wait conditions ------------------------------- */

const WaitSection = () => {
  const [showDelayed, setShowDelayed] = useState(false);
  const [dynamic, setDynamic] = useState("Initial value");
  const [loading, setLoading] = useState(false);

  const tickRef = useRef(null);
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setDynamic(`tick ${new Date().toLocaleTimeString()}`);
    }, 2000);
    return () => clearInterval(tickRef.current);
  }, []);

  const startDelay = () => {
    setLoading(true);
    setShowDelayed(false);
    setTimeout(() => {
      setShowDelayed(true);
      setLoading(false);
    }, 3000);
  };

  return (
    <Section
      id="wait"
      title="Wait conditions"
      hint="Element appears after 3s, text changes every 2s, optimistic spinner."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Btn testId="test-trigger-delayed" onClick={startDelay} disabled={loading}>
          {loading ? "Loading…" : "Show delayed element"}
        </Btn>
        {loading && (
          <span
            data-testid="test-loading-spinner"
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-600"
          />
        )}
      </div>
      {showDelayed && (
        <div
          data-testid="test-delayed-element"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
        >
          I appeared after 3 seconds.
        </div>
      )}
      <Result testId="test-dynamic-text" label="dynamic" value={dynamic} />
    </Section>
  );
};

/* ----------------- 13. Disabled / visibility ------------------------------ */

const StateSection = () => {
  const [disabled, setDisabled] = useState(false);
  const [hidden, setHidden] = useState(false);
  return (
    <Section
      id="state"
      title="Disabled & visibility"
      hint="Toggle a button enabled/disabled and an element shown/hidden."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Btn
          testId="test-toggle-disabled"
          variant="outline"
          onClick={() => setDisabled((v) => !v)}
        >
          {disabled ? "Enable target" : "Disable target"}
        </Btn>
        <button
          type="button"
          data-testid="test-disable-target"
          disabled={disabled}
          className="inline-flex h-10 items-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Btn
          testId="test-toggle-visibility"
          variant="outline"
          onClick={() => setHidden((v) => !v)}
        >
          {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {hidden ? "Show element" : "Hide element"}
        </Btn>
        {!hidden && (
          <span
            data-testid="test-hidden-target"
            className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
          >
            I am visible
          </span>
        )}
      </div>
    </Section>
  );
};

/* ---------------------------- 14. Table ----------------------------------- */

const PEOPLE = [
  { id: 1, name: "Alice", role: "QA Lead", city: "Mumbai" },
  { id: 2, name: "Bob", role: "Developer", city: "Bengaluru" },
  { id: 3, name: "Charlie", role: "Designer", city: "Hyderabad" },
  { id: 4, name: "Diana", role: "PM", city: "Pune" },
];

const TableSection = () => {
  const [sort, setSort] = useState({ key: "id", dir: "asc" });
  const [selected, setSelected] = useState([]);

  const rows = useMemo(() => {
    const arr = [...PEOPLE];
    arr.sort((a, b) => {
      const sa = String(a[sort.key]).toLowerCase();
      const sb = String(b[sort.key]).toLowerCase();
      if (sa < sb) return sort.dir === "asc" ? -1 : 1;
      if (sa > sb) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [sort]);

  const toggle = (id) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );

  const headers = [
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "city", label: "City" },
  ];

  return (
    <Section
      id="table"
      title="Table & selection"
      hint="Sortable columns + row checkboxes."
    >
      <div className="overflow-hidden rounded-md border border-zinc-200">
        <table data-testid="test-table" className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-3 py-2"></th>
              {headers.map((h) => (
                <th key={h.key} className="px-3 py-2">
                  <button
                    type="button"
                    data-testid={`test-table-sort-${h.key}`}
                    onClick={() =>
                      setSort((s) => ({
                        key: h.key,
                        dir: s.key === h.key && s.dir === "asc" ? "desc" : "asc",
                      }))
                    }
                    className="inline-flex items-center gap-1 font-semibold hover:text-zinc-900"
                  >
                    {h.label}
                    {sort.key === h.key &&
                      (sort.dir === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((p) => (
              <tr key={p.id} data-testid={`test-table-row-${p.id}`}>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    data-testid={`test-table-select-${p.id}`}
                    checked={selected.includes(p.id)}
                    onChange={() => toggle(p.id)}
                    className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </td>
                <td data-testid={`test-table-name-${p.id}`} className="px-3 py-2 font-medium text-zinc-900">
                  {p.name}
                </td>
                <td className="px-3 py-2 text-zinc-600">{p.role}</td>
                <td className="px-3 py-2 text-zinc-600">{p.city}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Result
        testId="test-table-selected"
        label="selected ids"
        value={selected.join(",")}
      />
    </Section>
  );
};

/* ----------------------- 15. Iframe & new tab ----------------------------- */

const IframeAndNewTabSection = () => (
  <Section
    id="iframe"
    title="Iframe & new tab"
    hint="Switch frame / handle new window."
  >
    <iframe
      data-testid="test-iframe"
      title="inner-frame"
      srcDoc={
        '<!doctype html><html><body style="font-family:system-ui;padding:16px;background:#f4f4f5;color:#18181b;margin:0;">' +
        '<h3 data-testid="iframe-heading" style="margin:0 0 8px">Inside the iframe</h3>' +
        '<button data-testid="iframe-button" onclick="document.getElementById(\'r\').innerText=\'iframe-clicked\'">Click inside frame</button>' +
        '<p id="r" data-testid="iframe-result" style="margin-top:8px;font-family:ui-monospace,monospace;color:#52525b">—</p>' +
        '</body></html>'
      }
      className="h-44 w-full rounded-md border border-zinc-200 bg-white"
    />
    <a
      href="https://playwright.dev/"
      target="_blank"
      rel="noopener noreferrer"
      data-testid="test-new-tab-link"
      className="inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
    >
      Open Playwright docs in new tab
    </a>
  </Section>
);

/* ----------------------------- 16. Scroll --------------------------------- */

const ScrollSection = () => {
  return (
    <Section
      id="scroll"
      title="Scroll & anchor"
      hint="Tall scrollable area + scroll to bottom anchor."
    >
      <div
        data-testid="test-scroll-container"
        className="h-44 overflow-y-auto rounded-md border border-zinc-200 bg-white p-3"
      >
        {Array.from({ length: 30 }).map((_, i) => (
          <p
            key={i}
            data-testid={`test-scroll-line-${i + 1}`}
            className="border-b border-zinc-100 py-1 text-sm text-zinc-600 last:border-b-0"
          >
            Line {i + 1} — scroll down to find the anchor.
          </p>
        ))}
        <div
          data-testid="test-scroll-anchor"
          className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
        >
          🎯 You found the anchor
        </div>
      </div>
      <Btn
        testId="test-scroll-to-anchor"
        variant="outline"
        onClick={() =>
          document
            .querySelector('[data-testid="test-scroll-anchor"]')
            ?.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      >
        <ArrowDownToLine className="h-4 w-4" />
        Scroll to anchor
      </Btn>
    </Section>
  );
};

export default TestPage;
