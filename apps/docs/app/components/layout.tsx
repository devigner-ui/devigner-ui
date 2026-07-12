// Scopes /components and /components/[slug] to the shadcn-compatible neutral
// token set defined in globals.css's .shadcn-scope block, without affecting
// the rest of the site (which keeps Devigner's own palette).
export default function ComponentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="shadcn-scope">{children}</div>;
}
