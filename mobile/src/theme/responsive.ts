/**
 * Artisan-AI — Responsive Utilities
 * "Design once, adapt everywhere."
 *
 * All functions read Dimensions lazily (inside the function body) so they are
 * never called during module initialisation — safe for Hermes / React Native.
 */
import { Dimensions, PixelRatio } from 'react-native';

// Design baseline (standard Android phone 360px)
const BASE_WIDTH = 360;

/** Get current screen width safely (lazy, called inside functions) */
function getWidth(): number {
  return Dimensions.get('window').width;
}

function getHeight(): number {
  return Dimensions.get('window').height;
}

/**
 * Scale a size proportionally to screen width.
 * Clamped to ±25% of baseline to avoid extremes on tiny/huge devices.
 */
export function rs(size: number): number {
  const scale = getWidth() / BASE_WIDTH;
  const clamped = Math.max(0.85, Math.min(scale, 1.25));
  return Math.round(PixelRatio.roundToNearestPixel(size * clamped));
}

/**
 * Scale a font size. More conservative (±15%) to respect OS accessibility settings.
 */
export function rf(size: number): number {
  const scale = getWidth() / BASE_WIDTH;
  const clamped = Math.max(0.85, Math.min(scale, 1.15));
  return Math.round(PixelRatio.roundToNearestPixel(size * clamped));
}

/** Percentage of screen width */
export function wp(percent: number): number {
  return (getWidth() * percent) / 100;
}

/** Percentage of screen height */
export function hp(percent: number): number {
  return (getHeight() * percent) / 100;
}

/**
 * Responsive horizontal padding.
 * < 360px → 12  |  360–413px → 16  |  414px+ → 20
 */
export function rp(): number {
  const w = getWidth();
  if (w < 360) return 12;
  if (w >= 414) return 20;
  return 16;
}

/**
 * Responsive card gap.
 * < 360px → 8  |  360–413px → 10  |  414px+ → 12
 */
export function rg(): number {
  const w = getWidth();
  if (w < 360) return 8;
  if (w >= 414) return 12;
  return 10;
}

/** True for phones narrower than 360px */
export function isSmallDevice(): boolean {
  return getWidth() < 360;
}

/** True for tablets (width ≥ 600px) */
export function isTablet(): boolean {
  return getWidth() >= 600;
}

/** Current screen width (read lazily) */
export function screenWidth(): number {
  return getWidth();
}

/** Current screen height (read lazily) */
export function screenHeight(): number {
  return getHeight();
}

/**
 * Responsive value — picks the right value for the current device size.
 * Usage: rv({ small: 12, medium: 16, large: 20, tablet: 24 })
 */
export function rv<T>(values: {
  small?: T;
  medium: T;
  large?: T;
  tablet?: T;
}): T {
  const w = getWidth();
  if (w >= 600 && values.tablet !== undefined) return values.tablet;
  if (w >= 414 && values.large !== undefined) return values.large;
  if (w < 360 && values.small !== undefined) return values.small;
  return values.medium;
}
