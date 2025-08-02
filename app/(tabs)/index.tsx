import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

export default function LocationMap() {
	const [location, setLocation] = useState<Location.LocationObject | null>(
		null,
	);

	useEffect(() => {
		(async () => {
			// 位置情報の許可をリクエスト
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				return;
			}

			// 現在地を取得
			const loc = await Location.getCurrentPositionAsync({});
			setLocation(loc);
		})();
	}, []);

	if (!location) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" />
				<Text>位置情報を取得中...</Text>
			</View>
		);
	}

	return (
		<MapView
			style={{ flex: 1 }}
			provider={PROVIDER_GOOGLE}
			initialRegion={{
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
				latitudeDelta: 0.01,
				longitudeDelta: 0.01,
			}}
		>
			<Marker
				coordinate={{
					latitude: location.coords.latitude,
					longitude: location.coords.longitude,
				}}
				title="現在地"
				description="ここにいます"
			/>
		</MapView>
	);
}

const styles = StyleSheet.create({
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
