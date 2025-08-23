import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
import { LocationProvider } from "./app/conntexts/LocationContext";

const App = () => {
	const ctx = require.context("./app");
	return (
		<LocationProvider>
			<ExpoRoot context={ctx} />
		</LocationProvider>
	);
};

registerRootComponent(App);
