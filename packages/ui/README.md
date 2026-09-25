# devignerui

React components and motion utilities from Devigner UI.

```sh
npm i devignerui
```

The package expects React 18 or newer, React DOM 18 or newer, Tailwind CSS 4 or newer, Motion 11 or newer, and GSAP 3.13 or newer as peer dependencies.

```tsx
import { MagneticButton } from "devignerui";
import "devignerui/styles.css";

export function Example() {
  return <MagneticButton>Get started</MagneticButton>;
}
```

The package also exports `ChartCard`, `DeleteButton`, `Timeline`, `MenuDock`, and `DateRangePicker`. Motion tokens and hooks are available from `devignerui/motion` and `devignerui/hooks`.

## CLI

```sh
npx devignerui init
npx devignerui list
npx devignerui add magnetic-button
```
