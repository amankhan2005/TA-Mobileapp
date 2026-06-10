import { fs } from './layout';

export const Typography = {
  // Display
  h1:    { fontSize: fs(28), fontFamily: 'Poppins_700Bold',    lineHeight: fs(36) },
  h2:    { fontSize: fs(24), fontFamily: 'Poppins_700Bold',    lineHeight: fs(32) },
  h3:    { fontSize: fs(20), fontFamily: 'Poppins_600SemiBold', lineHeight: fs(28) },
  h4:    { fontSize: fs(17), fontFamily: 'Poppins_600SemiBold', lineHeight: fs(24) },

  // Body
  body1: { fontSize: fs(15), fontFamily: 'Poppins_400Regular', lineHeight: fs(22) },
  body2: { fontSize: fs(13), fontFamily: 'Poppins_400Regular', lineHeight: fs(20) },
  body3: { fontSize: fs(12), fontFamily: 'Poppins_400Regular', lineHeight: fs(18) },

  // Labels / UI
  label: { fontSize: fs(14), fontFamily: 'Poppins_500Medium',  lineHeight: fs(20) },
  btn:   { fontSize: fs(15), fontFamily: 'Poppins_600SemiBold', lineHeight: fs(22) },
  caption:{ fontSize: fs(11), fontFamily: 'Poppins_400Regular', lineHeight: fs(16) },

  // Brand
  brand: { fontSize: fs(22), fontFamily: 'Poppins_700Bold' },
  tag:   { fontSize: fs(10), fontFamily: 'Poppins_500Medium', letterSpacing: 1.5 },
};
