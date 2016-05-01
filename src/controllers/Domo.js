var _ = require('underscore');
var models = require('../models');

var Domo = models.Domo;

var makerPage = function(req, res){
	//res.render('app');
	Domo.DomoModel.findByOwner(req.session.account._id, function(err, docs){
		
		if(err){
			console.log(err);
			return res.status(400).json({error: 'An error occurred'});
		}
		
		res.render('app', {csrfToken: req.csrfToken(), characters: docs});
	});
	
};

var domoPage = function(req, res){
	Domo.DomoModel.findByOwner(req.session.account._id, function(err, docs){
		
		if(err){
			console.log(err);
			return res.status(400).json({error: 'An error occurred'});
		}
		
		var domoData = {
			name: req.body.name,
			color: req.body.color,
			level: req.body.level,
			owner: req.session.account._id
		};
		
		res.render('domo', {csrfToken: req.csrfToken(), characters: docs});
	});
	//res.render('game', {csrfToken: req.csrfToken()});	
};

var gamePage = function(req, res){
	Domo.DomoModel.findByOwner(req.session.account._id, function(err, docs){
		
		if(err){
			console.log(err);
			return res.status(400).json({error: 'An error occurred'});
		}
		
		var domoData = {
			name: req.body.name,
			color: req.body.color,
			level: req.body.level,
			owner: req.session.account._id
		};
		
		res.render('game', {csrfToken: req.csrfToken(), characters: docs});
	});
};

var makeDomo = function(req, res){
	
	if(!req.body.name || !req.body.color){
		return res.status(400).json({error: "Name and Color are required"});
	}
	
	var domoData = {
		name: req.body.name,
		color: req.body.color,
		level: 0,
		owner: req.session.account._id
	};
	
	var newDomo = new Domo.DomoModel(domoData);
	
	newDomo.save(function(err){
		if(err){
			console.log(err);
			return res.status(400).json({error: 'An error occurred'});
		}

		res.json({redirect: "/maker"});
	});
	
};

module.exports.makerPage = makerPage;
module.exports.make = makeDomo;
module.exports.domoPage = domoPage;
module.exports.gamePage = gamePage;