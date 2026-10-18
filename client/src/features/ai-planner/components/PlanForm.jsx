import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Textarea } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';

const EXAMPLES = [
  'I need to build a portfolio website within three days.',
  'Prepare and deliver a 20-minute presentation about our Q3 results.',
  'Plan a two-week study schedule for my JavaScript final exam.',
];

/**
 * Description input for the AI planner. Client-side checks mirror the server's
 * rules (5–2000 characters) so users get instant feedback.
 */
export function PlanForm({ onGenerate, isGenerating, disabled = false }) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);

  const submit = (event) => {
    event.preventDefault();
    const trimmed = description.trim();

    if (trimmed.length < 5) {
      setError('Please describe your task in at least 5 characters.');
      return;
    }
    if (trimmed.length > 2000) {
      setError('Descriptions are limited to 2000 characters.');
      return;
    }

    setError(null);
    onGenerate?.(trimmed);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Textarea
        label="What do you need to get done?"
        value={description}
        onChange={(event) => {
          setDescription(event.target.value);
          if (error) setError(null);
        }}
        error={error}
        rows={5}
        maxLength={2000}
        placeholder="Describe the goal, deadline, and any constraints. The more context, the better the plan."
        hint={`${description.length}/2000 characters · plans are AI estimates, not guarantees`}
      />

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setDescription(example);
              setError(null);
            }}
            className="rounded-full border border-border-base px-3 py-1 text-[11px] text-fg-muted transition hover:border-accent/40 hover:text-accent"
          >
            {example.length > 46 ? `${example.slice(0, 46)}…` : example}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <Button type="submit" leftIcon={Sparkles} isLoading={isGenerating} disabled={disabled}>
          {isGenerating ? 'Generating plan…' : 'Generate plan'}
        </Button>
      </div>
    </form>
  );
}
