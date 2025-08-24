import { StyleSheet, View, type ViewProps } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";

type ThemedViewProps = ViewProps & {
	lightColor?: string;
	darkColor?: string;
	type?: "default" | "card" | "tokyoCard" | "tokyoBackground";
};

export function ThemedView({
	style,
	lightColor,
	darkColor,
	type = "default",
	...otherProps
}: ThemedViewProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	const backgroundColor = useThemeColor(
		{ light: lightColor, dark: darkColor },
		"background",
	);
	const styles = createStyles(colors);

	return (
		<View
			style={[
				{ backgroundColor },
				type === "card" ? styles.card : undefined,
				type === "tokyoCard" ? styles.tokyoCard : undefined,
				type === "tokyoBackground" ? styles.tokyoBackground : undefined,
				style,
			]}
			{...otherProps}
		/>
	);
}

// 東京都アプリスタイルのスタイルシート
const createStyles = (colors: any) =>
	StyleSheet.create({
		card: {
			backgroundColor: colors.cardBackground,
			borderRadius: 12,
			padding: 16,
			elevation: 4,
			shadowColor: colors.shadowColor,
			shadowOpacity: 0.1,
			shadowRadius: 4,
			shadowOffset: { width: 0, height: 2 },
		},
		tokyoCard: {
			backgroundColor: colors.cardBackground,
			borderRadius: 16,
			padding: 20,
			elevation: 6,
			shadowColor: colors.shadowColor,
			shadowOpacity: 0.15,
			shadowRadius: 8,
			shadowOffset: { width: 0, height: 3 },
			borderTopWidth: 3,
			borderTopColor: colors.tokyoGreen,
		},
		tokyoBackground: {
			backgroundColor: colors.tokyoLightGreen,
		},
	});
