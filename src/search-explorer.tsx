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
import { searchSolana, formatSearchResult, EXPLORER_URLS, SearchResult } from "./utils/solana";
import { addToHistory } from "./utils/history";

interface Preferences {
  defaultExplorer: "Solana Explorer" | "Solscan" | "SolanaFM";
}

export default function Command() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const preferences = getPreferenceValues<Preferences>();

  useEffect(() => {
    if (searchQuery) {
      performSearch();
    }
  }, [searchQuery]);

  async function performSearch() {
    setIsLoading(true);
    try {
      const result = await searchSolana(searchQuery);
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

  const getExplorerUrl = (query: string) => {
    const baseUrl = EXPLORER_URLS[preferences.defaultExplorer];
    if (searchResult?.type === "address") {
      return `${baseUrl}/account/${query}`;
    } else if (searchResult?.type === "transaction") {
      return `${baseUrl}/tx/${query}`;
    } else if (searchResult?.type === "block") {
      return `${baseUrl}/block/${query}`;
    }
    return baseUrl;
  };

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
          subtitle={searchResult.type.charAt(0).toUpperCase() + searchResult.type.slice(1)}
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
          </ActionPanel>
        }
      />
    </List>
  );
}
