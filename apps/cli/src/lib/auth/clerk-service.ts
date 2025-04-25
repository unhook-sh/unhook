import { Clerk } from '@clerk/clerk-js/headless';
import { debug } from '@unhook/logger';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { env } from '../../env';
import { capture } from '../posthog';
import {
  ClerkSignInError,
  MissingTokenError,
  MissingUserError,
} from './errors';
import { FileStorage } from './file-storage';
import { SecureStorage } from './secure-storage';

const log = debug('unhook:cli:clerk-service');

// Required for Clerk in Node environment
global.window = global.window || {};

export class ClerkService {
  private static instance: ClerkService | null = null;
  private clerk: Clerk | null = null;
  private fileStorage: FileStorage;
  private secureStorage: SecureStorage;
  private signInTicketCache: string | null = null;
  private constructor() {
    this.secureStorage = new SecureStorage('clerk');
    this.fileStorage = new FileStorage('clerk');
  }

  public static getInstance(): ClerkService {
    if (!ClerkService.instance) {
      ClerkService.instance = new ClerkService();
    }
    return ClerkService.instance;
  }

  private async clearTokenCache(): Promise<void> {
    log('Clearing token cache and secure storage');
    await this.secureStorage.removeItem('token');
    await this.fileStorage.removeItem('sessionId');
    this.secureStorage = new SecureStorage('clerk');
    this.fileStorage = new FileStorage('clerk');
    this.signInTicketCache = null;
  }

  private async setSignInTicket(ticket: string): Promise<void> {
    log('Updating sign in ticket in secure storage and cache');
    await this.secureStorage.setItem('signInTicket', ticket);
    this.signInTicketCache = ticket;
  }

  private async getSignInTicket(): Promise<string | null> {
    if (this.signInTicketCache !== null) {
      log('Using cached sign in ticket');
      return this.signInTicketCache;
    }

    log('Fetching sign in ticket from secure storage');
    const ticket = await this.secureStorage.getItem('signInTicket');
    this.signInTicketCache = ticket;
    return ticket;
  }

  private async initializeClerk(): Promise<Clerk> {
    if (this.clerk) {
      log('Returning existing Clerk instance');
      return this.clerk;
    }

    log('Creating new Clerk instance');
    this.clerk = new Clerk(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

    this.clerk.__unstable__onBeforeRequest(async (requestInit) => {
      log('Preparing Clerk request', requestInit.method, requestInit.path);
      requestInit.credentials = 'omit';
      requestInit.url?.searchParams.append('_is_native', '1');

      const ticket = await this.getSignInTicket();
      if (ticket) {
        log('Adding sign in ticket to request');
        (requestInit.headers as Headers).set('authorization', ticket);
      } else {
        log('No sign in ticket available');
      }
    });

    this.clerk.__unstable__onAfterResponse(async (_, response) => {
      log('Processing Clerk response', response?.status);
      const authHeader = response?.headers.get('authorization');
      if (authHeader) {
        log('Received new sign in ticket');

        const currentTicket = await this.getSignInTicket();
        if (currentTicket !== authHeader) {
          await this.setSignInTicket(authHeader);
        } else {
          log('Ticket unchanged, skipping update');
        }
      } else {
        log('No sign in ticket in response');
      }
    });

    await this.clerk.load({
      standardBrowser: false,
    });

    log('Clerk instance loaded successfully');

    const sessionId = await this.fileStorage.getItem('sessionId');
    if (sessionId) {
      log('Adding sessionId to Clerk', sessionId);
      await this.clerk.setActive({
        session: sessionId,
      });
      const token = await this.clerk.session?.getToken({
        template: 'supabase',
      });
      log('Token', token);
    }
    log('is logged in', this.clerk);

    return this.clerk;
  }

  private async ensureClient(): Promise<Clerk> {
    if (!this.clerk) {
      return this.initializeClerk();
    }
    return this.clerk;
  }

  public async signInWithTicket(ticket: string): Promise<void> {
    const clerk = await this.ensureClient();

    if (!clerk.isSignedIn) {
      log('Signing in with Clerk using ticket');
      capture({
        event: 'auth_clerk_signin_started',
      });

      const signInResponse = await clerk.client?.signIn.create({
        strategy: 'ticket',
        ticket,
      });

      if (signInResponse?.status !== 'complete') {
        throw new ClerkSignInError();
      }

      await clerk.setActive({
        session: signInResponse.createdSessionId,
      });

      if (signInResponse.createdSessionId) {
        this.fileStorage.setItem('sessionId', signInResponse.createdSessionId);
      }

      await this.getSessionData();
      log('Signed in with Clerk using ticket');

      capture({
        event: 'auth_clerk_signin_completed',
      });
    }
  }

  public async getSessionData() {
    const clerk = await this.ensureClient();

    log('Fetching session token');
    const sessionToken = await clerk.session?.getToken({
      template: 'supabase',
    });

    if (!sessionToken) {
      throw new MissingTokenError('clerk');
    }

    const user = clerk.session?.user;

    if (!user) {
      throw new MissingUserError();
    }

    const isValid = await this.validateToken(sessionToken);

    if (!isValid.isValid) {
      throw new TokenExpiredError(
        'Token expired',
        isValid.expiredAt ?? new Date(),
      );
    }

    return {
      sessionToken,
      user,
      orgId: clerk.session?.lastActiveOrganizationId,
    };
  }

  public async isSignedIn(): Promise<boolean> {
    const clerk = await this.ensureClient();
    log('Checking if user is signed in', clerk.isSignedIn);
    return clerk.isSignedIn;
  }

  public async signOut(): Promise<void> {
    log('Signing out from Clerk');
    if (this.clerk?.session) {
      await this.clerk.session.remove();
    }
    await this.clearTokenCache();

    this.clerk = null;
  }

  private async validateToken(
    token: string,
  ): Promise<{ isValid: boolean; expiredAt: Date | null }> {
    log('Validating token with jsonwebtoken');

    try {
      // Decode without verification to check the structure and expiration
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || typeof decoded !== 'object') {
        log('Token could not be decoded');
        return { isValid: false, expiredAt: null };
      }

      // Check token expiration
      const expiryTime = (decoded.payload as jwt.JwtPayload).exp;
      if (!expiryTime || Date.now() >= expiryTime * 1000) {
        log('Token is expired');

        // Track session expiration
        const session = this.clerk?.session;
        capture({
          event: 'session_expired',
          properties: {
            userId: session?.user?.id,
            orgId: session?.lastActiveOrganizationId,
            email: session?.user?.primaryEmailAddress?.emailAddress,
            sessionId: session?.id,
          },
        });

        return {
          isValid: false,
          expiredAt: new Date(expiryTime ? expiryTime * 1000 : Date.now()),
        };
      }

      log('Token has valid structure and is not expired');
      return { isValid: true, expiredAt: null };
    } catch (error) {
      log('Error validating token: %O', error);
      return { isValid: false, expiredAt: null };
    }
  }
}
