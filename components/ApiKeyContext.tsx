"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type ApiKeyMap = Record<string, string>;

interface ApiKeyContextValue {
  apiKeys: ApiKeyMap;
  getApiKey: (provider: string) => string;
  setApiKey: (
    provider: string,
    value: string
  ) => void;
  clearApiKey: (
    provider: string
  ) => void;
}

const ApiKeyContext =
  createContext<ApiKeyContextValue | null>(
    null
  );

export function ApiKeyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
   * API Keys ONLY live in React memory.
   *
   * They are NOT stored in:
   * - localStorage
   * - sessionStorage
   * - cookies
   * - IndexedDB
   *
   * Refreshing / closing the page removes them.
   */
  const [apiKeys, setApiKeys] =
    useState<ApiKeyMap>({});

  /*
   * Migration cleanup:
   *
   * Older LinguiSnap versions stored encrypted
   * keys inside linguisnap_config.
   *
   * v2 removes those legacy values automatically.
   */
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(
          "linguisnap_config"
        );

      if (!raw) return;

      const config = JSON.parse(raw);

      let changed = false;

      if ("keys" in config) {
        delete config.keys;
        changed = true;
      }

      if ("apiKey" in config) {
        delete config.apiKey;
        changed = true;
      }

      if (
        "encryptedKey" in config
      ) {
        delete config.encryptedKey;
        changed = true;
      }

      if (changed) {
        localStorage.setItem(
          "linguisnap_config",
          JSON.stringify(config)
        );
      }
    } catch {
      // Ignore malformed legacy local config.
    }
  }, []);

  const getApiKey = (
    provider: string
  ) => {
    return (
      apiKeys[provider] || ""
    );
  };

  const setApiKey = (
    provider: string,
    value: string
  ) => {
    setApiKeys((current) => ({
      ...current,
      [provider]: value,
    }));
  };

  const clearApiKey = (
    provider: string
  ) => {
    setApiKeys((current) => {
      const next = {
        ...current,
      };

      delete next[provider];

      return next;
    });
  };

  return (
    <ApiKeyContext.Provider
      value={{
        apiKeys,
        getApiKey,
        setApiKey,
        clearApiKey,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKeys() {
  const context =
    useContext(ApiKeyContext);

  if (!context) {
    throw new Error(
      "useApiKeys must be used inside ApiKeyProvider"
    );
  }

  return context;
}