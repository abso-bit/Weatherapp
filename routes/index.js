var express = require('express');
var router  = express.Router();
var request = require('request');
var mongoose= require('mongoose');


var options = { server: { socketOptions: {connectTimeoutMS: 5000 } }};
mongoose.connect('mongodb://sofiane:azerty@ds217560.mlab.com:17560/weatherapp',
    options,
    function(err) {
     console.log(err);
    }
);

var citySchema = mongoose.Schema({
    name: String,
    desc: String,
    icon: String,
    temp_min: String,
    temp_max: String,
    user_id: String
});

var userSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String
});

var CityModel = mongoose.model('cities', citySchema);

var UserModel = mongoose.model('users', userSchema);

router.get('/', function(req, res, next) {
  res.render('login');
});

router.get('/view-city', function(req, res, next) {
  CityModel.find(
    {user_id: req.session.user._id},
    function(err, cityList){
      res.render('index', { cityList });
    }
  )
});

router.post('/add-city', function(req, res, next) {
  request("http://api.openweathermap.org/data/2.5/weather?q="+req.body.city+"&APPID=9b754f1f40051783e4f72c176953866e&lang=fr&units=metric", function(error, response, body) {
    body = JSON.parse(body);
    var newCity = new CityModel ({
      name: req.body.city,
      desc: body.weather[0].description,
      icon: "http://openweathermap.org/img/w/"+body.weather[0].icon+".png",
      temp_min: body.main.temp_min+"°c",
      temp_max: body.main.temp_max+"°c",
      user_id: req.session.user._id
    });
    newCity.save(
      function(error, city) {
        CityModel.find(
          {user_id: req.session.user._id},
          function(err, cityList){
            res.render('index', { cityList });
          }
        )
      }
    )
  });

});

router.get('/delete-city', function(req, res, next) {
  CityModel.remove(
    { _id: req.query.id, user_id: req.session.user._id },
    function(error) {
      CityModel.find(
        {user_id: req.session.user._id},
        function(err, cityList){
          res.render('index', { cityList });
        }
      )
    }
  );

});

router.post('/signup', function(req, res, next) {
  console.log(req.body.name);
  console.log(req.body.email);
  console.log(req.body.password);

  var newUser = new UserModel({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  });

  newUser.save(
    function(error, user){
      req.session.user = user;
      res.redirect('/view-city');
    }
  )

});


router.post('/signin', function(req, res, next) {

  UserModel.find(
    {email: req.body.email, password: req.body.password},
    function(err, users){

      if(users.length > 0) {
        req.session.user = users[0];
        res.redirect('/view-city');
      }

      else {
        res.render('login');
      }
    }
  )

});


module.exports = router;
