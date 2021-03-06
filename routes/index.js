// import all the models

var User = require('../models/users').User;
var Team = require('../models/teams').Team;
var Tournament = require('../models/tournaments').Tournament;
var Player = require('../models/players').Player;
var Game = require('../models/games').Game;

/*
 * GET home page.
 */

exports.index = function(req, res){
	
	console.log('Authentication: ' + req.isAuthenticated());
	// console.log(req.user)
	
	if (req.isAuthenticated()) {		
		res.render('index', {title: 'QScore', state: 'success', tournaments: [], user: req.user});
	}
	else {
		res.render('index', { title: 'QScore', tournaments: []});
	}
};

exports.alltournaments = function(req, res) {
	if (req.isAuthenticated()) {
		var userId = req.user._id.toString();
		// console.log(req.user);
		// console.log(userId);
		Tournament.find({createdBy: userId}, function(err, tournaments) {
			if (err) {
				res.render('alltournaments', {title: 'QScore', state: 'error', message: 'An error occurred!'});
			}
			else if (!tournaments) {
				res.render('alltournaments', {title: 'QScore', state: 'error', message: 'Could not retrieve tournaments!'});
			}
			else {
				res.render('alltournaments', {title: 'QScore', state: 'success', tournaments: tournaments, user: req.user});
			}
		});
	}
	else {
		res.render('alltournaments', { title: 'QScore', tournaments: []});
	}
};

exports.addteam = function(req, res) {
	
	console.log(req.body);
	
	if (req.method == 'POST') {
		var teamName = req.body['teamName'],
			tournament = req.body['tournament'],
			numPlayers = req.body['num-players'];
		
		var player_array = [];
		
		console.log('numPlayers: ' + numPlayers);
		
		und.range(numPlayers).forEach(function(player_index) {
			console.log(player_index);
			var first_name  = req.body['first-name-' + player_index];
			var last_name   = req.body['last-name-' + player_index];
			
			console.log(first_name + ' ' + last_name);
			
			player_array.push({firstName: first_name, lastName: last_name, tournament: tournament});
		});
		
		console.log(player_array);
		
		Player.create(player_array, function(err) {
			if (err) {
				console.log(err);
				res.render('addteam', {title: 'Add Team', 
					state: 'error', 
					message: 'There was an error creating the team roster!', 
					tournaments: [tournament]});
			}
			else {
				var player_ids = [];
				
				console.log(arguments);
				for(var i = 1; i < arguments.length; i++) {
					player_ids.push(arguments[i]._id);
				};
				
				Team.findOneAndUpdate({teamName: teamName, tournament: tournament},
				{teamName: teamName, tournament: tournament, teamRoster: player_ids},
				{upsert: true},
				function(err, team) {
					if (err) {
						console.log(err);
						res.render('addteam', {title: 'Add Team',
							state: 'error',
							message: 'There was an error creating the team!',
							tournaments: [tournament]});
					}
					else {
						console.log(team);
						res.render('addteam', {title: 'Add Team', 
							state: 'success', 
							message: 'Team created!', 
							tournaments: [tournament]});
					}
				});
			}
		});
	}
	
	if (req.method == 'GET') {
		
		var tourId = req.params.id;
		
		Tournament.findById(tourId, function(err, tournament) {
			if (err) {
				console.log('Error retrieving tournaments!');
				state = 'error';
				message = 'An error occurred! Could not retrieve tournaments!';
				res.render('addteam', {title: 'Add Team', state: state, message: message});
			}
			else {
				res.render('addteam', {title: 'Add Team', state: '', message: '', tournaments: [tournament]});
			}
		});
	}
	
};


exports.savegame = function(req, res) {
	
	var team_scores = req.body.teamScores;
	var player_scores = req.body.playerScores;
	var gameId = req.body.gameId;
	
	console.log(gameId);
	
	player_scores.forEach(function(score_entry) {
		
		db.players.update({_id: db.ObjectId(score_entry.playerId)},
						  {$pull: {scoreEntries: {gameId: gameId}}},
			function(err, saved) {
				if (err) {
					console.log(err);
					res.json({result: 'failure'});
				}
				else {
					db.players.update({_id: db.ObjectId(score_entry.playerId)},
							  {$push: {scoreEntries: {score: score_entry.score,
												   	  questionNum: score_entry.questionNum,
												   	  gameId: score_entry.gameId}}},
							function(err, saved) {
				
								if (err) {
									console.log(err);
									res.json({result: 'failure'});
								}
								else {
									// console.log(score_entry.questionNum + ' '
									// + score_entry.score);
									res.json({result: 'success'});
								}
							});
				}
		});
	});
	// This is decidedly *NOT* the right paradigm, but I'm too lazy to fix it right now
	
	team_scores.forEach(function(score_entry) {
		Team.findOneAndUpdate({_id: score_entry.teamId},
				{$pull: {scoreEntries: {gameId: gameId}}},
				function(err, team) {
					if (err) {
						console.log(err);
						res.json({result: 'error'});
					}
					else {
						Team.findOneAndUpdate({_id: score_entry.teamId},
								{$push: {scoreEntries: {score: score_entry.score,
									questionNum: score_entry.questionNum,
									gameId: score_entry.gameId}}},
						function(err, team) {
							if (err) {
								console.log(err);
								res.json({result: 'error'});
							}
							else {
								console.log(team);
								res.json({result: 'success'});
							}
						});
					}
				});
	});
};

exports.newgame = function(req, res) {
	
	teams = db.teams.find('', function(err, teams) {
		var message = '', state = '';
		
		if (err) {
			console.log('Error retrieving teams!');
			state = 'error';
			message = 'An error occurred! Could not retrieve teams!';
			res.render('newgame', {title: 'New Game', state: state, message: message});
		}
		else {
			tournaments = db.tournaments.find('', function(err, tournaments) {
				if (err) {
					console.log('Error retrieving tournaments!');
					state = 'error';
					message = 'An error occurred! Could not retrieve tournaments!';
					res.render('newgame', {title: 'New Game', state: state, message: message});
				}
				else {
					res.render('newgame', {title: 'New Game', state: '', message: '', 
						teams: teams,
						tournaments: tournaments});
				}
			});
		}
	});
	
};

exports.newgame2 = function(req, res) {
	var tourId = req.params['id'];
	
	console.log(tourId);
	
	Team.find({tournament: tourId}).populate('tournament').exec(function(err, teams) {
		if (err || !teams) {
			console.log(err);
			res.render('newgame', {title: 'New Game', 
				state: 'error', 
				message: 'An error occurred! Could not retrieve teams!'});
		}
		else {
			Tournament.findById(tourId, function(err, tournament) {
				if (err || ! tournament) {
					console.log(err);
					res.render('newgame', {title: 'New Game', 
						state: 'error', 
						message: 'An error occurred! Could not retrieve tournament!'});
				}
				else {
					console.log(teams);
					res.render('newgame', {title: 'New Game',
						state: 'success',
						tournaments: [tournament],
						teams: teams,
						message: ''});
				}
			});
		}
	});
}

exports.newtour = function(req, res) {
	
	var message = '';
	var state = '';
	
	/*
	 * someone should only be able to get to this page if they're already
	 * authenticated by the passport middleware
	 */
	
	
	if (req.method == 'POST') {
		var tourName = req.body.tourName,
			tourDate = req.body.tourDate,
			tourLocation = req.body.tourLocation,
			tourAddress = req.body.tourAddress,
			// username = req.user[0].username,
			id = req.user._id.toString();
			console.log(req.user);
			
		/*
		 * db.tournaments.findAndModify({query: {tourName: tourName, createdBy:
		 * db.ObjectId(id)}, sort: [], update: {$set: {tourName: tourName,
		 * tourDate: tourDate, tourLocation: tourLocation, tourAddress:
		 * tourAddress, createdBy: db.ObjectId(id), secret:
		 * Math.random().toString(36).substring(6)}}, upsert: true, 'new':
		 * true},
		 */
			
			
		Tournament.update(
				{tourName: tourName, createdBy: id},
				{$set: {tourName: tourName, tourDate: tourDate, 
						tourLocation: tourLocation, tourAddress: tourAddress,
						createdBy: id,
						secret: Math.random().toString(36).substring(6)}},
				{upsert: true},
			function(err, tournament) {
				if (err || !tournament) {
					console.log('An error occurred:' + err);
					state = 'error';
					message = 'An error occurred in saving this tournament!';
					res.render('newtour', {title: 'New Tournament', state: state, message: message});
				}
				else {
					console.log('Tournament succesfully saved!');
					state = 'success';
					message = 'The tournament has been succesfully saved!';
					Tournament.findOne({tourName: tourName, createdBy: id}, function(err, tournament) {
						if (!err && tournament) {
							console.log(tournament);
							res.render('edittour', {title: 'New Tournament', state: state, tournament: tournament, user: req.user});
						}
						else {
							res.render('newtour', {title: 'New Tournament', state: state, tournament: tournament, user: req.user});
						}
					});
				}
			});
	}
	else {
		res.render('newtour', {title: 'New Tournament', state: state, message: message, user: req.user});
	}
};

exports.playgame = function(req, res) {
	var message = '';
	var state = '';
	
	if (req.method == 'POST') {
		var team1 = req.body.team1,
			team2 = req.body.team2,
			tour = req.body.tour,
			round = req.body.round,
			room = req.body.room,
			moderator = req.body.moderator;
		
		console.log(team1);
		console.log(team2);
		console.log(tour);
		
		Game.create({team1: db.ObjectId(team1), team2: db.ObjectId(team2), tournament: db.ObjectId(tour),
			round: round, room: room, moderator: moderator},
			function(err, game) {
				if (err) {
					message = 'Error starting this game!';
					state = 'error';
					res.render('newgame', {title: 'New Game', state: state, message: message});
				}
				else {
					Team.find({$or: [{_id: team1}, {_id: team2}]})
					.populate('teamRoster').exec(function(err, teams) {
						if (err) {
							message = 'Error starting this game!';
							state = 'error';
							res.render('newgame', {title: 'New Game', state: state, message: message});
						}
						else {
							console.log(teams);
							console.log(game);
							res.render('playgame', {title: 'Play Game', teams: teams, game: game, 
								checkForNulScore: function(entry) {
									if (und.isNull(entry['score'])) {
										return 0;
									} else { return entry['score']}
								}});
						}
					});
				}
			}
		);
	}
	
	if (req.method == 'GET') {
		var gameId = req.params.id;
		
		Game.findById(gameId)
		.populate('team1 team2')
		.exec(function(err, game) {
			if (err) {
				console.log(err);
				res.render('playgame', {title: 'Play Game', state: 'error', message: 'Error occurred starting game!', game: {}});
			}
			else {
				console.log(game);
				Team.find({$or: [{_id: game.team1._id}, {_id: game.team2._id}]})
				.populate('teamRoster').
				exec(function(errm, teams) {
					if (err) {
						console.log(err)
					}
					else {
						console.log(teams);
						res.render('playgame', {title: 'Play Game', state: 'success', teams: teams, game: game,
							checkForNullScore: function(entry) {
								if (und.isNull(entry['score'])) {
									return 0;
								} else { return entry['score']}
							}});
					}
				});
				
			}
		});
	}
};

exports.viewtour = function(req, res) {
	
	var tourId = req.params.id;
	
	Tournament.findOne({_id: tourId}, function(err, tournament) {
		if (err) {
			res.render('viewtour', {title: 'View Tournament', state: 'error', message: 'An error occurred in the database!'});
		}
		else if (!tournament) {
			res.render('viewtour', {title: 'View Tournament', state: 'error', message: 'Tournament not found!'});
		}
		else {
			Team.find({tournament: tourId}, function(err, teams) {
				if (err) {
					res.render('viewtour', {title: 'View Tournament', state: 'error', message: 'An error occurred in the database!', user: req.user});
				}
				else if (!teams) {
					res.render('viewtour', {title: 'View Tournament', state: 'error', message: 'Tournament teams not found!', user: req.user});
				}
				else {
					Game
					.find({tournament: tourId})
					.populate('team1 team2')
					.exec(function(err, games) {
						if (err) {
							res.render('viewtour', {title: 'View Tournament', state: 'error', message: 'An error occurred in the database!', user: req.user});
						}
						else if (!games) {
							res.render('viewtour', {title: 'View Tournament', state: 'error', message: 'Tournament teams not found!', user: req.user});
						}
						else {
							res.render('viewtour', {title: 'View Tournament', state: 'success', tournament: tournament, teams: teams, games: games, user: req.user});
						}
					});
				}
			});
		}
	});
	
	// res.render('viewtour', {title: 'View Tournament'});
};

exports.edittour = function(req, res) {
	
	var tourId = req.params.id;
	
	if (req.method == 'GET') {
		Tournament.findOne({_id: tourId}, function(err, tournament) {
			if (err) {
				console.log(err);
				res.render('edittour', {title: 'Edit Tournament Info', state: 'error', message: 'Error occurred!', user: req.user});
			}
			else if (!tournament) {
				res.render('edittour', {title: 'Edit Tournament Info', state: 'error', message: 'Tournament not found!', user: req.user});
			}
			else {
				res.render('edittour', {title: 'Edit Tournament Info', state: 'success', tournament: tournament, user: req.user});
			}
		});
	}
};

exports.viewteam = function(req, res) {
	
	var teamId;
	
	if (req.method == 'GET') {
		teamId = req.params.id;
		var readOnly = true;
		
		Team.findOne({_id: teamId})
		.populate('allowedToEdit teamRoster')
		.exec(function(err, team) {
			if (err) {
				console.log(err);
			}
			else {
				console.log(team);
				if (team != null) {
					team.allowedToEdit.forEach(function(editor) {
						if (editor.id == req.user._id.toString()) {
							readOnly = false;
						}
					});
				}
				res.render('viewteam', {title: 'View/Edit Team', state: 'success', team: team, user: req.user, readOnly: readOnly});
			}
		});
	}
	
	
};

exports.saveteam = function(req, res) {
	console.log(req.body);
	
	if (req.method == 'POST') {
		var teamId = req.body['team-id'];
		var tourId = req.body['tour-id'];
		
		console.log(teamId);
		
		// complicated dependency structure here
		
		Team.findByIdAndUpdate(teamId,
		{teamName: req.body.teamName})
		.populate('allowedToEdit teamRoster')
		.exec(function(err, team) {
				if (err) {
					console.log(err);
				}
				else {
					// console.log(team);
					
					var num_players = und.initial(und.range((und.size(req.body) - 1) / 3));
					
					console.log(num_players);
					
					num_players.forEach(function(player) {
						
						playerId = req.body['player-id-' + player];
						firstName = req.body['first-name-' + player];
						lastName = req.body['last-name-' + player];
						
						console.log(playerId);
						
						if (playerId === null || und.isUndefined(playerId)) {
							Player.create({firstName: firstName, lastName: lastName, tournament: tourId},
							function(err, player) {
								if (err) {
									res.json({result: 'failure!'});
								}
								else {
									Team.findByIdAndUpdate(teamId,
									{$addToSet: {teamRoster: player._id}},
									function(err, team) {
					
									});
								}
							});
						}
						else {
							Player.findByIdAndUpdate(playerId, 
									{firstName: firstName,
									 lastName: lastName,
									 tournament: team.tournament},
							function(err, player) {
									
								if (err) {
									console.log(err);
									callback(err, player);
								}
								else {
									Team.findByIdAndUpdate(teamId,
									{$addToSet: {teamRoster: player._id}},
									function(err, team) {
										
									});
								}
							});
						}
					});
				}
		});
		
		res.json({result: 'success'});
	}
};

exports.deleteplayer = function(req, res) {
	
	if (req.method == 'POST') {
		
		console.log(req.body)
		
		var teamId = req.body['team-id'];
		var tourId = req.body['tour-id'];
		var playerId = req.body['player-id'];
		
		Player.findByIdAndRemove(playerId, function(err, player) {
			if (err) {
				console.log(err);
				res.json({result: 'failure'});
			}
			else {
				console.log(playerId + ' removed from db');
				Team.findByIdAndUpdate(teamId, {$pull: {teamRoster: playerId}}, function(err, team) {
					if (err) {
						console.log(err);
						res.json({result: 'failure'});
					}
					else {
						console.log(playerId + ' removed from ' + team.teamName);
						res.json({result: 'success'});
					}
				})
			}
		});

		res.json({result: 'success'});
	}
}