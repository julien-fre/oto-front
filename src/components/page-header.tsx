export function PageHeader({ title, caption }: { title: string; caption: string }) {
  return (
    <header>
      <h1 className="text-title text-gray-12">{title}</h1>
      <p className="mt-1 text-caption text-muted">{caption}</p>
    </header>
  );
}
