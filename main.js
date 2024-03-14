import {
  insertAuthors,
  insertCollectionsStories,
  insertStories,
  insertStoriesTags,
} from "./supabase.js";
import { createStoryObjects, htmlParser } from "./wordpress.js";
import cliProgress from 'cli-progress'
import log from 'why-is-node-running'

async function insertAllStoryData() {
  let storyObjects;
  let totalValid = 0;
  storyObjects = await createStoryObjects();
  console.log("TESTING STORYOBJECT LENGTH:", storyObjects.length)
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

  bar.start(storyObjects.length, 0);
  storyObjects.forEach(async (obj) => {
    bar.increment()
    await insertStories(obj);
    await insertStoriesTags(obj);
    await insertAuthors(obj);
    await insertCollectionsStories(obj);
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
  bar.stop()
  console.log(`Total Valid: ${totalValid}, Total Stories: ${storyObjects.length}, Percent Passed: ${totalValid / storyObjects.length * 100}%`)
}

insertAllStoryData();

