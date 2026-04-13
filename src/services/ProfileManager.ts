// services/ProfileManager.ts
import { supabase } from '../lib/supabase'

export interface ProfileData {
  name: string | null
  gender: string | null
  age: number | null
  college_id: number | null
  profile_pic: string | null
}

export const SPORT_ID_MAP: Record<string, number> = {
  football:    1,
  cricket:     2,
  basketball:  3,
  tabletennis: 4,
  badminton:   5,
  tennis:      6,
}

class ProfileManager {

  async saveNameAndGender(userId: string, name: string, gender: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, name, gender, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    if (error) { console.error('Error saving name and gender:', error); throw error }
  }

  async saveAge(userId: string, age: number): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ age, updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (error) { console.error('Error saving age:', error); throw error }
  }

  async saveCollegeId(userId: string, collegeId: number): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ college_id: collegeId, updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (error) { console.error('Error saving college ID:', error); throw error }
  }

  // ── Preferred Sports ────────────────────────────────────────────────────────

  async savePreferredSports(userId: string, sportStringIds: string[]): Promise<void> {
    const { error: deleteError } = await supabase
      .from('user_preferred_sports')
      .delete()
      .eq('user_id', userId)
    if (deleteError) { console.error('Error deleting existing sports:', deleteError); throw deleteError }

    if (sportStringIds.length === 0) return

    const sportsData = sportStringIds.map((sportStringId) => ({
      user_id: userId,
      sport_id: SPORT_ID_MAP[sportStringId],
      created_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase
      .from('user_preferred_sports')
      .insert(sportsData)
    if (insertError) { console.error('Error saving preferred sports:', insertError); throw insertError }
  }

  // ── Skill Levels ────────────────────────────────────────────────────────────

  async saveSkillLevels(userId: string, sportSkillLevels: Record<string, string>): Promise<void> {
    for (const [sportStringId, skillLevel] of Object.entries(sportSkillLevels)) {
      const sportId = SPORT_ID_MAP[sportStringId]
      const { error } = await supabase
        .from('user_preferred_sports')
        .update({ skill_level: skillLevel })
        .eq('user_id', userId)
        .eq('sport_id', sportId)
      if (error) { console.error(`Error saving skill level for ${sportStringId}:`, error); throw error }
    }
  }

  // ── Profile Picture ─────────────────────────────────────────────────────────

  async uploadProfilePicture(userId: string, imageUri: string): Promise<string> {
  const userIdLower = userId.toLowerCase()
  const timestamp = Math.floor(Date.now() / 1000)
  const fileName = `profile_${timestamp}.jpg`
  const filePath = `profile_pictures/${userIdLower}/${fileName}`

  console.log('Uploading image to storage...')

  // ── Android-safe upload using FormData ───────────────────────────────────
  const formData = new FormData()
  formData.append('file', {
    uri: imageUri,
    name: fileName,
    type: 'image/jpeg',
  } as any)

  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData?.session?.access_token
  if (!accessToken) throw new Error('No access token found. Please log in again.')

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
  const uploadUrl = `${supabaseUrl}/storage/v1/object/avatars/${filePath}`

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'x-upsert': 'true',
    },
    body: formData,
  })

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text()
    console.error('Upload failed:', errorText)
    throw new Error(`Upload failed: ${errorText}`)
  }

  console.log('Image uploaded successfully')

  // ── Get public URL ───────────────────────────────────────────────────────
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)
  const publicUrl = urlData.publicUrl

  console.log('Public URL:', publicUrl)

  // ── Save URL to profiles table ───────────────────────────────────────────
  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        profile_pic: publicUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
  if (upsertError) {
    console.error('Error saving profile pic URL:', upsertError)
    throw upsertError
  }

  console.log('Profile picture saved to database')
  return publicUrl
}

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async getProfile(userId: string): Promise<ProfileData | null> {
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', userId).single()
    if (error) { console.error('Error fetching profile:', error); return null }
    return data
  }

  async updateProfilePicture(userId: string, profilePicUrl: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ profile_pic: profilePicUrl, updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (error) { console.error('Error updating profile picture:', error); throw error }
  }

  async isOnboardingComplete(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles').select('name, age, gender, college_id').eq('id', userId).single()
    if (error) return false
    return !!(data.name && data.age && data.gender && data.college_id)
  }
}

export default new ProfileManager()