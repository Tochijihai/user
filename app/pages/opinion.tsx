import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import type { LatLng } from "react-native-maps";
import {
	ActivityIndicator,
	Button,
	Card,
	Provider as PaperProvider,
	Snackbar,
	Text,
	TextInput,
} from "react-native-paper";
import LocationMap from "@/components/LocationMap";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { userInfo } from "@/testUserInfo";
import { userApiClient } from "../apiClients/UserApiClient";
import { useLocationContext } from "../contexts/LocationContext";
import { useOpinionContext } from "../contexts/OpinionContext";

const Loading = () => {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	const styles = createStyles(colors);

	return (
		<PaperProvider>
			<View style={styles.center}>
				<ActivityIndicator animating size="large" color={colors.tokyoGreen} />
				<Text
					style={{ color: colors.tokyoGreenDark, fontSize: 16, marginTop: 12 }}
				>
					位置情報を取得中...
				</Text>
			</View>
		</PaperProvider>
	);
};

export default function OpinionScreen() {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	const styles = createStyles(colors);

	const { location, setLocation } = useLocationContext();
	const { triggerRefresh, setSuccessMessage } = useOpinionContext();

	const [feedback, setFeedback] = useState("");
	const [sending, setSending] = useState(false);
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [snackbarType, setSnackbarType] = useState<"success" | "error">(
		"success",
	);

	const [markerCoords, setMarkerCoords] = useState<LatLng | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);

	// 初期位置を取得してマーカーの座標を設定（一度だけ実行）
	useEffect(() => {
		(async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") return;

			// 初期化が未完了で、locationが存在する場合のみ設定
			if (!isInitialized && location) {
				setMarkerCoords({
					latitude: location.coords.latitude,
					longitude: location.coords.longitude,
				});
				setIsInitialized(true);
			}
		})();
	}, [location, isInitialized]); // isInitializedフラグで初期化を制御

	// 意見を送信する関数
	const handleSendOpinion = async () => {
		if (!markerCoords) {
			setSnackbarMessage("位置情報が未設定です");
			setSnackbarType("error");
			setSnackbarVisible(true);
			return;
		}

		setSending(true);
		try {
			const body = {
				mailAddress: userInfo.mailAddress,
				coordinate: {
					latitude: markerCoords.latitude,
					longitude: markerCoords.longitude,
				},
				opinion: feedback,
			};

			await userApiClient.post("/user/opinions", {}, body);
			setFeedback("");
			// メイン画面の意見一覧更新をトリガー
			triggerRefresh();
			// 成功メッセージをcontextに設定
			setSuccessMessage("意見を送信しました！");
			// 前の画面に戻る
			router.back();
		} catch (error) {
			setSnackbarMessage(`意見の送信に失敗しました。${error}`);
			setSnackbarType("error");
			setSnackbarVisible(true);
		} finally {
			setSending(false);
		}
	};

	const DefaultView = () => (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<LocationMap
				markerCoords={markerCoords}
				setMarkerCoords={setMarkerCoords}
			/>

			<Card style={styles.formContainer}>
				<Card.Title title="東京都内の施設・環境について" />
				<Card.Content>
					<TextInput
						label="良い点・課題点を教えてください"
						value={feedback}
						onChangeText={setFeedback}
						multiline
						mode="outlined"
						style={styles.input}
					/>
					<Button
						mode="contained"
						onPress={handleSendOpinion}
						loading={sending}
						disabled={sending}
						style={styles.button}
					>
						{sending ? "送信中..." : "送信する"}
					</Button>
				</Card.Content>
			</Card>

			<Snackbar
				visible={snackbarVisible}
				onDismiss={() => setSnackbarVisible(false)}
				duration={3000}
				style={{
					backgroundColor:
						snackbarType === "success" ? colors.tokyoGreen : "#f44336",
				}}
			>
				{snackbarMessage}
			</Snackbar>
		</KeyboardAvoidingView>
	);

	return <PaperProvider>{!location ? Loading() : DefaultView()}</PaperProvider>;
}

// 東京都アプリスタイルのスタイルシート
const createStyles = (colors: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.tokyoLightGreen,
		},
		mapContainer: {
			flex: 2,
			borderRadius: 12,
			margin: 8,
			overflow: "hidden",
			elevation: 4,
			shadowColor: colors.shadowColor,
			shadowOpacity: 0.1,
			shadowRadius: 4,
		},
		formContainer: {
			marginHorizontal: 16,
			marginVertical: 12,
			backgroundColor: colors.cardBackground,
			borderRadius: 16,
			elevation: 6,
			shadowColor: colors.shadowColor,
			shadowOpacity: 0.15,
			shadowRadius: 8,
			borderTopWidth: 3,
			borderTopColor: colors.tokyoGreen,
		},
		input: {
			marginBottom: 20,
			height: 120,
			textAlignVertical: "top",
			backgroundColor: "white",
		},
		button: {
			marginTop: 12,
			backgroundColor: colors.tokyoGreen,
			borderRadius: 8,
			paddingVertical: 4,
		},
		center: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			backgroundColor: colors.tokyoLightGreen,
		},
	});
