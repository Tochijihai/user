# 🗺️ 位置情報ベース意見共有アプリ

東京都内の施設・環境について位置情報と連携した意見共有とチャット機能を提供するReact Native/Expoアプリケーションです。

## 📱 アプリの概要

このアプリは以下の主要機能を提供します：

- **📍 位置情報ベースの意見投稿**: 地図上の特定の場所に対して意見や感想を投稿
- **🗺️ インタラクティブマップ**: OpenStreetMapを使用した地図表示とマーカー機能
- **💬 コメント機能**: 投稿された意見に対するコメントとリアクション
- **🤖 AIチャット**: 統合されたチャットボット機能
- **❤️ リアクション機能**: 投稿に対するいいね機能

## 🛠️ 技術スタック

### フロントエンド
- **React Native** 0.79.5
- **Expo** ^53.0.22
- **TypeScript** ~5.8.3
- **React Navigation** ^7.1.6

### 主要ライブラリ
- **react-native-maps** 1.20.1 - 地図表示
- **expo-location** ~18.1.6 - 位置情報取得
- **react-native-paper** ^5.14.5 - UIコンポーネント
- **axios** ^1.11.0 - HTTP通信
- **@faker-js/faker** ^9.9.0 - テストデータ生成

### 開発ツール
- **Biome** ^2.1.2 - コードフォーマッター・リンター
- **Babel** ^7.25.2 - トランスパイラー

## 🚀 セットアップ手順

### 前提条件
- Node.js (v22)
- yarn
- Expo CLI
- iOS Simulator または Android Emulator

### インストール

1. **リポジトリのクローン**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **依存パッケージのインストール**
   ```bash
   yarn install
   ```

3. **アプリの起動**
   ```bash
   yarn start
   # または
   npx expo start
   ```

### 開発環境での実行

- **iOS Simulator**: `yarn run ios`
- **Android Emulator**: `yarn run android`
- **Web**: `yarn run web`

## 📁 プロジェクト構造

```
├── app/                          # メインアプリケーションディレクトリ
│   ├── (tabs)/                   # タブナビゲーション
│   │   ├── _layout.tsx          # タブレイアウト
│   │   └── index.tsx            # メイン地図画面
│   ├── pages/                   # 個別ページ
│   │   ├── chat.tsx            # チャット画面
│   │   └── opinion.tsx         # 意見投稿画面
│   ├── apiClients/             # API通信クライアント
│   │   └── UserApiClient.ts    # ユーザーAPI
│   ├── contexts/              # React Context
│   │   └── LocationContext.tsx # 位置情報コンテキスト
│   ├── _layout.tsx             # ルートレイアウト
│   └── +not-found.tsx          # 404ページ
├── components/                  # 再利用可能コンポーネント
│   ├── ui/                     # UIコンポーネント
│   ├── LocationMap.tsx         # 位置情報マップ
│   ├── OpenStreetMap.tsx       # OpenStreetMapコンポーネント
│   └── ...                    # その他のコンポーネント
├── constants/                   # 定数定義
│   └── Colors.ts               # カラーテーマ
├── hooks/                      # カスタムフック
├── assets/                     # 静的アセット
└── scripts/                    # ビルドスクリプト
```

## 🔧 主要機能の詳細

### 1. 地図機能 (`app/(tabs)/index.tsx`)
- OpenStreetMapベースの地図表示
- 現在位置の取得と表示
- 投稿された意見のマーカー表示
- マーカータップでの詳細表示

### 2. 意見投稿機能 (`app/pages/opinion.tsx`)
- 地図上での位置選択
- テキスト入力による意見投稿
- React Native Paperを使用したUI

### 3. チャット機能 (`app/pages/chat.tsx`)
- AIチャットボットとの対話
- リアルタイムメッセージング
- JSON形式でのAPI通信

### 4. コメント・リアクション機能
- 投稿に対するコメント機能
- ハートアイコンによるリアクション
- リアルタイムでの更新

## 🌐 API エンドポイント

アプリは以下のAPIエンドポイントを使用します：

- `GET /user/opinions` - 意見一覧取得
- `POST /user/opinions` - 意見投稿
- `GET /user/opinions/{id}/comments` - コメント取得
- `POST /user/opinions/{id}/comments` - コメント投稿
- `GET /user/opinions/{id}/reactions` - リアクション取得
- `PUT /user/opinions/{id}/reactions` - リアクション更新
- `POST /user-chat/chat` - チャット機能

## 🔒 環境変数

以下の環境変数を設定してください：

```env
API_BASE_URL=<バックエンドAPIのベースURL>
```

## 📱 使用方法

### 意見の投稿
1. 右下の紙飛行機アイコンをタップ
2. 地図上で投稿したい場所をタップ
3. 意見を入力して送信

### 意見の閲覧
1. 地図上のマーカーをタップ
2. 詳細情報とコメントを確認
3. ハートアイコンでリアクション

### チャット機能
1. 右下のコメントアイコンをタップ
2. AIチャットボットと対話

## 🧪 開発・テスト

### コードチェック
```bash
yarn run check
```

### プロジェクトリセット
```bash
yarn run reset-project
```

## 🎨 デザインシステム

- **プライマリカラー**: `#17882e` (緑色)
- **UIライブラリ**: React Native Paper
- **アイコン**: FontAwesome
- **地図**: OpenStreetMap

## 🔧 トラブルシューティング

### 位置情報が取得できない場合
- デバイスの位置情報設定を確認
- アプリの位置情報許可を確認

### 地図が表示されない場合
- インターネット接続を確認
- react-native-mapsの設定を確認

### APIエラーが発生する場合
- 環境変数の設定を確認
- バックエンドサーバーの稼働状況を確認

## 📚 参考資料

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [React Native Paper](https://reactnativepaper.com/)
- [React Navigation](https://reactnavigation.org/)