export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-4 px-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Oto
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          The company brain. Frontend scaffold — start building in{" "}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
            src/app/page.tsx
          </code>
          .
        </p>
      </main>
    </div>
  );
}
