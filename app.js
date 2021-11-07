require("dotenv").config();
const http = require('http');
var express = require('express');
const ejs = require("ejs");
const mongoose = require("mongoose");
var bodyParser = require('body-parser');
const socketio = require('socket.io');
const accountSid = "ACc7a09c07721d70e03e75f3a2366c45b1";
const authToken = "d1c98793b8531a5beebd65463c0c8e99";
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
// mongodb + srv://admin-manan:test123@cluster0.qq1qv.mongodb.net/
// mongoose.connect("mongodb://localhost:27017/userDatabase", {
// 	useNewUrlParser: true
// });
mongoose.connect("mongodb+srv://admin-manan:test123@cluster0.qq1qv.mongodb.net/userDatabase", {
	useNewUrlParser: true
});
const userSchema = new mongoose.Schema({
	email: String,
	password: String,
	googleId: String,
	twitterId: String,
});
const contactSchema = {
	phone1: String,
	phone2: String,
	phone3: String
};

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Contact = mongoose.model("Contact", contactSchema);
let countContacts = 0;

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
// app.get("/text", (req, res) => {
// 	res.render("index");
// })
app.post("/text", (req, res) => {
	res.redirect("/dashboard");
})
io.on('connection', socket => {
	socket.on('sendLoc', (myLatitude, myLongitude) => {
		let ph1 = 0;
		let ph2 = 0;
		let ph3 = 0;
		Contact.find({}, function (err, foundContacts) {
			if (foundContacts.length > 0) {
				for (let i = 0; i < foundContacts.length; i++) {
					countContacts++;
					// console.log(foundContacts[i]);
				}
				console.log("Contacts", countContacts);
				ph1 = foundContacts[countContacts - 1].phone1;
				ph2 = foundContacts[countContacts - 1].phone2;
				ph3 = foundContacts[countContacts - 1].phone3;
				console.log(ph1);
				console.log(ph2);
				console.log(ph3);
				client.messages
					.create({
						body: `I need immediate help at ${myLatitude}, ${myLongitude}`,
						from: '+13252524384',
						to: `${ph1}`
					})
					.then(message => console.log(message.sid));
				client.messages
					.create({
						body: `I need immediate help at ${myLatitude}, ${myLongitude}`,
						from: '+13252524384',
						to: `${ph2}`
					})
					.then(message => console.log(message.sid));
				client.messages
					.create({
						body: `I need immediate help at ${myLatitude}, ${myLongitude}`,
						from: '+13252524384',
						to: `${ph3}`
					})
					.then(message => console.log(message.sid));
			}
		})
		// console.log(ph1);
		// client.messages
		// 	.create({
		// 		body: `I need immediate help at ${myLatitude}, ${myLongitude}`,
		// 		from: '+13252524384',
		// 		to: `${ph1}`
		// 	})
		// 	.then(message => console.log(message.sid));
		console.log(myLatitude);
		console.log(myLongitude);
	});
})
app.post("/storeContacts", function (req, res) {
	let ph1 = req.body.phone1;
	let ph2 = req.body.phone2;
	let ph3 = req.body.phone3;
	const contactItem = new Contact({
		phone1: ph1,
		phone2: ph2,
		phone3: ph3
	});
	contactItem.save();
	res.redirect("/dashboard");
})
app.get("/display", function (req, res) {
	Contact.find({}, function (err, foundContacts) {
		if (foundContacts.length > 0) {
			for (let i = 0; i < foundContacts.length; i++) {
				console.log(foundContacts[i]);
			}
			//call the function for loop to send message to all the numbers entered
		}
	})
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
	res.sendFile(path.join(__dirname + '/main.html'));
});

let port = process.env.PORT;
if (port == null || port == "") {
	port = 3000;
}
server.listen(port, function () {
	console.log(`Server started on http://localhost:3000/`);
});
