const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3");

const db = new sqlite3.Database("shows-dataBase.db");

db.run(`
CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  story TEXT NOT NULL,
  rating INTEGER NOT NULL,
  released INTEGER NOT NULL,
  picture TEXT,
  status TEXT,
  recommendation TEXT 
)
`);

//validation errors context
const MIN_FORM_CHARACTERS = {
  NAME: 2,
  STORY: 10,
  RATING: 1,
  RELEASED: 4,
};

function getValidationErrorsForShows(
  name,
  story,
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
  if (MIN_FORM_CHARACTERS.STORY > story.length) {
    validationErrors.push(
      "- The story must contain at least " +
        MIN_FORM_CHARACTERS.STORY +
        " letters."
    );
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

//Movies properities
router.get("/", function (request, response) {
  const query = "SELECT * FROM movies ORDER BY id";

  db.all(query, function (error, movies) {
    if (error) {
      console.log(error);
      const model = {
        dbError: true,
      };
      response.render("movies.hbs", model);
    } else {
      const model = {
        movies,
        dbError: false,
      };
      response.render("movies.hbs", model);
    }
  });
});

router.get("/movie/:id", function (request, response) {
  const id = request.params.id;

  const query = "SELECT * FROM movies WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, movie) {
    if (error) {
      console.log(error);
    } else {
      const model = { movie };

      response.render("movie.hbs", model);
    }
  });
});

router.get("/create-movie", function (request, response) {
  if (request.session.isLoggedIn) {
    response.render("create-movie.hbs");
  } else {
    response.redirect("/login");
  }
});

router.post("/create-movie", function (request, response) {
  const name = request.body.name;
  const story = request.body.story;
  const rating = parseInt(request.body.rating);
  const released = parseInt(request.body.released);
  const picture = request.body.picture;
  const status = request.body.status;
  const recommendation = parseInt(request.body.recommendation);

  const errors = getValidationErrorsForShows(
    name,
    story,
    released,
    rating,
    recommendation
  );

  if (!request.session.isLoggedIn) {
    errors.push("You have to login to use this function.");
  }

  if (errors.length == 0) {
    const query =
      "INSERT INTO movies (name, story, rating, released, picture, status, recommendation) VALUES (? , ?, ?, ?, ?, ?, ?)";
    const values = [
      name,
      story,
      rating,
      released,
      picture,
      status,
      recommendation,
    ];

    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
        response.render("error-page.hbs");
      } else {
        response.redirect("/movies/movie/" + this.lastID);
      }
    });
  } else {
    const model = {
      errors,
      name,
      story,
      rating,
      released,
      picture,
      status,
      recommendation,
    };
    response.render("create-movie.hbs", model);
  }
});

router.get("/update-movie/:id", function (request, response) {
  const id = request.params.id;
  const query = `SELECT * FROM movies WHERE id = ?`;
  const values = [id];

  db.get(query, values, function (error, movie) {
    if (error) {
      console.log(error);
    } else {
      const model = { movie };
      response.render("update-movie.hbs", model);
    }
  });
});

router.post("/update-movie/:id", function (request, response) {
  const id = request.params.id;
  const newName = request.body.name;
  const newStory = request.body.story;
  const newRating = parseInt(request.body.rating);
  const newReleased = parseInt(request.body.released);
  const newPicture = request.body.picture;
  const newStatus = request.body.status;
  const newRecommendation = parseInt(request.body.recommendation);

  const movie = {
    name: newName,
    story: newStory,
    rating: newRating,
    released: newReleased,
    picture: newPicture,
    status: newStatus,
    recommendation: newRecommendation,
    id: id,
  };

  const errors = getValidationErrorsForShows(
    newName,
    newStory,
    newReleased,
    newRating,
    newRecommendation
  );

  if (!request.session.isLoggedIn) {
    errors.push("You have to login to use this function.");
  }

  if (errors.length == 0) {
    const query = `UPDATE 
    movies 
    SET 
    name = ?, 
    story = ?,
    rating = ?,
    released = ?,
    picture = ?,
    status = ?,
    recommendation = ?
    WHERE
    id = ?
    `;
    const values = [
      newName,
      newStory,
      newRating,
      newReleased,
      newPicture,
      newStatus,
      newRecommendation,
      id,
    ];

    db.run(query, values, function (error) {
      if (error) {
        console.log(error);
        response.render("error-page.hbs");
      } else {
        response.redirect("/movies/movie/" + id);
      }
    });
  } else {
    const model = {
      errors,
      movie,
    };
    response.render("update-movie.hbs", model);
  }
});

router.post("/delete-movie/:id", function (request, response) {
  const id = request.params.id;
  if (!request.session.isLoggedIn) {
    response.redirect("/login");
  } else {
    const query = `DELETE FROM movies WHERE id = ?`;
    db.run(query, [id], function (error) {
      if (error) {
        console.log(error);
        response.render("error-page.hbs");
      } else {
        response.redirect("/movies");
      }
    });
  }
});

router.get("/search", function (request, response) {
  var name = request.query.searchName;

  var query = `SELECT * FROM movies WHERE name LIKE ?`;

  const values = ["%" + name + "%"];

  db.all(query, values, function (error, movies) {
    if (error) {
      console.log(error);
      const model = {
        dbError: true,
      };
      response.render("movies.hbs", model);
    } else {
      const model = {
        movies,
        dbError: false,
      };

      response.render("movies.hbs", model);
    }
  });
});

module.exports = router;
