export function PageHeader({ title }: { title: string }) {
  // leading-7 (28px) matches the floating reopen button (size-7) so the
  // title lines up with it regardless of sidebar state.
  return <h1 className="text-[15px] leading-7 text-gray-12">{title}</h1>;
}
