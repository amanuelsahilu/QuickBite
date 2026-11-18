# QuickBite

Campus food ordering for students and restaurant teams: browse outlets, order ahead around your class schedule, collect from pickup stations, and run the kitchen side with live orders, menu, sales and demand forecasting.

Live site: https://quickbite-six-eta.vercel.app

## Run locally

It's a static site with no build step. Open `index.html` in a browser, or serve the folder:

```
npx serve .
```

## Structure

- `index.html` - entry page
- `assets/core.js` - in-browser data layer (sample data kept in localStorage)
- `assets/ui-base.js` - shell, routing, theme (light/dark), events
- `assets/ui-student.js` - student screens
- `assets/ui-rest.js` - restaurant screens, including Demand Forecast
- `assets/ui-pages.js` - landing page
- `assets/styles.css` - styles

## Deploy

Any static host works. On Vercel: import the repo with framework preset "Other", no build command, output directory `.`.
