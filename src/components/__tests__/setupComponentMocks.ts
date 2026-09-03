// Setup PNG require hook for Node
require.extensions['.png'] = (module: any) => {
  module.exports = 1;
};

// Mock react-native
const mockReactNative = {
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  TouchableOpacity: 'TouchableOpacity',
  Pressable: 'Pressable',
  StyleSheet: {
    create: <T extends Record<string, any>>(styles: T): T => styles,
    flatten: (style: any) => {
      if (!style) return {};
      if (Array.isArray(style)) {
        const flat: Record<string, any> = {};
        for (const s of style) {
          if (s) Object.assign(flat, Array.isArray(s) ? mockReactNative.StyleSheet.flatten(s) : s);
        }
        return flat;
      }
      return style;
    },
    absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  },
  Platform: {
    OS: 'ios',
    select: (obj: any) => obj.ios,
  },
};

const rnResolved = require.resolve('react-native');
require.cache[rnResolved] = {
  id: rnResolved,
  filename: rnResolved,
  loaded: true,
  exports: mockReactNative,
} as unknown as NodeModule;

// Mock expo-linear-gradient
const elgResolved = require.resolve('expo-linear-gradient');
require.cache[elgResolved] = {
  id: elgResolved,
  filename: elgResolved,
  loaded: true,
  exports: { LinearGradient: 'LinearGradient' },
} as unknown as NodeModule;

// Mock @expo/vector-icons
const viResolved = require.resolve('@expo/vector-icons');
require.cache[viResolved] = {
  id: viResolved,
  filename: viResolved,
  loaded: true,
  exports: { MaterialIcons: 'MaterialIcons' },
} as unknown as NodeModule;
