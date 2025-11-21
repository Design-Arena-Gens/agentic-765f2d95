"use client";

import { useEffect, useMemo, useState } from "react";
import { analyzeDataset, SAMPLE_DATASET, type AnalysisResult } from "@/lib/agent";

type RunState = "idle" | "running" | "complete" | "error";

export function AgentWorkbench() {
  const [dataset, setDataset] = useState<string>(SAMPLE_DATASET);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState>("idle");
  const [timeline, setTimeline] = useState<string[]>([]);

  const canRun = useMemo(() => dataset.trim().length > 0 && runState !== "running", [dataset, runState]);

  useEffect(() => {
    setTimeline([]);
  }, []);

  const runAgent = async () => {
    setRunState("running");
    setResult(null);
    setError(null);
    setTimeline([]);

    const stagedTimeline: string[] = [];

    const pushTimeline = (entry: string) => {
      stagedTimeline.push(entry);
      setTimeline([...stagedTimeline]);
    };

    try {
      pushTimeline("📥 Parsing dataset...");
      await delay(400);

      const analysis = analyzeDataset(dataset);
      pushTimeline("🧬 Isolating HPRT1 evidence...");
      await delay(400);
      pushTimeline("🧠 Synthesizing interpretation...");
      await delay(400);
      pushTimeline("📊 Contextualizing dataset...");
      await delay(400);

      setResult(analysis);
      setRunState("complete");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected failure while running agent.";
      setError(message);
      setRunState("error");
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">HPRT1 Gene Insight Agent</h1>
        <p className="text-slate-600">
          Upload or paste a gene expression dataset. The agent scans for the housekeeping gene HPRT1,
          surfaces its context, and summarizes how the dataset classifies the detected entries.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium text-slate-700">Dataset (CSV)</label>
          <textarea
            className="min-h-[280px] w-full rounded-xl border border-slate-200 bg-white p-4 font-mono text-sm shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={dataset}
            onChange={(event) => setDataset(event.target.value)}
            spellCheck={false}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={runAgent}
              disabled={!canRun}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {runState === "running" ? "Running…" : "Run Agent"}
            </button>
            <button
              onClick={() => setDataset(SAMPLE_DATASET)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Load Sample Data
            </button>
            <button
              onClick={() => {
                setDataset("");
                setResult(null);
                setTimeline([]);
                setError(null);
                setRunState("idle");
              }}
              className="rounded-lg border border-transparent px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-200 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Agent Timeline</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {timeline.length === 0 && <li className="text-slate-400">Awaiting run…</li>}
            {timeline.map((entry, index) => (
              <li key={index} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                {entry}
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
            <h2 className="text-lg font-semibold text-rose-700">Agent Error</h2>
            <p className="mt-2 leading-relaxed">{error}</p>
          </div>
        )}

        {result && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800">HPRT1 Classification</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{result.inferredRole}</p>
              <p className="mt-3 text-sm font-medium text-slate-700">{result.datasetCoverage}</p>
              <p className="mt-2 text-sm text-slate-600">{result.classificationSynopsis}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800">HPRT1 Evidence</h2>
              <ul className="mt-3 space-y-3">
                {result.hprt1Rows.map((row, idx) => (
                  <li
                    key={`${row.gene}-${idx}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
                  >
                    <p className="font-semibold text-slate-800">Record {idx + 1}</p>
                    <p>
                      Expression:{" "}
                      <span className="font-medium">
                        {typeof row.expression === "number" ? row.expression.toFixed(2) : "n/a"}
                      </span>
                    </p>
                    <p>Classification: {row.classification ?? "Unlabeled"}</p>
                    <p>Description: {row.description ?? "No description provided"}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-semibold text-blue-900">Agent Reasoning Trace</h2>
              <ul className="mt-3 space-y-3 text-sm text-blue-900">
                {result.steps.map((step) => (
                  <li key={step.title} className="rounded-lg border border-blue-100 bg-white px-4 py-3 shadow-sm">
                    <p className="font-semibold">{step.title}</p>
                    <p className="mt-1 text-blue-800">{step.detail}</p>
                  </li>
                ))}
              </ul>
            </div>

            {result.issues.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm lg:col-span-2">
                <h2 className="text-lg font-semibold text-amber-900">Quality Flags</h2>
                <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-amber-800">
                  {result.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
