import { API_BASE_URL } from "@env";
import { useRef, useState } from "react";
import {
	FlatList,
	Pressable,
	SafeAreaView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

// ===== Types =====
type Msg = { id: string; text: string; from: "me" | "bot"; createdAt: number };

type FormShape = {
	title: string | null;
	category: string | null;
	description: string | null;
	place: string | null;
};

type ApiResponse = {
	success: boolean;
	generated_text: string | null;
	generated_json?: {
		answer?: string | null;
		form?: string | null; // NOTE: sample shows JSON string here
		form_complete?: boolean | null;
	} | null;
	form?: {
		title?: string | null;
		category?: string | null;
		description?: string | null;
		place?: string | null;
	} | null;
	form_complete?: boolean | null;
	error?: string | null;
};

// ===== Config =====
const CHAT_ENDPOINT = `${API_BASE_URL}/user-chat/chat`;
const MAIL_ADDRESS = "test@example.com"; // sample に合わせる

export default function ChatScreen() {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	const styles = createStyles(colors);

	const [messages, setMessages] = useState<Msg[]>([
		{
			id: "1",
			text: "こんにちは！東京都への意見やご質問をお聞かせください。",
			from: "bot",
			createdAt: Date.now(),
		},
	]);
	const [text, setText] = useState("");
	const inputRef = useRef<TextInput>(null);

	// form / answer / form_complete をサーバーに送るための状態
	const [form, setForm] = useState<FormShape>({
		title: null,
		category: null,
		description: null,
		place: null,
	});
	const [answer, setAnswer] = useState<string>("");
	const [formComplete, setFormComplete] = useState<boolean>(false);

	const send = async () => {
		const content = text.trim();
		if (!content) return;

		// 先に自分の発言を表示
		const me: Msg = {
			id: `${Date.now()}`,
			text: content,
			from: "me",
			createdAt: Date.now(),
		};
		setMessages((prev) => [me, ...prev]);
		setText("");

		// ---- API のリクエスト形式に整形（古い→新しい順へ）----
		const historyChrono = [...messages].reverse(); // stateは新しい順で保持しているため反転
		const fullHistory = [...historyChrono, me];

		const payload = {
			mail_address: MAIL_ADDRESS,
			messages: fullHistory.map((m) => ({
				content: m.text,
				role: m.from === "me" ? "user" : "assistant",
			})),
			// ★ リクエストの form には前回レスポンスの form をそのまま入れる（初回は各プロパティ null）
			form: {
				title: form.title,
				category: form.category,
				description: form.description,
				place: form.place,
			},
			// サンプル通りに保持
			answer: answer, // 現状は空文字で送信
			form_complete: formComplete,
			schema: {
				properties: { answer: { type: "string" } },
				required: ["answer"],
				type: "object",
			},
		};

		try {
			const res = await fetch(CHAT_ENDPOINT, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const raw = await res.text();

			if (!res.ok) {
				setMessages((prev) => [
					{
						id: `err-${Date.now()}`,
						text: `エラー: ${res.status}\n${raw || "(本文なし)"}`,
						from: "bot",
						createdAt: Date.now(),
					},
					...prev,
				]);
				return;
			}

			let data: ApiResponse | string;
			try {
				data = JSON.parse(raw) as ApiResponse;
			} catch {
				data = raw;
			}

			// success フラグを見て失敗応答ならエラー表示
			if (typeof data === "object" && data !== null && data.success === false) {
				const msg = data.error ?? "サーバー処理に失敗しました。";
				setMessages((prev) => [
					{
						id: `err-${Date.now()}`,
						text: msg,
						from: "bot",
						createdAt: Date.now(),
					},
					...prev,
				]);
				return;
			}

			// 表示テキスト: generated_json.answer -> generated_text -> 文字列raw
			const replyText =
				typeof data === "object" && data !== null
					? data.generated_json?.answer &&
						typeof data.generated_json.answer === "string"
						? data.generated_json.answer
						: (typeof data.generated_text === "string" &&
								data.generated_text) ||
							"(応答なし)"
					: typeof data === "string"
						? data
						: "(応答なし)";

			// ★ レスポンスの form をそのまま次回のリクエストに載せる
			if (
				typeof data === "object" &&
				data !== null &&
				data.form &&
				typeof data.form === "object"
			) {
				setForm({
					title: data.form.title ?? null,
					category: data.form.category ?? null,
					description: data.form.description ?? null,
					place: data.form.place ?? null,
				});
			}

			// form_complete も維持（明記は form のみだが、整合のため採用）
			setFormComplete(false);

			// answer はサンプル通りクライアントからは空送信を継続
			setAnswer("");

			setMessages((prev) => [
				{
					id: `b-${Date.now()}`,
					text: replyText,
					from: "bot",
					createdAt: Date.now(),
				},
				...prev,
			]);
		} catch (e: any) {
			setMessages((prev) => [
				{
					id: `err-${Date.now()}`,
					text: `サーバーに接続できませんでした。${String(e?.message ?? "")}`,
					from: "bot",
					createdAt: Date.now(),
				},
				...prev,
			]);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>東京都チャットサポート</Text>
				<Text style={styles.headerSubtitle}>
					ご質問やご意見をお聞かせください
				</Text>
			</View>

			<FlatList
				inverted
				data={messages}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<View style={styles.messageContainer}>
						<View
							style={[
								styles.messageBubble,
								item.from === "me" ? styles.myMessage : styles.botMessage,
							]}
						>
							<Text
								style={[
									styles.messageText,
									item.from === "me"
										? styles.myMessageText
										: styles.botMessageText,
								]}
							>
								{item.text}
							</Text>
						</View>
					</View>
				)}
				contentContainerStyle={styles.messagesList}
			/>

			<View style={styles.inputContainer}>
				<TextInput
					ref={inputRef}
					value={text}
					onChangeText={setText}
					placeholder="メッセージを入力してください..."
					style={styles.textInput}
					onSubmitEditing={send}
					returnKeyType="send"
					multiline
				/>
				<Pressable onPress={send} style={styles.sendButton}>
					<Text style={styles.sendButtonText}>送信</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

// 東京都アプリスタイルのスタイルシート
const createStyles = (colors: any) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.tokyoLightGreen,
		},
		header: {
			backgroundColor: colors.tokyoGreen,
			paddingVertical: 16,
			paddingHorizontal: 20,
			borderBottomLeftRadius: 16,
			borderBottomRightRadius: 16,
			elevation: 4,
			shadowColor: colors.shadowColor,
			shadowOpacity: 0.1,
			shadowRadius: 4,
		},
		headerTitle: {
			color: "white",
			fontSize: 20,
			fontWeight: "700",
			textAlign: "center",
		},
		headerSubtitle: {
			color: "white",
			fontSize: 14,
			textAlign: "center",
			marginTop: 4,
			opacity: 0.9,
		},
		messagesList: {
			paddingVertical: 12,
			paddingHorizontal: 8,
		},
		messageContainer: {
			padding: 8,
			alignItems: "flex-start",
		},
		messageBubble: {
			paddingHorizontal: 16,
			paddingVertical: 12,
			borderRadius: 20,
			maxWidth: "85%",
			elevation: 2,
			shadowColor: colors.shadowColor,
			shadowOpacity: 0.1,
			shadowRadius: 2,
		},
		myMessage: {
			backgroundColor: colors.tokyoGreen,
			alignSelf: "flex-end",
			borderBottomRightRadius: 6,
		},
		botMessage: {
			backgroundColor: "white",
			alignSelf: "flex-start",
			borderBottomLeftRadius: 6,
			borderLeftWidth: 3,
			borderLeftColor: colors.tokyoGreenLight,
		},
		messageText: {
			fontSize: 16,
			lineHeight: 22,
		},
		myMessageText: {
			color: "white",
			fontWeight: "500",
		},
		botMessageText: {
			color: colors.text,
			fontWeight: "400",
		},
		inputContainer: {
			flexDirection: "row",
			padding: 12,
			gap: 12,
			marginBottom: 20,
			backgroundColor: "white",
			marginHorizontal: 8,
			borderRadius: 16,
			elevation: 4,
			shadowColor: colors.shadowColor,
			shadowOpacity: 0.1,
			shadowRadius: 4,
			borderTopWidth: 2,
			borderTopColor: colors.tokyoGreen,
		},
		textInput: {
			flex: 1,
			borderWidth: 1,
			borderColor: colors.tokyoLightGreen,
			borderRadius: 12,
			paddingHorizontal: 16,
			paddingVertical: 12,
			fontSize: 16,
			backgroundColor: colors.tokyoLightGreen,
			maxHeight: 100,
		},
		sendButton: {
			paddingHorizontal: 20,
			paddingVertical: 12,
			borderRadius: 12,
			backgroundColor: colors.tokyoGreen,
			alignItems: "center",
			justifyContent: "center",
			elevation: 2,
			shadowColor: colors.shadowColor,
			shadowOpacity: 0.2,
			shadowRadius: 2,
		},
		sendButtonText: {
			color: "white",
			fontWeight: "700",
			fontSize: 16,
		},
	});
