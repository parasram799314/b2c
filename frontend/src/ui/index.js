// ui/index.js
// ─────────────────────────────────────────────────────────────────────────
// SINGLE IMPORT POINT — har jagah se bas yahi use karo:
//   import { FlightCard, TabHeader, EmptyState, BookingOverlay } from '../ui'
// ─────────────────────────────────────────────────────────────────────────

// ── primitives ────────────────────────────────────────────────────────────
export { default as TabHeader }   from './primitives/TabHeader';
export { default as EmptyState }  from './primitives/EmptyState';
export { default as DestSection } from './primitives/DestSection';
export { default as Stepper }     from './primitives/Stepper';
export { Badge, Tag }             from './primitives/Badge';

// ── layout ────────────────────────────────────────────────────────────────
export { default as FilterTabBar }          from './layout/FilterTabBar';
export { CardGrid, SectionHeader, PageTopBar } from './layout/CardGrid';

// ── cards ─────────────────────────────────────────────────────────────────
export {
  FlightCard,
  HotelCard,
  RestaurantCard,
  AttractionCard,
  TransportCard,
  TransportOptionCard,
  ItineraryCard,
} from './cards/index';

// ── overlays ──────────────────────────────────────────────────────────────
export { default as BookingOverlay } from './overlays/BookingOverlay';
export { ModalWrapper }              from './overlays/ModalWrapper';

// ── feedback ──────────────────────────────────────────────────────────────
export { LoadingSpinner, ErrorBanner, ProgressBar, InlineLoader } from './feedback/index';