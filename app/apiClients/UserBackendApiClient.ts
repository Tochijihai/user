// 投稿作成APIのレスポンス型
export type ApiResponse<T> = {
	statusCode: number;
	body?: T;
};

class UserBackendApiClient {
	private baseURL: string;
	private headers: HeadersInit;

	constructor(baseURL: string) {
		this.baseURL = baseURL;
		this.headers = {
			"Content-Type": "application/json",
			accept: "*/*",
		};
	}

	// POSTメソッド。body と response の型を動的に設定
	public async post<T, S>(path: string, body?: S): Promise<ApiResponse<T>> {
		try {
			const response = await fetch(`${this.baseURL}${path}`, {
				method: "POST",
				headers: this.headers,
				body: body ? JSON.stringify(body) : undefined,
			});

			if (!response.ok) {
				// TODO: 正式なエラーハンドリング
				throw new Error(`Request failed with status: ${response.status}`);
			}

			// レスポンスの空判定チェック用テキスト
			const responseText = await response.text();

			return {
				statusCode: response.status,
				body: responseText ? await response.json() : undefined, // レスポンスをJSONとしてパース
			};
		} catch (error) {
			console.error("API call error:", error);
			throw error;
		}
	}
}

// インスタンスをエクスポート
export const userBackendApiClient = new UserBackendApiClient(
	process.env.API_BASE_URL ??
		"https://inyzdjntkl.execute-api.ap-northeast-1.amazonaws.com/dev",
);
