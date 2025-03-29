import { getPreferenceValues } from "@raycast/api";

export interface Preferences {
  defaultExplorer: "Solana Explorer" | "Solscan" | "SolanaFM";
}

export const preferences = getPreferenceValues<Preferences>();
