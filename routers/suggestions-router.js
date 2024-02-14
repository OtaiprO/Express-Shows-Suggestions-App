const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3");

const db = new sqlite3.Database("shows-dataBase.db");

db.run(`
CREATE TABLE IF NOT EXISTS suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  released INTEGER NOT NULL,
  recommendation INTEGER NOT NULL,
  picture TEXT
)
`);

//validation errors context
const MIN_FORM_CHARACTERS = {
  NAME: 2,
  RATING: 1,
  RELEASED: 4,
};

function getValidationErrorsForShows(
  type,
  name,
  released,
  rating,
  recommendation
) {
  const validationErrors = [];

  if (MIN_FORM_CHARACTERS.NAME > name.length) {
    validationErrors.push(
      "- The name must contain at least " +
        MIN_FORM_CHARACTERS.NAME +
        " letters."
    );
  }
  if (type == "Movie" || type == "Show" || type == "Anime") {
  } else {
    validationErrors.push("- Must choose one of the three given types.");
  }
  if (isNaN(rating) || rating < 0 || rating > 10) {
    validationErrors.push("- Must enter a valid rating of 10.");
  }
  if (isNaN(released) || released < 1800 || released > 2022) {
    validationErrors.push("- Must enter the correct year of release.");
  }
  if (isNaN(recommendation) || recommendation < 0 || recommendation > 10) {
    validationErrors.push("- Must enter a valid recommendation of 10.");
  }
  return validationErrors;
}

//Suggestions properities
router.get("/", function (request, response) {
  const query = "SELECT * FROM suggestions ORDER BY id";

  db.all(query, function (error, suggestions) {
    if (error) {
      console.log(error);
      const model = {
        dbError: true,
      };
      response.render("suggestions.hbs", model);
    } else {
      const model = {
        suggestions,
        dbError: false,
      };
      response.render("suggestions.hbs", model);
    }
  });
});

router.get("/create-suggestion", function (request, response) {
  response.render("create-suggestion.hbs");
});

router.post("/create-suggestion", function (request, response) {
  const type = request.body.type;
  const name = request.body.name;
  const rating = parseInt(request.body.rating);
  const released = parseInt(request.body.released);
  const recommendation = parseInt(request.body.recommendation);
  const picture = request.body.picture;

  const errors = getValidationErrorsForShows(
    type,
    name,
    released,
    rating,
    recommendation
  );

  if (errors.length == 0) {
    const query =
      "INSERT INTO suggestions (type, name, rating, released, recommendation, picture) VALUES (?, ?, ?, ?, ?, ?)";
    const values = [type, name, rating, released, recommendation, picture];

    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
        response.render("error-page.hbs");
      } else {
        response.redirect("/suggestions");
      }
    });
  } else {
    const model = {
      errors,
      type,
      name,
      rating,
      released,
      picture,
      recommendation,
    };
    response.render("create-suggestion.hbs", model);
  }
});

router.post("/delete-suggestion/:id", function (request, response) {
  const id = request.params.id;
  if (!request.session.isLoggedIn) {
    response.redirect("/login");
  } else {
    const query = `DELETE FROM suggestions WHERE id = ?`;
    db.run(query, [id], function (error) {
      if (error) {
        console.log(error);
        response.render("error-page.hbs");
      } else {
        response.redirect("/suggestions");
      }
    });
  }
});

module.exports = router;
