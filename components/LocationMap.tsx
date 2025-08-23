import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocationContext } from "@/app/conntexts/LocationContext";
import OpenStreetMap from "./OpenStreetMap";

type LatLng = {
	latitude: number;
	longitude: number;
};

type Props = {
	markerCoords: LatLng | null;
	setMarkerCoords: (coords: LatLng) => void;
	onLocationLoaded?: (location: Location.LocationObject) => void;
	markers?: Array<{
		id: string;
		latitude: number;
		longitude: number;
		title?: string;
		description?: string;
	}>;
	onMarkerPress?: (markerId: string) => void;
};

export default function LocationMap({
	markerCoords,
	setMarkerCoords,
	onLocationLoaded,
	markers = [],
	onMarkerPress,
}: Props) {
	const { location, setLocation } = useLocationContext();

	useEffect(() => {
		(async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") return;

			if (onLocationLoaded) onLocationLoaded(location!);
			if (!markerCoords) {
				setMarkerCoords({
					latitude: location!.coords.latitude,
					longitude: location!.coords.longitude,
				});
			}
		})();
	}, [setMarkerCoords, markerCoords, onLocationLoaded, location]);

	if (!location) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" />
				<Text>位置情報を取得中...</Text>
			</View>
		);
	}

	return (
		<OpenStreetMap
			markerCoords={markerCoords}
			setMarkerCoords={setMarkerCoords}
			initialRegion={{
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
				latitudeDelta: 0.01,
				longitudeDelta: 0.01,
			}}
			markers={markers}
			onMarkerPress={onMarkerPress}
		/>
	);
}

const styles = StyleSheet.create({
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
