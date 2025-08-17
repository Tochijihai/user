import axios from "axios"; // axiosをインポート
export type ApiResponse<T> = {
	statusCode: number;
	data?: T;
};

class UserApiClient {
	private baseURL: string;
	private headers: Record<string, string>;

	constructor(baseURL: string) {
		this.baseURL = baseURL;
		this.headers = {
			"Content-Type": "application/json",
			accept: "*/*",
		};
	}

	// GETメソッド
	public async get<T>(path: string) {
		try {
			const response = await axios.get<T>(`${this.baseURL}${path}`, {
				headers: this.headers,
			});

			return {
				statusCode: response.status,
				data: response.data,
			};
		} catch (error) {
			console.error("API call error:", error);
			throw error;
		}
	}

	// POSTメソッド。body と response の型を動的に設定
	public async post<T, S>(
		path: string,
		requestBody?: S,
	): Promise<ApiResponse<T>> {
		try {
			const response = await axios.post<T>(
				`${this.baseURL}${path}`,
				requestBody,
				{
					headers: this.headers,
				},
			);

			return {
				statusCode: response.status,
				data: response.data,
			};
		} catch (error) {
			console.error("API call error:", error);
			throw error;
		}
	}
}

// インスタンスをエクスポート
export const userApiClient = new UserApiClient(
	process.env.API_BASE_URL ??
		"https://inyzdjntkl.execute-api.ap-northeast-1.amazonaws.com/dev",
);
