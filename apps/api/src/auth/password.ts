import bcrypt from 'bcryptjs'

export async function hashPassword(password: string): Promise<{ passwordHash: string; passwordAlgo: 'bcrypt' }> {
  const passwordHash = await bcrypt.hash(password, 10)

  return {
    passwordHash,
    passwordAlgo: 'bcrypt',
  }
}

export async function verifyPasswordHash(params: {
  password: string
  passwordHash: string
  passwordAlgo: 'argon2id' | 'bcrypt'
}): Promise<boolean> {
  const { password, passwordHash, passwordAlgo } = params

  if (passwordAlgo !== 'bcrypt') {
    throw new Error(`Unsupported password algorithm: ${passwordAlgo}`)
  }

  return bcrypt.compare(password, passwordHash)
}
