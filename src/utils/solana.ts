import { Connection, PublicKey, ParsedTransactionWithMeta, BlockResponse, clusterApiUrl } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TokenInfo, TokenListProvider } from "@solana/spl-token-registry";
import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  defaultExplorer: "Solana Explorer" | "Solscan" | "SolanaFM";
  moralisApiKey: string;
}

const preferences = getPreferenceValues<Preferences>();

export type Network = "mainnet" | "devnet" | "testnet";

export type SearchType = "address" | "transaction" | "block" | "token";

export interface SearchResult {
  type: SearchType;
  data: any;
  network: Network;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  website?: string;
  totalSupplyFormatted?: string;
  fullyDilutedValue?: string;
}

interface MoralisTokenMetadata {
  name?: string;
  symbol?: string;
  decimals?: number;
  logo?: string;
  website?: string;
  totalSupplyFormatted?: string;
  fullyDilutedValue?: string;
}

// RPC URLs for different networks
export const RPC_URLS = {
  mainnet: "https://mainnet.helius-rpc.com/?api-key=20775439-c373-4f7e-8a64-f705c75b3b37",
  devnet: clusterApiUrl("devnet"),
  testnet: clusterApiUrl("testnet"),
};

// Explorer URLs for different networks
export const EXPLORER_BASE_URLS = {
  "Solana Explorer": "https://explorer.solana.com",
  Solscan: "https://solscan.io",
  SolanaFM: "https://solana.fm",
};

export const EXPLORER_CLUSTER_URLS = {
  "Solana Explorer": {
    mainnet: "",
    devnet: "?cluster=devnet",
    testnet: "?cluster=testnet",
  },
  Solscan: {
    mainnet: "",
    devnet: "?cluster=devnet",
    testnet: "?cluster=testnet",
  },
  SolanaFM: {
    mainnet: "",
    devnet: "?cluster=devnet-solana",
    testnet: "?cluster=testnet-solana",
  },
};

let tokenList: TokenInfo[] = [];

// Create a function to get connection for a specific network
export function getConnection(network: Network): Connection {
  return new Connection(RPC_URLS[network]);
}

async function isTokenAccount(address: string, network: Network): Promise<boolean> {
  try {
    const connection = getConnection(network);
    const accountInfo = await connection.getAccountInfo(new PublicKey(address));
    if (!accountInfo) return false;

    // Check if the account is owned by the Token Program
    return accountInfo.owner?.equals(TOKEN_PROGRAM_ID) ?? false;
  } catch {
    return false;
  }
}

async function getTokenMetadata(tokenAddress: string, network: Network): Promise<TokenMetadata | null> {
  try {
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-Key":
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImJkNzIxYWU2LTQ2ZmQtNGI3YS1hY2ZiLTJkMTIyYTdhZjMwZiIsIm9yZ0lkIjoiNDM4NjQ4IiwidXNlcklkIjoiNDUxMjc3IiwidHlwZUlkIjoiNmE1MTg1ZTItZWI1OC00NmU3LWIxYzUtNjlkYjQyNTVjMTQxIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDMyNDMwNzUsImV4cCI6NDg5OTAwMzA3NX0.wu-4ImKXtLBf9LX5oSTLglzmtLIZr_EMEln-DknPlqc",
      },
    };

    const response = await fetch(
      `https://solana-gateway.moralis.io/token/${network}/${tokenAddress}/metadata`,
      options,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as MoralisTokenMetadata;

    // Validate and transform the response data
    return {
      name: data.name || "Unknown Token",
      symbol: data.symbol || "UNKNOWN",
      decimals: Number(data.decimals) || 0,
      logoURI: data.logo,
      website: data.website,
      totalSupplyFormatted: data.totalSupplyFormatted,
      fullyDilutedValue: data.fullyDilutedValue,
    };
  } catch (error) {
    console.error("Error fetching token metadata:", error);
    return null;
  }
}

export async function detectSearchType(query: string, network: Network): Promise<SearchType> {
  if (!query) return "address";

  // Check if it's a transaction signature (base58 encoded, 88 characters)
  if (/^[1-9A-HJ-NP-Za-km-z]{88}$/.test(query)) {
    return "transaction";
  }

  // Check if it's a block number
  if (/^\d+$/.test(query)) {
    return "block";
  }

  // For addresses, check if it's a token account
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(query)) {
    const isToken = await isTokenAccount(query, network);
    return isToken ? "token" : "address";
  }

  // Default to address
  return "address";
}

export async function searchSolana(query: string, network: Network = "mainnet"): Promise<SearchResult> {
  if (!query) {
    throw new Error("Search query cannot be empty");
  }

  const type = await detectSearchType(query, network);
  const connection = getConnection(network);

  switch (type) {
    case "address": {
      const accountInfo = await connection.getAccountInfo(new PublicKey(query));
      if (!accountInfo) {
        throw new Error("Account not found");
      }
      return {
        type,
        network,
        data: {
          ...accountInfo,
          address: query,
        },
      };
    }

    case "transaction": {
      const tx = await connection.getParsedTransaction(query);
      if (!tx) {
        throw new Error("Transaction not found");
      }
      return {
        type,
        network,
        data: tx,
      };
    }

    case "block": {
      const block = await connection.getBlock(parseInt(query));
      if (!block) {
        throw new Error("Block not found");
      }
      return {
        type,
        network,
        data: block,
      };
    }

    case "token": {
      const tokenAccountInfo = await connection.getAccountInfo(new PublicKey(query));
      if (!tokenAccountInfo) {
        throw new Error("Token account not found");
      }

      // Get the mint address from the token account data
      const mintAddress = new PublicKey(tokenAccountInfo.data.slice(0, 32)).toString();
      const tokenMetadata = await getTokenMetadata(query, network);

      return {
        type,
        network,
        data: {
          address: query,
          owner: tokenAccountInfo.owner?.toString() ?? "Unknown",
          data: tokenAccountInfo.data,
          lamports: tokenAccountInfo.lamports ?? 0,
          executable: tokenAccountInfo.executable ?? false,
          rentEpoch: tokenAccountInfo.rentEpoch ?? 0,
          mint: mintAddress,
          metadata: tokenMetadata,
        },
      };
    }
  }
}

export function formatSearchResult(result: SearchResult): string {
  if (!result || !result.data) {
    return "# Error\nNo data available";
  }

  const network = result.network.charAt(0).toUpperCase() + result.network.slice(1);

  switch (result.type) {
    case "address": {
      const data = result.data;
      if (!data) return "# Error\nAccount data not available";

      const solBalance = ((data.lamports ?? 0) / 1e9).toFixed(4);
      const address = data.address ?? "Unknown";
      const owner = data.owner?.toString() ?? "Unknown";
      const dataSize = data.data?.length ? (data.data.length / 1024).toFixed(2) : "0";
      const rentEpoch = data.rentEpoch ?? "Unknown";
      const slot = data.slot ?? "Unknown";

      return `# Account Details

## Overview
- **Address:** \`${address}\`
- **SOL Balance:** ${solBalance} SOL
- **Lamports:** ${(data.lamports ?? 0).toLocaleString()}
- **Executable:** ${data.executable ? "Yes" : "No"}
- **Data Size:** ${dataSize} KB

## Metadata
- **Owner Program:** \`${owner}\`
- **Rent Epoch:** ${rentEpoch}
- **Slot:** ${slot}

## Network
- **Current Network:** ${network}`;
    }

    case "transaction": {
      const data = result.data;
      if (!data?.transaction?.signatures?.[0] || !data?.meta) {
        return "# Error\nTransaction data not available";
      }

      const blockTime = data.blockTime ? new Date(data.blockTime * 1000).toLocaleString() : "Unknown";
      const fee = ((data.meta.fee ?? 0) / 1e9).toFixed(9);
      const status = data.meta.err ? "Failed" : "Success";
      const instructions = data.transaction?.message?.instructions ?? [];

      return `# Transaction Details

## Overview
- **Signature:** \`${data.transaction.signatures[0]}\`
- **Block Time:** ${blockTime}
- **Fee:** ${fee} SOL (${data.meta.fee?.toLocaleString() ?? "0"} lamports)
- **Status:** ${status}

## Transaction Info
- **Slot:** ${data.slot ?? "Unknown"}
- **Block Hash:** \`${data.blockhash ?? "Unknown"}\`
- **Previous Block Hash:** \`${data.previousBlockhash ?? "Unknown"}\`

## Instructions
${instructions
  .map(
    (ix: any, index: number) => `
### Instruction ${index + 1}
- **Program:** \`${ix.programId?.toString() ?? "Unknown"}\`
- **Accounts:** ${ix.accounts?.length ?? 0}
- **Data:** \`${ix.data ?? "No data"}\`
`,
  )
  .join("\n")}`;
    }

    case "block": {
      const data = result.data;
      if (!data) return "# Error\nBlock data not available";

      const blockTime = data.blockTime ? new Date(data.blockTime * 1000).toLocaleString() : "Unknown";
      const transactions = data.transactions ?? [];
      const rewards = data.rewards ?? [];

      return `# Block Information

## Overview
- **Block Height:** ${data.parentSlot ?? "Unknown"}
- **Block Hash:** \`${data.blockhash ?? "Unknown"}\`
- **Previous Block Hash:** \`${data.previousBlockhash ?? "Unknown"}\`
- **Transaction Count:** ${transactions.length}
- **Block Time:** ${blockTime}

## Block Details
- **Parent Slot:** ${data.parentSlot ?? "Unknown"}
- **Rewards:** ${rewards.length}
- **Block Time:** ${data.blockTime ?? "Unknown"}
- **Block Height:** ${data.blockHeight ?? "Unknown"}

## Transactions
${transactions
  .slice(0, 5)
  .map(
    (tx: any, index: number) => `
### Transaction ${index + 1}
- **Signature:** \`${tx.transaction?.signatures?.[0] ?? "Unknown"}\`
- **Program:** \`${tx.transaction?.message?.accountKeys?.[1]?.toString() ?? "Unknown"}\`
`,
  )
  .join("\n")}
${transactions.length > 5 ? `\n... and ${transactions.length - 5} more transactions` : ""}`;
    }

    case "token": {
      const data = result.data;
      if (!data) return "# Error\nToken account data not available";

      const dataSize = data.data?.length ? (data.data.length / 1024).toFixed(2) : "0";
      const metadata = data.metadata;

      return `# Token Account Information

## Token Details
${metadata?.logoURI ? `<img src="${metadata.logoURI}" width="48" height="48" style="border-radius: 8px; margin-bottom: 1px;" />` : ""}

### Basic Information
- **Name:** ${metadata?.name ?? "Unknown"}
- **Symbol:** ${metadata?.symbol ?? "Unknown"}
- **Decimals:** ${metadata?.decimals ?? "Unknown"}
${metadata?.standard ? `- **Standard:** ${metadata.standard}` : ""}

### Market Data
- **Fully Diluted Value:** $${metadata?.fullyDilutedValue ?? "Unknown"}
- **Total Supply:** ${metadata?.totalSupplyFormatted ?? "Unknown"}

## Account Information
### Overview
- **Token Account:** \`${data.address ?? "Unknown"}\`
- **Mint Address:** \`${data.mint ?? "Unknown"}\`
- **Owner Program:** \`${data.owner ?? "Unknown"}\`
- **Lamports:** ${(data.lamports ?? 0).toLocaleString()}
- **Data Size:** ${dataSize} KB

### Account Details
- **Rent Epoch:** ${data.rentEpoch ?? "Unknown"}
- **Executable:** ${data.executable ? "Yes" : "No"}

## Network
- **Current Network:** ${network}`;
    }

    default:
      return "# Error\nUnknown search type";
  }
}
