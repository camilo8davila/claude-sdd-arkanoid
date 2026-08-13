# 03 - Niveles y sonidos

**Estado:** Approved
**Depende de:** SPEC 01, SPEC 02
**Fecha:** 2026-08-13

**Objetivo:** Agregar 3 niveles con layouts de bloques distintos y velocidad de pelota creciente, efectos de sonido de rebote y rotura de bloque, y un menú de pausa con selector de nivel para testing.

## Alcance

**Incluye:**

- 3 niveles fijos, cada uno con un layout de bloques distinto sobre el mismo grid base (15 columnas x 7 filas de colores, mismas dimensiones/offsets que hoy): nivel 1 completo (igual al layout actual), nivel 2 y nivel 3 con patrones de huecos distintos definidos en código (ej. huecos en el centro, huecos en forma de diamante).
- Al romper todos los bloques de un nivel que no es el último, se avanza automáticamente al siguiente nivel: se genera el nuevo layout, se reposicionan pelota y pala en su posición inicial, y se muestra una pantalla breve tipo "Nivel 2" (mismo estilo que las pantallas de inicio/derrota/victoria existentes) hasta que el jugador hace clic para continuar; la pelota no se mueve hasta ese clic.
- Al romper todos los bloques del nivel 3 (último), se muestra la pantalla de victoria final existente (`gameState = 'win'`), igual que hoy.
- Vidas y puntaje se mantienen al pasar de nivel (no se reinician); solo se reinician al llegar a 0 vidas (game over) o al reiniciar la partida completa desde game over/victoria.
- La velocidad base de la pelota aumenta un 15% por nivel respecto al nivel anterior (nivel 1: velocidad base actual, nivel 2: x1.15, nivel 3: x1.3225 acumulado), aplicada al lanzar la pelota al inicio de cada nivel.
- Al reiniciar la partida completa (desde game over o victoria final), el juego vuelve al nivel 1, con vidas y puntaje en su estado inicial, igual que hoy hace `restartGame()`.
- Sonido de rebote (`assets/sounds/ball-bounce.mp3`): se reproduce cada vez que la pelota rebota contra una pared (izquierda, derecha, arriba) o contra la pala.
- Sonido de rotura de bloque (`assets/sounds/break-sound.mp3`): se reproduce en el mismo instante en que un bloque es golpeado y marcado `alive: false` (junto con la explosión visual del spec 02).
- Los sonidos se reproducen siempre, sin control de volumen ni botón de mute en la UI.
- Instancias de sonido superpuestas están permitidas: si dos eventos de sonido ocurren casi al mismo tiempo (ej. rebote de pared y rotura de bloque en el mismo frame), ambos sonidos se reproducen de forma independiente sin cancelarse ni esperarse entre sí.
- Menú de pausa: durante `gameState === 'playing'`, presionar `P` o `Escape` pausa el juego (pelota y pala congeladas, loop de física detenido) y muestra un overlay con un `<select>` HTML superpuesto al canvas con las opciones "Nivel 1" / "Nivel 2" / "Nivel 3", más un mensaje indicando que `P`/`Escape` reanuda.
- El `<select>` de pausa es una herramienta de debug/testing (no una feature pulida para el jugador final): permite saltar directo a cualquier nivel para probarlo, sin cuidar transiciones ni mensajes especiales de UX.
- Al elegir un nivel distinto en el `<select>` durante la pausa, se regenera el layout de ese nivel (`levelIndex` pasa a ese valor), se reposicionan pelota y pala a su posición inicial y se limpian las explosiones activas; vidas y puntaje no se tocan.
- Al reanudar la pausa (`P`/`Escape`) sin haber tocado el `<select>`, el juego continúa exactamente desde donde quedó: pelota, pala, vidas, puntaje y bloques rotos permanecen sin cambios.
- El `<select>` de pausa solo es interactuable mientras `gameState === 'paused'`; permanece oculto (`display: none` o equivalente) en cualquier otro estado.

**No incluye (queda fuera de este spec):**

- Control de volumen, mute, o cualquier UI de configuración de audio.
- Persistencia de preferencias de audio entre sesiones (no aplica, no hay control de mute).
- Más de 3 niveles, generación procedural de niveles, o selección de nivel por el jugador final fuera del menú de pausa de debug.
- Persistencia de progreso de nivel o puntaje entre sesiones (recarga de página siempre vuelve a nivel 1).
- Resistencia variable de bloques por color / múltiples golpes.
- Cambios a la física de colisión pelota-pala más allá del multiplicador de velocidad por nivel.
- Diseño visual pulido del menú de pausa (estilos mínimos, es herramienta de debug).
- Pausa disponible en estados distintos a `'playing'` (no aplica en `'start'`, `'gameover'`, `'win'`).

## Modelo de datos

Se agrega un nuevo archivo `levels.js` (cargado vía `<script>` en `index.html` antes de `game.js`, igual que `assets/spritesheet.js`), y se agregan las siguientes variables/estructuras:

- **`LEVELS`** (definido en `levels.js`): array de 3 definiciones de layout, una por nivel. Cada definición describe qué celdas `(row, col)` del grid base (`BLOCK_ROWS` x `BLOCK_COLS`) quedan excluidas (sin bloque) para ese nivel, vía una función `isExcluded(row, col)`. Nivel 1 no excluye ninguna celda (layout actual).
- **`levelIndex`**: number, 0-based, inicia en 0. El nivel mostrado al jugador es `levelIndex + 1`.
- **`LEVEL_SPEED_MULTIPLIER`**: constante, `1.15`. La velocidad base de lanzamiento en `launchBall()` se multiplica por `LEVEL_SPEED_MULTIPLIER ** levelIndex`.
- **`createBlocks(levelIndex)`**: se modifica la función existente para recibir `levelIndex` y omitir del array resultante las celdas excluidas por `LEVELS[levelIndex]`.
- **`SOUND_BOUNCE`** / **`SOUND_BREAK`**: constantes con las rutas `'assets/sounds/ball-bounce.mp3'` y `'assets/sounds/break-sound.mp3'`.
- **`playSound(src)`**: función que crea una nueva instancia `new Audio(src)` y llama a `.play()` en cada invocación (sin reusar ni trackear instancias previas), permitiendo solapamiento.
- **`previousGameState`**: variable que guarda el valor de `gameState` justo antes de pausar (siempre `'playing'` dado el alcance de este spec), usada para restaurar al reanudar.

La pantalla de transición de nivel reutiliza el estado `'start'` existente (mismo mecanismo de "pelota no se mueve hasta el clic"), con mensaje dependiente de `levelIndex` (ver plan de implementación). Se agrega un único valor nuevo a `gameState`: `'paused'`, usado exclusivamente por el menú de pausa/debug.

## Plan de implementación

1. Definir `LEVELS` (3 patrones de huecos, vía `isExcluded(row, col)`) en un archivo nuevo `levels.js`, cargado en `index.html` antes de `game.js`. Definir `levelIndex = 0` en `game.js`. Modificar `createBlocks()` para aceptar `levelIndex` y excluir las celdas indicadas por `LEVELS[levelIndex]`. Llamar `createBlocks(levelIndex)` donde hoy se llama `createBlocks()`. En este punto el juego sigue funcionando igual que antes, solo con el nivel 1 (sin cambios visibles).
2. Aplicar `LEVEL_SPEED_MULTIPLIER ** levelIndex` a la velocidad base en `launchBall()`. En este punto el multiplicador existe pero no cambia nada visible porque `levelIndex` sigue en 0.
3. En `checkBlockCollisions()`, donde hoy se hace `gameState = 'win'` al vaciar todos los bloques, distinguir: si `levelIndex < LEVELS.length - 1`, incrementar `levelIndex`, regenerar `blocks = createBlocks(levelIndex)`, reposicionar pelota/pala (`resetPaddleAndBall()`), limpiar `explosions`, y volver a `gameState = 'start'`; si es el último nivel, mantener el comportamiento actual (`gameState = 'win'`). En este punto, al vaciar el nivel 1 se ve el layout del nivel 2 y la pelota vuelve a la posición inicial, sin pantalla de transición todavía (usa el mensaje genérico de start).
4. Modificar `drawStartScreen()` para mostrar mensaje dependiente de `levelIndex`: si `levelIndex === 0`, mantener "Arkanoid" / "Haz clic para jugar"; si `levelIndex > 0`, mostrar `Nivel ${levelIndex + 1}` / "Haz clic para continuar". En este punto, al pasar de nivel se ve la pantalla "Nivel 2" y la pelota no se mueve hasta hacer clic; al hacer clic se lanza con la velocidad multiplicada del nuevo nivel.
5. Modificar `restartGame()` para resetear `levelIndex = 0` además de lo que ya reinicia. En este punto, tras ganar el nivel 3 y reiniciar, el juego vuelve al nivel 1 con vidas/puntaje en su estado inicial.
6. Agregar `playSound(src)` y las constantes `SOUND_BOUNCE`/`SOUND_BREAK`. Llamar `playSound(SOUND_BOUNCE)` en cada rebote contra pared (izquierda, derecha, arriba) dentro de `updateBall()`, y dentro de `checkPaddleCollision()` cuando `hitPaddle` es verdadero. En este punto se escucha el sonido de rebote en paredes y pala, sin errores de consola.
7. Llamar `playSound(SOUND_BREAK)` en `checkBlockCollisions()` en el mismo punto donde se marca `block.alive = false` y se suma el puntaje. En este punto se escucha el sonido de rotura junto con la animación de explosión del bloque.
8. Verificar que romper varios bloques o rebotar en rápida sucesión reproduce los sonidos superpuestos sin cortarse entre sí, y que avanzar por los 3 niveles hasta la victoria final, más el reinicio completo, funciona de punta a punta sin errores de consola.
9. En `index.html`, agregar un `<select>` con opciones "Nivel 1"/"Nivel 2"/"Nivel 3" posicionado sobre el canvas (`position: absolute`, mismo contenedor), oculto por defecto (`display: none`). En este punto el elemento existe en el DOM pero no es visible ni afecta el juego.
10. En `game.js`, escuchar `keydown` para `P`/`Escape`: si `gameState === 'playing'`, guardar `previousGameState = gameState`, poner `gameState = 'paused'` y mostrar el `<select>` (sincronizado con `levelIndex` actual); si `gameState === 'paused'`, restaurar `gameState = previousGameState` y ocultar el `<select>`. En este punto se puede pausar y reanudar sin cambiar de nivel, y la pelota/pala quedan congeladas mientras `gameState === 'paused'` (agregar el chequeo correspondiente en `update()` para no mover pelota/pala en ese estado).
11. Escuchar el evento `change` del `<select>`: al elegir un nivel distinto, actualizar `levelIndex`, regenerar `blocks = createBlocks(levelIndex)`, reposicionar pelota/pala con `resetPaddleAndBall()`, limpiar `explosions`, ocultar el `<select>` y poner `gameState = 'start'` directamente (sin pasar por `previousGameState`), reutilizando el flujo existente de "pelota no se mueve hasta el clic" con el mensaje `Nivel ${levelIndex + 1}`. En este punto, elegir un nivel en pausa salta directo a ese nivel (pantalla "Nivel N", clic para lanzar) con vidas/puntaje intactos.
12. Verificar el flujo completo: pausar en cualquier nivel con `P`/`Escape`, reanudar sin tocar el select (continúa igual), pausar de nuevo y saltar de nivel con el select (layout y velocidad cambian, vidas/puntaje se mantienen), sin errores de consola.

## Criterios de aceptación

- [ ] El nivel 1 tiene el mismo layout de bloques que existía antes de este spec.
- [ ] Al romper todos los bloques del nivel 1, se muestra una pantalla "Nivel 2" con "Haz clic para continuar"; la pelota no se mueve hasta hacer clic.
- [ ] Tras hacer clic en la pantalla "Nivel 2", aparece el layout distinto del nivel 2 y la pelota se lanza a mayor velocidad que en el nivel 1.
- [ ] Al romper todos los bloques del nivel 2, se repite el mismo flujo con "Nivel 3" y un layout distinto, con velocidad aún mayor.
- [ ] Al romper todos los bloques del nivel 3, se muestra la pantalla de victoria final existente (no una pantalla de "Nivel 4").
- [ ] Vidas y puntaje no se reinician al pasar de nivel 1 a 2 ni de 2 a 3.
- [ ] Si el jugador pierde todas las vidas en cualquier nivel, se muestra game over (comportamiento sin cambios respecto al spec 01/02).
- [ ] Al reiniciar desde game over o desde la victoria final, el juego vuelve al nivel 1, con vidas y puntaje en su estado inicial.
- [ ] Cada rebote de la pelota contra una pared (izquierda, derecha, arriba) reproduce el sonido `ball-bounce.mp3`.
- [ ] Cada rebote de la pelota contra la pala reproduce el sonido `ball-bounce.mp3`.
- [ ] Cada bloque roto reproduce el sonido `break-sound.mp3` en el mismo instante en que se suma el puntaje y comienza la animación de explosión.
- [ ] Romper varios bloques o rebotar varias veces en rápida sucesión reproduce los sonidos superpuestos, sin que uno corte o silencie a otro.
- [ ] No hay ningún control de volumen/mute visible en la UI.
- [ ] Presionar `P` o `Escape` durante `'playing'` pausa el juego: pelota y pala se congelan, y aparece el `<select>` con el nivel actual seleccionado.
- [ ] Presionar `P` o `Escape` de nuevo mientras está en pausa, sin tocar el `<select>`, reanuda exactamente desde donde quedó (misma posición de pelota/pala, mismas vidas/puntaje/bloques rotos).
- [ ] Elegir un nivel distinto en el `<select>` durante la pausa salta directo a ese nivel: nuevo layout, pelota/pala reposicionadas, vidas y puntaje sin cambios, con la pantalla "Nivel N" pidiendo clic para lanzar.
- [ ] El `<select>` no es visible ni interactuable fuera del estado de pausa.
- [ ] No hay errores en consola durante una partida completa de los 3 niveles, incluyendo pausas, saltos de nivel vía select, victoria final y reinicio.

## Decisiones tomadas y descartadas

- **Spec combinado (niveles + sonidos)** en lugar de dos specs separados, por decisión explícita del usuario, aunque son dominios distintos (progresión de juego vs. audio).
- **Reutilizar el estado `gameState = 'start'` para la pantalla de transición de nivel**, en lugar de agregar un nuevo valor (`'levelTransition'`), porque el comportamiento requerido (pelota detenida hasta clic, pantalla con mensaje y clic para continuar) es idéntico al que ya tiene `'start'`; solo cambia el texto mostrado según `levelIndex`.
- **Layouts de nivel definidos como patrones de huecos sobre el mismo grid base** (15x7, mismas dimensiones/offsets), en lugar de variar cantidad de filas/columnas, para no tener que recalcular `BLOCK_OFFSET_LEFT`/`BLOCK_OFFSET_TOP` ni el tamaño de bloque por nivel.
- **Multiplicador de velocidad (+15% por nivel) aplicado solo al lanzar la pelota al inicio del nivel**, no recalculado en cada rebote, para que la velocidad se sienta estable dentro de un mismo nivel y solo suba escalonadamente entre niveles.
- **Sin control de volumen ni mute**, por decisión explícita del usuario: el sonido por defecto es suficiente para este spec.
- **Sin persistencia de preferencias de audio ni de progreso de nivel**: recargar la página siempre vuelve al nivel 1, consistente con que el proyecto no tiene persistencia hasta ahora.
- **`new Audio(src)` por cada reproducción**, en lugar de reusar una única instancia por sonido, para permitir solapamiento de sonidos simultáneos sin lógica de throttling, según decisión explícita del usuario.
- **Selector de nivel como `<select>` HTML superpuesto**, en lugar de botones dibujados en canvas, para evitar código propio de detección de clicks/hitboxes cuando un elemento nativo del DOM resuelve lo mismo con menos código.
- **Menú de pausa es herramienta de debug/testing, no feature de jugador final**: se documenta explícitamente así para no invertir esfuerzo en pulir su UX/diseño visual; puede quedar accesible en el juego final igual, pero sin tratamiento especial.
- **Saltar de nivel vía `<select>` no reinicia vidas/puntaje**, para poder probar un nivel específico repetidamente sin perder progreso de puntaje durante testing.
- **Reanudar pausa sin usar el `<select>` no reposiciona pelota/pala**: la pausa solo congela el loop, no reinicia estado, a diferencia de un salto de nivel explícito.
- **`LEVELS` definido en `levels.js` separado**, en lugar de vivir dentro de `game.js`, por decisión explícita del usuario durante la implementación, para aislar la definición de niveles del resto de la lógica del juego.
