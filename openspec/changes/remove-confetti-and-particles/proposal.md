# Proposal: Eliminar confetti y partículas

## Intent
Eliminar completamente el confetti con `canvas-confetti`, el componente de partículas de fondo, y todos los efectos de partículas CSS para simplificar el código base, reducir dependencias y eliminar animaciones que no son centrales para la experiencia del usuario. Este cambio reduce la complejidad del proyecto y elimina una dependencia externa que no es crítica para la funcionalidad principal.

## Scope
### In Scope
- Remover la librería `canvas-confetti` de dependencies
- Remover `@types/canvas-confetti` de devDependencies
- Eliminar completamente el ConfettiService
- Remover todas las llamadas a confetti en componentes (conservando la lógica principal)
- Eliminar el componente ParticlesBackgroundComponent
- Remover todas las animaciones de partículas CSS en todos los componentes
- Conservar funcionalidad base de los componentes (solo remover efectos visuales)

### Out of Scope
- Reemplazar confetti con efectos alternativos
- Modificar lógica de negocio en componentes (solo quitar llamadas a confetti)
- Cambiar estilos generales de la aplicación
- Actualizar documentación de usuario (esto es refactor técnico)

## Capabilities
### New Capabilities
None - This is a pure removal/refactor with no new behavior

### Modified Capabilities
None - No business requirements change, only visual effects removal

## Approach
1. **Eliminar dependencias**: Modificar package.json para remover canvas-confetti y sus tipos
2. **Eliminar archivos completos**: Desechar service y componente ParticlesBackgroundComponent
3. **Remover imports e inyecciones**: Eliminar todas las importaciones e inyecciones de ConfettiService
4. **Limpiar llamadas**: Quitar todas las llamadas .fire() mientras conservando el código que las rodea
5. **Remover estilos CSS**: Quitar clases .confetti-particle, .confetti y .particles-layer
6. **Probar compilación**: Verificar que `npm run build` funciona sin errores
7. **Probar ejecución**: Confirmar que la aplicación arranca sin errores en consola

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Remove canvas-confetti dependencies |
| `src/app/services/confetti.service.ts` | Deleted | Complete service removal |
| `src/app/features/motions/motions.component.ts` | Modified | Remove ConfettiService injection and 2 fire() calls (602, 609) |
| `src/app/shared/components/bonus-claim/bonus-claim.component.ts` | Modified | Remove ConfettiService injection and 1 fire('win') call (577) |
| `src/app/features/mini-games/ruleta/ruleta.component.ts` | Modified | Remove import confetti and 3 confetti() calls (485, 493, 500) |
| `src/app/features/mini-games/box/box.component.ts` | Modified | Remove JS code creating confetti-particle divs (line ~219) |
| `src/app/features/mini-games/box/box.component.scss` | Modified | Remove .confetti-particle styles (line ~151) |
| `src/app/shared/components/level-up-animation/level-up-animation.component.html` | Modified | Remove confetti div with confetti-piece children |
| `src/app/shared/components/level-up-animation/level-up-animation.component.scss` | Modified | Remove confetti and confetti-piece styles |
| `src/app/shared/components/particles-background/particles-background.component.ts` | Deleted | Complete component removal |
| `src/app/app.ts` | Modified | Remove ParticlesBackgroundComponent import and from imports array |
| `src/app/app.html` | Modified | Remove <app-particles-background /> element |
| `src/app/shared/components/bonus-claim/bonus-claim.component.ts` | Modified | Remove particles-layer div, particles array, and particles CSS styles |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking TypeScript compilation | Low | Remover imports y referencias en orden correcto; TypeScript alertará sobre referencias pendientes |
| Tiempo de carga más lento al cargar dinámicamente confetti | Low | Validar que `ng build` se completa sin errores; Webpack fallará si hay dependencias órfanas |
| Functionalidad de componente se rompa | Low | Todas las llamadas son decorativas (efectos visuales), no afectan lógica de negocio; Cuéntalas para validar |
| Conflicto de merge con otras ramas | Med | Esta es una operación de eliminación limpia; Conflictos probablemente serán straightforward |
| Usuarios pierdan "delighted" moments | Med | Este es el propósito intencional del cambio; No se busca reemplazo |

## Rollback Plan
Si se descubren problemas:
1. Usar git para revertir commits: `git revert HEAD`
2. O hacer rollback manual:
   - Reinstalar dependencies: `bun add canvas-confetti && bun add -d @types/canvas-confetti`
   - Restaurar archivos eliminados desde git: `git checkout HEAD -- src/app/services/confetti.service.ts` etc.
   - Revertir cambios en archivos modificados: `git checkout HEAD -- src/app/features/motions/motions.component.ts` etc.
   - Revertir cambios en package.json: `git checkout HEAD -- package.json`
3. Verificar que build limpio funciona: `bun install && npm run build`

## Dependencies
None - No prior work required, can be executed in isolation

## Success Criteria
- [ ] `package.json` no contiene canvas-confetti o @types/canvas-confetti
- [ ] `src/app/services/confetti.service.ts` está completamente eliminado
- [ ] `src/app/shared/components/particles-background/particles-background.component.ts` está completamente eliminado
- [ ] Todos los imports de ConfettiService y canvas-confetti están removidos
- [ ] Todas las llamadas .fire() y confetti() están removidas
- [ ] Todos los estilos CSS de confetti y particles están removidos
- [ ] `ng build` se completa sin errores
- [ ] La aplicación inicia sin errores en consola
- [ ] Componentes afectados mantienen su funcionalidad principal (sin efectos visuales)
- [ ] Al menos 3 componentes clave (motions, bonus-claim, ruleta) se pueden probar manualmente
