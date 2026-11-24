// The one bold thing on the page: the headline says, in words,
// how much of your morning is left.

type Props = {
  today: string; // "2026-11-24", or "" before the browser takes over
  total: number;
  done: number;
  ready: boolean;
};

function headline(total: number, done: number) {
  const left = total - done;
  if (left === 0) return "All clear. Have a quiet shift.";
  if (done === 0) return `Good morning. ${total} checks before you're clear.`;
  if (left === 1) return "One check left.";
  return `${left} checks left.`;
}

function formatDate(today: string) {
  if (!today) return " "; // keep the line's height while loading
  return new Date(`${today}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function Masthead({ today, total, done, ready }: Props) {
  const left = total - done;
  const percent = total ? (done / total) * 100 : 0;

  return (
    <header className="mx-auto max-w-6xl px-4 pt-12 pb-8">
      <p className="mb-2 font-medium text-muted">{formatDate(today)}</p>

      <h1 className="mb-6 max-w-[20ch] text-[clamp(2rem,5.5vw,3.75rem)] leading-[1.05] font-extrabold tracking-[-0.02em]">
        {ready ? headline(total, done) : "Good morning."}
      </h1>

      <div className="h-1.5 overflow-hidden rounded-full bg-rule" aria-hidden="true">
        <div
          className={`h-full transition-[width,background-color] duration-300 motion-reduce:transition-none ${
            left === 0 ? "bg-ok" : "bg-signal"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </header>
  );
}
