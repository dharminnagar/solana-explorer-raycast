import { ActionPanel, List, Action, Icon, showToast, Toast, Detail } from "@raycast/api";
import { useEffect, useState } from "react";
import { getHistory, clearHistory, SearchHistoryItem } from "./utils/history";
import { searchSolana, formatSearchResult, EXPLORER_URLS } from "./utils/solana";
import { preferences } from "./preferences";

export default function Command() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SearchHistoryItem | null>(null);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      loadSearchResult();
    }
  }, [selectedItem]);

  async function loadHistory() {
    const items = await getHistory();
    setHistory(items);
  }

  async function loadSearchResult() {
    if (!selectedItem) return;

    setIsLoading(true);
    try {
      const result = await searchSolana(selectedItem.query);
      setSearchResult(result);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Failed to fetch Solana data. Please try again.",
      });
    } finally {
      setIsLoading(false);
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
    } else if (searchResult?.type === "token") {
      return `${baseUrl}/token/${query}`;
    }
    return baseUrl;
  };

  return (
    <List
      isLoading={isLoading}
      selectedItemId={selectedItem?.query}
      onSelectionChange={(id) => {
        const item = history.find((h) => h.query === id);
        setSelectedItem(item || null);
      }}
    >
      {history.map((item) => (
        <List.Item
          key={item.query}
          id={item.query}
          icon={Icon.Clock}
          title={item.query}
          subtitle={`${item.type} • ${new Date(item.timestamp).toLocaleString()}`}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title={`Open in ${preferences.defaultExplorer}`} url={getExplorerUrl(item.query)} />
              <Action.CopyToClipboard title="Copy to Clipboard" content={item.query} />
              <Action
                title="Clear History"
                icon={Icon.Trash}
                onAction={async () => {
                  await clearHistory();
                  setHistory([]);
                  setSelectedItem(null);
                  setSearchResult(null);
                }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
