/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// 東京都アプリのカラーパレット
const tokyoGreen = "#00B04F"; // 東京都アプリのメインカラー
const tokyoGreenLight = "#17B04F"; // 少し明るい緑
const tokyoGreenDark = "#008A3F"; // 少し暗い緑
const tokyoLightGreen = "#E8F5E8"; // 薄い緑色背景
const tintColorLight = tokyoGreen;
const tintColorDark = "#fff";

export const Colors = {
	light: {
		text: "#11181C",
		background: "#fff",
		tint: tintColorLight,
		icon: "#687076",
		tabIconDefault: "#687076",
		tabIconSelected: tintColorLight,
		// 東京都アプリ専用カラー
		tokyoGreen: tokyoGreen,
		tokyoGreenLight: tokyoGreenLight,
		tokyoGreenDark: tokyoGreenDark,
		tokyoLightGreen: tokyoLightGreen,
		cardBackground: "#fff",
		shadowColor: "rgba(0, 0, 0, 0.1)",
	},
	dark: {
		text: "#ECEDEE",
		background: "#151718",
		tint: tintColorDark,
		icon: "#9BA1A6",
		tabIconDefault: "#9BA1A6",
		tabIconSelected: tintColorDark,
		// 東京都アプリ専用カラー（ダークモード）
		tokyoGreen: tokyoGreenLight,
		tokyoGreenLight: tokyoGreenDark,
		tokyoGreenDark: tokyoGreen,
		tokyoLightGreen: "#1A3A1A",
		cardBackground: "#2A2A2A",
		shadowColor: "rgba(255, 255, 255, 0.1)",
	},
};
