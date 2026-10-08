"use client"

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDefaultAvatarHistory, getLatestDefaultAvatar, setCurrentDefaultAvatar, uploadDefaultAvatar } from '../api'

const defaultAvatarPageQueryKey = ['dashboard', 'default-avatar', 'page-state'] as const

export function useAdminDefaultAvatarPage() {
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [settingCurrentKey, setSettingCurrentKey] = useState<string | null>(null)

  const query = useQuery({
    queryKey: defaultAvatarPageQueryKey,
    queryFn: async () => {
      const [latest, history] = await Promise.all([
        getLatestDefaultAvatar(),
        getDefaultAvatarHistory(),
      ])

      return {
        latest,
        history: history.items,
      }
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadDefaultAvatar(file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: defaultAvatarPageQueryKey })
      setFeedback('Default avatar updated.')
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : 'Unable to upload default avatar.')
    },
  })

  const setCurrentMutation = useMutation({
    mutationFn: async (key: string) => {
      setSettingCurrentKey(key)
      return setCurrentDefaultAvatar({ key })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: defaultAvatarPageQueryKey })
      setFeedback('Default avatar switched.')
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : 'Unable to set current default avatar.')
    },
    onSettled: () => {
      setSettingCurrentKey(null)
    },
  })

  return {
    latestAvatarKey: query.data?.latest.key ?? null,
    latestAvatarUpdatedAtMs: query.data?.latest.updatedAtMs ?? null,
    history: query.data?.history ?? [],
    isLoading: query.isLoading,
    feedback,
    setFeedback,
    isUploading: uploadMutation.isPending,
    isSettingCurrentKey: settingCurrentKey,
    uploadDefaultAvatar: uploadMutation.mutateAsync,
    setCurrentDefaultAvatar: setCurrentMutation.mutateAsync,
  }
}
