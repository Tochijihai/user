import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

type Spot = {
	latitude: number;
	longitude: number;
	title?: string;
	description?: string;
};

const spots: Spot[] = [
	{
		latitude: 35.6764217,
		longitude: 139.6500267,
		title: "てすと１",
		description: "てすと１",
	},
	{
		latitude: 35.6765217,
		longitude: 139.6510367,
		title: "てすと２",
		description: "てすと２",
	},
];
export default function LocationMap() {
	const [location, setLocation] = useState<Location.LocationObject | null>(
		null,
	);
	const [posts, setPosts] = useState<Spot[] | null>(null);

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

			// TODO: 投稿取得API
			setPosts(spots);
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
			{posts
				? posts.map((post, idx) => (
						<Marker
							key={`${post.latitude}-${post.longitude}-${idx}`}
							coordinate={{
								latitude: post.latitude,
								longitude: post.longitude,
							}}
							title={post.title}
							description={post.description}
							image={require("../../assets/images/post.png")}
						/>
					))
				: null}
		</MapView>
	);
}

const styles = StyleSheet.create({
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
