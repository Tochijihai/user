import { createContext, type ReactNode, useContext, useState } from "react";

interface OpinionContextType {
	shouldRefresh: boolean;
	triggerRefresh: () => void;
	resetRefresh: () => void;
}

const OpinionContext = createContext<OpinionContextType | undefined>(undefined);

export function OpinionProvider({ children }: { children: ReactNode }) {
	const [shouldRefresh, setShouldRefresh] = useState(false);

	const triggerRefresh = () => {
		setShouldRefresh(true);
	};

	const resetRefresh = () => {
		setShouldRefresh(false);
	};

	return (
		<OpinionContext.Provider
			value={{ shouldRefresh, triggerRefresh, resetRefresh }}
		>
			{children}
		</OpinionContext.Provider>
	);
}

export function useOpinionContext() {
	const context = useContext(OpinionContext);
	if (context === undefined) {
		throw new Error("useOpinionContext must be used within an OpinionProvider");
	}
	return context;
}

export default OpinionProvider;
