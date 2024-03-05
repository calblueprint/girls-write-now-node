import {
  insertAuthors,
  insertCollectionsStories,
  insertStories,
  insertStoriesTags,
} from "./supabase.js";
import { createStoryObjects, htmlParser } from "./wordpress.js";

async function insertAllStoryData() {
  let storyObjects;
  let totalValid = 0;
  storyObjects = await createStoryObjects();
  console.log("TESTING STORYOBJECT LENGTH:", storyObjects.length)
  storyObjects.forEach(async (obj) => {
    await insertStories(obj);
    await insertStoriesTags(obj);
    // await insertCollectionsStories(obj);
    await insertAuthors(obj);
    // const htmlParsedObject = htmlParser(
    //   obj.content.rendered,
    //   obj.excerpt.rendered,
    //   obj.title.rendered,
    //   obj.link
    // );
    // if (htmlParsedObject.valid) {
    //   totalValid++;
    // }

    // console.log(obj);
  });
  console.log(`Total Valid: ${totalValid}, Total Stories: ${storyObjects.length}, Percent Passed: ${totalValid / storyObjects.length * 100}%`)
}

insertAllStoryData();
