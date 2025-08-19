import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import type { LatLng } from "react-native-maps";
import {
	ActivityIndicator,
	Button,
	Card,
	Provider as PaperProvider,
	Text,
	TextInput,
} from "react-native-paper";
import LocationMap from "@/components/LocationMap";
import { Colors } from "@/constants/Colors"; // Colors.tsをインポート
import { userInfo } from "@/testUserInfo";
import { userApiClient } from "../apiClients/UserApiClient";

export default function OpinionScreen() {
	const [location, setLocation] = useState<Location.LocationObject | null>(
		null,
	);
	const [feedback, setFeedback] = useState("");
	const [sending, setSending] = useState(false);

	const [markerCoords, setMarkerCoords] = useState<LatLng | null>(null);

	// 初期位置を取得してマーカーの座標を設定
	useEffect(() => {
		(async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") return;

			const loc = await Location.getCurrentPositionAsync({});
			setLocation(loc);
			setMarkerCoords({
				latitude: loc.coords.latitude,
				longitude: loc.coords.longitude,
			});
		})();
	}, []);

	// 意見を送信する関数
	const handleSendOpinion = async () => {
		if (!markerCoords) {
			alert("位置情報が未設定です");
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
			alert("意見を送信しました！");
			setFeedback("");
		} catch (error) {
			alert(`意見の送信に失敗しました。${error}`);
		} finally {
			setSending(false);
		}
	};

	const Loading = () => (
		<PaperProvider>
			<View style={styles.center}>
				<ActivityIndicator animating size="large" />
				<Text>位置情報を取得中...</Text>
			</View>
		</PaperProvider>
	);

	const DefaultView = () => (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : "padding"}
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
		</KeyboardAvoidingView>
	);

	return <PaperProvider>{!location ? Loading() : DefaultView()}</PaperProvider>;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.light.background, // 背景色を設定
	},
	mapContainer: { flex: 2 },
	formContainer: {
		flex: 1,
		margin: 16,
		justifyContent: "center",
		backgroundColor: Colors.light.background, // フォームの背景色を設定
	},
	input: {
		marginBottom: 16,
		height: 100,
		textAlignVertical: "top",
		color: Colors.light.text, // テキスト色を設定
	},
	button: {
		marginTop: 8,
		backgroundColor: Colors.light.tint, // ボタンの色を設定
	},
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
});
