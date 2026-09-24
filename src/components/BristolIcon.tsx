/** Small drawing of each Bristol stool type, in the current text colour. */
export default function BristolIcon({ type }: { type: number }) {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" fill="currentColor" aria-hidden="true">
      {SHAPES[type]}
    </svg>
  );
}

const SHAPES: Record<number, React.ReactNode> = {
  // Separate hard lumps
  1: (
    <>
      <circle cx="10" cy="10" r="4" />
      <circle cx="22" cy="10" r="4" />
      <circle cx="10" cy="22" r="4" />
      <circle cx="22" cy="22" r="4" />
      <circle cx="16" cy="16" r="2.5" opacity="0.55" />
    </>
  ),
  // Lumpy clump
  2: (
    <>
      <circle cx="13" cy="13" r="6" />
      <circle cx="19" cy="15" r="6" />
      <circle cx="15" cy="20" r="6" />
      <circle cx="21" cy="11" r="3" opacity="0.7" />
    </>
  ),
  // Sausage with cracks
  3: (
    <>
      <rect x="4" y="10" width="24" height="12" rx="6" transform="rotate(-8 16 16)" />
      <path d="M12 11l1 4M17 10.5l1 4M22 10l.6 3.5" stroke="var(--crack, #fff)" strokeWidth="1.4" strokeLinecap="round" transform="rotate(-8 16 16)" />
    </>
  ),
  // Smooth, soft sausage
  4: <ellipse cx="16" cy="16" rx="12" ry="6" />,
  // Soft blobs with clear edges
  5: (
    <>
      <circle cx="11" cy="18" r="5.5" />
      <circle cx="21" cy="13" r="5" />
      <circle cx="17" cy="23" r="3.5" opacity="0.7" />
    </>
  ),
  // Mushy, ragged edges
  6: (
    <path d="M8 18c-2-3 1-7 4-6 0-3 4-5 6-3 2-2 6 0 6 3 3 0 5 4 3 6 1 3-2 6-5 5-1 2-5 3-7 1-3 1-6-1-5-3-2 0-3-2-2-3z" />
  ),
  // Watery
  7: (
    <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <path d="M5 10c3-3 5 3 8 0s5 3 8 0 5 3 6 1" />
      <path d="M5 16c3-3 5 3 8 0s5 3 8 0 5 3 6 1" />
      <path d="M5 22c3-3 5 3 8 0s5 3 8 0 5 3 6 1" />
    </g>
  ),
};
