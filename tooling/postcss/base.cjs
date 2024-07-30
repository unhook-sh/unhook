// If you want to use other PostCSS plugins, see the following:
// https://tailwindcss.com/docs/using-with-preprocessors
module.exports = {
  plugins: {
    autoprefixer: {},
    "postcss-focus-visible": {
      replaceWith: "[data-focus-visible-added]",
    },
    "postcss-import": {},
    tailwindcss: {},
    ...(process.env.NODE_ENV === "production" ? { cssnano: {} } : {}),
  },
};
