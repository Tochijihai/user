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
	public async get<T>(path: string, customHeaders: Record<string, any> = {}) {
		try {
			const response = await axios.get<T>(`${this.baseURL}${path}`, {
				headers: { ...this.headers, ...customHeaders },
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
		customHeaders: Record<string, any> = {},
		requestBody?: S,
	): Promise<ApiResponse<T>> {
		try {
			const response = await axios.post<T>(
				`${this.baseURL}${path}`,
				requestBody,
				{
					headers: { ...this.headers, ...customHeaders },
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

	// PUTメソッド。body と response の型を動的に設定
	public async put<T, S>(
		path: string,
		customHeaders: Record<string, any> = {},
		requestBody?: S,
	): Promise<ApiResponse<T>> {
		try {
			const response = await axios.put<T>(
				`${this.baseURL}${path}`,
				requestBody,
				{
					headers: { ...this.headers, ...customHeaders },
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
export default UserApiClient;

// インスタンスをエクスポート
export const userApiClient = new UserApiClient(
	"https://inyzdjntkl.execute-api.ap-northeast-1.amazonaws.com/dev",
);
