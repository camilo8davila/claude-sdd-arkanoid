const canvas = document.getElementById( 'gameCanvas' );
const ctx = canvas.getContext( '2d' );

const paddle = {
  x: canvas.width / 2 - SPRITES.paddle.sw / 2,
  y: canvas.height - 40,
  width: SPRITES.paddle.sw,
  height: SPRITES.paddle.sh,
  speed: 7,
};

const ball = {
  x: 0,
  y: 0,
  dx: 0,
  dy: 0,
  radius: SPRITES.ball.sw / 2,
};

function resetPaddleAndBall() {
  paddle.x = canvas.width / 2 - paddle.width / 2;
  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y - ball.radius;
  ball.dx = 0;
  ball.dy = 0;
}

const LEVEL_SPEED_MULTIPLIER = 1.15;

function launchBall() {
  const speedFactor = LEVEL_SPEED_MULTIPLIER ** levelIndex;
  ball.dx = 4 * speedFactor;
  ball.dy = -4 * speedFactor;
}

resetPaddleAndBall();

let lives = 3;
let score = 0;
let gameState = 'start';

const BLOCK_ROW_COLORS = [ 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green', 'gray' ];
const BLOCK_ROWS = BLOCK_ROW_COLORS.length;
const BLOCK_COLS = 15;
const BLOCK_PADDING = 4;
const BLOCK_WIDTH = 32;
const BLOCK_HEIGHT = 16;
const BLOCK_OFFSET_TOP = 60;
const BLOCK_OFFSET_LEFT = ( canvas.width - ( BLOCK_COLS * ( BLOCK_WIDTH + BLOCK_PADDING ) - BLOCK_PADDING ) ) / 2;

const LEVELS = [
  {
    // Nivel 1: grid completo, sin huecos.
    isExcluded: () => false,
  },
  {
    // Nivel 2: hueco rectangular en el centro.
    isExcluded: ( row, col ) => row >= 2 && row <= 4 && col >= 6 && col <= 8,
  },
  {
    // Nivel 3: hueco en forma de diamante centrado en el grid.
    isExcluded: ( row, col ) => {
      const centerRow = ( BLOCK_ROWS - 1 ) / 2;
      const centerCol = ( BLOCK_COLS - 1 ) / 2;
      const halfWidth = 3 - Math.abs( row - centerRow );
      if ( halfWidth < 0 ) return false;
      return col >= centerCol - halfWidth && col <= centerCol + halfWidth;
    },
  },
];

let levelIndex = 0;

function createBlocks( levelIndex ) {
  const blocks = [];
  const level = LEVELS[ levelIndex ];
  for ( let row = 0; row < BLOCK_ROWS; row++ ) {
    for ( let col = 0; col < BLOCK_COLS; col++ ) {
      if ( level.isExcluded( row, col ) ) continue;
      blocks.push( {
        x: BLOCK_OFFSET_LEFT + col * ( BLOCK_WIDTH + BLOCK_PADDING ),
        y: BLOCK_OFFSET_TOP + row * ( BLOCK_HEIGHT + BLOCK_PADDING ),
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        color: BLOCK_ROW_COLORS[ row ],
        alive: true,
      } );
    }
  }
  return blocks;
}

let blocks = createBlocks( levelIndex );
let explosions = [];

const keys = { left: false, right: false };

document.addEventListener( 'keydown', ( e ) => {
  if ( e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ) keys.left = true;
  if ( e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ) keys.right = true;
} );

document.addEventListener( 'keyup', ( e ) => {
  if ( e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ) keys.left = false;
  if ( e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ) keys.right = false;
} );

canvas.addEventListener( 'mousemove', ( e ) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = ( e.clientX - rect.left ) * ( canvas.width / rect.width );
  paddle.x = clamp( mouseX - paddle.width / 2, 0, canvas.width - paddle.width );
} );

canvas.addEventListener( 'click', () => {
  if ( gameState === 'start' ) {
    gameState = 'playing';
    launchBall();
  } else if ( gameState === 'gameover' || gameState === 'win' ) {
    restartGame();
  }
} );

function restartGame() {
  lives = 3;
  score = 0;
  blocks = createBlocks( levelIndex );
  explosions = [];
  resetPaddleAndBall();
  gameState = 'start';
}

function clamp( value, min, max ) {
  return Math.max( min, Math.min( max, value ) );
}

function updatePaddle() {
  if ( keys.left ) paddle.x -= paddle.speed;
  if ( keys.right ) paddle.x += paddle.speed;
  paddle.x = clamp( paddle.x, 0, canvas.width - paddle.width );
}

function updateBall() {
  ball.x += ball.dx;
  ball.y += ball.dy;

  if ( ball.x - ball.radius <= 0 ) {
    ball.x = ball.radius;
    ball.dx *= -1;
  } else if ( ball.x + ball.radius >= canvas.width ) {
    ball.x = canvas.width - ball.radius;
    ball.dx *= -1;
  }

  if ( ball.y - ball.radius <= 0 ) {
    ball.y = ball.radius;
    ball.dy *= -1;
  }

  checkPaddleCollision();
  checkBlockCollisions();

  if ( ball.y - ball.radius > canvas.height ) {
    loseLife();
  }
}

function loseLife() {
  lives -= 1;

  if ( lives <= 0 ) {
    gameState = 'gameover';
    return;
  }

  resetPaddleAndBall();
  gameState = 'start';
}

const BLOCK_SCORE = 10;

function checkBlockCollisions() {
  for ( const block of blocks ) {
    if ( !block.alive ) continue;

    const collides = ball.x + ball.radius > block.x
      && ball.x - ball.radius < block.x + block.width
      && ball.y + ball.radius > block.y
      && ball.y - ball.radius < block.y + block.height;

    if ( !collides ) continue;

    block.alive = false;
    score += BLOCK_SCORE;
    explosions.push( {
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height,
      color: block.color,
      startTime: performance.now(),
    } );

    if ( blocks.every( ( b ) => !b.alive ) ) {
      if ( levelIndex < LEVELS.length - 1 ) {
        levelIndex += 1;
        blocks = createBlocks( levelIndex );
        explosions = [];
        resetPaddleAndBall();
        gameState = 'start';
      } else {
        gameState = 'win';
      }
    }

    const overlapLeft = ball.x + ball.radius - block.x;
    const overlapRight = block.x + block.width - ( ball.x - ball.radius );
    const overlapTop = ball.y + ball.radius - block.y;
    const overlapBottom = block.y + block.height - ( ball.y - ball.radius );
    const minOverlap = Math.min( overlapLeft, overlapRight, overlapTop, overlapBottom );

    if ( minOverlap === overlapTop || minOverlap === overlapBottom ) {
      ball.dy *= -1;
    } else {
      ball.dx *= -1;
    }

    break;
  }
}

function checkPaddleCollision() {
  const ballBottom = ball.y + ball.radius;
  const withinPaddleX = ball.x >= paddle.x && ball.x <= paddle.x + paddle.width;
  const hitPaddle = ball.dy > 0
    && ballBottom >= paddle.y
    && ball.y <= paddle.y + paddle.height
    && withinPaddleX;

  if ( !hitPaddle ) return;

  ball.y = paddle.y - ball.radius;

  const paddleCenter = paddle.x + paddle.width / 2;
  const relativeIntersect = ( ball.x - paddleCenter ) / ( paddle.width / 2 );
  const speed = Math.hypot( ball.dx, ball.dy );
  const maxBounceAngle = Math.PI * 0.4;
  const bounceAngle = relativeIntersect * maxBounceAngle;

  ball.dx = speed * Math.sin( bounceAngle );
  ball.dy = -speed * Math.cos( bounceAngle );
}

function updateExplosions( currentTime ) {
  explosions = explosions.filter( ( explosion ) => currentTime - explosion.startTime < EXPLOSION_DURATION );
}

function update() {
  const currentTime = performance.now();
  updateExplosions( currentTime );

  if ( gameState === 'gameover' || gameState === 'win' ) return;

  updatePaddle();

  if ( gameState === 'start' ) {
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius;
    return;
  }

  updateBall();
}

function drawHud() {
  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText( `Puntaje: ${ score }`, 10, 10 );
  ctx.fillText( `Vidas: ${ lives }`, canvas.width - 100, 10 );
}

function drawExplosions( currentTime ) {
  const frameDuration = EXPLOSION_DURATION / 4;
  explosions.forEach( ( explosion ) => {
    const frameIndex = Math.min( 3, Math.floor( ( currentTime - explosion.startTime ) / frameDuration ) );
    const frame = EXPLOSION_FRAMES[ explosion.color ][ frameIndex ];
    drawFrame( ctx, frame, explosion.x, explosion.y, explosion.width, explosion.height );
  } );
}

function draw() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );

  blocks.forEach( ( block ) => {
    if ( !block.alive ) return;
    drawSprite( ctx, `block_${ block.color }`, block.x, block.y, block.width, block.height );
  } );

  drawExplosions( performance.now() );

  drawSprite( ctx, 'paddle', paddle.x, paddle.y, paddle.width, paddle.height );
  drawSprite( ctx, 'ball', ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2 );

  drawHud();

  if ( gameState === 'start' ) {
    drawStartScreen();
  } else if ( gameState === 'gameover' ) {
    drawMessageScreen( 'Game Over', 'Haz clic para reiniciar' );
  } else if ( gameState === 'win' ) {
    drawMessageScreen( '¡Victoria!', 'Haz clic para reiniciar' );
  }
}

function drawStartScreen() {
  drawMessageScreen( 'Arkanoid', 'Haz clic para jugar' );
}

function drawMessageScreen( title, subtitle ) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';

  ctx.font = '36px sans-serif';
  ctx.fillText( title, canvas.width / 2, canvas.height / 2 - 60 );

  ctx.font = '20px sans-serif';
  ctx.fillText( subtitle, canvas.width / 2, canvas.height / 2 );

  ctx.textAlign = 'left';
}

function loop() {
  update();
  draw();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => {
  loop();
} );
