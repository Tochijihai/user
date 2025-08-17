import { FontAwesome } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
	Pressable,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { userApiClient } from "../apiClients/UserApiClient";

const windowHeight = Dimensions.get("window").height;

type Spot = {
	id: string;
	latitude: number;
	longitude: number;
	title?: string;
	description?: string;
};

type Comment = {
	id: string;
	author: string;
	content: string;
	createdAt: string;
};
type Opinion = {
	ID: string;
	MailAddress: string;
	Latitude: number;
	Longitude: number;
	Opinion: string;
};

// モックコメント
const mockComments: Record<string, Comment[]> = {
	"1": [
		{
			id: "c1",
			author: "Alice",
			content: "ここは最高！",
			createdAt: new Date().toISOString(),
		},
	],
	"2": [
		{
			id: "c2",
			author: "Bob",
			content: "ちょっと寂しい...",
			createdAt: new Date().toISOString(),
		},
	],
};

type ReactionState = {
	liked: boolean;
	count: number;
};

export default function LocationMap() {
	const [location, setLocation] = useState<Location.LocationObject | null>(
		null,
	);
	const [posts, setPosts] = useState<Spot[]>([]);
	const [selected, setSelected] = useState<Spot | null>(null);
	const [loading, setLoading] = useState(false);

	const [reactions, setReactions] = useState<Record<string, ReactionState>>({});

	// 投稿取得関数（必ず新しい配列をセット）
	const fetchPosts = useCallback(async () => {
		setLoading(true);
		console.log("Fetching posts...");
		try {
			const response = await userApiClient.get<Opinion[]>("/user/opinions");
			const newSpots: Spot[] =
				response.data?.map((data: Opinion) => ({
					id: data.ID,
					latitude: data.Latitude,
					longitude: data.Longitude,
					title: data.ID,
					description: data.Opinion,
				})) ?? [];
			console.log("Fetched posts:", newSpots);

			setPosts([...newSpots]);
			setReactions(
				newSpots.reduce(
					(acc, spot) => {
						acc[spot.id] = { liked: false, count: 0 };
						return acc;
					},
					{} as Record<string, ReactionState>,
				),
			);
		} catch (error) {
			console.error("API呼び出しエラー:", error);
		} finally {
			setLoading(false);
		}
	}, []); // 依存は空でOK（userApiClientが外から変わらない前提）

	useEffect(() => {
		(async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") return;
			const loc = await Location.getCurrentPositionAsync({});
			setLocation(loc);
			await fetchPosts();
		})();
	}, [fetchPosts]);

	const toggleLike = (id: string) => {
		setReactions((prev) => {
			const prevState = prev[id];
			const liked = !prevState.liked;
			const count = liked
				? prevState.count + 1
				: Math.max(0, prevState.count - 1);
			return {
				...prev,
				[id]: { liked, count },
			};
		});
	};

	if (!location) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" />
				<Text>位置情報を取得中...</Text>
			</View>
		);
	}

	// コメントレンダー
	const renderComment = ({ item }: { item: Comment }) => (
		<View style={styles.commentRow}>
			<View style={styles.avatar}>
				<Text style={{ color: "white", fontWeight: "600" }}>
					{item.author.slice(0, 1)}
				</Text>
			</View>
			<View style={{ flex: 1, marginLeft: 8 }}>
				<Text style={styles.commentAuthor}>{item.author}</Text>
				<Text>{item.content}</Text>
				<Text style={styles.timestamp}>
					{new Date(item.createdAt).toLocaleDateString("ja-JP", {
						year: "numeric",
						month: "2-digit",
						day: "2-digit",
					})}{" "}
					{new Date(item.createdAt).toLocaleTimeString(undefined, {
						hour12: false,
						hour: "2-digit",
						minute: "2-digit",
					})}
				</Text>
			</View>
		</View>
	);

	return (
		<View style={{ flex: 1 }}>
			<MapView
				style={{ flex: 1 }}
				provider={PROVIDER_GOOGLE}
				initialRegion={{
					latitude: location.coords.latitude,
					longitude: location.coords.longitude,
					latitudeDelta: 0.01,
					longitudeDelta: 0.01,
				}}
				onPress={() => setSelected(null)}
			>
				{posts.map((post, idx) => {
					console.log("Rendering marker for post:", post);
					return (
						<Marker
							key={`${post.id}-${idx}`}
							coordinate={{
								latitude: post.latitude,
								longitude: post.longitude,
							}}
							title={post.title}
							description={post.description}
							onPress={() => setSelected(post)}
							image={require("../../assets/images/post.png")}
						/>
					);
				})}
			</MapView>

			{/* 更新ボタン（右下配置） */}
			<TouchableOpacity
				style={styles.refreshButton}
				onPress={fetchPosts}
				disabled={loading}
			>
				{loading ? (
					<ActivityIndicator color="white" />
				) : (
					<FontAwesome name="refresh" size={24} color="white" />
				)}
			</TouchableOpacity>

			{selected && (
				<View style={styles.card}>
					<View style={styles.row}>
						<Pressable
							onPress={() => toggleLike(selected.id)}
							style={styles.button}
						>
							<FontAwesome
								name={reactions[selected.id]?.liked ? "heart" : "heart-o"}
								size={24}
								color={reactions[selected.id]?.liked ? "#e0245e" : "#444"}
							/>
						</Pressable>
						<Text style={{ marginLeft: 8 }}>
							{reactions[selected.id]?.count}
						</Text>
						<Pressable
							onPress={() => setSelected(null)}
							style={{ marginLeft: "auto" }}
						>
							<Text style={{ color: "blue" }}>閉じる</Text>
						</Pressable>
					</View>

					<View style={styles.commentListContainer}>
						<Text style={styles.commentHeader}>コメント</Text>
						{mockComments[selected.id] &&
						mockComments[selected.id].length > 0 ? (
							<FlatList
								data={mockComments[selected.id]}
								keyExtractor={(c) => c.id}
								renderItem={renderComment}
								nestedScrollEnabled
							/>
						) : (
							<Text style={{ color: "#666" }}>コメントはまだありません</Text>
						)}
					</View>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
	card: {
		position: "absolute",
		bottom: 0,
		width: Dimensions.get("window").width,
		backgroundColor: "white",
		padding: 16,
		borderTopLeftRadius: 12,
		borderTopRightRadius: 12,
		shadowColor: "#000",
		shadowOpacity: 0.2,
		shadowRadius: 6,
		elevation: 6,
		maxHeight: windowHeight * 0.4,
	},
	row: { flexDirection: "row", alignItems: "center", marginTop: 8 },
	button: { padding: 4 },
	commentListContainer: {
		marginTop: 12,
		flex: 1,
		maxHeight: windowHeight * 0.25,
	},
	commentHeader: {
		fontWeight: "600",
		marginBottom: 6,
		fontSize: 16,
	},
	commentRow: {
		flexDirection: "row",
		paddingVertical: 6,
		borderBottomColor: "#eee",
		borderBottomWidth: 1,
		alignItems: "flex-start",
	},
	avatar: {
		backgroundColor: "#007AFF",
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	commentAuthor: {
		fontWeight: "600",
	},
	timestamp: {
		fontSize: 10,
		color: "#888",
		marginTop: 2,
	},
	refreshButton: {
		position: "absolute",
		bottom: 30,
		right: 20,
		backgroundColor: "#007AFF",
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
		elevation: 6,
		shadowColor: "#000",
		shadowOpacity: 0.3,
		shadowRadius: 4,
	},
});
