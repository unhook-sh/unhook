// !!!GENERATED FILE, DO NOT EDIT!!!
// This file is auto-generated by supabase in scripts/generate-types.ts
// Schema: public
// Generated at: 2025-04-14T19:10:20.976Z

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      connections: {
        Row: {
          clientHostname: string | null;
          clientId: string;
          clientOs: string | null;
          clientVersion: string | null;
          connectedAt: string;
          disconnectedAt: string | null;
          id: string;
          ipAddress: string;
          lastPingAt: string;
          orgId: string;
          tunnelId: string;
          userId: string;
        };
        Insert: {
          clientHostname?: string | null;
          clientId: string;
          clientOs?: string | null;
          clientVersion?: string | null;
          connectedAt?: string;
          disconnectedAt?: string | null;
          id: string;
          ipAddress: string;
          lastPingAt?: string;
          orgId: string;
          tunnelId: string;
          userId: string;
        };
        Update: {
          clientHostname?: string | null;
          clientId?: string;
          clientOs?: string | null;
          clientVersion?: string | null;
          connectedAt?: string;
          disconnectedAt?: string | null;
          id?: string;
          ipAddress?: string;
          lastPingAt?: string;
          orgId?: string;
          tunnelId?: string;
          userId?: string;
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
            foreignKeyName: 'connections_tunnelId_tunnels_id_fk';
            columns: ['tunnelId'];
            isOneToOne: false;
            referencedRelation: 'tunnels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'connections_userId_user_id_fk';
            columns: ['userId'];
            isOneToOne: false;
            referencedRelation: 'user';
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
          originalRequest: Json;
          retryCount: number;
          status: Database['public']['Enums']['eventStatus'];
          timestamp: string;
          tunnelId: string;
          updatedAt: string | null;
          userId: string;
        };
        Insert: {
          apiKey?: string | null;
          createdAt?: string;
          failedReason?: string | null;
          id: string;
          maxRetries?: number;
          orgId: string;
          originalRequest: Json;
          retryCount?: number;
          status?: Database['public']['Enums']['eventStatus'];
          timestamp: string;
          tunnelId: string;
          updatedAt?: string | null;
          userId: string;
        };
        Update: {
          apiKey?: string | null;
          createdAt?: string;
          failedReason?: string | null;
          id?: string;
          maxRetries?: number;
          orgId?: string;
          originalRequest?: Json;
          retryCount?: number;
          status?: Database['public']['Enums']['eventStatus'];
          timestamp?: string;
          tunnelId?: string;
          updatedAt?: string | null;
          userId?: string;
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
            foreignKeyName: 'events_tunnelId_tunnels_id_fk';
            columns: ['tunnelId'];
            isOneToOne: false;
            referencedRelation: 'tunnels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'events_userId_user_id_fk';
            columns: ['userId'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      orgMembers: {
        Row: {
          createdAt: string | null;
          createdByUserId: string;
          id: string;
          orgId: string;
          role: Database['public']['Enums']['userRole'];
          updatedAt: string | null;
        };
        Insert: {
          createdAt?: string | null;
          createdByUserId: string;
          id: string;
          orgId: string;
          role?: Database['public']['Enums']['userRole'];
          updatedAt?: string | null;
        };
        Update: {
          createdAt?: string | null;
          createdByUserId?: string;
          id?: string;
          orgId?: string;
          role?: Database['public']['Enums']['userRole'];
          updatedAt?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orgMembers_createdByUserId_user_id_fk';
            columns: ['createdByUserId'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orgMembers_orgId_orgs_id_fk';
            columns: ['orgId'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
        ];
      };
      orgs: {
        Row: {
          clerkOrgId: string | null;
          createdAt: string | null;
          createdByUserId: string;
          id: string;
          updatedAt: string | null;
        };
        Insert: {
          clerkOrgId?: string | null;
          createdAt?: string | null;
          createdByUserId: string;
          id: string;
          updatedAt?: string | null;
        };
        Update: {
          clerkOrgId?: string | null;
          createdAt?: string | null;
          createdByUserId?: string;
          id?: string;
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
          eventId: string | null;
          failedReason: string | null;
          id: string;
          orgId: string;
          request: Json;
          response: Json | null;
          responseTimeMs: number;
          status: Database['public']['Enums']['requestStatus'];
          timestamp: string;
          tunnelId: string;
          userId: string;
        };
        Insert: {
          apiKey?: string | null;
          completedAt?: string | null;
          connectionId?: string | null;
          createdAt?: string;
          eventId?: string | null;
          failedReason?: string | null;
          id: string;
          orgId: string;
          request: Json;
          response?: Json | null;
          responseTimeMs?: number;
          status: Database['public']['Enums']['requestStatus'];
          timestamp: string;
          tunnelId: string;
          userId: string;
        };
        Update: {
          apiKey?: string | null;
          completedAt?: string | null;
          connectionId?: string | null;
          createdAt?: string;
          eventId?: string | null;
          failedReason?: string | null;
          id?: string;
          orgId?: string;
          request?: Json;
          response?: Json | null;
          responseTimeMs?: number;
          status?: Database['public']['Enums']['requestStatus'];
          timestamp?: string;
          tunnelId?: string;
          userId?: string;
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
            foreignKeyName: 'requests_tunnelId_tunnels_id_fk';
            columns: ['tunnelId'];
            isOneToOne: false;
            referencedRelation: 'tunnels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'requests_userId_user_id_fk';
            columns: ['userId'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      tunnels: {
        Row: {
          clientCount: number;
          clientId: string;
          config: Json;
          createdAt: string | null;
          id: string;
          lastConnectionAt: string | null;
          lastLocalConnectionAt: string | null;
          lastLocalDisconnectionAt: string | null;
          lastRequestAt: string | null;
          localConnectionPid: number | null;
          localConnectionProcessName: string | null;
          localConnectionStatus: Database['public']['Enums']['localConnectionStatus'];
          orgId: string;
          port: number;
          requestCount: number;
          status: Database['public']['Enums']['tunnelStatus'];
          updatedAt: string | null;
          userId: string;
        };
        Insert: {
          clientCount?: number;
          clientId: string;
          config?: Json;
          createdAt?: string | null;
          id: string;
          lastConnectionAt?: string | null;
          lastLocalConnectionAt?: string | null;
          lastLocalDisconnectionAt?: string | null;
          lastRequestAt?: string | null;
          localConnectionPid?: number | null;
          localConnectionProcessName?: string | null;
          localConnectionStatus?: Database['public']['Enums']['localConnectionStatus'];
          orgId: string;
          port: number;
          requestCount?: number;
          status?: Database['public']['Enums']['tunnelStatus'];
          updatedAt?: string | null;
          userId: string;
        };
        Update: {
          clientCount?: number;
          clientId?: string;
          config?: Json;
          createdAt?: string | null;
          id?: string;
          lastConnectionAt?: string | null;
          lastLocalConnectionAt?: string | null;
          lastLocalDisconnectionAt?: string | null;
          lastRequestAt?: string | null;
          localConnectionPid?: number | null;
          localConnectionProcessName?: string | null;
          localConnectionStatus?: Database['public']['Enums']['localConnectionStatus'];
          orgId?: string;
          port?: number;
          requestCount?: number;
          status?: Database['public']['Enums']['tunnelStatus'];
          updatedAt?: string | null;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tunnels_orgId_orgs_id_fk';
            columns: ['orgId'];
            isOneToOne: false;
            referencedRelation: 'orgs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tunnels_userId_user_id_fk';
            columns: ['userId'];
            isOneToOne: false;
            referencedRelation: 'user';
            referencedColumns: ['id'];
          },
        ];
      };
      user: {
        Row: {
          avatarUrl: string | null;
          clerkId: string | null;
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
          clerkId?: string | null;
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
          clerkId?: string | null;
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
      tunnelStatus: 'active' | 'inactive';
      userRole: 'admin' | 'superAdmin' | 'user';
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      eventStatus: ['pending', 'processing', 'completed', 'failed'],
      localConnectionStatus: ['connected', 'disconnected'],
      requestStatus: ['pending', 'completed', 'failed'],
      tunnelStatus: ['active', 'inactive'],
      userRole: ['admin', 'superAdmin', 'user'],
    },
  },
} as const;
