import { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

type LatLng = {
	latitude: number;
	longitude: number;
};

type Props = {
	markerCoords: LatLng | null;
	setMarkerCoords: (coords: LatLng) => void;
	initialRegion: {
		latitude: number;
		longitude: number;
		latitudeDelta: number;
		longitudeDelta: number;
	};
	onPress?: () => void;
	markers?: Array<{
		id: string;
		latitude: number;
		longitude: number;
		title?: string;
		description?: string;
	}>;
	onMarkerPress?: (markerId: string) => void;
	disableMapClick?: boolean;
	currentLocation?: LatLng | null;
};

export default function OpenStreetMap({
	markerCoords,
	setMarkerCoords,
	initialRegion,
	onPress,
	markers = [],
	onMarkerPress,
	disableMapClick = false,
	currentLocation,
}: Props) {
	const webViewRef = useRef<WebView>(null);
	const [isLoading, setIsLoading] = useState(true);

	const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        let map;
        let currentMarker;
        let markers = [];

        function initMap() {
          map = L.map('map').setView([${initialRegion.latitude}, ${initialRegion.longitude}], 15);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          ${
						!disableMapClick
							? `
          map.on('click', function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            if (currentMarker) {
              map.removeLayer(currentMarker);
            }
            
            currentMarker = L.marker([lat, lng], {
              draggable: true
            }).addTo(map);
            
            currentMarker.on('dragend', function(e) {
              const newLat = e.target.getLatLng().lat;
              const newLng = e.target.getLatLng().lng;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerDrag',
                latitude: newLat,
                longitude: newLng
              }));
            });
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapClick',
              latitude: lat,
              longitude: lng
            }));
          });
          `
							: ""
					}

          // 初期マーカーの設定
          ${
						markerCoords
							? `
            currentMarker = L.marker([${markerCoords.latitude}, ${markerCoords.longitude}], {
              draggable: true
            }).addTo(map);
            
            currentMarker.on('dragend', function(e) {
              const newLat = e.target.getLatLng().lat;
              const newLng = e.target.getLatLng().lng;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerDrag',
                latitude: newLat,
                longitude: newLng
              }));
            });
          `
							: ""
					}

          // 既存のマーカーを追加
          ${markers
						.map(
							(marker, index) => `
            const existingMarker_${index} = L.marker([${marker.latitude}, ${marker.longitude}])
              .addTo(map);
            
            ${
							marker.title || marker.description
								? `
            existingMarker_${index}.bindPopup(\`${(marker.title || "").replace(/`/g, "\\`").replace(/\$/g, "\\$")}${marker.title && marker.description ? "<br>" : ""}${(marker.description || "").replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`);
            `
								: ""
						}
            
            existingMarker_${index}.on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerClick',
                markerId: '${marker.id.replace(/'/g, "\\'")}'
              }));
            });
          `,
						)
						.join("")}

          // 現在地マーカーを追加
          ${
						currentLocation
							? `
            const currentLocationIcon = L.divIcon({
              className: 'current-location-marker',
              html: '<div style="background-color: red; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });
            
            const currentLocationMarker = L.marker([${currentLocation.latitude}, ${currentLocation.longitude}], {
              icon: currentLocationIcon
            }).addTo(map);
            
            currentLocationMarker.bindPopup('現在地');
            `
							: ""
					}

          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapReady'
          }));
        }

        function updateMarker(lat, lng) {
          if (currentMarker) {
            map.removeLayer(currentMarker);
          }
          
          currentMarker = L.marker([lat, lng], {
            draggable: true
          }).addTo(map);
          
          currentMarker.on('dragend', function(e) {
            const newLat = e.target.getLatLng().lat;
            const newLng = e.target.getLatLng().lng;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'markerDrag',
              latitude: newLat,
              longitude: newLng
            }));
          });
        }

        document.addEventListener('DOMContentLoaded', initMap);
      </script>
    </body>
    </html>
  `;

	const handleMessage = (event: any) => {
		try {
			const data = JSON.parse(event.nativeEvent.data);

			switch (data.type) {
				case "mapReady":
					setIsLoading(false);
					break;
				case "mapClick":
					setMarkerCoords({
						latitude: data.latitude,
						longitude: data.longitude,
					});
					if (onPress) onPress();
					break;
				case "markerDrag":
					setMarkerCoords({
						latitude: data.latitude,
						longitude: data.longitude,
					});
					break;
				case "markerClick":
					if (onMarkerPress) onMarkerPress(data.markerId);
					break;
			}
		} catch (error) {
			console.error("Error parsing WebView message:", error);
		}
	};

	return (
		<View style={styles.container}>
			{isLoading && (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" />
					<Text>マップを読み込み中...</Text>
				</View>
			)}
			<WebView
				ref={webViewRef}
				source={{ html: htmlContent }}
				style={styles.webview}
				onMessage={handleMessage}
				javaScriptEnabled={true}
				domStorageEnabled={true}
				startInLoadingState={false}
				scalesPageToFit={true}
				scrollEnabled={false}
				showsHorizontalScrollIndicator={false}
				showsVerticalScrollIndicator={false}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	webview: {
		flex: 1,
	},
	loadingContainer: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "white",
		zIndex: 1000,
	},
});
