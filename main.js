import fs from "fs";
import { insertAuthors, insertStories, insertStoriesTags } from "./supabase.js";
import { createStoryObjects } from "./wordpress.js";
import cliProgress from "cli-progress";
import colors from "ansi-colors";
import bb from "bluebird";
const { Promise } = bb;

const bar = new cliProgress.SingleBar(
  {
    format:
      "|" +
      colors.cyan("{bar}") +
      '| {percentage}% || ETA: {eta}s || {value}/{total} stories || Current: "{storyTitle}" (segment: {segment})',
  },
  cliProgress.Presets.shades_classic
);

async function insertAllStoryData() {
  let startStory = 0;
  let endStory = 1250;
  let storyObjects = createStoryObjects(startStory, endStory);

  let logStream = fs.createWriteStream("errored_stories.txt", { flags: "a+" });

  Promise.map(
    storyObjects,
    async (stories) => {
      bar.start(endStory - startStory, 0);
      bar.update(bar.getProgress(), {
        storyTitle: "None",
        segment: "Fetching Stories",
      });

      await Promise.map(
        stories,
        async (storyObject) => {
          try {
            bar.update({
              storyTitle: storyObject.title.rendered,
              segment: "Inserting Content",
            });
            await insertStories(storyObject);
          } catch (error) {
            console.log(
              `\nError on story "${storyObject.title.rendered}" (id: ${storyObject.id}, link: ${storyObject.link}) for segment "Inserting Content"`
            );
            console.log(`Error:`);
            console.log(error);
            logStream.write(storyObject.id.toString());
            logStream.write("\n");
          }

          try {
            bar.update({
              storyTitle: storyObject.title.rendered,
              segment: "Inserting Tags",
            });
            await insertStoriesTags(storyObject);
          } catch (error) {
            console.log(
              `\nError on story "${storyObject.title.rendered}" (id: ${storyObject.id}, link: ${storyObject.link}) for segment "Inserting Tags"`
            );
            console.log(`Error:`);
            console.log(error);
            logStream.write(storyObject.id.toString());
            logStream.write("\n");
          }

          try {
            bar.update({
              storyTitle: storyObject.title.rendered,
              segment: "Inserting Authors",
            });
            await insertAuthors(storyObject);
          } catch (error) {
            console.log(
              `\nError on story "${storyObject.title.rendered}" (id: ${storyObject.id}, link: ${storyObject.link}) for segment "Inserting Authors"`
            );
            console.log(`Error:`);
            console.log(error);
            logStream.write(storyObject.id.toString());
            logStream.write("\n");
          }

          bar.increment();
        },
        { concurrency: 3 }
      );
    },
    { concurrency: 1 }
  );

  logStream.end();
  bar.stop();
}

insertAllStoryData();
