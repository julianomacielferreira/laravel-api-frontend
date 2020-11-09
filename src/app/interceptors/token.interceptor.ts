/*
 * The MIT License
 *
 * Copyright 2020 Juliano Maciel Ferreira.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthResponse } from '../models/auth-response';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  private isRefreshingToken = false;
  private refreshingTokenSubject = new BehaviorSubject<any>(null);

  constructor(private authenticationService: AuthenticationService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const token = this.authenticationService.getToken();

    if (token) {
      request = this.addTokenToRequest(request, token);
    }

    return next.handle(request).pipe(
      catchError(
        (error: any) => {

          if (error instanceof HttpErrorResponse && error.status === 401) {

            this.handle401Error(request, next);

          } else {

            return throwError(error);
          }
        }
      )
    );
  }

  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {

    return request.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {

    if (!this.isRefreshingToken) {

      this.isRefreshingToken = true;
      this.refreshingTokenSubject.next(null);

      this.authenticationService.refreshToken().pipe(
        switchMap(
          (authResponse: AuthResponse) => {

            this.isRefreshingToken = false;
            this.refreshingTokenSubject.next(authResponse.token);

            return next.handle(this.addTokenToRequest(request, authResponse.token));
          }
        )
      );

    } else {

      return this.authenticationService.refreshToken().pipe(
        filter(
          (authResponse: any) => authResponse.token != null
        ),
        take(1),
        switchMap(
          (authResponse: AuthResponse) => {
            return next.handle(this.addTokenToRequest(request, authResponse.token));
          }
        )
      );
    }
  }
}
