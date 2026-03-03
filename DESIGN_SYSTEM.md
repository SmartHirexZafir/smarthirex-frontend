# Smart HireX Design System

## Color Palette (only colors used across the app)

| Role        | Hex       | Usage                    |
|------------|-----------|--------------------------|
| Primary    | `#1B3C53` | Navbar, primary buttons, main dark surfaces |
| Secondary  | `#234C6A` | Cards (dark), secondary buttons |
| Accent     | `#456882` | Links, focus rings, accents |
| Light BG   | `#D2C1B6` | Light theme background, soft panels |

## CSS Variables (globals.css)

- **Design roles:** `--color-primary`, `--color-secondary`, `--color-accent`, `--color-bg`, `--color-text-dark`, `--color-text-light`, `--color-border`, `--color-hover`, `--color-active`, `--color-muted`
- **Theme (HSL for Tailwind):** `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--accent`, `--muted`, `--border`, `--ring`, plus status: `--destructive`, `--success`, `--warning`, `--info` (and `-foreground` variants)
- **Spacing (8px grid):** `--space-1` (8px) through `--space-6` (48px)
- **Radii:** `--r-sm` (6px) through `--r-3xl` (16px)
- **Transitions:** `--transition-fast` (0.15s), `--transition-base` (0.2s), `--transition-slow` (0.3s)

## Usage

- Use Tailwind semantic classes: `bg-primary`, `text-primary-foreground`, `border-accent`, `ring-accent`, etc.
- Buttons: `btn-primary`, `btn-secondary`, `btn-outline`, `btn-ghost`, `btn-soft`, `btn-danger`, `btn-success`, `btn-warning`, `btn-info`, `btn-google`
- Forms: `input`, `textarea`, `select`; focus uses accent ring
- Cards: `card`, `panel`; soft shadow and hover lift
- Nav: `nav`, `nav-item` (navbar uses solid primary background; text stays visible)
- Tables: add `table-row-hover` for row hover highlight
- Modals: `modal-backdrop`, `modal`

## Theming

- Default: dark (primary/secondary/accent on dark surfaces).
- Light: `<html class="light">`; background uses light palette; text and borders use dark palette for contrast.
- All status colors (success, warning, destructive, info) are derived from the same palette for consistency.

## Accessibility

- Contrast targets WCAG: light text on dark (primary/secondary), dark text on light background in light mode.
- Focus rings use `--ring` (accent); no invisible buttons or low-contrast UI.
