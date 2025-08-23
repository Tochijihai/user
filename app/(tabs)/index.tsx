import { FontAwesome } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { userInfo } from "@/testUserInfo";
import OpenStreetMap from "../../components/OpenStreetMap";
import { userApiClient } from "../apiClients/UserApiClient";

const windowHeight = Dimensions.get("window").height;

type Spot = {
	id: string;
	latitude: number;
	longitude: number;
	title?: string;
	description?: string;
};

type ResponseComment = {
	Id: string;
	CommentID: string;
	Author?: string;
	MailAddress: string;
	Comment: string;
	CreatedDateTime: string;
};

type DisplayComment = {
	id: string;
	commentId: string;
	author: string;
	comment: string;
	createdAt: string;
};

type Opinion = {
	ID: string;
	MailAddress: string;
	Coordinate: {
		Latitude: number;
		Longitude: number;
	};
	Opinion: string;
};

type ReactionInfo = {
	IsReactioned: boolean;
	ReactionCount: number;
};

export default function LocationMap() {
	const [location, setLocation] = useState<Location.LocationObject | null>(
		null,
	);
	const [posts, setPosts] = useState<Spot[]>([]);
	const [selected, setSelected] = useState<Spot | null>(null);
	const [loading, setLoading] = useState(false);
	const [newComment, setNewComment] = useState<string>("");
	const [reactionInfo, setReactionInfo] = useState<ReactionInfo | null>(null); // リアクション情報のステート
	const [commentsByPost, setCommentsByPost] = useState<
		Record<string, DisplayComment[]>
	>({});

	const fetchOpinion = useCallback(async () => {
		setLoading(true);
		try {
			const response = await userApiClient.get<Opinion[]>("/user/opinions");
			const newSpots: Spot[] =
				response.data?.map((data: Opinion) => ({
					id: data.ID,
					latitude: data.Coordinate.Latitude,
					longitude: data.Coordinate.Longitude,
					title: data.MailAddress,
					description: data.Opinion,
				})) ?? [];
			setPosts([...newSpots]);
		} catch (error) {
			console.error("API呼び出しエラー:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchComments = useCallback(async (opinionId: string) => {
		try {
			const response = await userApiClient.get<ResponseComment[]>(
				`/user/opinions/${opinionId}/comments`,
			);
			const commentList: DisplayComment[] =
				response.data?.map((data: ResponseComment) => ({
					id: data.Id,
					commentId: data.CommentID,
					author: data?.Author ?? data.MailAddress,
					comment: data.Comment,
					createdAt: data.CreatedDateTime,
				})) ?? [];
			setCommentsByPost((prev) => ({
				...prev,
				[opinionId]: commentList,
			}));
		} catch (error) {
			console.error("コメント取得エラー:", error);
		}
	}, []);

	const fetchReactions = useCallback(async (opinionId: string) => {
		try {
			const response = await userApiClient.get<ReactionInfo>(
				`/user/opinions/${opinionId}/reactions`,
				{
					mailAddress: userInfo.mailAddress,
				},
			);
			const data = response.data;
			console.log("data:", data);
			setReactionInfo({
				IsReactioned: data.IsReactioned,
				ReactionCount: data.ReactionCount,
			});
		} catch (error) {
			console.error("リアクション取得エラー:", error);
			// エラー時もステートをクリアして表示をリセット
			setReactionInfo(null);
		}
	}, []);

	const sendReaction = async (id: string, isReactioned: boolean) => {
		try {
			await userApiClient.put(
				`/user/opinions/${id}/reactions`,
				{},
				{
					reaction: isReactioned,
					mailAddress: userInfo.mailAddress,
				},
			);
			// API成功後、リアクション情報を再取得
			fetchReactions(id);
		} catch (error) {
			console.error("API通信エラー:", error);
		}
	};

	const toggleLike = async (id: string) => {
		// 現在のリアクション状態を取得
		const isCurrentlyReactioned = reactionInfo?.IsReactioned ?? false;
		// APIに送信する新しい状態
		const newReactionState = !isCurrentlyReactioned;
		// APIに送信
		await sendReaction(id, newReactionState);
	};

	useEffect(() => {
		(async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") return;
			const loc = await Location.getCurrentPositionAsync({});
			setLocation(loc);
			await fetchOpinion();
		})();
	}, [fetchOpinion]);

	useEffect(() => {
		if (selected?.id) {
			fetchComments(selected.id);
			fetchReactions(selected.id); // リアクション情報を取得
		}
	}, [selected, fetchComments, fetchReactions]);

	const renderComment = ({ item }: { item: DisplayComment }) => (
		<View key={item.commentId} style={styles.commentRow}>
			<View style={styles.avatar}>
				<Text style={{ color: "white", fontWeight: "600" }}>
					{item.author.slice(0, 1)}
				</Text>
			</View>
			<View style={{ flex: 1, marginLeft: 8 }}>
				<Text style={styles.commentAuthor}>{item.author}</Text>
				<Text>{item.comment}</Text>
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

	const handleCommentSubmit = async () => {
		if (newComment.trim() === "" || !selected) return;
		try {
			await userApiClient.post(
				`/user/opinions/${selected.id}/comments`,
				{},
				{
					mailAddress: userInfo.mailAddress,
					comment: newComment,
				},
			);
			setNewComment("");
			await fetchComments(selected.id);
		} catch (error) {
			console.error("コメント投稿エラー:", error);
		}
	};

	if (!location) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" />
				<Text>位置情報を取得中...</Text>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<View style={{ flex: 1 }}>
				<OpenStreetMap
					markerCoords={null}
					setMarkerCoords={() => {}}
					initialRegion={{
						latitude: location.coords.latitude,
						longitude: location.coords.longitude,
						latitudeDelta: 0.01,
						longitudeDelta: 0.01,
					}}
					markers={posts}
					onPress={() => setSelected(null)}
					onMarkerPress={(markerId) => {
						const post = posts.find((p) => p.id === markerId);
						if (post) setSelected(post);
					}}
				/>

				<TouchableOpacity
					style={styles.refreshButton}
					onPress={fetchOpinion}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color="white" />
					) : (
						<FontAwesome name="refresh" size={24} color="white" />
					)}
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.opinionButton}
					onPress={() => router.push("/pages/opinion")}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color="white" />
					) : (
						<FontAwesome name="paper-plane" size={24} color="white" />
					)}
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.chatButton}
					onPress={() => router.push("/pages/chat")}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color="white" />
					) : (
						<FontAwesome name="comment" size={24} color="white" />
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
									name={reactionInfo?.IsReactioned ? "heart" : "heart-o"}
									size={24}
									color={reactionInfo?.IsReactioned ? "#e0245e" : "#444"}
								/>
							</Pressable>
							<Text style={{ marginLeft: 8 }}>
								{reactionInfo?.ReactionCount}
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
							{commentsByPost[selected.id] &&
							commentsByPost[selected.id].length > 0 ? (
								<FlatList
									data={commentsByPost[selected.id]}
									keyExtractor={(c, index) =>
										c.commentId || c.id || index.toString()
									}
									renderItem={renderComment}
									nestedScrollEnabled
								/>
							) : (
								<Text style={{ color: "#666" }}>コメントはまだありません</Text>
							)}
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									marginTop: 8,
								}}
							>
								<TextInput
									style={{
										flex: 1,
										borderColor: "#ccc",
										borderWidth: 1,
										borderRadius: 4,
										padding: 12,
									}}
									placeholder="コメントを入力..."
									value={newComment}
									onChangeText={setNewComment}
								/>
								<TouchableOpacity
									onPress={handleCommentSubmit}
									style={{ marginLeft: 8 }}
								>
									<Text style={{ color: "blue" }}>送信</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				)}
			</View>
		</KeyboardAvoidingView>
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
		backgroundColor: "#17882e",
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
		backgroundColor: "#17882e",
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
	opinionButton: {
		position: "absolute",
		bottom: 30 + 56 + 10,
		right: 20,
		backgroundColor: "#17882e",
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
	chatButton: {
		position: "absolute",
		bottom: 30 + 56 + 10 + 56 + 10,
		right: 20,
		backgroundColor: "#17882e",
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
