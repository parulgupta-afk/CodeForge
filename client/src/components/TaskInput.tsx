import { useState } from "react";

interface Props {
  onSubmit: (task: string) => void;
  loading: boolean;
}

export default function TaskInput({ onSubmit, loading }: Props) {
  const [task, setTask] = useState(
    "Calculate the average of numbers from 1 to 100"
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!task.trim() || loading) return;
    onSubmit(task.trim());
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <label style={styles.label}>What do you want to build?</label>
      <textarea
        value={task}
        onChange={(e) => setTask(e.target.value)}
        rows={4}
        style={styles.textarea}
        placeholder="e.g. Clean this CSV and create a bar chart..."
        disabled={loading}
      />
      <button type="submit" disabled={loading || !task.trim()} style={styles.button}>
        {loading ? "Running Agent..." : "Run Agent"}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    background: "#1e293b",
    padding: "1.5rem",
    borderRadius: "12px",
    border: "1px solid #334155",
  },
  label: {
    fontWeight: 600,
    fontSize: "1.1rem",
  },
  textarea: {
    background: "#0f172a",
    color: "#e2e8f0",
    border: "1px solid #475569",
    borderRadius: "8px",
    padding: "0.75rem",
    resize: "vertical",
    fontSize: "0.95rem",
  },
  button: {
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "0.75rem 1.25rem",
    fontWeight: 600,
    fontSize: "1rem",
    alignSelf: "flex-start",
  },
};
