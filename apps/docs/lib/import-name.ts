/** The export a component's usage snippet renders, for the import line above
 *  it: the snippet's first JSX tag. It isn't always the display name spelled
 *  as one word (Liquid Glass renders a GlassMenu, File Upload a
 *  FileUploader), so it is read from the snippet, with the name as the
 *  fallback for a snippet that has no tag. */
export function importName(meta: { name: string; usage: string }) {
  return meta.usage.match(/<([A-Z]\w*)/)?.[1] ?? meta.name.replace(/\s+/g, "");
}
