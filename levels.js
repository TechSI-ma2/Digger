/**
 * Digger Level Definitions & Configurations
 * 15 columns x 10 rows grid.
 * Legend:
 *   '.' = Dirt
 *   ' ' = Open Tunnel
 *   'E' = Emerald (in dirt)
 *   'B' = Gold Bag (resting above tunnel or in dirt)
 *   'S' = Digger Start
 *   'M' = Monster Spawner (top right: x:14, y:0)
 */

const DIGGER_LEVELS = [
  // LEVEL 1: Classic Digger Layout
  {
    name: 'Level 1: The Mines of Tech.SI',
    monsterTotal: 4,
    monsterMaxActive: 3,
    monsterSpeed: 2.35,
    hobbinTime: 8.0,        // seconds before Nobbin mutates into Hobbin
    hobbinDuration: 9.0,    // seconds Hobbin stays mutated
    bonusDuration: 12.0,    // William tell overture bonus duration
    map: [
      '              M', // Row 0 (top open corridor to spawner)
      ' EEEE . B. EEEE',
      ' EEEE .  . EEEE',
      ' .... B..B ....',
      '      ....     ',
      ' EEEE .... EEEE',
      ' EEEE .  . EEEE',
      ' .... .B.. ....',
      ' .... .  . ....',
      '       S       '  // Row 9 (bottom tunnel with start)
    ]
  },

  // LEVEL 2: Twin Shafts
  {
    name: 'Level 2: Twin Shafts',
    monsterTotal: 5,
    monsterMaxActive: 3,
    monsterSpeed: 2.5,
    hobbinTime: 7.5,
    hobbinDuration: 10.0,
    bonusDuration: 11.0,
    map: [
      '              M',
      '.EEEE.  B .EEEE.',
      '.EEEE. ... .EEEE.',
      ' B... .  . ...B ',
      '      .  .      ',
      ' ...B .  . B... ',
      '.EEEE. ... .EEEE.',
      '.EEEE.  B  .EEEE.',
      ' ....  ..  .... ',
      '       S        '
    ]
  },

  // LEVEL 3: Emerald Vault
  {
    name: 'Level 3: Emerald Vault',
    monsterTotal: 6,
    monsterMaxActive: 4,
    monsterSpeed: 2.65,
    hobbinTime: 7.0,
    hobbinDuration: 10.0,
    bonusDuration: 10.0,
    map: [
      '              M',
      ' B.EEEE..EEEE.B ',
      '  .EEEE..EEEE.  ',
      '. ........... . ',
      '  .   B  B  .   ',
      '.. ...    ... ..',
      '  .EEEE..EEEE.  ',
      ' B.EEEE..EEEE.B ',
      '  ...........   ',
      '       S        '
    ]
  },

  // LEVEL 4: The Pyramid
  {
    name: 'Level 4: The Pyramid',
    monsterTotal: 7,
    monsterMaxActive: 4,
    monsterSpeed: 2.8,
    hobbinTime: 6.5,
    hobbinDuration: 11.0,
    bonusDuration: 10.0,
    map: [
      '              M',
      '    .. B ..     ',
      '   .EEEEEEEE.   ',
      '  ..   B B  ..  ',
      ' .EEEE .... EEEE. ',
      '.. B ..    .. B ..',
      ' .EEEE .... EEEE. ',
      '  ..   B B  ..  ',
      '   .EEEEEEEE.   ',
      '       S        '
    ]
  },

  // LEVEL 5: Cross Chasm
  {
    name: 'Level 5: Cross Chasm',
    monsterTotal: 8,
    monsterMaxActive: 4,
    monsterSpeed: 2.9,
    hobbinTime: 6.0,
    hobbinDuration: 12.0,
    bonusDuration: 9.0,
    map: [
      '              M',
      '.EEEE. B  B .EEEE.',
      '.EEEE. .... .EEEE.',
      ' B... .EEEE. ...B ',
      '      .EEEE.      ',
      ' B... .EEEE. ...B ',
      '.EEEE. .... .EEEE.',
      '.EEEE. B  B .EEEE.',
      ' ....  ..  .... ',
      '       S        '
    ]
  },

  // LEVEL 6: The Labyrinth
  {
    name: 'Level 6: The Labyrinth',
    monsterTotal: 8,
    monsterMaxActive: 4,
    monsterSpeed: 3.0,
    hobbinTime: 5.5,
    hobbinDuration: 12.0,
    bonusDuration: 9.0,
    map: [
      '              M',
      ' EEE. B  B .EEE ',
      ' ... .EEEE. ... ',
      ' B.. .EEEE. ..B ',
      '     ..  ..     ',
      ' B.. .EEEE. ..B ',
      ' ... .EEEE. ... ',
      ' EEE. B  B .EEE ',
      ' ....  ..  .... ',
      '       S        '
    ]
  },

  // LEVEL 7: Danger Zone
  {
    name: 'Level 7: Danger Zone',
    monsterTotal: 9,
    monsterMaxActive: 4,
    monsterSpeed: 3.1,
    hobbinTime: 5.0,
    hobbinDuration: 13.0,
    bonusDuration: 8.5,
    map: [
      '              M',
      ' B EEEE..EEEE B ',
      '   EEEE..EEEE   ',
      ' . B........B . ',
      '      B  B      ',
      ' . B........B . ',
      '   EEEE..EEEE   ',
      ' B EEEE..EEEE B ',
      '  ...........   ',
      '       S        '
    ]
  },

  // LEVEL 8: Deep Core
  {
    name: 'Level 8: Deep Core',
    monsterTotal: 10,
    monsterMaxActive: 4,
    monsterSpeed: 3.3,
    hobbinTime: 4.5,
    hobbinDuration: 14.0,
    bonusDuration: 8.0,
    map: [
      '              M',
      '.EEEE. B..B .EEEE.',
      '.EEEE.  ..  .EEEE.',
      ' B... .EEEE. ...B ',
      '      .EEEE.      ',
      ' B... .EEEE. ...B ',
      '.EEEE.  ..  .EEEE.',
      '.EEEE. B..B .EEEE.',
      ' ....   ..   .. ',
      '       S        '
    ]
  }
];

window.DIGGER_LEVELS = DIGGER_LEVELS;
