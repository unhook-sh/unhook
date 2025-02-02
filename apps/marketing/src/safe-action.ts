import { currentUser } from '@clerk/nextjs/server'
import { createServerActionProcedure } from 'zsa'

import { db } from '@acme/db/client'

export const authenticatedAction = createServerActionProcedure().handler(
  async () => {
    const user = await currentUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    return { db, user }
  },
)

export const unauthenticatedAction = createServerActionProcedure().handler(
  () => {
    return { user: null }
  },
)
