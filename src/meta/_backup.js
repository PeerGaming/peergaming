/**
 *  Backup
 *  ======
 *
 *  Using local stored information to provide a backup for reconnection.
 */

if ( LOCAL['player'] ) {

  var range = parseFloat( JSON.parse(LOCAL.player).time ) +
              config.reconnectConfig.backupDuration - Date.now();

  if ( range >= 0 ) extend( BACKUP, JSON.parse(LOCAL.player) );
}

delete LOCAL['player'];


/**
 *  Overwrites the data in the localStorage
 *
 *  TODO: instead of always serializing the whole instance, just update the increment
 */

function updateBackup() {

  LOCAL['player'] = JSON.stringify(PLAYER);
}


/**
 *  Uses the former data as initial values
 *
 *  TODO: check if account information (name) should also be stored
 *
 *  @param  {[type]} data [description]
 */

function restoreBackup ( player ) {

  if ( !config.reconnectConfig.restoreEnabled ) return;

  if ( BACKUP.id   ) player.id   = BACKUP.id;
  if ( BACKUP.time ) player.time = BACKUP.time;

  if ( !BACKUP.data ) return;

  var data = player.data,
      last = BACKUP.data, keys = getKeys(last);

  for ( var i = 0, l = keys.length; i < l; i++ ) data[ keys[i] ] = last[ keys[i] ];
}
