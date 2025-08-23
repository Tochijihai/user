import { Tabs } from "expo-router";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: colors.tokyoGreen,
				tabBarInactiveTintColor: colors.icon,
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarStyle: Platform.select({
					ios: {
						// Use a transparent background on iOS to show the blur effect
						position: "absolute",
						backgroundColor: "rgba(255, 255, 255, 0.9)",
						borderTopWidth: 1,
						borderTopColor: colors.tokyoLightGreen,
					},
					default: {
						backgroundColor: "white",
						borderTopWidth: 2,
						borderTopColor: colors.tokyoGreen,
						elevation: 8,
						shadowColor: colors.shadowColor,
						shadowOpacity: 0.1,
						shadowRadius: 4,
					},
				}),
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: "600",
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "都へのコメント",
					tabBarIcon: ({ color }) => (
						<IconSymbol
							size={28}
							name="bubble.left.and.bubble.right.fill"
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
