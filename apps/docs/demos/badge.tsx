"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "devignerui";
import { SPRING_LAYOUT } from "devignerui/motion";
import {
  IconArchive,
  IconClock,
  IconRoundArrowRightUp,
  IconCloseCircle2,
  IconDocument,
  IconEye,
  IconFolder,
  IconGallery,
  IconForbiddenCircle,
  IconRestart,
  IconSpinner,
  IconTickCircle,
  IconLoading,
} from "@devigner-ui/icons";

const FILES = [
  { label: "Folders", icon: <IconFolder variant="Bold" />, count: 4 },
  { label: "Files", icon: <IconDocument variant="Bold" />, count: 12 },
  { label: "Images", icon: <IconGallery variant="Bold" />, count: 36 },
];

/** Argentina: sky, white, sky, with the sun. Drawn here so the demo needs no
 *  image request; any <img> or <svg> works in the media slot. */
const FLAG_AR = (
  <svg viewBox="0 0 20 20" className="rounded-full">
    <rect width="20" height="20" fill="#74ACDF" />
    <rect y="6.67" width="20" height="6.66" fill="#fff" />
    <circle cx="10" cy="10" r="1.8" fill="#F6B40E" />
  </svg>
);

/** Presence marks. Online is a dot with a soft halo, offline an empty ring;
 *  both are currentColor, so the badge's tone colors them. */
const STATUS = (
  <span className="m-0.5 size-2 rounded-full bg-current ring-2 ring-current/30" />
);

const AVATAR = (
  <img src="https://avatars.githubusercontent.com/u/124599?v=4" alt="" />
);

export default function BadgeDemo() {
  const [files, setFiles] = useState(FILES);

  return (
    <div className="flex max-w-xl flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        <Badge tone="success" icon={<IconTickCircle variant="Bold" />}>
          Approved
        </Badge>
        <Badge
          icon={<IconLoading strokeWidth="2.5" />}
          className="text-yellow-600 dark:text-yellow-400"
        >
          In Progress
        </Badge>
        <Badge dashed className="text-text-tertiary">
          Not applicable
        </Badge>
        <Badge tone="danger" icon={<IconCloseCircle2 variant="Bold" />}>
          Failed
        </Badge>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Badge
          icon={<IconEye variant="Bold" />}
          className="text-violet-600 dark:text-violet-400"
        >
          Waiting for approval
        </Badge>
        <Badge tone="info" icon={<IconRoundArrowRightUp variant="Bold" />}>
          Submitted
        </Badge>
        <Badge tone="warning" icon={<IconClock variant="Bold" />}>
          Pending
        </Badge>
        <Badge
          icon={<IconArchive variant="Bold" />}
          className="text-text-tertiary"
        >
          Archived
        </Badge>
      </div>
      <div className="flex h-7 flex-wrap justify-center gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {files.map((f) => (
            <Badge
              key={f.label}
              icon={f.icon}
              count={f.count}
              onRemove={() => setFiles((all) => all.filter((x) => x !== f))}
            >
              {f.label}
            </Badge>
          ))}
          {files.length < FILES.length && (
            <motion.span
              key="reset"
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={SPRING_LAYOUT}
            >
              <button
                type="button"
                onClick={() => setFiles(FILES)}
                aria-label="Restore removed badges"
                className="grid size-7 cursor-pointer place-items-center rounded-full text-text-tertiary transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <IconRestart className="size-4" />
              </button>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Badge media={AVATAR}>Liam Smith</Badge>
        <Badge media={FLAG_AR}>Argentina</Badge>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Badge tone="success" icon={STATUS}>
          Online
        </Badge>
        <Badge tone="danger" icon={STATUS}>
          Do not disturb
        </Badge>
        <Badge icon={STATUS} className="text-text-tertiary">
          Offline
        </Badge>
      </div>
    </div>
  );
}
