"use client"

import { useAdminProfilePage } from '../hooks/use-admin-profile-page'
import { ProfilePage } from './profile-page'

export function ProfileContent() {
  const { profile, session, refreshProfile } = useAdminProfilePage()

  return <ProfilePage profile={profile} session={session} refreshProfile={refreshProfile} />
}
