import { FontAwesome } from "@expo/vector-icons";
import { faker } from "@faker-js/faker/locale/ja";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
	Image,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { userInfo } from "@/testUserInfo";
import OpenStreetMap from "../../components/OpenStreetMap";
import { userApiClient } from "../apiClients/UserApiClient";
import { useLocationContext } from "../contexts/LocationContext";
import { useOpinionContext } from "../contexts/OpinionContext";

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
	avatarUrl?: string;
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

function LocationMap() {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	const styles = createStyles(colors);
	const { location, setLocation } = useLocationContext();
	const { shouldRefresh, resetRefresh } = useOpinionContext();
	const [posts, setPosts] = useState<Spot[]>([]);
	const [selected, setSelected] = useState<Spot | null>(null);
	const [loading, setLoading] = useState(false);
	const [newComment, setNewComment] = useState<string>("");
	const [reactionInfo, setReactionInfo] = useState<ReactionInfo | null>(null); // リアクション情報のステート
	const [commentsByPost, setCommentsByPost] = useState<
		Record<string, DisplayComment[]>
	>({});
	const [mapKey, setMapKey] = useState(0);

	const fetchOpinion = useCallback(async () => {
		setLoading(true);
		try {
			const response = await userApiClient.get<Opinion[]>("/user/opinions");
			const newSpots: Spot[] =
				response.data?.map((data: Opinion) => ({
					id: data.ID,
					latitude: data.Coordinate.Latitude,
					longitude: data.Coordinate.Longitude,
					// TODO: メールアドレスだったので仮で名前をランダム生成
					title: faker.person.fullName(),
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
					// TODO: 仮で名前を自動生成
					author: data?.Author ?? faker.person.fullName(),
					comment: data.Comment,
					createdAt: data.CreatedDateTime,
					// TODO: 仮で自動生成
					avatarUrl: faker.image.personPortrait(),
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
	}, [fetchOpinion, setLocation]);

	// OpinionContextからの更新要求を監視
	useEffect(() => {
		if (shouldRefresh && location) {
			fetchOpinion();
			resetRefresh();
			// 地図も更新
			setMapKey((prev) => prev + 1);
		}
	}, [shouldRefresh, location, fetchOpinion, resetRefresh]);

	useEffect(() => {
		if (selected?.id) {
			fetchComments(selected.id);
			fetchReactions(selected.id); // リアクション情報を取得
		}
	}, [selected, fetchComments, fetchReactions]);

	const renderComment = useCallback(
		({ item }: { item: DisplayComment }) => (
			<View key={item.commentId} style={styles.commentRow}>
				<View style={styles.avatar}>
					<Image style={styles.avatar} source={{ uri: item.avatarUrl }} />
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
		),
		[],
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
					key={`main-map-${mapKey}-${location?.timestamp || 0}`}
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
					disableMapClick={true}
					currentLocation={{
						latitude: location.coords.latitude,
						longitude: location.coords.longitude,
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
							<TouchableOpacity
								onPress={() => setSelected(null)}
								style={styles.closeButton}
							>
								<Text style={styles.closeButtonText}>閉じる</Text>
							</TouchableOpacity>
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
									removeClippedSubviews={true}
									maxToRenderPerBatch={10}
									windowSize={10}
									getItemLayout={(_data, index) => ({
										length: 60,
										offset: 60 * index,
										index,
									})}
								/>
							) : (
								<Text style={{ color: "#666" }}>コメントはまだありません</Text>
							)}
							<View style={styles.inputContainer}>
								<TextInput
									style={styles.textInput}
									placeholder="コメントを入力..."
									value={newComment}
									onChangeText={setNewComment}
								/>
								<TouchableOpacity
									onPress={handleCommentSubmit}
									style={styles.sendButton}
								>
									<Text style={styles.sendButtonText}>送信</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				)}
			</View>
		</KeyboardAvoidingView>
	);
}

// 東京都アプリスタイルのスタイルシート
const createStyles = (colors: any) =>
	StyleSheet.create({
		center: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
			backgroundColor: colors.tokyoLightGreen,
		},
		card: {
			position: "absolute",
			bottom: 0,
			width: Dimensions.get("window").width,
			backgroundColor: colors.cardBackground,
			padding: 20,
			borderTopLeftRadius: 20,
			borderTopRightRadius: 20,
			shadowColor: colors.shadowColor,
			shadowOpacity: 0.15,
			shadowRadius: 10,
			elevation: 8,
			maxHeight: windowHeight * 0.4,
			borderTopWidth: 3,
			borderTopColor: colors.tokyoGreen,
		},
		row: {
			flexDirection: "row",
			alignItems: "center",
			marginTop: 12,
			paddingBottom: 8,
			borderBottomWidth: 1,
			borderBottomColor: colors.tokyoLightGreen,
		},
		button: {
			padding: 8,
			borderRadius: 8,
		},
		commentListContainer: {
			marginTop: 16,
			flex: 1,
			maxHeight: windowHeight * 0.25,
		},
		commentHeader: {
			fontWeight: "700",
			marginBottom: 12,
			fontSize: 18,
			color: colors.tokyoGreen,
		},
		commentRow: {
			flexDirection: "row",
			paddingVertical: 12,
			borderBottomColor: colors.tokyoLightGreen,
			borderBottomWidth: 1,
			alignItems: "flex-start",
		},
		avatar: {
			backgroundColor: colors.tokyoGreen,
			width: 36,
			height: 36,
			borderRadius: 18,
			alignItems: "center",
			justifyContent: "center",
		},
		commentAuthor: {
			fontWeight: "700",
			color: colors.tokyoGreenDark,
			fontSize: 14,
		},
		timestamp: {
			fontSize: 11,
			color: "#888",
			marginTop: 4,
		},
		refreshButton: {
			position: "absolute",
			bottom: 30,
			right: 20,
			backgroundColor: colors.tokyoGreen,
			width: 60,
			height: 60,
			borderRadius: 30,
			alignItems: "center",
			justifyContent: "center",
			elevation: 8,
			shadowColor: colors.shadowColor,
			shadowOpacity: 0.25,
			shadowRadius: 6,
			borderWidth: 2,
			borderColor: "white",
		},
		opinionButton: {
			position: "absolute",
			bottom: 30 + 60 + 15,
			right: 20,
			backgroundColor: colors.tokyoGreenLight,
			width: 60,
			height: 60,
			borderRadius: 30,
			alignItems: "center",
			justifyContent: "center",
			elevation: 8,
			shadowColor: colors.shadowColor,
			shadowOpacity: 0.25,
			shadowRadius: 6,
			borderWidth: 2,
			borderColor: "white",
		},
		chatButton: {
			position: "absolute",
			bottom: 30 + 60 + 15 + 60 + 15,
			right: 20,
			backgroundColor: colors.tokyoGreenDark,
			width: 60,
			height: 60,
			borderRadius: 30,
			alignItems: "center",
			justifyContent: "center",
			elevation: 8,
			shadowColor: colors.shadowColor,
			shadowOpacity: 0.25,
			shadowRadius: 6,
			borderWidth: 2,
			borderColor: "white",
		},
		inputContainer: {
			flexDirection: "row",
			alignItems: "center",
			marginTop: 12,
			backgroundColor: colors.tokyoLightGreen,
			borderRadius: 12,
			padding: 4,
		},
		textInput: {
			flex: 1,
			borderColor: colors.tokyoGreen,
			borderWidth: 1,
			borderRadius: 8,
			padding: 12,
			backgroundColor: "white",
			fontSize: 14,
		},
		sendButton: {
			marginLeft: 8,
			backgroundColor: colors.tokyoGreen,
			paddingHorizontal: 16,
			paddingVertical: 12,
			borderRadius: 8,
		},
		sendButtonText: {
			color: "white",
			fontWeight: "600",
			fontSize: 14,
		},
		closeButton: {
			marginLeft: "auto",
			backgroundColor: colors.tokyoLightGreen,
			paddingHorizontal: 12,
			paddingVertical: 6,
			borderRadius: 6,
		},
		closeButtonText: {
			color: colors.tokyoGreenDark,
			fontWeight: "600",
			fontSize: 14,
		},
	});

export default React.memo(LocationMap);
