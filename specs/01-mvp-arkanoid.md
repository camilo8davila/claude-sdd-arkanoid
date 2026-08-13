# 01 - MVP Arkanoid jugable

**Estado:** Implemented
**Depende de:** ninguno
**Fecha:** 2026-08-11

**Objetivo:** Construir un MVP jugable de Arkanoid en HTML/JS plano (sin build tooling) con un único layout de bloques fijo, pala controlada por teclado y mouse, 3 vidas, puntaje en pantalla, y pantallas de inicio/victoria/derrota.

## Alcance

**Incluye:**

- `index.html` con un `<canvas>` de 800x600 px, cargando `assets/spritesheet.js` y un nuevo `game.js` vía `<script>` tags.
- Pala controlada por teclado (flechas izquierda/derecha o A/D) y por mouse (sigue la posición horizontal del cursor sobre el canvas).
- Una pelota con física de rebote: reflexión simple contra paredes y bloques, y ángulo variable según el punto de impacto contra la pala (golpear cerca del borde de la pala produce un rebote más lateral; cerca del centro, más vertical).
- Un único layout de bloques fijo, hardcodeado en `game.js`, usando los colores definidos en `SPRITES.blocks` (gray, red, yellow, cyan, magenta, hotpink, green).
- Todos los bloques se rompen en un solo golpe (sin resistencia variable), y desaparecen inmediatamente al ser golpeados (sin animación de explosión).
- Sistema de puntaje simple: cada bloque roto suma puntos, mostrado en un HUD durante la partida. No persiste entre sesiones.
- Sistema de vidas: 3 vidas. Al caer la pelota por debajo de la pala se resta una vida y se reposicionan pelota y pala en su posición inicial (el layout de bloques restante no se reinicia).
- Pantalla de inicio: mensaje/botón "Jugar"; la pelota no se mueve hasta que el jugador confirma el inicio.
- Pantalla de derrota (game over) al llegar a 0 vidas, con opción de reiniciar la partida completa (vidas, puntaje y layout de bloques vuelven al estado inicial).
- Pantalla de victoria al romper todos los bloques, con opción de reiniciar la partida completa.

**No incluye (queda fuera de este spec):**

- Sonido (`ball-bounce.mp3`, `break-sound.mp3`) — se deja para un spec futuro.
- Animación de explosión de bloques (`EXPLOSION_FRAMES`/`EXPLOSION_DURATION`) — se deja para un spec futuro.
- Múltiples niveles o progresión — se deja para un spec futuro.
- Persistencia de puntaje / high scores — se deja para un spec futuro.
- Resistencia variable de bloques por color (bloques que requieren más de un golpe).
- Power-ups.
- Responsive / distintos tamaños de canvas — el canvas es fijo en 800x600.

## Modelo de datos

No se introduce persistencia. El estado vive en memoria mientras dura la sesión del navegador, en variables/objetos de `game.js`:

- **`paddle`**: `{ x, y, width, height, speed }`. `width`/`height` provienen de `SPRITES.paddle` (162x14). `x` se actualiza por teclado (velocidad fija) o por posición del mouse (clamp para no salir del canvas).
- **`ball`**: `{ x, y, dx, dy, radius }`. `radius` derivado de `SPRITES.ball` (16x16). Antes de lanzar, `ball` sigue la posición de la pala.
- **`blocks`**: array de `{ x, y, width, height, color, alive }`, generado una vez a partir de un layout fijo (filas x columnas, con color por fila o patrón definido en código). `width`/`height` = 32x16 (según `SPRITES.blocks`). Un bloque con `alive: false` no se dibuja ni colisiona.
- **`gameState`**: string con uno de los valores `'start' | 'playing' | 'gameover' | 'win'`, controla qué se dibuja y qué inputs se aceptan.
- **`lives`**: number, inicia en 3.
- **`score`**: number, inicia en 0, suma un valor fijo por bloque roto.

## Plan de implementación

1. Crear `index.html` en la raíz: canvas de 800x600, carga `assets/spritesheet.js` y `game.js` con `<script>` tags, llama a `loadSpritesheet` y arranca el loop una vez cargado. En este punto el canvas se ve en blanco/negro sin errores de consola.
2. En `game.js`, dibujar la pala y la pelota estáticas en su posición inicial usando `drawSprite`, y el HUD de vidas/puntaje. Sistema jugable visualmente pero sin movimiento.
3. Implementar el layout fijo de bloques y su dibujado con `drawSprite('block_<color>', ...)`. Los bloques se ven completos en pantalla.
4. Implementar movimiento de pala por teclado y por mouse, con clamp a los límites del canvas.
5. Implementar movimiento y rebote de la pelota contra paredes (izquierda, derecha, arriba) con reflexión simple.
6. Implementar colisión pelota-pala con ángulo variable según punto de impacto.
7. Implementar colisión pelota-bloque: al impactar, el bloque se marca `alive: false`, deja de dibujarse y de colisionar, y se suma el puntaje.
8. Implementar pérdida de vida: cuando la pelota cruza el borde inferior del canvas, restar una vida y reposicionar pelota/pala; si `lives` llega a 0, pasar a `gameState = 'gameover'`.
9. Implementar condición de victoria: cuando todos los bloques tienen `alive: false`, pasar a `gameState = 'win'`.
10. Implementar pantalla de inicio (`gameState = 'start'`): mensaje/botón "Jugar", la pelota no se mueve hasta confirmar; al confirmar pasa a `gameState = 'playing'`.
11. Implementar pantallas de derrota y victoria con opción de reiniciar toda la partida (vidas, puntaje, layout de bloques y `gameState` vuelven al estado inicial).

## Criterios de aceptación

- [x] Al abrir `index.html` en un navegador, se ve la pantalla de inicio con mensaje/botón "Jugar", sin errores en consola.
- [x] Al confirmar el inicio, la pelota comienza a moverse desde la pala.
- [x] La pala se mueve con flechas izquierda/derecha (o A/D) y también siguiendo el mouse sobre el canvas, sin salir de los límites del canvas.
- [x] La pelota rebota correctamente contra las paredes izquierda, derecha y superior.
- [x] La pelota rebota contra la pala con ángulo variable: golpear cerca del borde produce un rebote más lateral que golpear cerca del centro.
- [x] Al golpear un bloque, este desaparece inmediatamente y el puntaje mostrado en el HUD aumenta.
- [x] Cuando la pelota cae por debajo de la pala, se resta una vida (visible en el HUD) y pelota/pala vuelven a su posición inicial; los bloques ya rotos siguen rotos.
- [x] Al llegar a 0 vidas se muestra la pantalla de derrota con opción de reiniciar; al reiniciar, vidas, puntaje y bloques vuelven al estado inicial y el juego regresa a la pantalla de inicio o de juego según lo implementado.
- [x] Al romper todos los bloques se muestra la pantalla de victoria con opción de reiniciar, con el mismo comportamiento de reinicio.
- [x] El juego corre a 800x600 px sin necesidad de ningún paso de build (abrir `index.html` directamente o servirlo como archivos estáticos es suficiente).

## Decisiones tomadas y descartadas

- **Estructura de archivos plana (`index.html` + `game.js` en la raíz)** en lugar de una carpeta `src/` con módulos, para mantener consistencia con `assets/spritesheet.js` y con la indicación de CLAUDE.md de que este proyecto no usa bundler.
- **Rebote con ángulo variable en la pala** en lugar de reflexión simple, porque es el comportamiento esperado del género Arkanoid/Breakout y da control real al jugador.
- **Todos los bloques se rompen en un golpe** (sin resistencia por color) para mantener el MVP simple; resistencia variable queda para un spec futuro si se decide iterar.
- **Sin sonido ni animación de explosión en el MVP**, aunque los assets (`ball-bounce.mp3`, `break-sound.mp3`, `EXPLOSION_FRAMES`) ya existen en el repo — se deja explícitamente fuera para no ampliar el alcance del primer MVP jugable.
- **Un único layout fijo hardcodeado**, sin sistema de niveles ni generación procedural, ya que niveles y progresión se consideran una feature separada.
- **Puntaje visible pero no persistente**: se muestra en el HUD pero no se guarda entre sesiones; persistencia de high scores queda para otro spec.
- **Canvas fijo de 800x600 sin diseño responsive**, para simplificar el cálculo de colisiones y posiciones en el MVP.
