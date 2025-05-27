export type Json =
  | string
  | number
  | boolean
  | null
  | {
      [key: string]: Json | undefined;
    }
  | Json[];
export type Database = {
  public: {
    Tables: {
      authCodes: {
        Row: {
          createdAt: string;
          expiresAt: string;
          id: string;
          orgId: string;
          sessionId: string;
          updatedAt: string | null;
          usedAt: string | null;
          userId: string;
        };
        Insert: {
          createdAt?: string;
          expiresAt: string;
          id: string;
          orgId?: string;
          sessionId: string;
          updatedAt?: string | null;
          usedAt?: string | null;
          userId?: string;
        };
        Update: {
          createdAt?: string;
          expiresAt?: string;
          id?: string;
          orgId?: string;
          sessionId?: string;
          updatedAt?: string | null;
          usedAt?: string | null;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'authCodes_orgId_orgs_id_fk';
            columns: ['orgId'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'authCodes_userId_user_id_fk';
            columns: ['userId'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      connections: {
        Row: {
          clientHostname: string | null;
          clientId: string;
          clientOs: string | null;
          clientVersion: string | null;
          connectedAt: string;
          createdAt: string;
          disconnectedAt: string | null;
          id: string;
          ipAddress: string;
          lastPingAt: string;
          orgId: string;
          updatedAt: string | null;
          userId: string;
          webhookId: string;
        };
        Insert: {
          clientHostname?: string | null;
          clientId: string;
          clientOs?: string | null;
          clientVersion?: string | null;
          connectedAt?: string;
          createdAt?: string;
          disconnectedAt?: string | null;
          id: string;
          ipAddress: string;
          lastPingAt?: string;
          orgId?: string;
          updatedAt?: string | null;
          userId?: string;
          webhookId: string;
        };
        Update: {
          clientHostname?: string | null;
          clientId?: string;
          clientOs?: string | null;
          clientVersion?: string | null;
          connectedAt?: string;
          createdAt?: string;
          disconnectedAt?: string | null;
          id?: string;
          ipAddress?: string;
          lastPingAt?: string;
          orgId?: string;
          updatedAt?: string | null;
          userId?: string;
          webhookId?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'connections_orgId_orgs_id_fk';
            columns: ['orgId'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'connections_userId_user_id_fk';
            columns: ['userId'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'connections_webhookId_webhooks_id_fk';
            columns: ['webhookId'];
            isOneToOne: false;
            referencedRelation: 'webhooks';
            referencedColumns: ['id'];
          },
        ];
      };
      events: {
        Row: {
          apiKey: string | null;
          createdAt: string;
          failedReason: string | null;
          id: string;
          maxRetries: number;
          orgId: string;
          originRequest: Json;
          retryCount: number;
          source: string;
          status: Database['public']['Enums']['eventStatus'];
          timestamp: string;
          updatedAt: string | null;
          userId: string;
          webhookId: string;
        };
        Insert: {
          apiKey?: string | null;
          createdAt?: string;
          failedReason?: string | null;
          id: string;
          maxRetries?: number;
          orgId?: string;
          originRequest: Json;
          retryCount?: number;
          source?: string;
          status?: Database['public']['Enums']['eventStatus'];
          timestamp: string;
          updatedAt?: string | null;
          userId?: string;
          webhookId: string;
        };
        Update: {
          apiKey?: string | null;
          createdAt?: string;
          failedReason?: string | null;
          id?: string;
          maxRetries?: number;
          orgId?: string;
          originRequest?: Json;
          retryCount?: number;
          source?: string;
          status?: Database['public']['Enums']['eventStatus'];
          timestamp?: string;
          updatedAt?: string | null;
          userId?: string;
          webhookId?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'events_orgId_orgs_id_fk';
            columns: ['orgId'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'events_userId_user_id_fk';
            columns: ['userId'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'events_webhookId_webhooks_id_fk';
            columns: ['webhookId'];
            isOneToOne: false;
            referencedRelation: 'webhooks';
            referencedColumns: ['id'];
          },
        ];
      };
      orgMembers: {
        Row: {
          createdAt: string | null;
          id: string;
          orgId: string;
          role: Database['public']['Enums']['userRole'];
          updatedAt: string | null;
          userId: string;
        };
        Insert: {
          createdAt?: string | null;
          id: string;
          orgId?: string;
          role?: Database['public']['Enums']['userRole'];
          updatedAt?: string | null;
          userId?: string;
        };
        Update: {
          createdAt?: string | null;
          id?: string;
          orgId?: string;
          role?: Database['public']['Enums']['userRole'];
          updatedAt?: string | null;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orgMembers_orgId_orgs_id_fk';
            columns: ['orgId'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orgMembers_userId_user_id_fk';
            columns: ['userId'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      orgs: {
        Row: {
          clerkOrgId: string;
          createdAt: string | null;
          createdByUserId: string;
          id: string;
          name: string;
          updatedAt: string | null;
        };
        Insert: {
          clerkOrgId: string;
          createdAt?: string | null;
          createdByUserId: string;
          id: string;
          name: string;
          updatedAt?: string | null;
        };
        Update: {
          clerkOrgId?: string;
          createdAt?: string | null;
          createdByUserId?: string;
          id?: string;
          name?: string;
          updatedAt?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orgs_createdByUserId_user_id_fk';
            columns: ['createdByUserId'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      requests: {
        Row: {
          apiKey: string | null;
          completedAt: string | null;
          connectionId: string | null;
          createdAt: string;
          destination: Json;
          eventId: string | null;
          failedReason: string | null;
          id: string;
          orgId: string;
          request: Json;
          response: Json | null;
          responseTimeMs: number;
          source: string;
          status: Database['public']['Enums']['requestStatus'];
          timestamp: string;
          userId: string;
          webhookId: string;
        };
        Insert: {
          apiKey?: string | null;
          completedAt?: string | null;
          connectionId?: string | null;
          createdAt?: string;
          destination: Json;
          eventId?: string | null;
          failedReason?: string | null;
          id: string;
          orgId?: string;
          request: Json;
          response?: Json | null;
          responseTimeMs?: number;
          source?: string;
          status: Database['public']['Enums']['requestStatus'];
          timestamp: string;
          userId?: string;
          webhookId: string;
        };
        Update: {
          apiKey?: string | null;
          completedAt?: string | null;
          connectionId?: string | null;
          createdAt?: string;
          destination?: Json;
          eventId?: string | null;
          failedReason?: string | null;
          id?: string;
          orgId?: string;
          request?: Json;
          response?: Json | null;
          responseTimeMs?: number;
          source?: string;
          status?: Database['public']['Enums']['requestStatus'];
          timestamp?: string;
          userId?: string;
          webhookId?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'requests_connectionId_connections_id_fk';
            columns: ['connectionId'];
            isOneToOne: false;
            referencedRelation: 'connections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'requests_eventId_events_id_fk';
            columns: ['eventId'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'requests_orgId_orgs_id_fk';
            columns: ['orgId'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'requests_userId_user_id_fk';
            columns: ['userId'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'requests_webhookId_webhooks_id_fk';
            columns: ['webhookId'];
            isOneToOne: false;
            referencedRelation: 'webhooks';
            referencedColumns: ['id'];
          },
        ];
      };
      user: {
        Row: {
          avatarUrl: string | null;
          clerkId: string;
          createdAt: string;
          email: string;
          firstName: string | null;
          id: string;
          lastLoggedInAt: string | null;
          lastName: string | null;
          online: boolean;
          updatedAt: string | null;
        };
        Insert: {
          avatarUrl?: string | null;
          clerkId: string;
          createdAt?: string;
          email: string;
          firstName?: string | null;
          id: string;
          lastLoggedInAt?: string | null;
          lastName?: string | null;
          online?: boolean;
          updatedAt?: string | null;
        };
        Update: {
          avatarUrl?: string | null;
          clerkId?: string;
          createdAt?: string;
          email?: string;
          firstName?: string | null;
          id?: string;
          lastLoggedInAt?: string | null;
          lastName?: string | null;
          online?: boolean;
          updatedAt?: string | null;
        };
        Relationships: [];
      };
      webhooks: {
        Row: {
          apiKey: string;
          config: Json;
          createdAt: string | null;
          id: string;
          isPrivate: boolean;
          name: string;
          orgId: string;
          requestCount: number;
          status: Database['public']['Enums']['webhookStatus'];
          updatedAt: string | null;
          userId: string;
        };
        Insert: {
          apiKey: string;
          config?: Json;
          createdAt?: string | null;
          id: string;
          isPrivate?: boolean;
          name: string;
          orgId?: string;
          requestCount?: number;
          status?: Database['public']['Enums']['webhookStatus'];
          updatedAt?: string | null;
          userId?: string;
        };
        Update: {
          apiKey?: string;
          config?: Json;
          createdAt?: string | null;
          id?: string;
          isPrivate?: boolean;
          name?: string;
          orgId?: string;
          requestCount?: number;
          status?: Database['public']['Enums']['webhookStatus'];
          updatedAt?: string | null;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'webhooks_orgId_orgs_id_fk';
            columns: ['orgId'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'webhooks_userId_user_id_fk';
            columns: ['userId'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      eventStatus: 'pending' | 'processing' | 'completed' | 'failed';
      localConnectionStatus: 'connected' | 'disconnected';
      requestStatus: 'pending' | 'completed' | 'failed';
      userRole: 'admin' | 'superAdmin' | 'user';
      webhookStatus: 'active' | 'inactive';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
type DefaultSchema = Database[Extract<keyof Database, 'public'>];
export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | {
        schema: keyof Database;
      },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;
export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | {
        schema: keyof Database;
      },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;
export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | {
        schema: keyof Database;
      },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;
export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | {
        schema: keyof Database;
      },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;
export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | {
        schema: keyof Database;
      },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;
export declare const Constants: {
  readonly public: {
    readonly Enums: {
      readonly eventStatus: readonly [
        'pending',
        'processing',
        'completed',
        'failed',
      ];
      readonly localConnectionStatus: readonly ['connected', 'disconnected'];
      readonly requestStatus: readonly ['pending', 'completed', 'failed'];
      readonly userRole: readonly ['admin', 'superAdmin', 'user'];
      readonly webhookStatus: readonly ['active', 'inactive'];
    };
  };
};
