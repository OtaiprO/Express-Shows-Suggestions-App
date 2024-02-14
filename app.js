const express = require("express");
const expressHandlebars = require("express-handlebars");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3");
const expressSession = require("express-session");
const SQLiteStore = require("connect-sqlite3")(expressSession);
const bcrypt = require("bcrypt");

//routers
const animesRouter = require("./routers/animes-router");
const moviesRouter = require("./routers/movies-router");
const tvShowsRouter = require("./routers/tv-shows-router");
const suggestionsRouter = require("./routers/suggestions-router");
//

const app = express();

app.use(
  expressSession({
    secret: "jkkjjkkjjklmmllm",
    saveUninitialized: false,
    resave: false,
    store: new SQLiteStore(),
  })
);

const correctUsername = "abod";
const correctPassword =
  "$2b$10$ucyYJa5HEpO/mYpCGXBKheDpnwACfLJ0V/aBy0gmZQ2.R8GWMuh/S";

app.engine(
  "hbs",
  expressHandlebars.engine({
    defaultLayout: "main.hbs",
    extname: "hbs",
  })
);

app.use(express.static("publicCss"));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(function (request, response, next) {
  const isLoggedIn = request.session.isLoggedIn;
  response.locals.isLoggedIn = isLoggedIn;
  next();
});

app.get("/", function (request, response) {
  response.render("start.hbs");
});

//Login context
app.get("/login", function (request, response) {
  response.render("login.hbs");
});

app.post("/login", function (request, response) {
  const enteredUsername = request.body.username;
  const enteredPassword = request.body.password;

  if (
    enteredUsername == correctUsername &&
    bcrypt.compareSync(enteredPassword, correctPassword)
  ) {
    request.session.isLoggedIn = true;
    response.redirect("/");
  } else {
    response.redirect("/login");
  }
});

app.post("/logout", function (request, response) {
  request.session.isLoggedIn = false;
  response.redirect("/");
});

//routers use
app.use("/animes", animesRouter);
app.use("/movies", moviesRouter);
app.use("/tv-shows", tvShowsRouter);
app.use("/suggestions", suggestionsRouter);
//

//About us properities
app.get("/about-us", function (request, response) {
  response.render("about-us.hbs");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
