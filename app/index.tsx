import { Redirect } from 'expo-router';

// The root "/" route always redirects to the onboarding welcome screen.
// _layout.tsx will redirect to /(tabs) if the user has already onboarded.
export default function Index() {
  return <Redirect href="/(onboarding)/welcome" />;
}
