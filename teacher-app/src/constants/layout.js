import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Scale relative to 390pt wide baseline (iPhone 14)
const BASE_W = 390;
const scale  = SCREEN_W / BASE_W;

/**
 * rs() — responsive size. Clamps scale between 0.85 and 1.25 to prevent
 * extreme values on very small or very large screens.
 */
export const rs = (size) => {
  const clamped = Math.min(Math.max(scale, 0.85), 1.25);
  return Math.round(PixelRatio.roundToNearestPixel(size * clamped));
};

/**
 * fs() — responsive font size. Tighter clamping (0.9 – 1.15) so text
 * doesn't grow/shrink as aggressively as spacing.
 */
export const fs = (size) => {
  const clamped = Math.min(Math.max(scale, 0.9), 1.15);
  return Math.round(PixelRatio.roundToNearestPixel(size * clamped));
};

export const Layout = {
  screenW:   SCREEN_W,
  screenH:   SCREEN_H,
  isSmall:   SCREEN_W < 375,
  isMedium:  SCREEN_W >= 375 && SCREEN_W < 414,
  isLarge:   SCREEN_W >= 414,
  isIpad:    SCREEN_W >= 768,
  isIOS:     Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',

  // Spacing
  xs:  rs(4),
  sm:  rs(8),
  md:  rs(16),
  lg:  rs(24),
  xl:  rs(32),
  xxl: rs(48),

  // Border radius
  radiusSm:   rs(8),
  radiusMd:   rs(12),
  radiusLg:   rs(16),
  radiusXl:   rs(24),
  radiusFull: 999,

  // Component dimensions
  cardPadding: rs(20),
  cardRadius:  rs(16),
  inputHeight: rs(52),
  inputRadius: rs(12),
  btnHeight:   rs(52),
  btnRadius:   rs(14),
};
