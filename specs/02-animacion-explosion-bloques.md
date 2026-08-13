# 02 - Animación de explosión de bloques

**Estado:** Done
**Depende de:** SPEC 01
**Fecha:** 2026-08-13

**Objetivo:** Reemplazar la desaparición instantánea de bloques por una animación de explosión de 4 frames usando `EXPLOSION_FRAMES`/`EXPLOSION_DURATION`, manteniendo la colisión y el puntaje inmediatos.

## Alcance

**Incluye:**

- Al golpear un bloque, este deja de colisionar y de dibujarse como bloque sólido de inmediato (igual que hoy), pero en su lugar se reproduce una animación de 4 frames tomada de `EXPLOSION_FRAMES[color]`, con duración total `EXPLOSION_DURATION` (150ms) repartida en partes iguales entre los 4 frames (~37.5ms cada uno).
- Soporte para múltiples explosiones simultáneas e independientes: cada bloque roto genera su propia animación con su propio timestamp de inicio, sin límite de cuántas corren a la vez.
- El puntaje se suma en el momento del impacto (como hoy), no al terminar la animación.
- Uso de `performance.now()` (o el timestamp entregado por el loop vía `requestAnimationFrame`) para calcular qué frame (0-3) corresponde mostrar en cada explosión activa, según el tiempo transcurrido desde su inicio.
- Cuando una explosión completa sus 4 frames, se remueve del estado activo y deja de dibujarse.

**No incluye (queda fuera de este spec):**

- Sonido de rotura de bloque (`break-sound.mp3`) o de rebote (`ball-bounce.mp3`) — se deja para un spec futuro dedicado a audio.
- Resistencia variable de bloques por color / múltiples golpes.
- Cualquier cambio a la física de rebote, colisión pelota-pala o layout de bloques.

## Modelo de datos

Se agrega un nuevo array global en `game.js`, independiente de `blocks`:

- **`explosions`**: array de `{ x, y, width, height, color, startTime }`.
  - `x`, `y`, `width`, `height`: posición y tamaño del bloque que explotó (iguales a los del block original, para dibujar el frame en el mismo lugar).
  - `color`: clave usada para indexar `EXPLOSION_FRAMES[color]`.
  - `startTime`: timestamp (`performance.now()` o el timestamp del loop) en el que empezó la animación.

No se modifica la estructura de `block` (`{ x, y, width, height, color, alive }`); `alive: false` se sigue marcando en el mismo instante del impacto, como hoy.

## Plan de implementación

1. En `checkBlockCollisions()` (game.js:151), en el momento en que se marca `block.alive = false` y se suma el puntaje, hacer `push` a `explosions` con `{ x: block.x, y: block.y, width: block.width, height: block.height, color: block.color, startTime: <timestamp actual> }`. En este punto el bloque desaparece igual que antes (aún sin animación visible), sin errores de consola.
2. Agregar una función `updateExplosions(currentTime)` que recorra `explosions` y elimine las que ya superaron `EXPLOSION_DURATION` desde su `startTime`. Llamarla desde el loop principal junto al resto de updates.
3. Agregar una función `drawExplosions(currentTime)` que, por cada explosión activa, calcule el índice de frame (`Math.min(3, Math.floor((currentTime - startTime) / (EXPLOSION_DURATION / 4)))`) y dibuje `EXPLOSION_FRAMES[color][frameIndex]` con `drawFrame(ctx, frame, x, y, width, height)`. Llamarla en el render, en el mismo lugar donde antes se dibujaban los bloques vivos. En este punto, al romper un bloque se ve la secuencia de 4 frames de explosión en su lugar durante 150ms y luego desaparece.
4. Verificar que romper varios bloques en rápida sucesión anima cada explosión de forma independiente y simultánea, sin que unas corten a otras.

## Criterios de aceptación

- [x] Al golpear un bloque, este deja de colisionar con la pelota inmediatamente (mismo comportamiento que antes de este spec).
- [x] En el lugar del bloque golpeado se reproduce una secuencia de 4 frames de `EXPLOSION_FRAMES[color]` correspondiente al color del bloque, con duración total de 150ms.
- [x] Al terminar la animación, el bloque ya no se dibuja (ni como bloque sólido ni como frame de explosión).
- [x] El puntaje aumenta en el HUD en el momento del impacto, no al terminar la animación.
- [x] Romper dos o más bloques en rápida sucesión anima cada explosión de forma independiente, sin que una corte o reinicie a otra.
- [x] No hay errores en consola durante ninguna secuencia de explosión.
- [x] El resto de comportamiento del juego (física de pelota, pala, vidas, victoria/derrota) no cambia respecto al spec 01.

## Decisiones tomadas y descartadas

- **Colisión termina en el instante del impacto, no al final de la animación**: se descartó mantener el bloque colisionable durante los 150ms de explosión porque generaría rebotes dobles o inconsistentes con la pelota; se prioriza física predecible sobre realismo visual.
- **`EXPLOSION_DURATION` (150ms) se interpreta como duración total de la secuencia de 4 frames** (~37.5ms por frame), no como duración por frame, para mantener las explosiones rápidas y consistentes con el ritmo de juego.
- **Array `explosions` separado del array `blocks`**, en lugar de agregar un campo `explodingSince` a cada block, para mantener el ciclo de vida de la animación desacoplado del estado de colisión/puntaje de los bloques.
- **Timing basado en `performance.now()` / timestamp del loop**, no en conteo de frames renderizados, para que la duración de la animación sea consistente sin importar el framerate real del navegador.
- **Sonido explícitamente fuera de este spec**, aunque `break-sound.mp3` ya existe en el repo, para mantener el spec enfocado solo en la animación visual.
