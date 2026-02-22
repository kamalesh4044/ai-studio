import { CHAT_MODELS } from "@/utils/models";

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-ink-200/70 bg-white/75 px-3 py-2 text-sm shadow-sm dark:border-ink-600 dark:bg-ink-900/75">
      <span className="text-ink-600 dark:text-ink-300">Model</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-48 rounded-md border border-transparent bg-transparent text-ink-900 outline-none dark:text-ink-100"
      >
        {CHAT_MODELS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
    </label>
  );
}
