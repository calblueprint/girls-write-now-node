import { createClient } from "@supabase/supabase-js";
import "dotenv/config.js";
import { decode } from "html-entities";
import { getAuthor, getFeaturedMedia, htmlParser } from "./wordpress.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const storyTagCateogories = ["tone", "topic", "genre-medium"];

async function insertStories(storyObject) {
  try {
    const htmlParsedObject = htmlParser(
      storyObject.content.rendered,
      storyObject.excerpt.rendered,
      storyObject.title.rendered,
      storyObject.link
    );
    console.log("HTML PARSED OBJECT:", htmlParsedObject)
    const featuredMediaLink = await getFeaturedMedia(
      storyObject.featured_media
    );
    const { error } = await supabase.from("stories").upsert([
      {
        id: storyObject.id,
        date: storyObject.date,
        title: decode(storyObject.title.rendered),
        content: { html: htmlParsedObject.story },
        process: { html: htmlParsedObject.process },
        excerpt: { html: htmlParsedObject.excerpt },
        featured_media: featuredMediaLink,
        link: storyObject.link,
      },
    ]);
    if (error) {
      console.log(
        `Unable to push story ${storyObject.id} to Supabase: ${error.code}`
      );
    } else {
      console.log(`Inserted story ${storyObject.id} to Supabase`);
    }
  } catch (error) {
    console.log(`Unable to parse story content: ${error}`);
  }
}

async function insertStoriesTags(storyObject) {
  for (const category of storyTagCateogories) {
    for (const tag of storyObject[category]) {
      const { error } = await supabase
        .from("stories_tags")
        .insert([{ story_id: storyObject.id, tag_id: tag }]);
      if (error) {
        `Unable to insert tags for story ${storyObject.id}: ${error}`;
      }
    }
  }
  console.log(`Inserted tags for story ${storyObject.id}`);
}

async function insertCollectionsStories(storyObject) {
  for (const id of storyObject["collection"]) {
    const { error } = await supabase
      .from("collections_stories")
      .upsert([{ story_id: storyObject.id, collection_id: id }]);
    if (error) {
      console.log(
        `Unable to insert story ${storyObject.id} to collection ${id}: ${error}`
      );
    }
  }
  console.log(`Inserted story ${storyObject.id} into respective collections`);
}

async function insertAuthors(storyObject) {
  try {
    const authorObject = await getAuthor(storyObject);
    const { error } = await supabase.from("authors").upsert({
      id: authorObject.id,
      name: authorObject.name,
      pronouns: authorObject.pronouns,
      bio: authorObject.bio,
      artist_statement: authorObject.artist_statement,
      image: authorObject.thumbnail,
    });
    if (error) {
      console.log(`Unable to insert author ${authorObject.id}: ${error.code}`);
    }
    await insertStoriesAuthors(storyObject.id, authorObject.id);
    console.log(`Inserted author ${authorObject.id}`);
  } catch (error) {
    console.log(`Unable to get author from WP: ${error}`);
  }
}

async function insertStoriesAuthors(storyID, authorID) {
  const { error } = await supabase.from("stories_authors").upsert({
    story_id: storyID,
    author_id: authorID,
  });
  if (error) {
    console.log(
      `Unable to insert author ${authorID} to story ${storyID}: ${error}`
    );
  }
  console.log(`Inserted author ${authorID} to story ${storyID}`);
}

export {
  insertAuthors,
  insertCollectionsStories,
  insertStories,
  insertStoriesTags
};

