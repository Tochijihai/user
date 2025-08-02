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

export default function OpinionScreen() {
	const [location, setLocation] = useState<Location.LocationObject | null>(
		null,
	);
	const [feedback, setFeedback] = useState("");
	const [sending, setSending] = useState(false);

	const [markerCoords, setMarkerCoords] = useState<LatLng | null>(null);

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

	const handleSendFeedback = () => {
		// TODO: API通信部分を記載
		setSending(true);

		setTimeout(() => {
			alert("意見を送信しました！");
			setFeedback("");
			setSending(false);
		}, 1000);
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
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<LocationMap
				markerCoords={markerCoords}
				setMarkerCoords={setMarkerCoords}
				onLocationLoaded={(loc) => console.log("初期位置:", loc.coords)}
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
						onPress={handleSendFeedback}
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
	container: { flex: 1 },
	mapContainer: { flex: 2 },
	formContainer: {
		flex: 1,
		margin: 16,
		justifyContent: "center",
	},
	input: {
		marginBottom: 16,
		height: 100,
		textAlignVertical: "top",
	},
	button: {
		marginTop: 8,
	},
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
});
