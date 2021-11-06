require("dotenv").config();
const http = require('http');
var express = require('express');
const ejs = require("ejs");
const mongoose = require("mongoose");
var bodyParser = require('body-parser');
const socketio = require('socket.io');
const accountSid = "ACc7a09c07721d70e03e75f3a2366c45b1";
const authToken = "392df2f8eea3ac49235fcb04d5a51ed2";
const client = require('twilio')(accountSid, authToken);
const session = require("express-session");
var passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const TwitterStrategy = require("passport-twitter");
var methodOverride = require("method-override");
const _ = require("lodash");
var path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(session({
	secret: "Our little secret.",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDatabase", {
	useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
	email: String,
	password: String,
	googleId: String,
	twitterId: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
	done(null, user.id);
});
passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

/////////////////////////GOOGLE STRATEGY///////////////////////////////
passport.use(new GoogleStrategy({
	clientID: process.env.CLIENT_ID,
	clientSecret: process.env.CLIENT_SECRET,
	callbackURL: "http://localhost:3000/auth/google/dashboard",
	userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
	function (accessToken, refreshToken, profile, cb) {
		User.findOrCreate({ username: profile.displayName, googleId: profile.id }, function (err, user) {
			return cb(err, user);
		});
	}
));
//////////////////////TWITTER STRATEGY//////////////////////
passport.use(new TwitterStrategy({
	consumerKey: process.env.TWITTER_KEY,
	consumerSecret: process.env.TWITTER_SECRET,
	callbackURL: "http://localhost:3000/auth/twitter/dashboard"
},
	function (token, tokenSecret, profile, cb) {

		User.findOrCreate({ twitterId: profile.id }, function (err, user) {
			return cb(err, user);
		});
	}
));

/////////////////////FACEBOOK STRATEGY///will be added once hosted(privacy issue of http on FB)///


//////////////////GOOOGLE ROUTES/////////////////////
app.get("/auth/google",
	passport.authenticate("google", { scope: ["profile"] })
);

app.get('/auth/google/dashboard',
	passport.authenticate('google', { failureRedirect: '/login' }),
	function (req, res) {
		// Successful authentication, redirect home.
		res.redirect('/dashboard');
	});

//////////////////TWITTER ROUTES///////////////////////
app.get('/auth/twitter',
	passport.authenticate('twitter'));

app.get('/auth/twitter/dashboard',
	passport.authenticate('twitter', { failureRedirect: '/login' }),
	function (req, res) {
		// Successful authentication, redirect home.
		res.redirect('/dashboard');
	});

app.use(methodOverride("_method"));

app.get("/", function (req, res) {
	res.render("homePage");
});
app.get("/text", (req, res) => {
	res.render("index");
})
app.post("/text", (req, res) => {
	res.redirect("/text");
})
io.on('connection', socket => {
	socket.on('sendLoc', (myLatitude, myLongitude) => {
		client.messages
			.create({
				body: `I need help at latitude ${myLatitude}, longitude ${myLongitude}`,
				from: '+13252524384',
				to: '+919891721234'
			})
			.then(message => console.log(message.sid));
		console.log(myLatitude);
		console.log(myLongitude);
	});
})
app.get("/login", function (req, res) {
	res.render("loginSignup");
});
app.get("/register", function (req, res) {
	res.render("loginSignup");
});

app.post("/register", function (req, res) {

	User.register({ username: req.body.username }, req.body.password, function (err, user) {
		if (err) {
			console.log(err);
			res.redirect("/register");
		}
		else {
			passport.authenticate("local")(req, res, function () {
				res.redirect("/dashboard");
			});
		}
	});
});

app.post("/login", function (req, res) {

	const user = new User({
		username: req.body.username,
		password: req.body.password
	});

	req.login(user, function (err) {
		if (err) {
			console.log(err);
		}
		else {
			passport.authenticate("local")(req, res, function () {
				res.redirect("/dashboard");
			});
		}
	});
});

app.get("/dashboard", function (req, res) {
	res.sendFile(path.join(__dirname + '/MapAndLoc.html'));
});

server.listen(3000, function () {
	console.log("Server started on port 3000");
});
