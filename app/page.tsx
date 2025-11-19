import PromptBuilder from '@/components/PromptBuilder'

export default function Page() {
  return (
    <main className="container py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Prompt Maker AI</h1>
          <p className="text-ink-300 mt-1">Compose world-class prompts with reusable templates, examples, and guardrails.</p>
        </div>
        <a className="button" href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
      </header>
      <PromptBuilder />
      <footer className="text-ink-400 text-sm mt-10">
        Built for fast iteration and production-ready prompts.
      </footer>
    </main>
  )
}
