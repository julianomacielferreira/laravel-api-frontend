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
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError, mapTo } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LoginData } from '../models/login-data';
import { AuthResponse } from '../models/auth-response';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private readonly JWT_TOKEN = 'JWT_TOKEN';
  private loggedUser: User;

  constructor(private http: HttpClient) { }

  public authenticate(loginData: LoginData): Observable<boolean> {

    return this.http.post<any>(`${environment.restAPIUrl}/api/login`, loginData).pipe(
      tap(
        (authResponse: AuthResponse) => {
          this.authenticateUser(loginData, authResponse);
        }
      ),
      mapTo(true),
      catchError(error => {

        console.log(error.error);

        return of(false);
      }));
  }

  public logout(): Observable<boolean> {

    return this.http.post<any>(`${environment.restAPIUrl}/api/logout`, {
      'Authorization': `Bearer ${this.getToken()}`
    }).pipe(
      tap(
        () => {
          this.loggedUser = null;
          this.removeTokens();
        }
      ),
      mapTo(true),
      catchError(error => {
        console.log(error.error);
        return of(false);
      }));
  }

  public refreshToken(): Observable<any> {

    return this.http.post<any>(`${environment.restAPIUrl}/api/refresh`, {
      'Authorization': `Bearer ${this.getToken()}`
    }).pipe(
      tap(
        (authResponse: AuthResponse) => {
          this.storeToken(authResponse);
        }
      )
    );
  }

  public isLoggedIn(): boolean {
    return !!this.getToken();
  }

  public getToken(): string {
    return localStorage.getItem(this.JWT_TOKEN);
  }

  public getLoggedUser(): User {
    return this.loggedUser;
  }

  private authenticateUser(loginData: LoginData, authResponse: AuthResponse): void {

    // Store the token
    this.storeToken(authResponse);

    // Make a GET request to /api/profile to ge the full user data
    this.http.get<any>(`${environment.restAPIUrl}/api/profile`).subscribe(
      (user: User) => {
        this.loggedUser = user;
      }
    );
  }

  private storeToken(authResponse: AuthResponse): void {
    localStorage.setItem(this.JWT_TOKEN, authResponse.token);
  }

  private removeTokens(): void {
    localStorage.removeItem(this.JWT_TOKEN);
  }
}
