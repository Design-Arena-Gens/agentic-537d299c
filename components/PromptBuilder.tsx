"use client"

import { useEffect, useMemo, useState } from 'react'
import { assemblePrompt } from '@/lib/promptAssembler'
import { defaultPresetLibrary } from '@/lib/presets'
import { critiquePrompt, getChecklist } from '@/lib/quality'
import type { PromptState, Preset } from '@/lib/types'

const defaultState: PromptState = {
  goal: '',
  role: 'You are a senior expert specialized in this task.',
  audience: '',
  context: '',
  inputs: '',
  constraints: 'Be precise. Cite assumptions. Ask clarifying questions if needed.',
  outputFormat: 'Return a final answer AND a concise bullet summary.',
  style: 'Clear, direct, and structured. Prefer numbered steps and bullet points.',
  steps: '1) Analyze 2) Plan 3) Execute 4) Validate 5) Summarize',
  examples: [],
  guardrails: 'Do not fabricate facts. State uncertainties. Refuse out-of-scope or harmful requests.',
  rubric: 'The answer is useful, correct, complete, concise, and reproducible.',
  variables: {},
}

export default function PromptBuilder() {
  const [state, setState] = useState<PromptState>(defaultState)
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [presets, setPresets] = useState<Preset[]>(defaultPresetLibrary)
  const [autoCritique, setAutoCritique] = useState(true)

  // load from URL if present
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
    if (hash) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(hash))) as PromptState
        setState(decoded)
      } catch {}
    }
  }, [])

  // sync to URL for sharable links
  useEffect(() => {
    const encoded = encodeURIComponent(btoa(JSON.stringify(state)))
    const url = new URL(window.location.href)
    url.hash = encoded
    window.history.replaceState({}, '', url.toString())
  }, [state])

  const prompt = useMemo(() => assemblePrompt(state), [state])
  const checklist = useMemo(() => getChecklist(state), [state])
  const critique = useMemo(() => autoCritique ? critiquePrompt(state) : null, [state, autoCritique])

  function applyPreset(id: string) {
    const p = presets.find(x => x.id === id)
    if (!p) return
    setSelectedPreset(id)
    setState(p.state)
  }

  function update<K extends keyof PromptState>(key: K, value: PromptState[K]) {
    setState(prev => ({ ...prev, [key]: value }))
  }

  function addExample() {
    setState(prev => ({ ...prev, examples: [...prev.examples, { input: '', output: '' }] }))
  }

  function updateExample(i: number, field: 'input' | 'output', value: string) {
    setState(prev => ({
      ...prev,
      examples: prev.examples.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex)
    }))
  }

  function removeExample(i: number) {
    setState(prev => ({ ...prev, examples: prev.examples.filter((_, idx) => idx !== i) }))
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
  }

  function download(text: string) {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'prompt.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  function reset() {
    setState(defaultState)
    setSelectedPreset('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className="card p-5 space-y-5">
        <div className="flex items-center gap-3">
          <select className="input" value={selectedPreset} onChange={e => applyPreset(e.target.value)}>
            <option value="">Choose a preset?</option>
            {presets.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button className="button" onClick={() => setPresets(prev => [{ id: crypto.randomUUID(), name: `Custom ${prev.length+1}`, state }, ...prev])}>Save as preset</button>
          <button className="button" onClick={reset}>Reset</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Goal / Task</label>
            <textarea className="textarea" placeholder="What should the AI accomplish?" value={state.goal} onChange={e => update('goal', e.target.value)} />
          </div>
          <div>
            <label className="label">Role</label>
            <input className="input" value={state.role} onChange={e => update('role', e.target.value)} />
          </div>
          <div>
            <label className="label">Audience</label>
            <input className="input" placeholder="Who is the output for?" value={state.audience} onChange={e => update('audience', e.target.value)} />
          </div>
          <div>
            <label className="label">Context</label>
            <textarea className="textarea" placeholder="Background, definitions, constraints..." value={state.context} onChange={e => update('context', e.target.value)} />
          </div>
          <div>
            <label className="label">Inputs / Data</label>
            <textarea className="textarea" placeholder="Paste relevant data or input schema" value={state.inputs} onChange={e => update('inputs', e.target.value)} />
          </div>
          <div>
            <label className="label">Style</label>
            <input className="input" value={state.style} onChange={e => update('style', e.target.value)} />
          </div>
          <div>
            <label className="label">Output Format</label>
            <input className="input" value={state.outputFormat} onChange={e => update('outputFormat', e.target.value)} />
          </div>
          <div>
            <label className="label">Steps / Approach</label>
            <input className="input" value={state.steps} onChange={e => update('steps', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Constraints & Guardrails</label>
            <textarea className="textarea" value={state.constraints + (state.guardrails ? `\n${state.guardrails}` : '')} onChange={e => {
              const val = e.target.value
              const [constraints, ...rest] = val.split('\n')
              update('constraints', constraints)
              update('guardrails', rest.join('\n'))
            }} />
          </div>
          <div className="md:col-span-2">
            <label className="label flex items-center gap-2">
              Variables
              <span className="text-ink-500 text-xs">Reference with {'{{variableName}}'} inside fields</span>
            </label>
            <VariablesEditor value={state.variables} onChange={v => update('variables', v)} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="label">Few-shot Examples</label>
            <button className="button" onClick={addExample}>Add example</button>
          </div>
          <div className="space-y-3">
            {state.examples.map((ex, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <textarea className="textarea" placeholder="Example input" value={ex.input} onChange={e => updateExample(i, 'input', e.target.value)} />
                <div className="flex gap-3">
                  <textarea className="textarea w-full" placeholder="Ideal output" value={ex.output} onChange={e => updateExample(i, 'output', e.target.value)} />
                  <button className="button" onClick={() => removeExample(i)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-ink-300 text-sm">
              <input type="checkbox" checked={autoCritique} onChange={e => setAutoCritique(e.target.checked)} /> Auto-critique
            </label>
          </div>
          <div className="flex gap-3">
            <button className="button" onClick={() => copy(prompt)}>Copy prompt</button>
            <button className="button" onClick={() => download(prompt)}>Download</button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Prompt Preview</h2>
            <button className="button" onClick={() => copy(prompt)}>Copy</button>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-ink-100">{prompt}</pre>
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold mb-4">Quality Checklist</h3>
          <ul className="list-disc list-inside text-ink-200 space-y-1">
            {checklist.map(item => (
              <li key={item.key} className={item.pass ? 'text-ink-300' : 'text-rose-300'}>
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {critique && (
          <div className="card p-5">
            <h3 className="text-base font-semibold mb-4">Auto Critique</h3>
            <ul className="list-disc list-inside text-ink-200 space-y-1">
              {critique.suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
            {critique.rewrite && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="label">Suggested rewrite</div>
                  <div className="flex gap-2">
                    <button className="button" onClick={() => copy(critique.rewrite!)}>Copy rewrite</button>
                    <button className="button" onClick={() => setState(prev => ({ ...prev, ...critique!.statePatch }))}>Apply improvements</button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-ink-100">{critique.rewrite}</pre>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function VariablesEditor({ value, onChange }: { value: Record<string, string>, onChange: (v: Record<string, string>) => void }) {
  const [k, setK] = useState('')
  const [v, setV] = useState('')

  function add() {
    if (!k.trim()) return
    onChange({ ...value, [k.trim()]: v })
    setK(''); setV('')
  }

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input className="input" placeholder="name" value={k} onChange={e => setK(e.target.value)} />
        <input className="input" placeholder="value" value={v} onChange={e => setV(e.target.value)} />
        <button className="button" onClick={add}>Add</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {Object.entries(value).map(([key, val]) => (
          <div key={key} className="flex items-center justify-between border border-ink-700 rounded-lg px-3 py-2">
            <div>
              <div className="text-sm text-ink-300">{key}</div>
              <div className="text-xs text-ink-500">{val}</div>
            </div>
            <button className="button" onClick={() => {
              const copy = { ...value }; delete copy[key]; onChange(copy)
            }}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}
