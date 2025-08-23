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

type Msg = { id: string; text: string; from: "me" | "bot"; createdAt: number };

const CHAT_ENDPOINT = `${API_BASE_URL}/user-chat/chat`;
const MAIL_ADDRESS = "test1@example.com";

export default function ChatScreen() {
	const [messages, setMessages] = useState<Msg[]>([
		{ id: "1", text: "こんにちは！", from: "bot", createdAt: Date.now() },
	]);
	const [text, setText] = useState("");
	const inputRef = useRef<TextInput>(null);

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

		// ---- FastAPI のリクエスト形式に整形（古い→新しい順へ）----
		const historyChrono = [...messages].reverse(); // stateは新しい順で保持しているため反転
		const fullHistory = [...historyChrono, me];

		const payload = {
			mail_address: MAIL_ADDRESS,
			messages: fullHistory.map((m) => ({
				content: m.text,
				role: m.from === "me" ? "user" : "assistant",
			})),
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
				body: JSON.stringify(payload), // ← ここが重要！
			});
			console.log("res: ", JSON.stringify(res));

			const raw = await res.text();
			console.log("raw: ", raw);

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

			// まず JSON を試みる（失敗したら raw を文字列として扱う）
			let data: any;
			try {
				data = JSON.parse(raw);
			} catch {
				data = raw;
			}

			// 優先順: generated_json.answer → generated_text → answer → fallback
			const replyText =
				data &&
				typeof data === "object" &&
				data.generated_json &&
				typeof data.generated_json.answer === "string"
					? data.generated_json.answer
					: typeof data?.generated_text === "string" && data.generated_text
						? data.generated_text
						: typeof data?.answer === "string" && data.answer
							? data.answer
							: typeof data === "string" && data
								? data
								: "(応答なし)";

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
