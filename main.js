import {
	insertAuthors,
	insertCollectionsStories,
	insertStories,
	insertStoriesTags,
} from "./supabase.js";
import { createStoryObjects } from "./wordpress.js";

async function insertAllStoryData() {
	let storyObjects;
	try {
		storyObjects = await createStoryObjects();
		console.log("TESTING STORYOBJECT LENGTH:", storyObjects.length)
	} catch (error) {
		console.log(`Unable to get all stories: ${error}`);
		return;
	} finally {
		storyObjects.forEach(async (obj) => {
			await insertStories(obj);
			await insertStoriesTags(obj);
			await insertCollectionsStories(obj);
			await insertAuthors(obj);
		});
	}
}

insertAllStoryData();
