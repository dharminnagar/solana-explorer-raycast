import {
  ActionPanel,
  Detail,
  List,
  Action,
  Icon,
  showToast,
  Toast,
  getPreferenceValues,
  Clipboard,
} from "@raycast/api";
import { useState, useEffect } from "react";
import { searchSolana, formatSearchResult, Network, EXPLORER_BASE_URLS, EXPLORER_CLUSTER_URLS } from "./utils/solana";
import { addToHistory, getLastNetwork, setLastNetwork } from "./utils/history";

interface Preferences {
  defaultExplorer: "Solana Explorer" | "Solscan" | "SolanaFM";
}

export default function Command() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<Network>("mainnet");
  const preferences = getPreferenceValues<Preferences>();

  // Load the last selected network when the component mounts
  useEffect(() => {
    loadLastNetwork();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      performSearch();
    }
  }, [searchQuery, currentNetwork]);

  async function loadLastNetwork() {
    const lastNetwork = await getLastNetwork();
    setCurrentNetwork(lastNetwork);
  }

  async function handleNetworkChange(network: Network) {
    setCurrentNetwork(network);
    await setLastNetwork(network);
  }

  async function performSearch() {
    setIsLoading(true);
    try {
      const result = await searchSolana(searchQuery, currentNetwork);
      setSearchResult(result);
      // Save to history
      await addToHistory(searchQuery, result.type);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Failed to fetch Solana data. Please check your input and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePasteFromClipboard() {
    try {
      const clipboardText = await Clipboard.read();
      if (clipboardText.text) {
        setSearchQuery(clipboardText.text.trim());
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Failed to read from clipboard",
      });
    }
  }

  const getExplorerUrl = (query: string): string => {
    const baseUrl = EXPLORER_BASE_URLS[preferences.defaultExplorer];
    const clusterUrl = EXPLORER_CLUSTER_URLS[preferences.defaultExplorer][currentNetwork];
    if (searchResult?.type === "address") {
      return `${baseUrl}/account/${query}${clusterUrl}`;
    } else if (searchResult?.type === "transaction") {
      return `${baseUrl}/tx/${query}${clusterUrl}`;
    } else if (searchResult?.type === "block") {
      return `${baseUrl}/block/${query}${clusterUrl}`;
    }
    return `${baseUrl}${clusterUrl}`;
  };

  const networkActions = (
    <ActionPanel.Submenu title="Switch Network" icon={Icon.Network}>
      <Action
        title="Mainnet"
        icon={Icon.Globe}
        onAction={() => handleNetworkChange("mainnet")}
        autoFocus={currentNetwork === "mainnet"}
      />
      <Action
        title="Devnet"
        icon={Icon.Code}
        onAction={() => handleNetworkChange("devnet")}
        autoFocus={currentNetwork === "devnet"}
      />
      <Action
        title="Testnet"
        icon={Icon.Hammer}
        onAction={() => handleNetworkChange("testnet")}
        autoFocus={currentNetwork === "testnet"}
      />
    </ActionPanel.Submenu>
  );

  return (
    <List
      searchBarPlaceholder="Search by address, transaction hash, block number, or token address"
      onSearchTextChange={setSearchQuery}
      isLoading={isLoading}
    >
      {searchResult && (
        <List.Item
          icon={Icon.MagnifyingGlass}
          title={searchQuery}
          subtitle={`${searchResult.type.charAt(0).toUpperCase() + searchResult.type.slice(1)} • ${currentNetwork.charAt(0).toUpperCase() + currentNetwork.slice(1)}`}
          actions={
            <ActionPanel>
              <Action.Push
                title="View Details"
                target={
                  <Detail
                    markdown={formatSearchResult(searchResult)}
                    actions={
                      <ActionPanel>
                        <Action.OpenInBrowser
                          title={`Open in ${preferences.defaultExplorer}`}
                          url={getExplorerUrl(searchQuery)}
                        />
                        <Action.CopyToClipboard title="Copy to Clipboard" content={searchQuery} />
                        {networkActions}
                      </ActionPanel>
                    }
                  />
                }
              />
              <Action.OpenInBrowser
                title={`Open in ${preferences.defaultExplorer}`}
                url={getExplorerUrl(searchQuery)}
              />
              <Action.CopyToClipboard title="Copy to Clipboard" content={searchQuery} />
              {networkActions}
            </ActionPanel>
          }
        />
      )}
      <List.Item
        icon={Icon.Clipboard}
        title="Paste from Clipboard"
        subtitle="Paste the last copied text"
        actions={
          <ActionPanel>
            <Action title="Paste" onAction={handlePasteFromClipboard} />
            {networkActions}
          </ActionPanel>
        }
      />
    </List>
  );
}
