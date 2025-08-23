import { API_BASE_URL } from "@env";
import { useRef, useState } from "react";
import {
	FlatList,
	Pressable,
	SafeAreaView,
	Text,
	TextInput,
	View,
} from "react-native";

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
	const [messages, setMessages] = useState<Msg[]>([
		{ id: "1", text: "こんにちは！", from: "bot", createdAt: Date.now() },
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
		<SafeAreaView style={{ flex: 1 }}>
			<FlatList
				inverted
				data={messages}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<View
						style={{
							padding: 8,
							alignItems: item.from === "me" ? "flex-end" : "flex-start",
						}}
					>
						<View
							style={{
								backgroundColor: item.from === "me" ? "#17882e" : "#e5e5ea",
								paddingHorizontal: 12,
								paddingVertical: 8,
								borderRadius: 16,
								maxWidth: "80%",
							}}
						>
							<Text style={{ color: item.from === "me" ? "#fff" : "#000" }}>
								{item.text}
							</Text>
						</View>
					</View>
				)}
				contentContainerStyle={{ paddingVertical: 8 }}
			/>

			<View
				style={{ flexDirection: "row", padding: 8, gap: 8, marginBottom: 30 }}
			>
				<TextInput
					ref={inputRef}
					value={text}
					onChangeText={setText}
					placeholder="メッセージを入力"
					style={{
						flex: 1,
						borderWidth: 1,
						borderColor: "#ccc",
						borderRadius: 20,
						paddingHorizontal: 12,
						height: 40,
					}}
					onSubmitEditing={send}
					returnKeyType="send"
				/>
				<Pressable
					onPress={send}
					style={{
						height: 40,
						paddingHorizontal: 16,
						borderRadius: 20,
						backgroundColor: "#17882e",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text style={{ color: "white", fontWeight: "600" }}>送信</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}
