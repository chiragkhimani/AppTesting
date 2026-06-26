import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Keyboard,
  MousePointer2,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
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

/* ------------------------------ Snippet card ------------------------------ */

// Minimal TypeScript / Playwright tokenizer for in-browser syntax highlighting.
// Avoids pulling in highlight.js / prismjs as deps.
const TS_KEYWORDS = new Set([
  "await", "async", "const", "let", "var", "function", "return", "new",
  "if", "else", "for", "while", "class", "import", "from", "export",
  "true", "false", "null", "undefined", "of", "in", "as", "type",
]);
const TS_BUILTINS = new Set([
  "page", "expect", "context", "browser", "test", "console", "document", "window",
]);

const tokenizeTs = (src) => {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const rest = src.slice(i);
    let m;
    if ((m = rest.match(/^\/\/[^\n]*/)))      { out.push(["c", m[0]]); i += m[0].length; continue; }
    if ((m = rest.match(/^\/\*[\s\S]*?\*\//))) { out.push(["c", m[0]]); i += m[0].length; continue; }
    if ((m = rest.match(/^'(?:\\.|[^'\\])*'/))) { out.push(["s", m[0]]); i += m[0].length; continue; }
    if ((m = rest.match(/^"(?:\\.|[^"\\])*"/))) { out.push(["s", m[0]]); i += m[0].length; continue; }
    if ((m = rest.match(/^`(?:\\.|[^`\\])*`/))) { out.push(["s", m[0]]); i += m[0].length; continue; }
    if ((m = rest.match(/^\/(?:\\.|[^/\\\n])+\/[gimsuy]*/))) { out.push(["r", m[0]]); i += m[0].length; continue; }
    if ((m = rest.match(/^\b\d+(?:\.\d+)?\b/))) { out.push(["n", m[0]]); i += m[0].length; continue; }
    if ((m = rest.match(/^[A-Za-z_$][\w$]*/))) {
      const w = m[0];
      const kind = TS_KEYWORDS.has(w) ? "k" : TS_BUILTINS.has(w) ? "b" : "i";
      out.push([kind, w]);
      i += w.length;
      continue;
    }
    if ((m = rest.match(/^\s+/))) { out.push(["w", m[0]]); i += m[0].length; continue; }
    out.push(["p", src[i]]);
    i++;
  }
  return out;
};

const TOK_CLASS = {
  c: "text-zinc-500 italic",          // comment
  s: "text-emerald-300",              // string
  r: "text-amber-300",                // regex literal
  n: "text-orange-300",               // number
  k: "text-pink-400",                 // keyword
  b: "text-cyan-300",                 // builtin (page, expect, …)
  i: "text-zinc-100",                 // identifier
  p: "text-zinc-400",                 // punctuation
  w: "",                              // whitespace
};

const Snippet = ({ code, testId, collapsible = true, maxLines = 10 }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lines = code.split("\n");
  const tooLong = collapsible && lines.length > maxLines;
  const display = tooLong && !expanded
    ? lines.slice(0, maxLines).join("\n") + "\n…"
    : code;
  const tokens = useMemo(() => tokenizeTs(display), [display]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      toast.error("Clipboard not available");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 text-[12px] shadow-inner ring-1 ring-zinc-900/60">
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          playwright · typescript
        </span>
        <button
          type="button"
          onClick={onCopy}
          aria-label="Copy code"
          data-testid={testId ? `${testId}-copy` : undefined}
          className="inline-flex h-6 items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 text-[10px] font-medium text-zinc-200 transition hover:border-emerald-500/40 hover:bg-zinc-700 hover:text-emerald-300"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre
        data-testid={testId}
        className="overflow-x-auto p-3 font-mono leading-relaxed"
      >
        <code>
          {tokens.map((t, idx) => (
            <span key={idx} className={TOK_CLASS[t[0]]}>
              {t[1]}
            </span>
          ))}
        </code>
      </pre>
      {tooLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="block w-full border-t border-zinc-800/80 bg-zinc-900/60 py-1 text-center text-[11px] font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-emerald-300"
        >
          {expanded ? "Show less" : `Show ${lines.length - maxLines} more lines`}
        </button>
      )}
    </div>
  );
};

const Badge = ({ tone = "emerald", children }) => {
  const tones = {
    emerald: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-100 text-amber-700 ring-amber-200",
    zinc: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

/* --------------------------------- Page ----------------------------------- */

const SECTIONS = [
  ["dyn-id", "Dynamic ID"],
  ["dyn-text", "Dynamic Text"],
  ["spinner", "Loading Spinner"],
  ["delayed", "Delayed Element"],
  ["dyn-table", "Dynamic Table"],
  ["case-link", "Case-insensitive link"],
  ["alert-dialog", "Alert Dialog (prompt)"],
  ["popup", "Popup window"],
  ["new-tab", "New tab"],
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

        <div className="mb-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-emerald-800">
            <Sparkles className="h-4 w-4" /> Playwright scenarios
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Real-world locator gotchas — each card ships with the exact
            Playwright snippet that targets it.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DynamicIdSection />
          <DynamicTextSection />
          <LoadingSpinnerSection />
          <DelayedElementSection />
          <DynamicTableSection />
          <CaseInsensitiveLinkSection />
          <AlertDialogSection />
          <PopupSection />
          <NewTabSection />
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900">
            Control fixtures
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Every common browser-automation control, ready for assertion.
          </p>
        </div>

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

/* ============================================================
   PLAYWRIGHT SCENARIOS
   ============================================================ */

/* ----- 0a. Dynamic ID -------------------------------------------------- */

const randomId = () => "user_" + Math.random().toString(36).slice(2, 10);

const DynamicIdSection = () => {
  const [uid, setUid] = useState(randomId());
  const [clicked, setClicked] = useState(false);
  return (
    <Section
      id="dyn-id"
      title="Problem 1 — Dynamic ID"
      hint="The element id changes on every render. Use a prefix selector."
    >
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          id={uid}
          data-testid="dyn-id-target"
          onClick={() => setClicked(true)}
          className="inline-flex h-10 items-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
        >
          Click me ({uid})
        </button>
        <Btn
          testId="dyn-id-regenerate"
          variant="outline"
          onClick={() => {
            setUid(randomId());
            setClicked(false);
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Regenerate id
        </Btn>
      </div>
      <Result testId="dyn-id-current" label="current id" value={uid} />
      <Result testId="dyn-id-result" label="clicked" value={clicked ? "yes" : "no"} />
      <Snippet
        testId="dyn-id-snippet"
        code={`await page.locator('[id^="user_"]').click();`}
      />
    </Section>
  );
};

/* ----- 0b. Dynamic Text ------------------------------------------------- */

const NAMES = ["Alice", "Bob", "Chirag", "Diana", "Eve", "Felix", "Gina"];

const DynamicTextSection = () => {
  const [name, setName] = useState(NAMES[0]);
  const [now, setNow] = useState(() => new Date().toLocaleTimeString());
  useEffect(() => {
    const t = setInterval(() => {
      setName(NAMES[Math.floor(Math.random() * NAMES.length)]);
      setNow(new Date().toLocaleTimeString());
    }, 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <Section
      id="dyn-text"
      title="Problem 2 — Dynamic Text"
      hint="Stable substring inside an ever-changing string. Match with /Welcome/."
    >
      <div
        data-testid="dyn-text-banner"
        className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
      >
        <span className="font-semibold">Welcome</span>, {name} —{" "}
        <span className="font-mono">{now}</span>
      </div>
      <Snippet
        testId="dyn-text-snippet"
        code={`await expect(page.getByText(/Welcome/)).toBeVisible();`}
      />
    </Section>
  );
};

/* ----- 0c. Loading Spinner --------------------------------------------- */

const LoadingSpinnerSection = () => {
  const [loading, setLoading] = useState(false);
  const start = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2500);
  };
  return (
    <Section
      id="spinner"
      title="Problem 3 — Loading Spinner"
      hint="Use .loader class. Wait for it to be hidden before continuing."
    >
      <div className="flex items-center gap-3">
        <Btn testId="spinner-start" onClick={start} disabled={loading}>
          {loading ? "Loading…" : "Trigger load"}
        </Btn>
        {loading && (
          <span
            className="loader inline-block h-6 w-6 animate-spin rounded-full border-[3px] border-zinc-200 border-t-emerald-600"
            data-testid="spinner-loader"
            aria-label="Loading"
          />
        )}
      </div>
      <Result
        testId="spinner-state"
        label="spinner"
        value={loading ? "visible" : "hidden"}
      />
      <Snippet
        testId="spinner-snippet"
        code={`await page.getByTestId('spinner-start').click();
await expect(page.locator('.loader')).toBeHidden();`}
      />
    </Section>
  );
};

/* ----- 0d. Delayed Element --------------------------------------------- */

const DelayedElementSection = () => {
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const trigger = () => {
    setShow(false);
    setPending(true);
    setTimeout(() => {
      setShow(true);
      setPending(false);
    }, 2000);
  };
  return (
    <Section
      id="delayed"
      title="Problem 4 — Delayed Element"
      hint="Element appears 2s after the click. Locator: .result"
    >
      <Btn testId="delayed-trigger" onClick={trigger} disabled={pending}>
        {pending ? "Working…" : "Run computation"}
      </Btn>
      {show && (
        <div
          className="result rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
          data-testid="delayed-result"
        >
          ✅ Computation finished — value = 42
        </div>
      )}
      <Snippet
        testId="delayed-snippet"
        code={`await page.getByTestId('delayed-trigger').click();
await expect(page.locator('.result')).toBeVisible();`}
      />
    </Section>
  );
};

/* ----- 0e. Dynamic Table ----------------------------------------------- */

const DYN_PEOPLE = [
  { id: 101, name: "Alice Johnson", role: "QA Lead",   amount: "$1,200" },
  { id: 102, name: "Bob Wilson",    role: "Developer", amount: "$2,400" },
  { id: 103, name: "Chirag Patel",  role: "Designer",  amount: "$1,950" },
  { id: 104, name: "Diana Hart",    role: "PM",        amount: "$3,100" },
];

const DynamicTableSection = () => {
  const [lastAction, setLastAction] = useState("");
  return (
    <Section
      id="dyn-table"
      title="Problem 5 — Dynamic Table"
      hint="Pick the row whose text contains the person's name, then click its button."
    >
      <div className="overflow-hidden rounded-md border border-zinc-200">
        <table
          data-testid="dyn-table"
          className="w-full text-sm"
        >
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {DYN_PEOPLE.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2 font-medium text-zinc-900">{p.name}</td>
                <td className="px-3 py-2 text-zinc-600">{p.role}</td>
                <td className="px-3 py-2 text-zinc-600">{p.amount}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => setLastAction(`pay:${p.name}`)}
                    className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Pay now
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Result testId="dyn-table-result" label="last action" value={lastAction} />
      <Snippet
        testId="dyn-table-snippet"
        code={`await page.locator('tr')
  .filter({ hasText: 'Chirag' })
  .getByRole('button')
  .click();`}
      />
    </Section>
  );
};

/* ----- 0f. Case-insensitive link --------------------------------------- */

const CaseInsensitiveLinkSection = () => {
  const [clicked, setClicked] = useState(false);
  return (
    <Section
      id="case-link"
      title="Problem 6 — Case-insensitive link"
      hint="Match 'WeDDinG photography' regardless of case."
    >
      <div className="flex flex-wrap items-center gap-3">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setClicked(true);
          }}
          data-testid="case-link-target"
          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline"
        >
          WeDDinG photography
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {clicked && (
          <Badge tone="emerald">link clicked</Badge>
        )}
      </div>
      <Snippet
        testId="case-link-snippet"
        code={`await page.getByRole('link', { name: /wedding/i }).click();`}
      />
    </Section>
  );
};

/* ----- 0g. Alert Dialog (prompt with default accept value) ------------- */

const AlertDialogSection = () => {
  const [result, setResult] = useState("");
  return (
    <Section
      id="alert-dialog"
      title="Problem 7 — Alert Dialog"
      hint="page.on('dialog') can accept, dismiss, or accept-with-value (prompt)."
    >
      <div className="flex flex-wrap gap-2">
        <Btn
          testId="alert-dialog-alert"
          variant="outline"
          onClick={() => {
            window.alert("This is an alert.");
            setResult("alert-accepted");
          }}
        >
          Trigger alert()
        </Btn>
        <Btn
          testId="alert-dialog-confirm"
          variant="outline"
          onClick={() => {
            const ok = window.confirm("Do you confirm?");
            setResult(ok ? "confirm-accepted" : "confirm-dismissed");
          }}
        >
          Trigger confirm()
        </Btn>
        <Btn
          testId="alert-dialog-prompt"
          onClick={() => {
            const val = window.prompt("What is your name?", "");
            setResult(val == null ? "prompt-dismissed" : `prompt-value:${val}`);
          }}
        >
          Trigger prompt()
        </Btn>
      </div>
      <Result testId="alert-dialog-result" value={result} />
      <Snippet
        testId="alert-dialog-snippet"
        code={`page.on('dialog', async dialog => {
  console.log(dialog.message());
  await dialog.accept('Chirag');   // for prompt(): types & accepts
  // await dialog.accept();        // for alert/confirm
  // await dialog.dismiss();       // cancel
});
await page.getByTestId('alert-dialog-prompt').click();`}
      />
    </Section>
  );
};

/* ----- 0h. Popup window ------------------------------------------------ */

const PopupSection = () => {
  const [opened, setOpened] = useState(false);
  const open = () => {
    const w = window.open(
      "about:blank",
      "qa-popup",
      "width=420,height=320,menubar=no,toolbar=no"
    );
    if (w) {
      w.document.write(
        '<!doctype html><title>QA Popup</title>' +
        '<body style="font-family:system-ui;padding:20px;background:#f4f4f5">' +
        '<h2 style="margin:0 0 8px">Popup window</h2>' +
        '<p>This was opened via <code>window.open()</code>.</p>' +
        '<p>In Playwright: <code>page.waitForEvent(\'popup\')</code>.</p>' +
        '<button onclick="window.close()" style="margin-top:12px;padding:8px 14px;background:#059669;color:white;border:0;border-radius:6px;cursor:pointer">Close</button>' +
        '</body>'
      );
      setOpened(true);
    }
  };
  return (
    <Section
      id="popup"
      title="Problem 8 — Popup window"
      hint="window.open() opens a child window — captured with waitForEvent('popup')."
    >
      <Btn testId="popup-open" id="open" onClick={open}>
        Open popup
      </Btn>
      <Result
        testId="popup-state"
        label="popup"
        value={opened ? "opened" : "—"}
      />
      <Snippet
        testId="popup-snippet"
        code={`const popupPromise = page.waitForEvent('popup');
await page.locator('#open').click();
const popup = await popupPromise;
await popup.waitForLoadState();`}
      />
    </Section>
  );
};

/* ----- 0i. New tab ----------------------------------------------------- */

const NewTabSection = () => (
  <Section
    id="new-tab"
    title="Problem 9 — New tab"
    hint="target='_blank' opens a new page in the same context."
  >
    <a
      href="https://playwright.dev/"
      target="_blank"
      rel="noopener noreferrer"
      data-testid="new-tab-link"
      className="inline-flex h-10 items-center gap-1.5 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
    >
      <ExternalLink className="h-4 w-4" />
      Open
    </a>
    <Snippet
      testId="new-tab-snippet"
      code={`const newPagePromise = context.waitForEvent('page');
await page.getByText('Open').click();
const newPage = await newPagePromise;
await newPage.waitForLoadState();
// switch back:
await page.bringToFront();`}
    />
  </Section>
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
      <Snippet
        testId="click-snippet"
        code={`await page.getByRole('button', { name: 'Click me' }).click();

await page.getByRole('button', { name: 'Double-click me' }).dblclick();

await page.getByRole('button', { name: 'Right-click me' }).click({
  button: 'right',
});`}
      />
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
      <Snippet
        testId="typing-snippet"
        code={`await page.getByTestId('test-type-input').fill('Playwright');

await page.getByTestId('test-clear-input').clear();

// Type character-by-character (useful for autocomplete inputs):
await page.getByTestId('test-type-input').pressSequentially('Automation', { delay: 50 });`}
      />
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
      <Snippet
        testId="hover-snippet"
        code={`await page.getByTestId('test-hover-target').hover();
await expect(page.getByTestId('test-hover-tooltip')).toBeVisible();`}
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
      <Snippet
        testId="select-snippet"
        code={`// By value:
await page.getByTestId('test-select-dropdown').selectOption('india');

// By visible label:
await page.getByTestId('test-select-dropdown').selectOption({ label: 'India' });

// By index:
await page.getByTestId('test-select-dropdown').selectOption({ index: 1 });

// Multi-select:
await page.getByTestId('test-multiselect-dropdown')
  .selectOption(['javascript', 'python']);`}
      />
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
      <Snippet
        testId="checkbox-snippet"
        code={`// Check / uncheck a single checkbox:
await page.getByTestId('test-checkbox-single').check();
await page.getByTestId('test-checkbox-single').uncheck();

// Or via its visible label:
await page.getByLabel('I accept the demo terms').check();

// State assertions:
await expect(page.getByTestId('test-checkbox-single')).toBeChecked();
await expect(page.getByTestId('test-checkbox-single')).not.toBeChecked();`}
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
      <Snippet
        testId="radio-snippet"
        code={`// Select a radio option by its label:
await page.getByLabel('Medium').check();

// Or by test id:
await page.getByTestId('test-radio-medium').check();

await expect(page.getByLabel('Medium')).toBeChecked();`}
      />
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
      <Snippet
        testId="keyboard-snippet"
        code={`await page.getByTestId('test-key-target').focus();

// Single keys:
await page.keyboard.press('Enter');
await page.keyboard.press('Tab');
await page.keyboard.press('Escape');

// Modifier combos:
await page.keyboard.press('Control+A');
await page.keyboard.press('Shift+ArrowRight');

// Type free-form text:
await page.keyboard.type('Hello, world');`}
      />
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
      <Snippet
        testId="mouse-snippet"
        code={`// Hover a target:
await page.getByTestId('test-mouse-track').hover();

// Drag from source onto target:
await page.getByTestId('test-drag-source')
  .dragTo(page.getByTestId('test-drop-target'));

// Manual mouse control (when dragTo isn't enough):
const src = await page.getByTestId('test-drag-source').boundingBox();
const dst = await page.getByTestId('test-drop-target').boundingBox();
await page.mouse.move(src!.x + src!.width / 2, src!.y + src!.height / 2);
await page.mouse.down();
await page.mouse.move(dst!.x + dst!.width / 2, dst!.y + dst!.height / 2, { steps: 10 });
await page.mouse.up();`}
      />
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
      <Snippet
        testId="upload-snippet"
        code={`// Single file:
await page.getByTestId('test-file-upload').setInputFiles('sample.pdf');

// Multiple files:
await page.getByTestId('test-file-multi').setInputFiles([
  'docs/file1.pdf',
  'docs/file2.pdf',
]);

// Generate a file on-the-fly:
await page.getByTestId('test-file-upload').setInputFiles({
  name: 'hello.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('Hello, world!'),
});

// Clear the selection:
await page.getByTestId('test-file-upload').setInputFiles([]);`}
      />
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
      <Snippet
        testId="date-snippet"
        code={`// Date input — fill the ISO value directly:
await page.getByTestId('test-date-picker').fill('2026-07-01');

// Range slider — fill the numeric value:
await page.getByTestId('test-range-slider').fill('75');

// Color picker — fill with a hex code (no '#' inside the input):
await page.getByTestId('test-color-picker').fill('#ff00aa');

await expect(page.getByTestId('test-date-result')).toContainText('2026-07-01');`}
      />
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
      <Snippet
        testId="dialogs-snippet"
        code={`// Register the handler BEFORE the action that triggers the dialog:
page.on('dialog', async dialog => {
  console.log(dialog.type(), dialog.message());
  // alert / confirm:
  await dialog.accept();
  // prompt — pass the response text:
  // await dialog.accept('Chirag');
  // cancel either kind:
  // await dialog.dismiss();
});

await page.getByTestId('test-alert-button').click();
await page.getByTestId('test-confirm-button').click();
await page.getByTestId('test-prompt-button').click();

// In-page (non-native) modal:
await page.getByTestId('test-modal-open').click();
await expect(page.getByTestId('test-modal')).toBeVisible();
await page.getByTestId('test-modal-confirm').click();
await expect(page.getByTestId('test-modal')).toBeHidden();`}
      />
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
      <Snippet
        testId="wait-snippet"
        code={`await page.getByTestId('test-trigger-delayed').click();

// Wait for the loading spinner to disappear:
await expect(page.locator('.loader')).toBeHidden();

// Wait for the delayed element to appear:
await expect(page.getByTestId('test-delayed-element')).toBeVisible();

// Wait for a specific text update:
await expect(page.getByTestId('test-dynamic-text')).toContainText(/tick/);

// Explicit deadline (avoid where possible, prefer auto-waiting expects):
await page.waitForTimeout(500);`}
      />
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
      <Snippet
        testId="state-snippet"
        code={`await page.getByTestId('test-toggle-disabled').click();
await expect(page.getByTestId('test-disable-target')).toBeDisabled();

await page.getByTestId('test-toggle-disabled').click();
await expect(page.getByTestId('test-disable-target')).toBeEnabled();

await page.getByTestId('test-toggle-visibility').click();
await expect(page.getByTestId('test-hidden-target')).toBeHidden();

await page.getByTestId('test-toggle-visibility').click();
await expect(page.getByTestId('test-hidden-target')).toBeVisible();`}
      />
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
      <Snippet
        testId="table-snippet"
        code={`// Pick a row by its visible text, then check the row's checkbox:
await page.locator('tr')
  .filter({ hasText: 'Bob' })
  .getByRole('checkbox')
  .check();

// Sort by clicking a column header:
await page.getByTestId('test-table-sort-name').click();

// Assert a specific cell's content:
await expect(page.getByTestId('test-table-name-2')).toHaveText('Bob');

// Read all row names into an array:
const names = await page.locator('[data-testid^="test-table-name-"]').allTextContents();`}
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
    <Snippet
      testId="iframe-snippet"
      code={`// Reach into an iframe with frameLocator():
const frame = page.frameLocator('[data-testid="test-iframe"]');
await frame.getByRole('button', { name: 'Click inside frame' }).click();
await expect(frame.getByTestId('iframe-result')).toHaveText('iframe-clicked');

// New tab triggered by target="_blank":
const newPagePromise = context.waitForEvent('page');
await page.getByTestId('test-new-tab-link').click();
const newPage = await newPagePromise;
await newPage.waitForLoadState();
await expect(newPage).toHaveURL(/playwright\\.dev/);
await page.bringToFront();`}
    />
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
      <Snippet
        testId="scroll-snippet"
        code={`// Scroll a specific element into view (recommended):
await page.getByTestId('test-scroll-anchor').scrollIntoViewIfNeeded();
await expect(page.getByTestId('test-scroll-anchor')).toBeInViewport();

// Programmatic wheel scroll inside a scroll container:
await page.getByTestId('test-scroll-container').hover();
await page.mouse.wheel(0, 1000);

// Scroll the whole page to the bottom via the runtime:
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));`}
      />
    </Section>
  );
};

export default TestPage;
