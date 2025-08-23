import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { LocationProvider } from "./contexts/LocationContext";
import { OpinionProvider } from "./contexts/OpinionContext";

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	if (!loaded) {
		// Async font loading only occurs in development.
		return null;
	}

	return (
		<LocationProvider>
			<OpinionProvider>
				<ThemeProvider
					value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
				>
					<Stack
						screenOptions={{
							headerTitle: "", // 上部タイトルを非表示
						}}
					>
						<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
						<Stack.Screen name="+not-found" />
					</Stack>
					<StatusBar style="auto" />
				</ThemeProvider>
			</OpinionProvider>
		</LocationProvider>
	);
}
