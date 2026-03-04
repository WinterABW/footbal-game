# Proposal: Rediseño de /mining para unificar estilo glassmorphism

## Intent

Las tarjetas de jugadores en la ruta /mining no coinciden con el estilo glassmorphism usado en otras rutas del proyecto (wallet, social, etc.). Esto genera inconsistencia visual y una experiencia de usuario fragmentada. El objetivo es aplicar el sistema de diseño liquid-glass existente para unificar la interfaz.

## Scope

### In Scope
- ProductCardComponent (tarjetas de jugadores en tab Mercado)
- ProductCardVerticalComponent (tarjetas VIP en tab VIP)
- Mantener la estructura de 3 tabs existente (Mercado / VIP / Equipo)
- Aplicar estilos de hover con borders como en wallet
- Unificar spacing y layout con el sistema liquid-glass

### Out of Scope
- Cambios en la lógica de negocio de /mining
- Modificación de la navegación o estructura de tabs
- Actualización de otros componentes no relacionados

## Approach

1. Analizar los estilos actuales de ProductCardComponent y ProductCardVerticalComponent
2. Revisar el sistema liquid-glass usado en wallet y social
3. Aplicar los estilos de glassmorphism a los componentes de /mining
4. Verificar que el diseño sea consistente con el resto de la aplicación

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/views/invest/invest-layout.component.ts` | Modified | Layout container que envuelve los tabs |
| `src/app/views/invest/components/product/product-card.component.ts` | Modified | Tarjetas de jugadores - aplicar estilos glassmorphism |
| `src/app/views/invest/components/product-vertical/product-card-vertical.component.ts` | Modified | Tarjetas VIP - aplicar estilos glassmorphism |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Break de funcionalidad existente en las tarjetas | Low | Verificar que las cards mantengan su comportamiento después del styled |
| Incompatibilidad con responsive | Low | Probar en múltiples breakpoints |

## Rollback Plan

Revertir los cambios en los tres archivos afectados usando git:
```bash
git checkout HEAD -- src/app/views/invest/
```

## Dependencies

- Sistema liquid-glass existente en otros componentes del proyecto
- No hay dependencias externas nuevas

## Success Criteria

- [ ] Las tarjetas de /mining tienen estilo glassmorphism consistente con wallet y social
- [ ] Los efectos hover con borders funcionan correctamente
- [ ] El layout se mantiene responsive en mobile y desktop
- [ ] No hay errores en consola ni warnings de lint
