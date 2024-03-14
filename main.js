import fs from 'fs'
import {
  insertAuthors,
  insertStories,
  insertStoriesTags,
} from "./supabase.js";
import { createStoryObjects } from "./wordpress.js";
import cliProgress from 'cli-progress'
import colors from 'ansi-colors';

const bar = new cliProgress.SingleBar({
  format: 'Port Progress |' + colors.cyan('{bar}') + '| {percentage}% || ETA: {eta}s || Progress: {value}/{total} || Current Story: "{storyTitle}" (segment: {segment})',
}, cliProgress.Presets.shades_classic);

async function insertAllStoryData() {
  let totalValid = 0;

  let startStory = 0;
  let endStory = 200;
  let currentIndex = 0
  let storyObjects = createStoryObjects(startStory, endStory);

  bar.start(endStory - startStory, 0);
  bar.update(bar.getProgress(), { storyTitle: "None", segment: "Fetching Stories" })

  let logStream = fs.createWriteStream('errored_stories.txt', { flags: 'a+' });

  for await (const obj of storyObjects) {
    try {
      bar.update(currentIndex, { storyTitle: obj.title.rendered, segment: "Inserting Content" })
      await insertStories(obj);
    } catch (error) {
      console.log(`Error on story "${obj.title.rendered}" (id: ${obj.id}, link: ${obj.link}) for segment "Inserting Content"`)
      console.log(`Error:`)
      console.log(error)
      logStream.write(obj.id);
    }

    try {
      bar.update(currentIndex, { storyTitle: obj.title.rendered, segment: "Inserting Tags" })
      await insertStoriesTags(obj);
    } catch (error) {
      console.log(`Error on story "${obj.title.rendered}" (id: ${obj.id}, link: ${obj.link}) for segment "Inserting Tags"`)
      console.log(`Error:`)
      console.log(error)
      logStream.write(obj.id);
    }

    try {
      bar.update(currentIndex, { storyTitle: obj.title.rendered, segment: "Inserting Authors" })
      await insertAuthors(obj);
    } catch (error) {
      console.log(`Error on story "${obj.title.rendered}" (id: ${obj.id}, link: ${obj.link}) for segment "Inserting Authors"`)
      console.log(`Error:`)
      console.log(error)
      logStream.write(obj.id);
    }

    currentIndex++;
    bar.increment()
  };
  logStream.end()
  bar.stop()
  console.log(`Total Valid: ${totalValid}, Total Stories: ${storyObjects.length}, Percent Passed: ${totalValid / storyObjects.length * 100}%`)
}

insertAllStoryData();

