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
  x: canvas.width / 2,
  y: paddle.y - SPRITES.ball.sh / 2,
  dx: 4,
  dy: -4,
  radius: SPRITES.ball.sw / 2,
};

let lives = 3;
let score = 0;

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
}

function update() {
  updatePaddle();
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
}

function loop() {
  update();
  draw();
  requestAnimationFrame( loop );
}

loadSpritesheet( () => {
  loop();
} );
