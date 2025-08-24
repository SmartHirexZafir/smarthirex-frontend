'use client';

// Deprecated: Sidebar is no longer used on /upload.
// Keeping a no-op component so any leftover imports won't break the build.
type Props = {
  collapsed?: boolean;
  onToggle?: (v: boolean) => void;
};

export default function Sidebar(_props: Props) {
  return null;
}
