interface Props {
  models: string[];
  selected: string;
  onChange: (v: string) => void;
}

export default function ModelSelector({ models, selected, onChange }: Props) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">Model</label>
      <select
        className="field text-xs py-1.5"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        {models.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
        {models.length === 0 && <option value="">no models found</option>}
      </select>
    </div>
  );
}
