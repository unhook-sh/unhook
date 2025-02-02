// If you want to use other PostCSS plugins, see the following:
// https://tailwindcss.com/docs/using-with-preprocessors
module.exports = {
  plugins: {
    'postcss-focus-visible': {
      replaceWith: '[data-focus-visible-added]',
    },
    '@tailwindcss/postcss': {},
  },
}
