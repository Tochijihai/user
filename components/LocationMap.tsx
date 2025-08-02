import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

type LatLng = {
	latitude: number;
	longitude: number;
};

type Props = {
	markerCoords: LatLng | null;
	setMarkerCoords: (coords: LatLng) => void;
	onLocationLoaded?: (location: Location.LocationObject) => void;
};

export default function LocationMap({
	markerCoords,
	setMarkerCoords,
	onLocationLoaded,
}: Props) {
	const [location, setLocation] = useState<Location.LocationObject | null>(
		null,
	);

	useEffect(() => {
		(async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") return;

			const loc = await Location.getCurrentPositionAsync({});
			setLocation(loc);
			if (onLocationLoaded) onLocationLoaded(loc);
			if (!markerCoords) {
				setMarkerCoords({
					latitude: loc.coords.latitude,
					longitude: loc.coords.longitude,
				});
			}
		})();
	}, [setMarkerCoords, markerCoords, onLocationLoaded]);

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
			onPress={(e) => {
				const { latitude, longitude } = e.nativeEvent.coordinate;
				setMarkerCoords({ latitude, longitude });
			}}
		>
			{markerCoords && (
				<Marker
					coordinate={markerCoords}
					draggable
					onDragEnd={(e) => {
						const { latitude, longitude } = e.nativeEvent.coordinate;
						setMarkerCoords({ latitude, longitude });
					}}
					title="選択した位置"
					description="この場所に意見を送信します"
				/>
			)}
		</MapView>
	);
}

const styles = StyleSheet.create({
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
