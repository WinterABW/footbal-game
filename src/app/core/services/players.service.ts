import { Injectable, inject, computed } from '@angular/core';
import { LocalApiService } from './local-api.service';
import type { Player } from '../../models/player.model';

export type { Player };


@Injectable({
    providedIn: 'root',
})
export class PlayersService {
    private localApi = inject(LocalApiService);

    // Computed signals desde LocalApiService
    readonly isLoading = computed(() => !this.localApi.isInitialized());
    readonly ownedPlayers = this.localApi.ownedPlayers;
    readonly availablePlayers = this.localApi.availablePlayers;
    readonly vipPlayers = this.localApi.vipPlayers;

    // Alias para compatibilidad
    readonly myPlayers = this.ownedPlayers;
    readonly regularPlayers = this.availablePlayers;

    /**
     * Obtiene jugadores disponibles para comprar (no comprados aún)
     */
    getAvailableForPurchase(): Player[] {
        return this.localApi.getAvailablePlayersForPurchase();
    }

    /**
     * Compra un jugador
     */
    buyPlayer(player: Player): { success: boolean; message: string } {
        return this.localApi.purchasePlayer(player.id);
    }

    /**
     * Obtiene los jugadores comprados
     */
    getMyPlayers(): Player[] {
        return this.ownedPlayers();
    }

    /**
     * Obtiene los jugadores regulares disponibles
     */
    getRegularPlayers(): Player[] {
        return this.availablePlayers();
    }

    /**
     * Obtiene los jugadores VIP
     */
    getVipPlayers(): Player[] {
        return this.vipPlayers();
    }
}
