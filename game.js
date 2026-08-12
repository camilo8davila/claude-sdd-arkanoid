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

function launchBall() {
  ball.dx = 4;
  ball.dy = -4;
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

function createBlocks() {
  const blocks = [];
  for ( let row = 0; row < BLOCK_ROWS; row++ ) {
    for ( let col = 0; col < BLOCK_COLS; col++ ) {
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

let blocks = createBlocks();

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
  }
} );

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

    if ( blocks.every( ( b ) => !b.alive ) ) {
      gameState = 'win';
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

function update() {
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

function draw() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );

  blocks.forEach( ( block ) => {
    if ( !block.alive ) return;
    drawSprite( ctx, `block_${ block.color }`, block.x, block.y, block.width, block.height );
  } );

  drawSprite( ctx, 'paddle', paddle.x, paddle.y, paddle.width, paddle.height );
  drawSprite( ctx, 'ball', ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2 );

  drawHud();

  if ( gameState === 'start' ) {
    drawStartScreen();
  }
}

function drawStartScreen() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';

  ctx.font = '36px sans-serif';
  ctx.fillText( 'Arkanoid', canvas.width / 2, canvas.height / 2 - 60 );

  ctx.font = '20px sans-serif';
  ctx.fillText( 'Haz clic para jugar', canvas.width / 2, canvas.height / 2 );

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
