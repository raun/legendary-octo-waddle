'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Play, CheckCircle2, XCircle, Loader2, MessageSquare, Send, FileCode, Terminal, BookOpen, Lock, Check, Sparkles, ArrowLeft, Circle, Crosshair, X } from 'lucide-react';
import { validateWorkflow, simulateRun } from '../lib/validate';

// ============================================================
// MARKDOWN RENDERER
// ============================================================

function renderMarkdown(text) {
  return text.split('\n').map((line, i, arr) => {
    const parts = [];
    const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
    let last = 0;
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > last) parts.push(line.slice(last, match.index));
      if (match[1]) parts.push(<strong key={match.index}>{match[2]}</strong>);
      else if (match[3]) parts.push(<em key={match.index}>{match[4]}</em>);
      else if (match[5]) parts.push(<code key={match.index} className="bg-stone-200/70 px-1 rounded text-xs font-mono">{match[6]}</code>);
      last = match.index + match[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return <span key={i}>{parts}{i < arr.length - 1 && <br />}</span>;
  });
}

// ============================================================
// REGION SELECTOR
// ============================================================

function RegionSelector({ screenshot, onCapture, onCancel }) {
  const [start, setStart] = useState(null);
  const [current, setCurrent] = useState(null);
  const isDragging = useRef(false);

  const getRect = () => {
    if (!start || !current) return null;
    return {
      left:   Math.min(start.x, current.x),
      top:    Math.min(start.y, current.y),
      width:  Math.abs(current.x - start.x),
      height: Math.abs(current.y - start.y),
    };
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    const pt = { x: e.clientX, y: e.clientY };
    setStart(pt);
    setCurrent(pt);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    setCurrent({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const rect = getRect();
    if (!rect || rect.width < 10 || rect.height < 10) { onCancel(); return; }

    const img = new Image();
    img.onload = () => {
      const scaleX = img.naturalWidth  / window.innerWidth;
      const scaleY = img.naturalHeight / window.innerHeight;
      const canvas = document.createElement('canvas');
      canvas.width  = rect.width  * scaleX;
      canvas.height = rect.height * scaleY;
      canvas.getContext('2d').drawImage(
        img,
        rect.left * scaleX, rect.top * scaleY,
        canvas.width, canvas.height,
        0, 0, canvas.width, canvas.height,
      );
      onCapture(canvas.toDataURL('image/png'));
    };
    img.src = screenshot;
  };

  const rect = getRect();

  return (
    <div
      className="fixed inset-0 z-50 cursor-crosshair select-none"
      style={{ backgroundImage: `url(${screenshot})`, backgroundSize: '100% 100%' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* dim layer — punched out by the selection box shadow */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg px-4 py-2 text-sm text-stone-700 shadow-lg flex items-center gap-3 z-10">
        <Crosshair className="w-4 h-4 text-indigo-500" />
        Drag to select a region
        <button
          className="text-rose-500 hover:text-rose-600 font-medium"
          onMouseDown={(e) => { e.stopPropagation(); onCancel(); }}
        >
          Cancel
        </button>
      </div>
      {rect && rect.width > 2 && rect.height > 2 && (
        <div
          className="absolute z-10 border-2 border-indigo-400"
          style={{ ...rect, boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }}
        />
      )}
    </div>
  );
}

// ============================================================
// EXERCISE CONTENT
// ============================================================

const MODULES = [
  {
    id: 'fundamentals',
    name: 'Workflow Fundamentals',
    color: 'emerald',
    exercises: [
      {
        id: 'hello-workflow',
        title: 'Your First Workflow',
        difficulty: 1,
        estMinutes: 10,
        objective: 'Create a workflow that prints "Hello, FDE" on every push to main.',
        framing: "Every CI/CD journey starts here. A workflow is just a YAML file in .github/workflows/ that tells GitHub Actions what to do and when. For FDEs shipping customer integrations, this is the foundation every pipeline builds on.",
        starter: `# .github/workflows/hello.yml
# TODO: Complete this workflow so it:
#   1. Runs on every push to the 'main' branch
#   2. Has a job named 'greet'
#   3. Prints "Hello, FDE" using the 'run' step

name: Hello Workflow

on:
  # Add trigger here

jobs:
  # Add job here
`,
        solution: `name: Hello Workflow

on:
  push:
    branches:
      - main

jobs:
  greet:
    runs-on: ubuntu-latest
    steps:
      - name: Say hello
        run: echo "Hello, FDE"
`,
        validations: [
          { id: 'v1', rule: 'push_trigger', description: "Triggers on 'push' events" },
          { id: 'v2', rule: 'main_branch', description: "Scoped to the 'main' branch" },
          { id: 'v3', rule: 'job_named_greet', description: "Has a job named 'greet'" },
          { id: 'v4', rule: 'prints_hello', description: 'Prints "Hello, FDE"' },
          { id: 'v5', rule: 'runs_on_ubuntu', description: "Uses 'ubuntu-latest' runner" },
        ],
        pitfalls: [
          "Forgetting the 'branches' key under 'push'",
          "Using 'runs_on' (underscore) instead of 'runs-on' (hyphen)",
          "Misspelling the job name — case matters",
        ],
      },
    ],
  },
  {
    id: 'triggers',
    name: 'Triggers & Events',
    color: 'sky',
    exercises: [
      {
        id: 'triggers',
        title: 'Understanding Triggers',
        difficulty: 2,
        estMinutes: 15,
        objective: 'Configure a workflow that runs on pushes AND pull requests AND manual dispatch.',
        framing: "FDEs often need workflows that run in multiple contexts: on developer pushes, on PRs for review checks, and manually for ad-hoc deploys. Multi-trigger workflows are a day-one skill.",
        starter: `name: Multi-Trigger Workflow

on:
  # TODO: Add three triggers:
  #   - push to main
  #   - pull_request to main
  #   - workflow_dispatch (manual)

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Triggered by \${{ github.event_name }}"
`,
        validations: [
          { id: 'v1', rule: 'has_push_trigger', description: 'Has a push trigger' },
          { id: 'v2', rule: 'has_pr_trigger', description: 'Has a pull_request trigger' },
          { id: 'v3', rule: 'has_dispatch', description: 'Has a workflow_dispatch trigger' },
        ],
        pitfalls: ["'workflow_dispatch' with no value is fine — don't over-configure it"],
      },
    ],
  },
  {
    id: 'environment',
    name: 'Environment & Context',
    color: 'violet',
    exercises: [
      {
        id: 'github-context',
        title: 'Using GITHUB Context',
        difficulty: 2,
        estMinutes: 12,
        objective: 'Print the commit SHA and the actor who triggered the workflow using the github context.',
        framing: "The github context exposes metadata about the event, the actor, the repo, and the commit. FDEs lean on this for everything from deployment tagging to audit logging. Learning to reach into the right field saves hours of debugging later.",
        starter: `name: Inspect Context

on: push

jobs:
  inspect:
    runs-on: ubuntu-latest
    steps:
      - name: Print commit info
        # TODO: Print two lines using the github context:
        #   1. The commit SHA (github.sha)
        #   2. Who triggered it (github.actor)
        run: |
          echo "TODO: print SHA here"
          echo "TODO: print actor here"
`,
        solution: `name: Inspect Context

on: push

jobs:
  inspect:
    runs-on: ubuntu-latest
    steps:
      - name: Print commit info
        run: |
          echo "Commit: \${{ github.sha }}"
          echo "Actor: \${{ github.actor }}"
`,
        validations: [
          { id: 'v1', rule: 'uses_github_sha', description: "References github.sha" },
          { id: 'v2', rule: 'uses_github_actor', description: "References github.actor" },
        ],
        pitfalls: [
          "Using '$GITHUB_SHA' (env var) works too but the exercise asks for the context expression",
          "Forgetting the double braces around the expression",
        ],
      },
    ],
  },
  {
    id: 'secrets',
    name: 'Secrets & Security',
    color: 'rose',
    exercises: [
      {
        id: 'secrets',
        title: 'Working with Secrets',
        difficulty: 2,
        estMinutes: 15,
        objective: 'Consume a secret named API_KEY and pass it to a step safely.',
        framing: "Every customer integration you'll ship uses secrets. Mess this up and credentials end up in logs. This exercise teaches the right pattern.",
        starter: `name: Use API Key

on: push

jobs:
  call-api:
    runs-on: ubuntu-latest
    steps:
      - name: Make request
        # TODO: Pass API_KEY from secrets as an env variable
        # Do NOT echo the secret value
        run: curl -H "Authorization: Bearer $TOKEN" https://api.example.com
`,
        solution: `name: Use API Key

on: push

jobs:
  call-api:
    runs-on: ubuntu-latest
    steps:
      - name: Make request
        env:
          TOKEN: \${{ secrets.API_KEY }}
        run: curl -H "Authorization: Bearer $TOKEN" https://api.example.com
`,
        validations: [
          { id: 'v1', rule: 'uses_secrets_context', description: "References secrets.API_KEY" },
          { id: 'v2', rule: 'no_echo_secret', description: "Does not echo the secret value" },
        ],
        pitfalls: ["Never 'echo' a secret — it gets masked but it's still bad practice"],
      },
    ],
  },
  {
    id: 'artifacts',
    name: 'Artifacts & Outputs',
    color: 'amber',
    exercises: [
      {
        id: 'upload-artifact',
        title: 'Uploading Build Artifacts',
        difficulty: 2,
        estMinutes: 15,
        objective: 'Build a zip file and upload it as a workflow artifact named "build".',
        framing: "Artifacts are how downstream jobs (and humans) get the outputs of a pipeline — test reports, compiled binaries, deploy bundles. For FDEs, uploading a build artifact is what turns a CI pipeline into a real delivery pipeline.",
        starter: `name: Build and Upload

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Create build
        run: |
          mkdir -p dist
          echo "hello" > dist/app.txt
          zip -r build.zip dist
      # TODO: Add a step that uploads build.zip as an artifact named "build"
      # Hint: use actions/upload-artifact@v4
`,
        solution: `name: Build and Upload

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Create build
        run: |
          mkdir -p dist
          echo "hello" > dist/app.txt
          zip -r build.zip dist
      - name: Upload build
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: build.zip
`,
        validations: [
          { id: 'v1', rule: 'uses_upload_artifact', description: "Uses actions/upload-artifact" },
          { id: 'v2', rule: 'artifact_named_build', description: "Names the artifact 'build'" },
          { id: 'v3', rule: 'uploads_zip', description: "Uploads build.zip as the path" },
        ],
        pitfalls: [
          "Using v2 or v3 of upload-artifact — v4 is current and the old versions are deprecated",
          "Forgetting the 'with:' block that configures name and path",
        ],
      },
    ],
  },
  {
    id: 'matrix',
    name: 'Matrix & Parallelism',
    color: 'teal',
    exercises: [
      {
        id: 'matrix',
        title: 'Matrix Builds',
        difficulty: 3,
        estMinutes: 20,
        objective: 'Run tests across Ubuntu and macOS with Node 18 and 20.',
        framing: "Customers run your integrations on heterogeneous infrastructure. Matrix builds catch platform-specific bugs before they reach production.",
        starter: `name: Matrix Tests
on: push
jobs:
  test:
    # TODO: Add matrix strategy for:
    #   - os: ubuntu-latest, macos-latest
    #   - node: 18, 20
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
`,
        solution: `name: Matrix Tests
on: push
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        node: [18, 20]
    runs-on: \${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
      - run: npm test
`,
        validations: [
          { id: 'v1', rule: 'has_matrix', description: 'Defines a matrix strategy' },
          { id: 'v2', rule: 'matrix_os', description: 'Matrix includes both ubuntu and macos' },
          { id: 'v3', rule: 'matrix_node', description: 'Matrix includes Node 18 and 20' },
        ],
        pitfalls: ["Using 'runs-on: ubuntu-latest' instead of 'runs-on: \\${{ matrix.os }}'"],
      },
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced Patterns',
    color: 'stone',
    locked: true,
    exercises: [],
  },
];

// ============================================================
// VALIDATION ENGINE
// ============================================================
// validateWorkflow and simulateRun are imported from ../lib/validate

// ============================================================
// CHATBOT
// ============================================================

async function askChatbot(messages, exercise, module_, learnerCode, lastRunResult, runLogs) {
  const systemPrompt = `You are a CI/CD tutor for Forward Deployed Engineers. You are helping the learner with this exercise:

MODULE: ${module_.name}
EXERCISE: ${exercise.title}
DIFFICULTY: ${exercise.difficulty}/3
OBJECTIVE: ${exercise.objective}
CONTEXT: ${exercise.framing}

ALL CHECKS THE LEARNER MUST PASS:
${exercise.validations.map((v, i) => `${i + 1}. ${v.description}`).join('\n')}

COMMON PITFALLS for this exercise:
${exercise.pitfalls.map(p => `- ${p}`).join('\n')}

STARTER CODE (what was provided to the learner):
\`\`\`yaml
${exercise.starter}
\`\`\`

SOLUTION (for your reference only — never reveal this directly):
\`\`\`yaml
${exercise.solution}
\`\`\`

LEARNER'S CURRENT CODE:
\`\`\`yaml
${learnerCode}
\`\`\`

${lastRunResult ? `LAST RUN RESULT: ${lastRunResult.success ? 'PASSED' : 'FAILED'}
${lastRunResult.failed?.length ? 'Failed checks:\n' + lastRunResult.failed.map(f => `- ${f.description}`).join('\n') : 'All checks passed.'}
${lastRunResult.passed?.length ? 'Passing checks:\n' + lastRunResult.passed.map(f => `- ${f.description}`).join('\n') : ''}` : 'Learner has not run the workflow yet.'}

${runLogs?.length ? `RUN LOG OUTPUT (what the learner sees in the terminal panel):
${runLogs.map(l => l.line).join('\n')}` : ''}

CRITICAL RULES:
1. NEVER reveal or write out the full solution. Do not output a complete working YAML file.
2. Ask ONE clarifying question before giving a hint, unless the question is very specific.
3. Point learners to the specific line or concept, not the code.
4. Only after 2+ back-and-forth turns, you may give a more detailed hint (still not full code).
5. Keep responses under 4 sentences. Be direct and warm.
6. If the learner asks for the answer outright, redirect: "I can't give you the answer, but I can help you think through it. What have you tried so far?"`;

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 400,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  const text = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  return text;
}

// Curriculum advisor — the chatbot on the module browser. Different role from
// the in-exercise tutor: here it's helping the learner navigate the curriculum
// and explain concepts at a high level, not guard a specific solution.
async function askCurriculumAdvisor(messages, completed) {
  const moduleList = MODULES.map(m => {
    if (m.locked) return `- ${m.name} (locked — coming soon)`;
    const exerciseList = m.exercises.map(ex => {
      const done = completed.includes(ex.id) ? ' [completed]' : '';
      return `    - ${ex.title}: ${ex.objective}${done}`;
    }).join('\n');
    return `- ${m.name}\n${exerciseList}`;
  }).join('\n');

  const systemPrompt = `You are a CI/CD curriculum advisor for Forward Deployed Engineers learning GitHub Actions. The learner is on the module browser, not inside an exercise. Your job is to help them:
- Decide which module to start with or do next
- Explain what a module or exercise covers at a high level
- Answer conceptual questions about CI/CD and GitHub Actions
- Encourage them to actually try the exercises (learn-by-doing is the core principle)

AVAILABLE MODULES:
${moduleList}

LEARNER PROGRESS: ${completed.length === 0 ? 'No exercises completed yet.' : `Completed: ${completed.join(', ')}`}

RULES:
1. Keep responses under 4 sentences. Be direct and warm.
2. When recommending a module, name it specifically and say why.
3. If asked about an exercise they haven't started, describe the concept without giving the YAML solution.
4. If asked something outside CI/CD scope, gently steer back: "That's outside what I can help with here — I'm best on GitHub Actions and CI/CD."
5. Don't narrate rules or meta-explain yourself. Just help.`;

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 400,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  const text = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  return text;
}

// ============================================================
// COMPONENTS
// ============================================================

function DifficultyPips({ level }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i <= level ? 'bg-amber-500' : 'bg-stone-200'}`} />
      ))}
    </div>
  );
}

function ModuleBrowser({ onSelectExercise, completed }) {
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [advisorMessages, setAdvisorMessages] = useState([]);
  const [advisorInput, setAdvisorInput] = useState('');
  const [advisorLoading, setAdvisorLoading] = useState(false);

  const sendAdvisorMessage = async () => {
    if (!advisorInput.trim() || advisorLoading) return;
    const userMsg = { role: 'user', content: advisorInput };
    const newMessages = [...advisorMessages, userMsg];
    setAdvisorMessages(newMessages);
    setAdvisorInput('');
    setAdvisorLoading(true);
    try {
      const response = await askCurriculumAdvisor(newMessages, completed);
      setAdvisorMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (e) {
      setAdvisorMessages([...newMessages, { role: 'assistant', content: "I had trouble reaching the backend. In the meantime — if you're just starting, try Workflow Fundamentals." }]);
    } finally {
      setAdvisorLoading(false);
    }
  };

  const suggestedPrompts = [
    "Which module should I start with?",
    "What's the difference between secrets and environment variables?",
    "How long will this whole course take?",
  ];

  return (
    <div className="max-w-5xl mx-auto px-8 py-16">
      <div className="mb-14">
        <div className="text-xs tracking-[0.24em] text-amber-700/80 mb-4 font-medium uppercase">Learn by doing</div>
        <h1 className="text-5xl font-serif text-stone-900 mb-5 leading-[1.1] tracking-tight">
          GitHub Actions<br/>
          <span className="italic text-stone-400 font-normal">for Forward Deployed Engineers</span>
        </h1>
        <p className="text-stone-600 max-w-2xl leading-relaxed text-[17px]">
          Seven modules. Real validation. Zero video-before-doing. Ship confident CI/CD pipelines for your next customer go-live.
        </p>
      </div>

      <div className="space-y-6">
        {MODULES.map(module_ => (
          <div
            key={module_.id}
            className={`
              bg-white rounded-2xl border border-stone-200/70
              shadow-sm shadow-stone-200/40
              transition-all duration-300
              ${module_.locked ? 'opacity-60' : 'hover:shadow-md hover:shadow-stone-200/60'}
            `}
          >
            <div className="flex items-center justify-between px-7 py-5 border-b border-stone-100">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full bg-${module_.color}-400 ring-4 ring-${module_.color}-400/15`} />
                <span className="text-[11px] tracking-[0.18em] text-stone-400 uppercase font-medium">Module 0{MODULES.indexOf(module_) + 1}</span>
                <span className="text-stone-900 font-serif text-xl">{module_.name}</span>
              </div>
              <div className="text-xs text-stone-400">
                {module_.locked ? <Lock className="w-3.5 h-3.5" /> : `${module_.exercises.length} exercise${module_.exercises.length === 1 ? '' : 's'}`}
              </div>
            </div>

            {!module_.locked && (
              <div className="divide-y divide-stone-100">
                {module_.exercises.map((ex, i) => {
                  const isDone = completed.includes(ex.id);
                  return (
                    <button
                      key={ex.id}
                      onClick={() => onSelectExercise(ex, module_)}
                      className="w-full flex items-center gap-6 px-7 py-5 hover:bg-amber-50/40 transition-all duration-200 text-left group first:rounded-none last:rounded-b-2xl"
                    >
                      <div className="text-sm text-stone-300 w-6 font-medium tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="flex-1">
                        <div className="text-stone-900 group-hover:text-amber-800 transition-colors mb-1 font-medium">
                          {ex.title}
                        </div>
                        <div className="text-xs text-stone-500">
                          {ex.estMinutes} min &middot; {ex.validations.length} checks
                        </div>
                      </div>
                      <DifficultyPips level={ex.difficulty} />
                      <div className="w-6 flex justify-center">
                        {isDone ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                          </div>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Curriculum advisor — floating button + collapsible chat box */}
      {!advisorOpen && (
        <button
          onClick={() => setAdvisorOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white px-5 py-3 rounded-full flex items-center gap-2.5 text-sm font-medium shadow-xl shadow-indigo-900/25 hover:shadow-2xl hover:shadow-indigo-900/35 transition-all hover:scale-105 z-40"
        >
          <MessageSquare className="w-4 h-4" />
          Ask advisor
        </button>
      )}

      {advisorOpen && (
        <div
          className="fixed bottom-6 right-6 h-[560px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl shadow-stone-900/25 z-50 flex flex-col border border-stone-200/80 overflow-hidden"
          style={{ animation: 'slideInUp 0.25s ease-out', width: '380px', minWidth: '380px', maxWidth: '380px' }}
        >
          <div className="border-b border-stone-200/70 px-4 py-3 flex items-center gap-2.5 bg-white">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-stone-900 font-medium leading-tight">Advisor</div>
              <div className="text-xs text-stone-500">Ask about the curriculum</div>
            </div>
            <button
              onClick={() => setAdvisorOpen(false)}
              className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors shrink-0"
              aria-label="Minimize"
              title="Minimize"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4" style={{ minWidth: 0 }}>
            {advisorMessages.length === 0 && (
              <>
                <div className="bg-indigo-50/60 rounded-xl p-3.5 border border-indigo-100/80 text-sm text-stone-800 leading-relaxed">
                  Hi — I'm here to help you navigate the curriculum. Ask me which module to start, what a concept means, or how to approach a pipeline you're building at work.
                </div>
                <div>
                  <div className="text-[11px] font-medium mb-2 text-stone-400 uppercase tracking-wider">Try asking</div>
                  <div className="space-y-1.5">
                    {suggestedPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => setAdvisorInput(prompt)}
                        className="w-full text-left text-[13px] text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-lg px-3 py-2 border border-stone-200/60 transition-colors leading-snug"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {advisorMessages.map((m, i) => (
              <div key={i}>
                <div className="text-[10px] font-medium mb-1 text-stone-400 uppercase tracking-wider">
                  {m.role === 'user' ? 'You' : 'Advisor'}
                </div>
                <div className={`text-[13.5px] leading-relaxed rounded-xl p-3 break-words ${
                  m.role === 'user'
                    ? 'bg-stone-50 text-stone-900 border border-stone-200/60'
                    : 'bg-indigo-50/60 text-stone-800 border border-indigo-100/80'
                }`} style={{ overflowWrap: 'anywhere' }}>
                  {m.role === 'user' ? m.content : renderMarkdown(m.content)}
                </div>
              </div>
            ))}
            {advisorLoading && (
              <div>
                <div className="text-[10px] font-medium mb-1 text-stone-400 uppercase tracking-wider">Advisor</div>
                <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100/80">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-stone-200/70 p-3 bg-stone-50/50" style={{ minWidth: 0 }}>
            <div className="flex gap-2" style={{ minWidth: 0 }}>
              <input
                value={advisorInput}
                onChange={(e) => setAdvisorInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendAdvisorMessage())}
                placeholder="Ask about the curriculum..."
                disabled={advisorLoading}
                autoFocus
                className="flex-1 bg-white border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-lg transition-all"
                style={{ minWidth: 0, width: '100%' }}
              />
              <button
                onClick={sendAdvisorMessage}
                disabled={advisorLoading || !advisorInput.trim()}
                className="px-3 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all rounded-lg shadow-sm shadow-indigo-900/20 hover:shadow-md shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function ExerciseView({ exercise, module: module_, onBack, onComplete, onNext, completed }) {
  const [code, setCode] = useState(exercise.starter);
  const [runState, setRunState] = useState('idle');
  const [logs, setLogs] = useState([]);
  const [runResult, setRunResult] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const logsRef = useRef(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    setCode(exercise.starter);
    setRunState('idle');
    setLogs([]);
    setRunResult(null);
    setShowSolution(false);
    setChatMessages([]);
  }, [exercise.id]);

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const runWorkflow = () => {
    setRunState('running');
    setLogs([]);
    setRunResult(null);
    const { logs: simLogs, success, passed, failed } = simulateRun(code, exercise);
    simLogs.forEach((log) => {
      setTimeout(() => setLogs(prev => [...prev, log]), log.t);
    });
    const totalTime = simLogs[simLogs.length - 1].t + 400;
    setTimeout(() => {
      setRunState('done');
      setRunResult({ success, passed, failed });
      if (success && !completed.includes(exercise.id)) {
        onComplete(exercise.id);
      }
    }, totalTime);
  };

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        preferCurrentTab: true,
      });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await new Promise(r => { video.onloadedmetadata = r; });
      await video.play();
      await new Promise(r => requestAnimationFrame(r));
      const canvas = document.createElement('canvas');
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      stream.getTracks().forEach(t => t.stop());
      setScreenshot(canvas.toDataURL('image/png'));
      setIsSelecting(true);
    } catch (e) {
      if (e.name !== 'NotAllowedError') console.error('Screen capture failed:', e);
    }
  };

  const sendChatMessage = async () => {
    if ((!chatInput.trim() && !selectedImage) || chatLoading) return;
    const content = selectedImage
      ? [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: selectedImage.split(',')[1] } },
          { type: 'text', text: chatInput || 'What do you see in this screenshot?' },
        ]
      : chatInput;
    const userMsg = { role: 'user', content };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setSelectedImage(null);
    setChatLoading(true);
    try {
      const response = await askChatbot(newMessages, exercise, module_, code, runResult, logs);
      setChatMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (e) {
      console.error('Tutor chatbot error:', e);
      setChatMessages([...newMessages, { role: 'assistant', content: `Error: ${e.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const moduleExercises = module_.exercises;
  const currentIdx = moduleExercises.findIndex(e => e.id === exercise.id);
  const progress = ((currentIdx + 1) / moduleExercises.length) * 100;

  // Next exercise: prefer within same module, then first exercise of next unlocked module
  let nextExercise = null;
  let nextModule = null;
  if (currentIdx < moduleExercises.length - 1) {
    nextExercise = moduleExercises[currentIdx + 1];
    nextModule = module_;
  } else {
    const moduleIdx = MODULES.findIndex(m => m.id === module_.id);
    for (let i = moduleIdx + 1; i < MODULES.length; i++) {
      if (!MODULES[i].locked && MODULES[i].exercises.length > 0) {
        nextExercise = MODULES[i].exercises[0];
        nextModule = MODULES[i];
        break;
      }
    }
  }

  const INDENT = '  ';
  const handleEditorKeyDown = (e) => {
    const ta = e.target;
    const { selectionStart, selectionEnd, value } = ta;

    const applyEdit = (newValue, newStart, newEnd) => {
      setCode(newValue);
      requestAnimationFrame(() => {
        ta.selectionStart = newStart;
        ta.selectionEnd = newEnd ?? newStart;
      });
    };

    if (e.key === 'Tab') {
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const selectionSpansMultipleLines = value.slice(selectionStart, selectionEnd).includes('\n');

      if (e.shiftKey) {
        const endOfLastLine = value.indexOf('\n', selectionEnd);
        const blockEnd = endOfLastLine === -1 ? value.length : endOfLastLine;
        const before = value.slice(0, lineStart);
        const block = value.slice(lineStart, blockEnd);
        const after = value.slice(blockEnd);
        const lines = block.split('\n');
        let removedFromFirst = 0;
        const dedented = lines.map((line, i) => {
          const match = line.match(/^( {1,2}|\t)/);
          if (!match) return line;
          if (i === 0) removedFromFirst = match[0].length;
          return line.slice(match[0].length);
        }).join('\n');
        const totalRemoved = block.length - dedented.length;
        applyEdit(before + dedented + after, Math.max(lineStart, selectionStart - removedFromFirst), selectionEnd - totalRemoved);
        return;
      }

      if (selectionSpansMultipleLines) {
        const endOfLastLine = value.indexOf('\n', selectionEnd);
        const blockEnd = endOfLastLine === -1 ? value.length : endOfLastLine;
        const before = value.slice(0, lineStart);
        const block = value.slice(lineStart, blockEnd);
        const after = value.slice(blockEnd);
        const indented = block.split('\n').map(l => INDENT + l).join('\n');
        const added = indented.length - block.length;
        applyEdit(before + indented + after, selectionStart + INDENT.length, selectionEnd + added);
        return;
      }

      const before = value.slice(0, selectionStart);
      const after = value.slice(selectionEnd);
      applyEdit(before + INDENT + after, selectionStart + INDENT.length);
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLine = value.slice(lineStart, selectionStart);
      const leadingWs = currentLine.match(/^[ \t]*/)[0];
      const endsWithColon = /:\s*$/.test(currentLine);
      const extra = endsWithColon ? INDENT : '';
      const insert = '\n' + leadingWs + extra;
      e.preventDefault();
      const before = value.slice(0, selectionStart);
      const after = value.slice(selectionEnd);
      applyEdit(before + insert + after, selectionStart + insert.length);
      return;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {isSelecting && screenshot && (
        <RegionSelector
          screenshot={screenshot}
          onCapture={(img) => { setSelectedImage(img); setIsSelecting(false); setScreenshot(null); }}
          onCancel={() => { setIsSelecting(false); setScreenshot(null); }}
        />
      )}
      {/* Top bar */}
      <div className="border-b border-stone-200/70 px-6 py-3.5 flex items-center gap-6 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm">Modules</span>
        </button>
        <div className="h-4 w-px bg-stone-200" />
        <div className="flex items-center gap-2.5 text-sm text-stone-500">
          <span>{module_.name}</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
          <span className="text-stone-800 font-medium">{exercise.title}</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <div className="text-xs text-stone-500 tabular-nums">
            {currentIdx + 1} of {moduleExercises.length}
          </div>
          <div className="w-32 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-12 gap-0">
        {/* Left panel — exercise details */}
        <div className="col-span-4 border-r border-stone-200/70 overflow-y-auto bg-white" style={{ maxHeight: 'calc(100vh - 57px)' }}>
          <div className="p-8">
            <div className="flex items-center gap-3 mb-5">
              <DifficultyPips level={exercise.difficulty} />
              <span className="text-xs text-stone-400">~{exercise.estMinutes} min</span>
            </div>
            <h2 className="font-serif text-[32px] text-stone-900 mb-6 leading-tight tracking-tight">{exercise.title}</h2>

            <div className="space-y-7">
              <div>
                <div className="text-[11px] tracking-[0.18em] text-amber-700/80 font-medium uppercase mb-2.5">Objective</div>
                <p className="text-stone-800 leading-relaxed text-[15px]">{exercise.objective}</p>
              </div>

              <div>
                <div className="text-[11px] tracking-[0.18em] text-stone-400 font-medium uppercase mb-2.5">Why this matters</div>
                <p className="text-stone-600 leading-relaxed text-sm">{exercise.framing}</p>
              </div>

              {/* Validation checks */}
              <div className="bg-stone-50/70 rounded-xl border border-stone-200/60 overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-200/60 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-xs text-stone-600 font-medium">Validation checks</span>
                </div>
                <div className="divide-y divide-stone-200/60">
                  {exercise.validations.map(v => {
                    const status = runResult
                      ? runResult.passed.some(p => p.id === v.id) ? 'pass'
                      : runResult.failed.some(f => f.id === v.id) ? 'fail' : 'pending'
                      : 'pending';
                    return (
                      <div key={v.id} className="flex items-center gap-3 px-4 py-3 text-sm transition-colors">
                        {status === 'pass' && (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3.5} />
                          </div>
                        )}
                        {status === 'fail' && (
                          <div className="w-4 h-4 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
                            <XCircle className="w-3 h-3 text-rose-600" />
                          </div>
                        )}
                        {status === 'pending' && (
                          <div className="w-4 h-4 rounded-full border-[1.5px] border-stone-300 shrink-0" />
                        )}
                        <span className={status === 'pass' ? 'text-stone-800' : status === 'fail' ? 'text-stone-700' : 'text-stone-500'}>
                          {v.description}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>


              {/* Solution */}
              <div className="bg-white rounded-xl border border-stone-200/60 overflow-hidden shadow-sm">
                <button
                  onClick={() => runResult?.success && setShowSolution(!showSolution)}
                  disabled={!runResult?.success}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors ${runResult?.success ? 'hover:bg-stone-50 cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${runResult?.success ? 'bg-emerald-50' : 'bg-stone-100'}`}>
                    {runResult?.success ? <FileCode className="w-3.5 h-3.5 text-emerald-700" /> : <Lock className="w-3.5 h-3.5 text-stone-400" />}
                  </div>
                  <span className="text-sm font-medium flex-1 text-left text-stone-700">
                    Canonical solution
                  </span>
                  <span className="text-xs text-stone-400">
                    {runResult?.success ? 'unlocked' : 'pass to unlock'}
                  </span>
                </button>
                {showSolution && runResult?.success && (
                  <div className="border-t border-stone-200/60 bg-stone-900">
                    <pre className="p-4 text-xs font-mono text-stone-100 overflow-x-auto leading-relaxed">
                      {exercise.solution}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center — editor */}
        <div className={chatOpen ? "col-span-5 flex flex-col border-r border-stone-200/70" : "col-span-8 flex flex-col"}>
          <div className="border-b border-stone-200/70 px-5 py-3 flex items-center gap-3 bg-white">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
                <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
                <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
              </div>
              <div className="h-4 w-px bg-stone-200 mx-2" />
              <FileCode className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-xs font-mono text-stone-600">.github/workflows/exercise.yml</span>
            </div>
            <div className="flex-1" />
            <button
              onClick={runWorkflow}
              disabled={runState === 'running'}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-stone-800 to-stone-900 hover:from-stone-700 hover:to-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-all rounded-lg shadow-sm shadow-stone-900/20 hover:shadow-md hover:shadow-stone-900/30"
            >
              {runState === 'running' ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running</>
              ) : (
                <><Play className="w-3.5 h-3.5" fill="currentColor" /> Run workflow</>
              )}
            </button>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 relative overflow-hidden bg-white" style={{ minHeight: '300px' }}>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleEditorKeyDown}
                spellCheck={false}
                className="absolute inset-0 w-full h-full bg-white text-stone-900 font-mono text-[13.5px] p-5 resize-none focus:outline-none leading-relaxed"
                style={{ tabSize: 2 }}
              />
            </div>
            {/* Run logs — kept dark, now with softer edges */}
            <div className="border-t border-stone-200/70 bg-[#1c1917] h-64 flex flex-col">
              <div className="px-5 py-2.5 border-b border-stone-700/50 flex items-center gap-2.5 bg-[#171513]">
                <Terminal className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-xs text-stone-400 font-medium">Run logs</span>
                {runResult && (
                  <div className={`ml-auto flex items-center gap-1.5 text-xs font-medium ${runResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <Circle className="w-1.5 h-1.5" fill="currentColor" />
                    {runResult.success ? 'Passed' : 'Failed'}
                  </div>
                )}
              </div>
              <div ref={logsRef} className="flex-1 overflow-y-auto p-5 font-mono text-[12.5px] leading-relaxed">
                {logs.length === 0 && runState === 'idle' && (
                  <div className="text-stone-500 italic">Click Run workflow to execute.</div>
                )}
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.kind === 'success' ? 'text-emerald-400' :
                      log.kind === 'error' ? 'text-rose-400' :
                      'text-stone-300'
                    }
                    style={{ animation: 'fadeIn 0.3s ease-out' }}
                  >
                    {log.line}
                  </div>
                ))}
                {runState === 'done' && runResult?.success && (
                  <div className="mt-5 pt-5 border-t border-stone-700/50">
                    <div className="flex items-center gap-2 mb-1.5 text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="font-medium">Exercise complete</span>
                    </div>
                    <div className="text-stone-400 text-xs mt-2 mb-4 leading-relaxed">
                      {nextExercise
                        ? nextModule?.id !== module_.id
                          ? `Module complete! Next up: ${nextModule.name}.`
                          : 'Solution unlocked in the sidebar. Ready for the next one?'
                        : "You've completed all available modules. Solution unlocked in the sidebar."}
                    </div>
                    {nextExercise ? (
                      <button
                        onClick={() => onNext(nextExercise, nextModule)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-900 text-sm font-medium transition-all rounded-lg shadow-md shadow-amber-900/20 hover:shadow-lg hover:shadow-amber-900/30 group"
                      >
                        <span>Next: {nextExercise.title}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ) : (
                      <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-900 text-sm font-medium transition-all rounded-lg shadow-md shadow-amber-900/20 hover:shadow-lg group"
                      >
                        <span>Back to modules</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right — chatbot */}
        <div className={chatOpen ? "col-span-3 flex flex-col bg-white" : "col-span-0 hidden"}>
          <div className="border-b border-stone-200/70 px-5 py-3 flex items-center gap-2.5 bg-white">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <span className="text-sm text-stone-700 font-medium">Tutor</span>
            <button onClick={() => setChatOpen(false)} className="ml-auto text-stone-400 hover:text-stone-700 text-xs transition-colors">Close</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ maxHeight: 'calc(100vh - 57px - 49px - 80px)' }}>
            {chatMessages.length === 0 && (
              <div className="text-stone-500 text-sm italic leading-relaxed bg-stone-50/70 rounded-xl p-4 border border-stone-200/60">
                Stuck? Ask me anything about this exercise. I won't give you the answer — but I'll help you find it.
              </div>
            )}
            {chatMessages.map((m, i) => {
              const isArray = Array.isArray(m.content);
              const imgPart  = isArray ? m.content.find(p => p.type === 'image') : null;
              const textPart = isArray ? m.content.find(p => p.type === 'text')?.text : m.content;
              return (
                <div key={i}>
                  <div className="text-[11px] font-medium mb-1.5 text-stone-400 uppercase tracking-wider">
                    {m.role === 'user' ? 'You' : 'Tutor'}
                  </div>
                  <div className={`text-sm leading-relaxed rounded-xl p-3.5 ${
                    m.role === 'user'
                      ? 'bg-stone-50 text-stone-900 border border-stone-200/60'
                      : 'bg-indigo-50/60 text-stone-800 border border-indigo-100/80'
                  }`}>
                    {imgPart && (
                      <img
                        src={`data:${imgPart.source.media_type};base64,${imgPart.source.data}`}
                        alt="screenshot"
                        className="rounded-lg mb-2 max-w-full border border-stone-200"
                      />
                    )}
                    {m.role === 'user' ? textPart : renderMarkdown(textPart)}
                  </div>
                </div>
              );
            })}
            {chatLoading && (
              <div>
                <div className="text-[11px] font-medium mb-1.5 text-stone-400 uppercase tracking-wider">Tutor</div>
                <div className="bg-indigo-50/60 rounded-xl p-3.5 border border-indigo-100/80">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
          <div className="border-t border-stone-200/70 p-4 bg-stone-50/50">
            {selectedImage && (
              <div className="relative mb-2 inline-block">
                <img src={selectedImage} alt="selection" className="h-20 rounded-lg border border-stone-200 object-cover" />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-700 hover:bg-stone-900 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={startCapture}
                disabled={chatLoading}
                title="Select a region of the screen"
                className="px-2.5 bg-white border border-stone-200 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-500 hover:text-indigo-600 transition-all rounded-lg"
              >
                <Crosshair className="w-4 h-4" />
              </button>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendChatMessage())}
                placeholder={selectedImage ? 'Add a question about the screenshot...' : 'Ask a question...'}
                disabled={chatLoading}
                className="flex-1 bg-white border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-lg transition-all"
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || (!chatInput.trim() && !selectedImage)}
                className="px-3 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all rounded-lg shadow-sm shadow-indigo-900/20 hover:shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white px-5 py-3 rounded-full flex items-center gap-2.5 text-sm font-medium shadow-xl shadow-indigo-900/25 hover:shadow-2xl hover:shadow-indigo-900/35 transition-all hover:scale-105"
          >
            <MessageSquare className="w-4 h-4" />
            Ask tutor
          </button>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  const [currentExercise, setCurrentExercise] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);
  const [completed, setCompleted] = useState([]);

  const selectExercise = (ex, module_) => {
    setCurrentExercise(ex);
    setCurrentModule(module_);
  };

  const markComplete = (exId) => {
    setCompleted(prev => prev.includes(exId) ? prev : [...prev, exId]);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {currentExercise ? (
        <ExerciseView
          exercise={currentExercise}
          module={currentModule}
          onBack={() => setCurrentExercise(null)}
          onComplete={markComplete}
          onNext={(nextEx, nextMod) => {
            setCurrentExercise(nextEx);
            if (nextMod) setCurrentModule(nextMod);
          }}
          completed={completed}
        />
      ) : (
        <ModuleBrowser onSelectExercise={selectExercise} completed={completed} />
      )}
    </div>
  );
}
