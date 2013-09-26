function nomekop ( 
	_name, 
	_description,
	_power_school,
	_basic_attack,
	_basic_attack_hp,
	_special_attack,
	_special_attack_type,
	_special_attack_chance, // default to 0.1
	_graphic ) {

	var creature = character(_name, {
		location: '',
		description: _description,
		power_school: _power_school,
		basic_attack: _basic_attack,
		basic_attack_hp: _basic_attack_hp,
		special_attack: _special_attack,
		special_attack_type: _special_attack_type, // critical = attack*2, heal = +hp basic, stun = stun lock for next hit, block = for basic hp, 
		special_attack_chance: _special_attack_chance,
		graphic: _graphic
	});	

	creature.isCreature = true;
	creature.canBeCaught = true;

	return creature;
}

var creatureList = new Array();
var hasTeleportedCreatures = false;

function addCreature( c ) {
	creatureList.push(c);
}
function findCreature( name ) {
	for( var i = 0; i < creatureList.length; i++ ) {
		if( name == creatureList[i].name ) {
			return creatureList[i];
		}
	}
	return null;
}

var playersWantingToFight = new Array();

function listFighters() {
	console.log("~~~");
	for( var i = 0; i < playersWantingToFight.length; i++ ) {
		console.log(" Fighter: " + playersWantingToFight[i].name);
	}
	console.log("~~~");
}

// Potential ideas:
// - Special attacks be a heal
// - Keep track 
addCreature(nomekop("Misunderstood Spider", "What's the book for?", "Teeth", "Bited in the face", 0, "Hurls flies", "critical", 0.0, ""));

handler('tick', function () {
	if( !hasTeleportedCreatures ) {
		hasTeleportedCreatures = true;
		var rooms = _.values(game.rooms);

		for( var i = 0; i < rooms.length; i++ ) {
			console.log("Room: " + rooms[i].id);
		}
	
		for( var i = 0; i < creatureList.length; i++ ) {
			var creature = creatureList[i];
			if( creature.location == '' ) {
				var room = rooms[Math.floor(Math.random() * (rooms.length - 1))];
				creature.setCurrentRoom(room.id);
				console.log("The creature " + creature.name + " is now in " + creature.getCurrentRoom().id);
			}
		} 
	}	
});

function playerCanFight( player ) {
	return (player.wantsToFight && player.hasPreviouslyCaughtCreature && player.creatureCount() > 0);
}

handler('enterRoom', function (player, room, game) {
	for( var i = 0; i < creatureList.length; i++ ) {
		var creature = creatureList[i];
		var creatureRoom = creature.getCurrentRoom();
		if( creatureRoom.id == room.id	) {
			if( creature.canBeCaught ) {
				room.broadcast( "{" + creature.name + "} Hey " + player.name + ", " + creature.description );
			}
		}
	}

	if( player.hasPreviouslyCaughtCreature ) {
		room.broadcast("Player " + player.name + " has caught:");
		for( var i = 0; i < player.inventory.length; i++ ) {
			var item = player.inventory[i];
			if( item.isCreature ) {
				room.broadcast("  ~> " + item.name);
			}
		}
	}
	
	if( playerCanFight(player) ) {
		for( var i = 0; i < playersWantingToFight.length; i++ ) {
			var potentialPlayer = playersWantingToFight[i];
			if( potentialPlayer.name != player.name && playerCanFight(potentialPlayer) ) {
				room.broadcast("Looks like " + player.name + " and " + potentialPlayer.name + " are going to duke it out!");
			}
		}
	}
});

command('catch', '"catch <nomekop>" the catch thing', function (rest, player, game) {
	var creature = findCreature(rest);
	if( creature ) {
		var creatureRoom = creature.getCurrentRoom();
		var playerRoom = player.getCurrentRoom();
		
		if( creatureRoom.id == playerRoom.id ) {
			if( creature.canBeCaught ) {
				if( !player.hasPreviouslyCaughtCreature ) {
					player.hasPreviouslyCaughtCreature = true;
					player.creatureCount = function() {
						var count = 0;
						for( var i = 0; i < player.inventory.length; i++ ) {
							var item = player.inventory[i];
							if( item.isCreature ) {
								count++;
							}
						}
						return count;
					};
				}
				creature.canBeCaught = false;
		        game.emitEvent("get", creature.name, player, creature);
			}
			else {
				playerRoom.broadcast("You can not haz " + creature.name);
			}
		}
	}
});

command('fight', '"fight"', function (rest, player, game) {
    var item = _.find(playersWantingToFight, function (it) {
      return player.name === it.name;
    });
	if( item == undefined ) {
		playersWantingToFight.push(player);
	}
	player.wantsToFight = true;
	player.getCurrentRoom().broadcast(player.name + " is cruisin' for a bruisin'");
	listFighters();
});

command('cower', '"cower"', function (rest, player, game) {
	playersWantingToFight = _.without(playersWantingToFight, player);
	player.wantsToFight = false;
	player.getCurrentRoom().broadcast(player.name + " is running away and cuddling all the caught pets");
	listFighters();
});

