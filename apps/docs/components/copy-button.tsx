"use client";

import { useState, useCallback } from "react";
import { StatefulButton, type ButtonProps } from "@devignerui/ui";

interface CopyButtonProps {
  code: string;
  componentName: string;
  variant?: ButtonProps["variant"];
  className?: string;
}

function CopyIcon() {
  return (
    <svg
      className="size-3.5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
      />
    </svg>
  );
}

export function CopyButton({
  code,
  variant = "outline",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (copied) return;

    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }, [code, copied]);

  return (
    <StatefulButton
      state={copied ? "success" : "idle"}
      successText="Copied"
      icon={<CopyIcon />}
      variant={variant}
      size="sm"
      onClick={handleCopy}
      disabled={copied}
      className={`h-auto rounded-md px-3 py-1 text-xs/4 ${className}`}
    >
      Copy
    </StatefulButton>
  );
}
