// Setup image require hook for Node
require.extensions['.png'] = (module: any) => {
  module.exports = 1;
};
require.extensions['.jpg'] = (module: any) => {
  module.exports = 1;
};
require.extensions['.jpeg'] = (module: any) => {
  module.exports = 1;
};

// Mock @react-native/assets-registry
try {
  const arResolved = require.resolve('@react-native/assets-registry/registry.js');
  require.cache[arResolved] = {
    id: arResolved,
    filename: arResolved,
    loaded: true,
    exports: {
      registerAsset: () => 1,
      getAssetByID: () => ({
        httpServerLocation: '',
        width: 100,
        height: 100,
        scales: [1],
        hash: '1',
        name: 'asset',
        type: 'png',
      }),
    },
  } as unknown as NodeModule;
} catch {
  // ignore
}

// Mock expo-notifications
export const mockExpoNotifications = {
  getPermissionsAsync: async () => ({ status: 'granted', granted: true }),
  requestPermissionsAsync: async () => ({ status: 'granted', granted: true }),
  scheduleNotificationAsync: async (_req?: any) => 'mock-notification-id',
  cancelScheduledNotificationAsync: async (_id: string) => {},
  setNotificationHandler: () => {},
  SchedulableTriggerInputTypes: {
    CALENDAR: 'calendar',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
  },
};

try {
  const expoNotifResolved = require.resolve('expo-notifications');
  require.cache[expoNotifResolved] = {
    id: expoNotifResolved,
    filename: expoNotifResolved,
    loaded: true,
    exports: mockExpoNotifications,
  } as unknown as NodeModule;
} catch {
  // ignore
}

// Mock Alert
export const mockAlert = {
  alert: (_title: string, _message?: string, _buttons?: any[]) => {},
};

// Mock react-native
const mockReactNative = {
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  TouchableOpacity: 'TouchableOpacity',
  Pressable: 'Pressable',
  TextInput: 'TextInput',
  FlatList: 'FlatList',
  ScrollView: 'ScrollView',
  ActivityIndicator: 'ActivityIndicator',
  StatusBar: 'StatusBar',
  Switch: 'Switch',
  Modal: 'Modal',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  SafeAreaView: 'SafeAreaView',
  Alert: mockAlert,
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
  useWindowDimensions: () => ({ width: 375, height: 812, scale: 2, fontScale: 1 }),
  Dimensions: {
    get: () => ({ width: 375, height: 812, scale: 2, fontScale: 1 }),
    set: () => {},
    addEventListener: () => ({ remove: () => {} }),
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
  exports: {
    MaterialIcons: 'MaterialIcons',
    MaterialCommunityIcons: 'MaterialCommunityIcons',
  },
} as unknown as NodeModule;

// Mock react-native-gesture-handler
try {
  const rnghResolved = require.resolve('react-native-gesture-handler');
  require.cache[rnghResolved] = {
    id: rnghResolved,
    filename: rnghResolved,
    loaded: true,
    exports: {
      Swipeable: 'Swipeable',
    },
  } as unknown as NodeModule;
} catch {
  // ignore
}

// Mock react-native-safe-area-context
try {
  const rnsacResolved = require.resolve('react-native-safe-area-context');
  require.cache[rnsacResolved] = {
    id: rnsacResolved,
    filename: rnsacResolved,
    loaded: true,
    exports: {
      SafeAreaView: 'SafeAreaView',
      SafeAreaProvider: 'SafeAreaProvider',
      useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    },
  } as unknown as NodeModule;
} catch {
  // ignore
}

// Mock react-native-svg
try {
  const rnSvgResolved = require.resolve('react-native-svg');
  const SvgMock: any = Object.assign((props: any) => props, {
    Circle: 'Circle',
    G: 'G',
    Path: 'Path',
    Text: 'SvgText',
  });
  require.cache[rnSvgResolved] = {
    id: rnSvgResolved,
    filename: rnSvgResolved,
    loaded: true,
    exports: {
      default: SvgMock,
      Svg: SvgMock,
      Circle: 'Circle',
      G: 'G',
      Path: 'Path',
      Text: 'SvgText',
    },
  } as unknown as NodeModule;
} catch {
  // ignore
}

// Mock victory-native
try {
  const vnResolved = require.resolve('victory-native');
  require.cache[vnResolved] = {
    id: vnResolved,
    filename: vnResolved,
    loaded: true,
    exports: {
      VictoryPie: 'VictoryPie',
    },
  } as unknown as NodeModule;
} catch {
  // ignore
}

// Mock expo-router
export const mockRouter = {
  push: (_url: string) => {},
  replace: (_url: string) => {},
  back: () => {},
};

const MockStack: any = Object.assign((props: any) => props, {
  Screen: (props: any) => props,
});

const MockTabs: any = Object.assign((props: any) => props, {
  Screen: (props: any) => props,
});

export let mockSearchParams: Record<string, any> = {};
export function setMockSearchParams(params: Record<string, any>) {
  mockSearchParams = params;
}

try {
  const erResolved = require.resolve('expo-router');
  require.cache[erResolved] = {
    id: erResolved,
    filename: erResolved,
    loaded: true,
    exports: {
      mockRouter,
      useRouter: () => mockRouter,
      useLocalSearchParams: () => mockSearchParams,
      useSegments: () => [],
      useFocusEffect: (cb: any) => {
        if (typeof cb === 'function') {
          return cb();
        }
      },
      Stack: MockStack,
      Tabs: MockTabs,
    },
  } as unknown as NodeModule;
} catch {
  // ignore
}


