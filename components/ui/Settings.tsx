"use client";

import React, {
  useEffect,
  useState,
} from "react";

import {
  Trash2,
  Check,
  Lock,
  ChevronDown,
  Globe,
  Sparkles,
  Cpu,
  ShieldCheck,
} from "lucide-react";

import * as Select from "@radix-ui/react-select";

import {
  useLanguage,
} from "@/components/LanguageContext";

import {
  useApiKeys,
} from "@/components/ApiKeyContext";

const PROVIDERS = [
  {
    id: "gemini",
    name: "Google Gemini",
  },
  {
    id: "openai",
    name: "OpenAI",
  },
  {
    id: "anthropic",
    name: "Anthropic",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
  },
];

const PROVIDER_MODELS: Record<
  string,
  {
    id: string;
    name: string;
  }[]
> = {
  gemini: [
    {
      id: "gemini-3.1-flash-lite-preview",
      name: "Gemini 3.1 Flash Lite",
    },
    {
      id: "gemini-2.5-flash-lite",
      name: "Gemini 2.5 Flash Lite",
    },
  ],

  openai: [
    {
      id: "gpt-4o",
      name: "GPT-4o",
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
    },
  ],

  anthropic: [
    {
      id: "claude-opus-4-7",
      name: "Claude Opus 4.7",
    },
    {
      id: "claude-haiku-4-5-20251001",
      name: "Claude Haiku 4.5",
    },
  ],

  deepseek: [
    {
      id: "deepseek-chat",
      name: "DeepSeek V3.2",
    },
  ],
};

export default function Settings() {
  const {
    uiLang,
    t,
  } = useLanguage();

  const {
    apiKeys,
    setApiKey,
    clearApiKey,
  } = useApiKeys();

  const languages =
    uiLang === "zh"
      ? [
          {
            id: "zh-all",
            name:
              "中文解析与翻译",
          },
          {
            id:
              "zh-parse-en-trans",
            name:
              "中文解析 + 英语意译",
          },
          {
            id: "en-all",
            name:
              "英文解析与翻译",
          },
        ]
      : [
          {
            id: "en-all",
            name:
              "English Parsing & Translation",
          },
          {
            id:
              "zh-parse-en-trans",
            name:
              "Chinese Parsing + English Translation",
          },
          {
            id: "zh-all",
            name:
              "Chinese Parsing & Translation",
          },
        ];

  /*
   * BYOK is the default in v2.
   * This avoids LinguiSnap paying for every request.
   */
  const [isPro, setIsPro] =
    useState(true);

  const [provider, setProvider] =
    useState("deepseek");

  const [model, setModel] =
    useState(
      PROVIDER_MODELS.deepseek[0].id
    );

  const [lang, setLang] =
    useState(
      uiLang === "zh"
        ? "zh-all"
        : "en-all"
    );

  const [saved, setSaved] =
    useState(false);

  const currentApiKey =
    apiKeys[provider] || "";

  const persistConfig = (
    patch: Record<
      string,
      unknown
    >
  ) => {
    try {
      const existing =
        JSON.parse(
          localStorage.getItem(
            "linguisnap_config"
          ) || "{}"
        );

      /*
       * Never persist API keys.
       */
      delete existing.keys;
      delete existing.apiKey;
      delete existing.encryptedKey;

      const next = {
        ...existing,
        ...patch,
      };

      localStorage.setItem(
        "linguisnap_config",
        JSON.stringify(next)
      );
    } catch {
      localStorage.setItem(
        "linguisnap_config",
        JSON.stringify(patch)
      );
    }
  };

  useEffect(() => {
    const raw =
      localStorage.getItem(
        "linguisnap_config"
      );

    if (!raw) {
      persistConfig({
        isPro: true,
        provider:
          "deepseek",
        model:
          "deepseek-chat",
        lang:
          uiLang === "zh"
            ? "zh-all"
            : "en-all",
      });

      return;
    }

    try {
      const config =
        JSON.parse(raw);

      if (
        typeof config.isPro ===
        "boolean"
      ) {
        setIsPro(
          config.isPro
        );
      }

      if (
        config.provider &&
        PROVIDER_MODELS[
          config.provider
        ]
      ) {
        setProvider(
          config.provider
        );

        if (
          config.model &&
          PROVIDER_MODELS[
            config.provider
          ].some(
            (item) =>
              item.id ===
              config.model
          )
        ) {
          setModel(
            config.model
          );
        } else {
          setModel(
            PROVIDER_MODELS[
              config.provider
            ][0].id
          );
        }
      }

      if (config.lang) {
        setLang(config.lang);
      }
    } catch {
      // Ignore malformed config.
    }
  }, []);

  useEffect(() => {
    const handleUiLangSync =
      () => {
        const raw =
          localStorage.getItem(
            "linguisnap_config"
          );

        if (!raw) return;

        try {
          const config =
            JSON.parse(raw);

          if (config.lang) {
            setLang(
              config.lang
            );
          }
        } catch {
          // Ignore malformed config.
        }
      };

    window.addEventListener(
      "ui_lang_changed",
      handleUiLangSync
    );

    return () =>
      window.removeEventListener(
        "ui_lang_changed",
        handleUiLangSync
      );
  }, []);

  const handleLangChange = (
    newLang: string
  ) => {
    setLang(newLang);

    persistConfig({
      lang: newLang,
    });
  };

  const handleProviderChange = (
    newProvider: string
  ) => {
    const newModel =
      PROVIDER_MODELS[
        newProvider
      ][0].id;

    setProvider(newProvider);
    setModel(newModel);

    persistConfig({
      provider:
        newProvider,
      model: newModel,
    });
  };

  const handleModelChange = (
    newModel: string
  ) => {
    setModel(newModel);

    persistConfig({
      model: newModel,
    });
  };

  const handleProToggle =
    () => {
      const next =
        !isPro;

      setIsPro(next);

      persistConfig({
        isPro: next,
      });
    };

  const handleSave = () => {
    persistConfig({
      isPro,
      provider,
      model,
      lang,
    });

    setSaved(true);

    window.setTimeout(
      () => {
        setSaved(false);
      },
      1800
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full mt-4">

      {/* Output language */}

      <div className="flex flex-col gap-2">

        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
          {uiLang === "zh"
            ? "输出语言偏好"
            : "Output Preference"}
        </label>

        <Select.Root
          value={lang}
          onValueChange={
            handleLangChange
          }
        >
          <Select.Trigger className="inline-flex items-center justify-between w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium hover:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-100 transition-colors">

            <div className="flex items-center gap-2">
              <Globe
                size={16}
                className="text-slate-400"
              />

              <Select.Value />
            </div>

            <Select.Icon>
              <ChevronDown
                size={16}
                className="text-slate-400"
              />
            </Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Content
              position="popper"
              sideOffset={6}
              className="bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] p-1 min-w-[260px]"
            >
              <Select.Viewport>
                {languages.map(
                  (item) => (
                    <Select.Item
                      key={item.id}
                      value={item.id}
                      className="relative flex items-center px-8 py-2 text-sm text-slate-700 font-medium rounded-lg cursor-pointer hover:bg-blue-50 outline-none data-[state=checked]:bg-slate-50"
                    >
                      <Select.ItemText>
                        {item.name}
                      </Select.ItemText>

                      <Select.ItemIndicator className="absolute left-2">
                        <Check
                          size={14}
                          className="text-blue-600"
                        />
                      </Select.ItemIndicator>
                    </Select.Item>
                  )
                )}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      <hr className="border-slate-100" />

      {/* Mode */}

      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">

        <div>
          <p className="font-bold text-sm text-slate-800">
            {isPro
              ? t.settings.proMode
              : t.settings.basicMode}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            {isPro
              ? t.settings.proDesc
              : t.settings.basicDesc}
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleProToggle
          }
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isPro
              ? "bg-blue-600"
              : "bg-slate-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
              isPro
                ? "translate-x-6"
                : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {isPro && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">

          {/* Security explanation */}

          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">

            <ShieldCheck
              size={20}
              className="text-blue-600 shrink-0 mt-0.5"
            />

            <div>
              <p className="text-sm font-bold text-blue-800">
                {uiLang === "zh"
                  ? "Session-only BYOK"
                  : "Session-only BYOK"}
              </p>

              <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">
                {uiLang === "zh"
                  ? "API Key 仅保存在当前页面内存中。解析时会通过 HTTPS 临时发送到 LinguiSnap 后端，再转发给所选模型提供商。LinguiSnap 不会把 Key 写入数据库、本地缓存、Redis 或日志。刷新页面后需要重新输入。"
                  : "Your API key is kept only in this page's memory. During analysis it is temporarily sent over HTTPS to the LinguiSnap backend and forwarded to the selected provider. It is not persisted in local storage, databases, Redis, or application logs. Refreshing the page removes it."}
              </p>
            </div>
          </div>

          {/* Provider */}

          <Select.Root
            value={provider}
            onValueChange={
              handleProviderChange
            }
          >
            <Select.Trigger className="inline-flex items-center justify-between w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 font-medium hover:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-100">

              <div className="flex items-center gap-2">
                <Sparkles
                  size={16}
                  className="text-slate-400"
                />

                <Select.Value />
              </div>

              <Select.Icon>
                <ChevronDown
                  size={16}
                  className="text-slate-400"
                />
              </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content
                position="popper"
                sideOffset={6}
                className="bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] p-1 min-w-[260px]"
              >
                <Select.Viewport>
                  {PROVIDERS.map(
                    (item) => (
                      <Select.Item
                        key={item.id}
                        value={item.id}
                        className="relative flex items-center px-8 py-2 text-sm text-slate-700 font-medium rounded-lg cursor-pointer hover:bg-blue-50 outline-none data-[state=checked]:bg-slate-50"
                      >
                        <Select.ItemText>
                          {item.name}
                        </Select.ItemText>

                        <Select.ItemIndicator className="absolute left-2">
                          <Check
                            size={14}
                            className="text-blue-600"
                          />
                        </Select.ItemIndicator>
                      </Select.Item>
                    )
                  )}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>

          {/* Model */}

          <Select.Root
            value={model}
            onValueChange={
              handleModelChange
            }
          >
            <Select.Trigger className="inline-flex items-center justify-between w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 font-medium hover:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-100">

              <div className="flex items-center gap-2">
                <Cpu
                  size={16}
                  className="text-slate-400"
                />

                <Select.Value />
              </div>

              <Select.Icon>
                <ChevronDown
                  size={16}
                  className="text-slate-400"
                />
              </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content
                position="popper"
                sideOffset={6}
                className="bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] p-1 min-w-[280px]"
              >
                <Select.Viewport>
                  {PROVIDER_MODELS[
                    provider
                  ].map(
                    (item) => (
                      <Select.Item
                        key={item.id}
                        value={item.id}
                        className="relative flex items-center px-8 py-2 text-sm text-slate-700 font-medium rounded-lg cursor-pointer hover:bg-blue-50 outline-none data-[state=checked]:bg-slate-50"
                      >
                        <Select.ItemText>
                          {item.name}
                        </Select.ItemText>

                        <Select.ItemIndicator className="absolute left-2">
                          <Check
                            size={14}
                            className="text-blue-600"
                          />
                        </Select.ItemIndicator>
                      </Select.Item>
                    )
                  )}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>

          {/* Key */}

          <div className="flex flex-col gap-2">

            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              API Key
            </label>

            <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2.5 rounded-xl focus-within:ring-2 focus-within:ring-blue-100">

              <Lock
                size={16}
                className="text-slate-400"
              />

              <input
                type="password"
                autoComplete="off"
                value={
                  currentApiKey
                }
                onChange={(e) =>
                  setApiKey(
                    provider,
                    e.target.value
                  )
                }
                placeholder={`${t.settings.input} ${
                  PROVIDERS.find(
                    (item) =>
                      item.id ===
                      provider
                  )?.name || ""
                } API Key`}
                className="flex-1 bg-transparent outline-none text-sm font-mono text-slate-700 w-full"
              />

              {currentApiKey && (
                <button
                  type="button"
                  onClick={() =>
                    clearApiKey(
                      provider
                    )
                  }
                  className="text-slate-400 hover:text-red-500"
                  title={
                    uiLang === "zh"
                      ? "清除当前会话中的 Key"
                      : "Clear key from this session"
                  }
                >
                  <Trash2
                    size={14}
                  />
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 px-1">
              {currentApiKey
                ? uiLang === "zh"
                  ? "✓ 当前会话已配置 Key。刷新页面后会自动清除。"
                  : "✓ Key is available for this session. It will be removed on refresh."
                : uiLang === "zh"
                  ? "Key 不会保存到浏览器存储。"
                  : "The key is not persisted in browser storage."}
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        className="w-full py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2"
      >
        {saved ? (
          <>
            <Check size={16} />
            {t.settings.saved}
          </>
        ) : (
          t.settings.save
        )}
      </button>
    </div>
  );
}