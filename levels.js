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
