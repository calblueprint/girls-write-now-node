import { decode } from "html-entities";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import fs from 'fs';

const allStoriesRoute =
  "https://girlswritenow.org/wp-json/wp/v2/story/?per_page=10";
const genreMediumRoute =
  "https://girlswritenow.org/wp-json/wp/v2/genre-medium/";
const mediaRoute = "https://girlswritenow.org/wp-json/wp/v2/media/";
const coauthorsRoute = "https://girlswritenow.org/wp-json/wp/v2/coauthors/";
const authorBioRoute =
  "https://girlswritenow.org/wp-json/elm/v1/guest-authors/";
const manuallyChecked = ["She&#8217;s a 7.8", "Skinny Girl Memoir", "A Foreshadowed Understanding", "My Love Was Bound in Red Silk / I Contain a Silence", , "Pull The Pin and Release the Locking Mechanism", "Love&#8217;s Sacrifice", "House of Lies", "Some Sundays", "your little world, here", "The Terror of Obesity", "From the Ancient Diary of an Unwilling Globetrotter", "The Restaurant", "Punctures of Light in the Darkness", "The Patient Daughter", "the ‘filler’", "Frostbites", "Motherhood Mural", "Pink", "Pocket of Peace", "Oma&#8217;s Hands", "Welcome To The Neighborhood", "The Rise of Fame, The Fall of Family", "How will they tell me you are dead?", "The Postcard Monologues", "Kill Them with Laughter, Kill Me with Peanuts", "The Scientist and the Fawn", "Mom Pants", "Here and There", "Static", "My Names", "Crown of Thorns", "Young Bones", "Love as Fragile as Time", "NYC Mayor&#8217;s Office Cover Letter", "Glasshouse Fever Dream", "crumbs"]

const gwnEmail = process.env.GWN_USERNAME;
const gwnPassword = process.env.GWN_PASSWORD;
const headers = new Headers();
headers.set(
  "Authorization",
  "Basic " + Buffer.from(gwnEmail + ":" + gwnPassword).toString("base64")
);

/* Fetch all story objects from WP story endpoint. */
const getAllStories = async (offsetParam) => {
  const response = await fetch(`https://girlswritenow.org/wp-json/wp/v2/story/?per_page=10&offset=${offsetParam}&orderby=date&order=desc`);
  let responseJson;
  try {
    responseJson = await response.json();
  } catch (error) {
    console.log(`Error on offset: ${offsetParam}`)
    console.log(`https://girlswritenow.org/wp-json/wp/v2/story/?per_page=10&offset=${offsetParam}&orderby=date&order=desc`)

    // console.log(`Retrying offsetParam: ${offsetParam}`)
    // return await getAllStories(offsetParam);
    return [];
  }
  console.log(`Fetched data for offsetParam: ${offsetParam}, Stories: ${responseJson.length}`)
  return responseJson;
};

/* Fetch all genre-medium IDs from WP genreMedium endpoint. */
const getAllGenreMediums = async () => {
  const response = await fetch(genreMediumRoute);
  await new Promise(r => setTimeout(r, 1000)); // servers are bad

  const responseJson = await response.json();
  return responseJson;
};

/* Remove elements with indexes in indexes from arr. */
export function removeElementsByIndexes(arr, indexes) {
  // Sort the indexes in descending order to prevent issues when removing elements
  indexes.sort((a, b) => b - a);
  for (const index of indexes) {
    if (index >= 0 && index < arr.length) {
      arr.splice(index, 1);
    }
  }
  return arr;
}

/* Filter story objects to be only text-based stories. */
const filterStories = async (storyObjects) => {
  // Hardcoded list of non-text based genre-medium IDs
  const nonTextGenres = [
    344, 383, 405, 414, 416, 470, 478, 503, 564, 568, 635, 712, 1202, 1205,
    1216, 1315, 1350, 1351, 1771, 1804, 1885, 2437, 2438,
  ];
  const indexesToRemove = [];
  storyObjects.forEach((storyObject, index) => {
    storyObject["genre-medium"].forEach((genreID) => {
      if (nonTextGenres.includes(genreID)) {
        indexesToRemove.push(index);
      }
    });
  });
  const filteredData = removeElementsByIndexes(storyObjects, indexesToRemove);
  return filteredData;
};

/* Fetch featured media link for each story. */
const getFeaturedMedia = async (featuredmediaId) => {
  const featuredMediaLink = mediaRoute + `${featuredmediaId}`;
  const response = await fetch(featuredMediaLink, { 'User-Agent': 'girlswritenow-mobile' });
  await new Promise(r => setTimeout(r, 1000)); // servers are bad

  let responseText = await response.text();
  let json;
  try {
    json = JSON.parse(responseText);
  } catch (error) {
    console.log(responseText)
    throw error
  }
  return json.link;
};

/* Parse storyObject content into Heading, Story, Process, and Excerpt. */
function parseNewStory(htmlString, htmlExcerpt) {
  const $ = cheerio.load(htmlString);
  const excerpt = cheerio.load(htmlExcerpt);
  const queryStory = "div.content-column pre, p:not(.social-sharing__text):not(.breadcrumb__content):not(.author-details__author-bio):not(blockquote > p), blockquote, li:not(.social-sharing__icon), pre.wp-block-verse, div.wp-block-embed__wrapper iframe, .wp-block-audio audio, .wp-block-video video, .wp-block-image img"
  const queryProcessHeader = `:header:contains("Process")`
  const queryProcess = "p"
  const queryExcerpt = "h2.wp-block-heading"

  const genre_medium = $(`h2.author-details__term-title:contains("Genre / Medium")`).next("div").find("span").toArray().map(v => $(v).text().trim())
  const topic = $(`h2.author-details__term-title:contains("Topic")`).next("div").find("span").toArray().map(v => $(v).text().trim())

  return {
    genre_medium,
    topic,
    story: $(queryStory).not(`${queryProcessHeader} ~ ${queryProcess}`).toArray().map((v) => $(v).prop('outerHTML')).join("") || "Not found",
    process: $(`${queryProcessHeader} ~ ${queryProcess}`).toArray().map((v) => $(v).prop('outerHTML')).join("") || "Not found",
    excerpt: excerpt(":header,p").prop('outerHTML') || $(queryExcerpt).prop('outerHTML') || "Not found"
  }
}

function parseOldStory(htmlString, htmlExcerpt) {
  let rootedHtml = htmlString
  const $ = cheerio.load(rootedHtml);
  const excerpt = cheerio.load(htmlExcerpt ?? "")
  const queryStory = `h4, h5, h6, p, li, pre.wp-block-verse, iframe, .wp-block-audio audio, .wp-block-video video, .wp-block-image img`
  const queryProcessHeader = `:header:contains("Process")`
  const queryProcess = "p"

  return {
    story: $(queryStory).not(`${queryProcessHeader} ~ ${queryProcess}`).toArray().map((v) => $(v).prop('outerHTML')).join("") || "Not found",
    process: $(queryProcessHeader).next(queryProcess).prop('outerHTML') || "", // Many old stories don't have a process
    excerpt: excerpt(":header,p").prop('outerHTML') || "Not found"
  }
}

function regexParseStory(htmlString, htmlExcerpt) {
  const regexStory =
    /<h2 class="wp-block-heading">.*?<\/h2>[\n\r]*((.|\n|\r)*?).*?(?=(<div style="color:#ddd" class="wp-block-genesis-blocks-gb-spacer gb-block-spacer gb-divider-solid gb-spacer-divider gb-divider-size-1">|<h1 class="wp-block-heading has-text-align-center">))/;
  const regexProcess = /Process.*?[\r\n]*?((<p>.*?<\/p>))/;
  const regexExcerpt = /(<p>(.|\n|\r)*?<\/p>)/;

  const story = htmlString.match(regexStory);
  const process = regexProcess.exec(htmlString);
  const excerpt = regexExcerpt.exec(htmlExcerpt);

  const contentStory = story ? decode(story[1].replace(/^\s*|\s*$/g, "")) : "";
  const contentProcess = process ? decode(process[1]) : "";
  const contentExcerpt = excerpt ? decode(excerpt[1]) : "";

  return {
    story: contentStory,
    process: contentProcess,
    excerpt: contentExcerpt.replace(" /", ""),
    valid: false,
  };

}

function getFeaturedMediaFromYoast(yoastHead) {
  // meta property =\"og:image\"
  const $ = cheerio.load(yoastHead)
  return $(`meta[property="og:image"]`).prop("content")
}

function htmlParser(htmlString, htmlExcerpt, title, yoastHead, link) {
  const $ = cheerio.load(htmlString);
  const isOldStory = $('div.story-post-title').text().trim().length == 0


  let jquery;
  if (isOldStory) {
    jquery = parseOldStory(htmlString, htmlExcerpt);
  } else {
    jquery = parseNewStory(htmlString, htmlExcerpt)
  }
  jquery["featuredMediaLink"] = getFeaturedMediaFromYoast(yoastHead)

  // fs.writeFileSync('/Users/adityapawar_1/Documents/school/college/blueprint/girls-write-now-node/conversations.html', htmlString)

  // const old = regexParseStory(htmlString, htmlExcerpt)
  if (manuallyChecked.includes(title)) {
    console.log(`"${title}" passed (manually checked, ${link})`)
  }
  else if (jquery.story == "Not found" || jquery.excerpt == "Not found" || jquery.story == "") {
    console.error(`Story "${title}" could not find one or more entries (${link}, old story?: ${isOldStory})`)
    console.log(jquery)
  }
  else {
    console.log(`"${title}" passed`)
  }

  return jquery;
}

/* Create storyObject from raw WP story response. For loop to use offset parameters to avoid JSON errors */
async function createStoryObjects() {
  let returnObject = [];
  let offsets = []

  let startOffset = 0
  let endOffset = 100
  for (let i = startOffset; i < endOffset; i += 10) {
    offsets.push(i);
    let storyObjects = await getAllStories(i);
    // storyObjects = await filterStories(storyObjects);
    await new Promise(r => setTimeout(r, 1000)); // servers are bad
    returnObject = returnObject.concat(storyObjects);
  }

  // await Promise.all(offsets.map(async (i) => {
  //   const unfilteredStoryObjects = await getAllStories(i);
  //   const filteredStoryObjects = await filterStories(unfilteredStoryObjects);
  //   returnObject = returnObject.concat(filteredStoryObjects);
  // }))

  // console.log("TESTING STORY OUTPUT:", returnObject[70]);
  console.log("testing array length:", returnObject.length);
  return returnObject;
}

/* Fetch authorObject and authorID from WP author endpoints. */
async function getAuthor(storyObject) {
  const re = /\d+/; // Regex to extract integers from string
  for (const coauthor of storyObject.coauthors) {
    const coauthorsEndpoint = coauthorsRoute + `${coauthor}`;
    const coauthorResponse = await fetch(coauthorsEndpoint, {
      method: "GET",
      headers: headers,
    });
    await new Promise(r => setTimeout(r, 1000)); // servers are bad

    const responseJson = await coauthorResponse.json();
    const authorId = re.exec(responseJson.description)[0];
    const authorBioEndpoint = authorBioRoute + `${authorId}`;
    const authorBioResponse = await fetch(authorBioEndpoint, {
      method: "GET",
      headers: headers,
    });
    await new Promise(r => setTimeout(r, 1000)); // servers are bad

    const authorBioResponseJson = await authorBioResponse.json();
    const thumbnailResponse = await fetch(
      mediaRoute + `${authorBioResponseJson.metadata._thumbnail_id[0]}`
    );
    await new Promise(r => setTimeout(r, 1000)); // servers are bad

    const thumbnailResponseJson = await thumbnailResponse.json();
    const thumbnailJpeg = thumbnailResponseJson.guid.rendered;
    return {
      id: coauthor,
      name: authorBioResponseJson.post_title,
      pronouns: authorBioResponseJson.metadata.pronouns
        ? authorBioResponseJson.metadata.pronouns.length > 0
          ? authorBioResponseJson.metadata.pronouns[0]
          : ""
        : "",
      bio: authorBioResponseJson.metadata["cap-description"][0],
      artist_statement: authorBioResponseJson.metadata.artist_statement[0],
      thumbnail: thumbnailJpeg,
    };
  }
}

export { createStoryObjects, getAuthor, getFeaturedMedia, htmlParser };
