function getEnvironmentConfig(opts = {}) {
  /**
  Get configuration from environment...
  this might eventually need some editing for different
  environments
  */
  let { baseURL, imageBaseURL, publicURL } = opts;

  try {
    // Attempt to set parameters from environment variables
    // This will fail if bundled on a different system, presumably,
    // so we wrap in try/catch.
    publicURL = process.env.PUBLIC_URL;
    baseURL = process.env.API_BASE_URL;
    imageBaseURL = process.env.IMAGE_BASE_URL;
  } catch (error) {
    console.log(error);
  }

  console.log(`\
Environment variables:
PUBLIC_URL: ${process.env.PUBLIC_URL}
API_BASE_URL: ${process.env.API_BASE_URL}
IMAGE_BASE_URL: ${process.env.IMAGE_BASE_URL}\
`);

  // Set reasonable defaults
  if (publicURL == null) {
    publicURL = "/";
  }
  if (baseURL == null) {
    baseURL = "https://dev.macrostrat.org/image-tagger-api";
  }
  if (imageBaseURL == null) {
    imageBaseURL = "https://dev.macrostrat.org/image-tagger/img/";
  }

  console.log(publicURL, baseURL, imageBaseURL);
  return { publicURL, baseURL, imageBaseURL };
}

export { getEnvironmentConfig };
