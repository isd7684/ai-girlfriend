"use client"

import type { InboxChatLlmConfig } from "@repo/contracts"

const legacyStorageKey = "web:local-llm-config"
const storageKey = "web:local-llm-configs"
const localLlmConfigChangedEventName = "web-local-llm-config-changed"

export type LocalLlmConfigItem = InboxChatLlmConfig & {
  id: string
  name: string
  enabled: boolean
  createdAtMs: number
  updatedAtMs: number
}

export type LocalLlmConfigStore = {
  selectedConfigId: string | null
  items: LocalLlmConfigItem[]
}

export type LocalLlmConfig = InboxChatLlmConfig & {
  enabled: boolean
}

function canUseStorage() {
  return typeof window !== "undefined"
}

function notifyLocalLlmConfigChanged() {
  if (canUseStorage()) {
    window.dispatchEvent(new Event(localLlmConfigChangedEventName))
  }
}

function createConfigId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `llm-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeConfigItem(input: LocalLlmConfigItem): LocalLlmConfigItem {
  const nowMs = Date.now()
  const name = input.name?.trim() || input.providerName?.trim() || input.model.trim() || "OpenAI Compatible"
  const baseURL = input.baseURL.trim().replace(/\/$/, "")
  const wireApi = input.wireApi === "responses" || baseURL.includes("tocodex.space")
    ? "responses"
    : "chat_completions"
  const reasoningEffort = ["minimal", "low", "medium", "high"].includes(input.reasoningEffort ?? "")
    ? input.reasoningEffort
    : undefined

  return {
    id: input.id || createConfigId(),
    name,
    enabled: input.enabled,
    providerName: input.providerName?.trim() || "OpenAI Compatible",
    baseURL,
    model: input.model.trim(),
    apiKey: input.apiKey.trim(),
    wireApi,
    ...(reasoningEffort ? { reasoningEffort } : {}),
    createdAtMs: input.createdAtMs || nowMs,
    updatedAtMs: input.updatedAtMs || nowMs,
  }
}

function normalizeStore(input: LocalLlmConfigStore): LocalLlmConfigStore {
  const items = input.items
    .filter((item) => item.apiKey?.trim() && item.baseURL?.trim() && item.model?.trim())
    .map(normalizeConfigItem)
  let selectedConfigId: string | null = null

  if (input.selectedConfigId && items.some((item) => item.id === input.selectedConfigId)) {
    selectedConfigId = input.selectedConfigId
  }

  return {
    selectedConfigId,
    items,
  }
}

function readLegacyLocalLlmConfig(): LocalLlmConfigStore | null {
  if (!canUseStorage()) {
    return null
  }

  const rawValue = window.localStorage.getItem(legacyStorageKey)

  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as LocalLlmConfig
    const nowMs = Date.now()

    if (!parsed.apiKey || !parsed.baseURL || !parsed.model) {
      window.localStorage.removeItem(legacyStorageKey)
      return null
    }

    const item = normalizeConfigItem({
      id: createConfigId(),
      name: parsed.providerName || parsed.model,
      enabled: parsed.enabled,
      providerName: parsed.providerName,
      baseURL: parsed.baseURL,
      model: parsed.model,
      apiKey: parsed.apiKey,
      createdAtMs: nowMs,
      updatedAtMs: nowMs,
    })

    return {
      selectedConfigId: item.id,
      items: [item],
    }
  } catch {
    window.localStorage.removeItem(legacyStorageKey)
    return null
  }
}

export function createDefaultLlmConfigItem(): LocalLlmConfigItem {
  const nowMs = Date.now()

  return {
    id: createConfigId(),
    name: "OpenAI 默认配置",
    enabled: true,
    providerName: "OpenAI Compatible",
    baseURL: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    apiKey: "",
    wireApi: "chat_completions",
    createdAtMs: nowMs,
    updatedAtMs: nowMs,
  }
}

export function readLocalLlmConfigStore(): LocalLlmConfigStore {
  if (!canUseStorage()) {
    return { selectedConfigId: null, items: [] }
  }

  const rawValue = window.localStorage.getItem(storageKey)

  if (rawValue) {
    try {
      return normalizeStore(JSON.parse(rawValue) as LocalLlmConfigStore)
    } catch {
      window.localStorage.removeItem(storageKey)
    }
  }

  const legacyStore = readLegacyLocalLlmConfig()

  if (legacyStore) {
    saveLocalLlmConfigStore(legacyStore)
    window.localStorage.removeItem(legacyStorageKey)
    return legacyStore
  }

  return { selectedConfigId: null, items: [] }
}

export function saveLocalLlmConfigStore(input: LocalLlmConfigStore) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(normalizeStore(input)))
  notifyLocalLlmConfigChanged()
}

export function upsertLocalLlmConfigItem(input: LocalLlmConfigItem) {
  const store = readLocalLlmConfigStore()
  const item = normalizeConfigItem({
    ...input,
    updatedAtMs: Date.now(),
  })
  const existingIndex = store.items.findIndex((current) => current.id === item.id)
  const items = existingIndex >= 0
    ? store.items.map((current) => current.id === item.id ? item : current)
    : [item, ...store.items]
  const selectedConfigId = store.items.length === 0 && store.selectedConfigId === null
    ? item.id
    : store.selectedConfigId

  saveLocalLlmConfigStore({
    selectedConfigId,
    items,
  })

  return item
}

export function deleteLocalLlmConfigItem(id: string) {
  const store = readLocalLlmConfigStore()
  const items = store.items.filter((item) => item.id !== id)
  const selectedConfigId = store.selectedConfigId === id
    ? items.find((item) => item.enabled)?.id ?? items[0]?.id ?? null
    : store.selectedConfigId

  saveLocalLlmConfigStore({
    selectedConfigId,
    items,
  })
}

export function selectLocalLlmConfig(id: string | null) {
  const store = readLocalLlmConfigStore()
  const selectedConfigId = id && store.items.some((item) => item.id === id) ? id : null

  saveLocalLlmConfigStore({
    ...store,
    selectedConfigId,
  })
}

export function readSelectedLocalLlmConfig(): LocalLlmConfigItem | null {
  const store = readLocalLlmConfigStore()

  return store.items.find((item) => item.enabled && item.id === store.selectedConfigId) ?? null
}

export function readEnabledLocalLlmConfig(): InboxChatLlmConfig | null {
  const selectedConfig = readSelectedLocalLlmConfig()

  if (!selectedConfig?.enabled) {
    return null
  }

  return {
    providerName: selectedConfig.providerName,
    baseURL: selectedConfig.baseURL,
    model: selectedConfig.model,
    apiKey: selectedConfig.apiKey,
    wireApi: selectedConfig.wireApi,
    ...(selectedConfig.reasoningEffort ? { reasoningEffort: selectedConfig.reasoningEffort } : {}),
  }
}

export function readLocalLlmConfig(): LocalLlmConfig | null {
  const selectedConfig = readSelectedLocalLlmConfig()

  if (!selectedConfig) {
    return null
  }

  return {
    enabled: selectedConfig.enabled,
    providerName: selectedConfig.providerName,
    baseURL: selectedConfig.baseURL,
    model: selectedConfig.model,
    apiKey: selectedConfig.apiKey,
    wireApi: selectedConfig.wireApi,
    ...(selectedConfig.reasoningEffort ? { reasoningEffort: selectedConfig.reasoningEffort } : {}),
  }
}

export function saveLocalLlmConfig(input: LocalLlmConfig) {
  upsertLocalLlmConfigItem({
    ...createDefaultLlmConfigItem(),
    enabled: input.enabled,
    name: input.providerName || input.model,
    providerName: input.providerName,
    baseURL: input.baseURL,
    model: input.model,
    apiKey: input.apiKey,
    wireApi: input.wireApi,
    reasoningEffort: input.reasoningEffort,
  })
}

export function clearLocalLlmConfig() {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(storageKey)
  window.localStorage.removeItem(legacyStorageKey)
  notifyLocalLlmConfigChanged()
}

export { localLlmConfigChangedEventName }
