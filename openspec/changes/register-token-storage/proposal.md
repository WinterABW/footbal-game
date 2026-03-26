# Proposal: Formalizar almacenamiento de token post-registro

## Intent

Documentar y formalizar el proceso de almacenamiento del token de autenticación después de un registro exitoso. El método `register()` en `AuthService` ya implementa la persistencia del token tanto en la señal `authToken` como en `localStorage`. Esta propuesta busca confirmar y documentar ese comportamiento establecido, asegurando consistencia con los métodos `login()` y `guest()`.

## Scope

### In Scope
- Documentación formal del uso del método `saveAuthStorage()` en `AuthService.register()`
- Confirmación de que el token se guarda en `localStorage` con clave `'auth_token'`
- Confirmación de que la señal `authToken` se actualiza con el token
- Alineación con el patrón existente en `login()` y `guest()`

### Out of Scope
- Cambios en la interfaz de usuario o flujos de navegación
- Modificación del contrato de la API (`/Auth/register`)
- Almacenamiento alternativo (sessionStorage, IndexedDB, cookies)
- Implementación de refresh tokens o expiración de tokens

## Approach

Reutilizar el método `saveAuthStorage()` ya existente en `AuthService`. Este método centraliza la lógica de persistencia:

1. Almacena el objeto usuario serializado en `localStorage` bajo la clave `'user'`
2. Almacena el token en `localStorage` bajo la clave `'auth_token'`
3. Actualiza la señal `userSignal` con los datos del usuario
4. Actualiza la señal `authToken` con el token

El método `register()` ya llama a `saveAuthStorage()` (línea 138) después de recibir la respuesta exitosa del servidor. Esta approach garantiza consistencia en todos los flujos de autenticación (login, registro, guest).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/core/services/auth.service.ts` | Modified (already) | El método `register()` en línea 138 ejecuta `this.saveAuthStorage(user, response.token)` para persistir el token. El método `saveAuthStorage()` (líneas 42-51) contiene la implementación. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Race conditions si múltiples llamadas a autenticación concurrentes | Low | El uso de señales de Angular garantiza actualización atómica. `localStorage` es síncrono y rápido, por lo que la ventana de conflicto es mínima. |
| Token no se guarda si `saveAuthStorage` falla | Low | `saveAuthStorage` no incluye try-catch, pero `localStorage.setItem()` es síncrono y rara vez falla en navegadores modernos. El método ya se usa en `login()` y `guest()` sin issues reportados. |
| Inconsistencia entre señal y localStorage si hay errores | Low | `saveAuthStorage` actualiza ambos en el mismo método, evitando disparidad. No hay riesgo de que falle a mitad del proceso. |

## Rollback Plan

En caso de ser necesario revertir esta formalización:

1. Revertir el contenido de `proposal.md` a una versión anterior (si aplica)
2. Como la implementación ya existe, el rollback real sería eliminar la llamada a `saveAuthStorage()` en `register()` (línea 138), restaurando la lógica anterior que NO persistía el token
3. No se requieren cambios en la base de datos ni migraciones de datos
4. El usuario deberá volver a iniciar sesión (login o guest) después del rollback, ya que el registro ya no guardaría el token

## Dependencies

- Angular v21+ con soporte para signals (`signal()`, `computed()`)
- Navegador con `localStorage` disponible (estándar en todos los navegadores modernos)
- Backend que retorne `{ username, token, isGuest }` en el endpoint `/Auth/register`

## Success Criteria

- [ ] El registro exitoso guarda el token en `localStorage` con clave `'auth_token'`
- [ ] La señal `authToken` refleja el valor del token inmediatamente después del registro
- [ ] El usuario permanece autenticado después de recargar la página (por el `loadAuthFromStorage()` en el constructor)
- [ ] Los métodos `getToken()` y `isLoggedIn()` funcionan correctamente tras registro
- [ ] El patrón es idéntico al utilizado en `login()` y `guest()` (consistencia)
