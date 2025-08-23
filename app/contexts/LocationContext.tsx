// LocationContext.tsx

import type * as Location from "expo-location";
import { createContext, useContext, useState } from "react";

type LocationContextType = {
	location: Location.LocationObject | null;
	setLocation: (loc: Location.LocationObject | null) => void;
};

const LocationContext = createContext<LocationContextType | undefined>(
	undefined,
);

export const LocationProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [location, setLocation] = useState<Location.LocationObject | null>(
		null,
	);
	return (
		<LocationContext.Provider value={{ location, setLocation }}>
			{children}
		</LocationContext.Provider>
	);
};

export const useLocationContext = () => {
	const ctx = useContext(LocationContext);
	if (!ctx)
		throw new Error("useLocationContext must be used within LocationProvider");
	return ctx;
};

export default LocationProvider;
