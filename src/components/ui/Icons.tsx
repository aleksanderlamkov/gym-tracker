import type { CategoryId } from '../../types';

export type IconName =
  | 'plus'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'ellipsis'
  | 'close'
  | 'trash'
  | 'chart'
  | 'calendar'
  | 'barbell'
  | 'program'
  | 'settings'
  | 'download'
  | 'upload'
  | 'arrow-up'
  | 'arrow-down'
  | 'link'
  | 'check';

const paths: Record<IconName, JSX.Element> = {
  plus: <path d="M12 5v14M5 12h14" />,
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  'chevron-right': <path d="M9 6l6 6-6 6" />,
  'chevron-left': <path d="M15 6l-6 6 6 6" />,
  ellipsis: (
    <>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  chart: (
    <>
      <path d="M5 20V14" />
      <path d="M12 20V6" />
      <path d="M19 20v-9" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="6" width="16" height="14" rx="3" />
      <path d="M4 10h16M9 3v5M15 3v5" />
    </>
  ),
  barbell: <path d="M6.5 8.5v7M3.5 10v4M17.5 8.5v7M20.5 10v4M6.5 12h11" />,
  program: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M8 9.5h8M8 14.5h5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" />
    </>
  ),
  download: <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />,
  upload: <path d="M12 15V4m0 0L8 8m4-4l4 4M5 20h14" />,
  'arrow-up': <path d="M12 19V5m0 0l-5 5m5-5l5 5" />,
  'arrow-down': <path d="M12 5v14m0 0l-5-5m5 5l5-5" />,
  link: (
    <path d="M10 13a4.5 4.5 0 0 0 6.4.5l2.5-2.5a4.5 4.5 0 0 0-6.4-6.4l-1.4 1.4M14 11a4.5 4.5 0 0 0-6.4-.5l-2.5 2.5a4.5 4.5 0 0 0 6.4 6.4l1.4-1.4" />
  ),
  check: <path d="M5 13l4 4L19 7" />
};

export function Icon({
  name,
  size = 22,
  strokeWidth = 2
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

const CATEGORY_COLORS: Record<CategoryId, string> = {
  back: '#4f7df9',
  chest: '#f97066',
  legs: '#9b8afb',
  arms: '#f79009',
  shoulders: '#2ed3b7',
  abs: '#fdb022',
  cardio: '#f04438',
  stretching: '#66c61c',
  other: '#98a2b3'
};

function categoryGlyph(category: CategoryId): JSX.Element {
  if (category === 'cardio') {
    return (
      <path d="M12 20s-7-4.3-9-9c-1.2-3 .8-6.5 4-6.5 2.2 0 4 1.4 5 3 1-1.6 2.8-3 5-3 3.2 0 5.2 3.5 4 6.5-2 4.7-9 9-9 9z" />
    );
  }
  if (category === 'stretching') {
    return (
      <>
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7.5V14m0-4.5L7 12m5-2.5l5 2.5M12 14l-3.5 6M12 14l3.5 6" />
      </>
    );
  }
  return <path d="M6.5 8.5v7M3.5 10v4M17.5 8.5v7M20.5 10v4M6.5 12h11" />;
}

export function CategoryBadge({ category, size = 42 }: { category: CategoryId; size?: number }) {
  return (
    <span
      className="cat-badge"
      style={{ width: size, height: size, background: CATEGORY_COLORS[category] }}
    >
      <svg
        width={size * 0.58}
        height={size * 0.58}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {categoryGlyph(category)}
      </svg>
    </span>
  );
}
