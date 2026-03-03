import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * OptionalJwtAuthGuard — runs JWT validation but does NOT reject unauthenticated requests.
 * Sets request.user = null when no token is present or the token is invalid.
 * Use this for endpoints that are public but need to know if the caller is authenticated.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // Override handleRequest so missing/invalid tokens are silently ignored.
  handleRequest(_err: any, user: any) {
    return user || null;
  }
}
