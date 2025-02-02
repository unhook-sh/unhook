import type { InferSelectModel } from 'drizzle-orm'

import type { OrgMembers, Orgs, ShortUrl, Users } from '../schema'

export interface Tables {
  orgMembers: InferSelectModel<typeof OrgMembers>
  orgs: InferSelectModel<typeof Orgs>
  short_url: InferSelectModel<typeof ShortUrl>
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
