import { StyleSheet, Text, type TextProps } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";

type ThemedTextProps = TextProps & {
	lightColor?: string;
	darkColor?: string;
	type?:
		| "default"
		| "title"
		| "defaultSemiBold"
		| "subtitle"
		| "link"
		| "tokyoTitle"
		| "tokyoSubtitle";
};

export function ThemedText({
	style,
	lightColor,
	darkColor,
	type = "default",
	...rest
}: ThemedTextProps) {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
	const styles = createStyles(colors);

	return (
		<Text
			style={[
				{ color },
				type === "default" ? styles.default : undefined,
				type === "title" ? styles.title : undefined,
				type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
				type === "subtitle" ? styles.subtitle : undefined,
				type === "link" ? styles.link : undefined,
				type === "tokyoTitle" ? styles.tokyoTitle : undefined,
				type === "tokyoSubtitle" ? styles.tokyoSubtitle : undefined,
				style,
			]}
			{...rest}
		/>
	);
}

// 東京都アプリスタイルのスタイルシート
const createStyles = (colors: any) =>
	StyleSheet.create({
		default: {
			fontSize: 16,
			lineHeight: 24,
			fontWeight: "400",
		},
		defaultSemiBold: {
			fontSize: 16,
			lineHeight: 24,
			fontWeight: "600",
		},
		title: {
			fontSize: 32,
			fontWeight: "700",
			lineHeight: 38,
			color: colors.tokyoGreenDark,
		},
		subtitle: {
			fontSize: 20,
			fontWeight: "600",
			lineHeight: 26,
			color: colors.tokyoGreen,
		},
		link: {
			lineHeight: 30,
			fontSize: 16,
			color: colors.tokyoGreen,
			fontWeight: "600",
		},
		// 東京都アプリ専用スタイル
		tokyoTitle: {
			fontSize: 28,
			fontWeight: "700",
			lineHeight: 34,
			color: colors.tokyoGreen,
			textAlign: "center",
		},
		tokyoSubtitle: {
			fontSize: 18,
			fontWeight: "600",
			lineHeight: 24,
			color: colors.tokyoGreenDark,
			textAlign: "center",
		},
	});
