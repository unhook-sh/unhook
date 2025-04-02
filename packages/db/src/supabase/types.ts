import type { InferSelectModel } from 'drizzle-orm'

import type { OrgMembers, Orgs, Users } from '../schema'

export interface Tables {
  orgMembers: InferSelectModel<typeof OrgMembers>
  orgs: InferSelectModel<typeof Orgs>
  user: InferSelectModel<typeof Users>
}

export type TableName = keyof Tables

export interface Database {
  public: {
    Tables: {
      [K in TableName]: {
        Row: Tables[K]
      }
    }
  }
}
