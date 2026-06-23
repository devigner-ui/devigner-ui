import { CopyButton } from "./copy-button";

interface CodeBlockProps {
  code: string;
  componentName: string;
  language?: string;
}

export function CodeBlock({
  code,
  componentName,
  language = "tsx",
}: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
        <span className="text-xs text-muted-foreground">
          {componentName}.tsx
        </span>
        <CopyButton code={code} componentName={componentName} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}
