import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
    id: number;
    username: string;
    email: string;
    avatar?: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private userSignal = signal<User | null>(null);

    user = this.userSignal.asReadonly();
    isAuthenticated = computed(() => this.userSignal() !== null);

    constructor(private router: Router) {
        // Cargar usuario del localStorage si existe
        this.loadUserFromStorage();
    }

    private loadUserFromStorage() {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                this.userSignal.set(JSON.parse(storedUser));
            } catch (error) {
                console.error('Error loading user from storage:', error);
                localStorage.removeItem('user');
            }
        }
    }

    login(email: string, password: string): Promise<boolean> {
        return new Promise((resolve) => {
            // Simulación de login - En producción, hacer llamada HTTP real
            setTimeout(() => {
                const user: User = {
                    id: 1,
                    username: 'User0001',
                    email: email,
                    avatar: 'game/header/user.png',
                };

                this.userSignal.set(user);
                localStorage.setItem('user', JSON.stringify(user));
                resolve(true);
            }, 1000);
        });
    }

    register(email: string, password: string, referralCode?: string): Promise<boolean> {
        return new Promise((resolve) => {
            // Simulación de registro - En producción, hacer llamada HTTP real
            setTimeout(() => {
                const user: User = {
                    id: Date.now(),
                    username: `User${Math.floor(Math.random() * 10000)}`,
                    email: email,
                    avatar: 'game/header/user.png',
                };

                this.userSignal.set(user);
                localStorage.setItem('user', JSON.stringify(user));
                resolve(true);
            }, 1000);
        });
    }

    logout() {
        this.userSignal.set(null);
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
    }

    getUsername(): string {
        return this.userSignal()?.username || 'Usuario';
    }
}
