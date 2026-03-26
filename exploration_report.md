# Exploración: Integración de API /Invest/getPlayers en ruta /mining

## Estado Actual

### 1. Ruta `/mining`
- **Ubicación**: `src/app/app.routes.ts` línea 22-24
- **Componente**: `InvestLayoutComponent` (de `src/app/features/invest/invest-layout.component.ts`)
- **Estructura**: Tiene 3 tabs implementadas con `GlassTabBarComponent`:
  - `jugadores` (Mercado) - jugadores regulares disponibles
  - `vip` - jugadores VIP exclusivos
  - `misJugadores` (Equipo) - jugadores comprados por el usuario

### 2. Servicios Relacionados

#### PlayersService (`src/app/core/services/players.service.ts`)
- **Función**: Servicio principal que provee datos al componente
- **Implementación actual**: 
  - Depende de `LocalApiService`
  - Expone señales computadas: `regularPlayers`, `vipPlayers`, `myPlayers`, `isLoading`
  - Métodos: `buyPlayer()`, `getAvailableForPurchase()`, etc.
- **Flujo de datos**: 
  ```
  PlayersService → LocalApiService → localStorage (clave: nequi_players) → señales
  ```

#### LocalApiService (`src/app/core/services/local-api.service.ts`)
- **Función**: Servicio de capa de datos que maneja localStorage
- **Almacenamiento**: 
  - Clave principal: `nequi_players` (STORAGE_KEYS.PLAYERS)
  - Estructura: `PlayersData` con arrays `availablePlayers`, `vipPlayers`, `ownedPlayers`
- **Inicialización**: Carga datos desde localStorage o crea defaults si no existen

#### InvestService (`src/app/core/services/invest.service.ts`)
- **Función**: Servicio existente para llamar a APIs de inversión
- **Método relevante**: `getPlayers()`
  - **Endpoint**: `${environment.apiBaseUrl}Invest/getPlayers`
  - **Respuesta esperada**: Array de objetos con estructura definida en `invest.model.ts`
  - **Implementación**: Usa HttpClient con manejo de errores básico

### 3. Modelos de Datos

#### Modelo Actual (localStorage) - `src/app/models/player.model.ts`
```typescript
export interface Player {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  earning: number;           // Ganancia por hora
  level: number;             // Nivel del jugador
  exclusive?: boolean;       // Si es VIP
  boughtAt?: string;         // Fecha de compra
  contract_days: number;
  age?: number;
  injuries?: number;
  height?: number;
}
```

#### Modelo API - `src/app/models/invest.model.ts`
```typescript
export interface Player {
  days: number;
  description: string;
  id: number;
  imageUrl: string;
  interest: number;          // Equivalente a earning/ganancia por hora
  isVIP: boolean;            // Equivalente a exclusive
  name: string;
  price: number;
}
```

### 4. Flujo de Datos Actual

```
[Componente InvestLayout]
        ↓ (usa señales)
[PlayersService]
        ↓ (inyecta)
[LocalApiService]
        ↓ (lee/escribe)
[localStorage] ←→ [nequi_players clave]
```

### 5. Cambios Necesarios

#### Archivos que requieren modificación:
1. **`src/app/core/services/players.service.ts`** 
   - Reemplazar dependencia de `LocalApiService` con `InvestService`
   - Adaptar señales para trabajar con datos asíncronos de API
   - Implementar transformación de datos de API al formato esperado

2. **Posiblemente crear nuevo servicio** 
   - `ApiPlayersService` que maneje la lógica específica de API
   - Mantener `PlayersService` como interfaz compatible

3. **Actualizar mapeo de datos**
   - Convertir respuesta API (`interest`, `isVIP`, `days`) al formato local (`earning`, `exclusive`, `contract_days`)
   - Añadir campos faltantes que el componente espera (`level`, `imageUrl`, `description` ya existen en ambos)

### 6. Riesgos y Consideraciones

#### Riesgos identificados:
1. **Incompatibilidad de modelos**: El modelo API falta algunos campos que el componente espera directamente (`level`, `age`, `injuries`, `height`)
2. **Estado de carga**: Necesario implementar proper loading states ya que las llamadas API son asíncronas
3. **Manejo de errores**: El servicio actual de PlayersService no maneja errores de red
4. **Consistencia de datos**: Necesario decidir si mantener caché local o depender exclusivamente de API
5. **Autenticación**: Verificar que el interceptor de tokens ya configurado funcione con las nuevas llamadas

#### Consideraciones técnicas:
- El componente actualmente usa señales síncronas; necesitaremos adaptar para datos asíncronos
- Podría ser necesario crear adaptadores de datos entre formato API y formato local
- Debemos mantener compatibilidad hacia atrás si otros servicios dependen de PlayersService actual
- Considerar implementar reintentos y manejo de timeouts para llamadas API

### 7. Próximos pasos recomendados

1. **Crear prototipo de servicio API** que llame a `InvestService.getPlayers()` y transforme los datos
2. **Actualizar PlayersService** para usar el nuevo servicio API en lugar de LocalApiService
3. **Implementar manejo de estados de carga y errores** apropiados
4. **Crear mapeador de datos** que convierta entre formato API y formato esperado por componente
5. **Actualizar componente** si es necesario para manejar nuevos estados o estructuras de datos
6. **Actualizar pruebas** para reflejar los cambios en el flujo de datos