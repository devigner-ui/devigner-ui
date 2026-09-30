"use client";

import { useEffect, useRef } from "react";
import {
  FileUpload,
  FileUploader,
  type FileUploadStatus,
  type FileUploaderContext,
} from "devignerui";

/** What the fake network and the uploader's props are set to. The docs
 *  Settings panel drives these; the gallery demo uses the defaults. */
export const UPLOADER_DEFAULTS = {
  /** Rough seconds per file. */
  seconds: 4,
  /** Every nth upload fails once; 0 never fails. */
  failEvery: 3,
  concurrency: 2,
  maxFiles: 5,
  /** In MB. */
  maxSize: 25,
  resumable: true,
  multiple: true,
  disabled: false,
};
export type UploaderConfig = typeof UPLOADER_DEFAULTS;

export const ACCEPT = ".zip,.rar,.pdf,.ai,.cdr,image/*";

/** Bytes already sent per file, so a resume carries on where it stopped,
 *  the way a resumable protocol would. */
const sent = new WeakMap<File, number>();
let uploads = 0;

/** A fake upload with uneven steps like a real network. */
function fakeUpload({ seconds, failEvery }: UploaderConfig) {
  return (file: File, { onProgress, signal }: FileUploaderContext) => {
    const fails =
      failEvery > 0 && ++uploads % failEvery === 0 && !sent.has(file);
    // A tick is 110ms; the mean step covers the file in `seconds`.
    const step = 0.11 / Math.max(seconds, 0.5);
    return new Promise<void>((resolve, reject) => {
      const tick = () => {
        if (signal.aborted) return reject(signal.reason);
        const done = Math.min(
          1,
          (sent.get(file) ?? 0) + step * (0.4 + Math.random() * 1.2),
        );
        sent.set(file, done);
        onProgress(done);
        if (fails && done > 0.4) {
          sent.delete(file);
          return reject(new Error("Connection lost, try again"));
        }
        if (done >= 1) return resolve();
        setTimeout(tick, 110);
      };
      setTimeout(tick, 110);
    });
  };
}

/** A small gradient picture, so the sample image has a real thumbnail. */
const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f97316"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs><rect width="160" height="160" fill="url(#g)"/><circle cx="112" cy="52" r="22" fill="#fde68a"/></svg>`;
export const SAMPLE_PREVIEW = `data:image/svg+xml,${encodeURIComponent(SAMPLE_SVG)}`;

const MB = 1024 * 1024;

/** The last seed whose samples were dropped. */
let droppedSeed = 0;

function sampleFiles() {
  return [
    new File([new Uint8Array(Math.round(2.4 * MB))], "brand-assets.zip", {
      type: "application/zip",
    }),
    new File([new Uint8Array(Math.round(0.8 * MB))], "invoice-2026.pdf", {
      type: "application/pdf",
    }),
    new File([SAMPLE_SVG], "moodboard.svg", { type: "image/svg+xml" }),
  ];
}

export default function FileUploadDemo({
  config = UPLOADER_DEFAULTS,
  seed = 0,
}: {
  config?: UploaderConfig;
  /** A new, never reused value clears the list and drops the samples in. */
  seed?: number;
}) {
  const box = useRef<HTMLDivElement>(null);

  // ponytail: dropped through the dropzone's own drop handler, so samples
  // take the same validate, queue and upload path a real drop does.
  useEffect(() => {
    // Once per seed: not again on Strict Mode's second effect run, nor when
    // the preview remounts after a trip to card mode.
    if (!seed || seed === droppedSeed) return;
    droppedSeed = seed;
    const zone = box.current?.querySelector("[data-state]");
    if (!zone) return;
    const dt = new DataTransfer();
    sampleFiles().forEach((f) => dt.items.add(f));
    zone.dispatchEvent(
      new DragEvent("drop", {
        dataTransfer: dt,
        bubbles: true,
        cancelable: true,
      }),
    );
  }, [seed]);

  return (
    <div ref={box} className="w-md max-w-full">
      <FileUploader
        key={seed}
        upload={fakeUpload(config)}
        accept={ACCEPT}
        maxSize={config.maxSize * MB}
        maxFiles={config.maxFiles}
        concurrency={config.concurrency}
        multiple={config.multiple}
        resumable={config.resumable}
        disabled={config.disabled}
        onClose={() => {}}
        onCancel={() => {}}
        onSubmit={() => {}}
      />
    </div>
  );
}

/* ─── Single card ─── */

export const FILE_STATUSES: FileUploadStatus[] = [
  "queued",
  "uploading",
  "paused",
  "completed",
  "error",
];

export const CARD_DEFAULTS = {
  /** Index into FILE_STATUSES. */
  status: 1,
  /** Percent. */
  progress: 42,
  /** Uploading counts up on its own and lands on completed. */
  autoplay: true,
  preview: false,
  actions: true,
};
export type CardConfig = typeof CARD_DEFAULTS;

/** One FileUpload driven straight from the Settings panel. Its buttons move
 *  it between states the way an app would. */
export function FileUploadCardDemo({
  config,
  onConfig,
}: {
  config: CardConfig;
  onConfig: (next: Partial<CardConfig>) => void;
}) {
  const status = FILE_STATUSES[config.status];
  const set = (s: FileUploadStatus, progress?: number) =>
    onConfig({
      status: FILE_STATUSES.indexOf(s),
      ...(progress === undefined ? null : { progress }),
    });

  // Latest progress for the timer, without restarting it every tick.
  const latest = useRef(config);
  latest.current = config;
  useEffect(() => {
    if (!config.autoplay || status !== "uploading") return;
    const id = setInterval(() => {
      const next = latest.current.progress + 1 + Math.random() * 3;
      onConfig(
        next >= 100
          ? { status: FILE_STATUSES.indexOf("completed"), progress: 100 }
          : { progress: next },
      );
    }, 120);
    return () => clearInterval(id);
  }, [config.autoplay, status, onConfig]);

  const on = config.actions;
  return (
    <FileUpload
      name={config.preview ? "moodboard.png" : "brand-assets.zip"}
      size={config.preview ? 1.6 * MB : 2.4 * MB}
      progress={config.progress / 100}
      status={status}
      error="Connection lost, try again"
      preview={config.preview ? SAMPLE_PREVIEW : undefined}
      onPause={on ? () => set("paused") : undefined}
      onResume={on ? () => set("uploading") : undefined}
      onRetry={on ? () => set("uploading", 0) : undefined}
      onCancel={on ? () => set("queued", 0) : undefined}
      onRemove={on ? () => set("queued", 0) : undefined}
      onChange={on ? () => set("uploading", 0) : undefined}
      onDownload={on ? () => {} : undefined}
      className="w-sm max-w-full"
    />
  );
}
