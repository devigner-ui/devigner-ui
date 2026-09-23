# Registry pipeline

`scripts/registry/descriptors.mts` is the canonical metadata for every published component. It owns the display metadata, documented props, examples, dependencies, source location, and the small list of source transformations.

`scripts/registry/generate.mts` writes `apps/docs/lib/registry.ts`. Package source is copied verbatim except for documented package-boundary changes: shared motion tokens import from `@devignerui/ui/motion`, controllable state imports from `@devignerui/ui/hooks`, and MenuDock navigation utilities import from `@devignerui/ui/menu-path`. No behavior or local utility implementation is duplicated in generated source.

`pnpm registry:validate` checks each documented prop against its component Props declarations. `pnpm registry:fixtures` writes a temporary fixture for every descriptor, verifies its imports are declared dependencies, and type-checks the generated source. `pnpm registry:ci` combines stale-output, prop, and fixture checks for CI.