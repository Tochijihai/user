import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocationContext } from "@/app/contexts/LocationContext";
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
	const [mapKey, setMapKey] = useState(0);

	useEffect(() => {
		(async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") return;

			if (onLocationLoaded && location) onLocationLoaded(location);
		})();
	}, [onLocationLoaded, location]);

	// 画面がフォーカスされた時に地図を再初期化
	useEffect(() => {
		const refreshMap = () => {
			setMapKey((prev) => prev + 1);
		};

		// コンポーネントがマウントされた時に地図をリフレッシュ
		refreshMap();
	}, []);

	if (!location) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" />
				<Text>位置情報を取得中...</Text>
			</View>
		);
	}

	// マーカーが設定されている場合はマーカー位置を中心に、そうでなければ現在地を中心に
	const mapCenter = markerCoords || {
		latitude: location.coords.latitude,
		longitude: location.coords.longitude,
	};

	return (
		<OpenStreetMap
			key={`map-${mapKey}-${location?.timestamp || 0}`}
			markerCoords={markerCoords}
			setMarkerCoords={setMarkerCoords}
			initialRegion={{
				latitude: mapCenter.latitude,
				longitude: mapCenter.longitude,
				latitudeDelta: 0.01,
				longitudeDelta: 0.01,
			}}
			markers={markers}
			onMarkerPress={onMarkerPress}
			currentLocation={{
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
			}}
		/>
	);
}

const styles = StyleSheet.create({
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
