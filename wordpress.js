import { decode } from "html-entities";
import fetch from "node-fetch";

const allStoriesRoute =
	"https://girlswritenow.org/wp-json/wp/v2/story/?per_page=10&page=10";
const genreMediumRoute =
	"https://girlswritenow.org/wp-json/wp/v2/genre-medium/";
const mediaRoute = "https://girlswritenow.org/wp-json/wp/v2/media/";
const coauthorsRoute = "https://girlswritenow.org/wp-json/wp/v2/coauthors/";
const authorBioRoute =
	"https://girlswritenow.org/wp-json/elm/v1/guest-authors/";

const gwnEmail = process.env.GWN_USERNAME;
const gwnPassword = process.env.GWN_PASSWORD;
const headers = new Headers();
headers.set(
	"Authorization",
	"Basic " + Buffer.from(gwnEmail + ":" + gwnPassword).toString("base64")
);

/* Fetch all story objects from WP story endpoint. */
const getAllStories = async () => {
	const response = await fetch(allStoriesRoute);
	const responseJson = await response.json();
	return responseJson;
};

/* Fetch all genre-medium IDs from WP genreMedium endpoint. */
const getAllGenreMediums = async () => {
	const response = await fetch(genreMediumRoute);
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
	// Use to manually update nonTextGenres if needed
	// const genreMediumDict = {};
	// const genreMediumResponse = await getAllGenreMediums();
	// genreMediumResponse.map((obj) => {
	//   genreMediumDict[obj.id] = obj.name;
	// });

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
	const response = await fetch(featuredMediaLink);
	const responseJson = await response.json();
	return responseJson.link;
};

/* Parse storyObject content into Heading, Story, Process, and Excerpt. */
function htmlParser(htmlString) {
	// const regexHeading = /(<h2(.*?)h2>)/;
	console.log(htmlString);
	// const regexStory = /<\/h2>\n*(.*)\n*Process/;
	// '<\/h2>\n*(.*)\n*Process'
	const regexStoryTest = RegExp('section*');
	const regexProcessTest = RegExp('(Process(.*)clickable-area)');
	// const regexProcess = /(Process(.*)clickable-area)/;


	// const heading = regexHeading.exec(htmlString);
	const story = regexStoryTest.exec(htmlString);
	const process = regexProcessTest.exec(htmlString);
	console.log("story and process before replacement:", story, process)
	// const excerpt = regexExcerpt.exec(htmlExcerpt);

	// const contentHeading = heading
	// 	? decode(heading[0])
	// 			// .replace("</h2>", "")
	// 			// .replace(/<h2.+>/, "")
	// 	: "";

	const contentStory = story
		? decode(story[0])
				.replace(/(\n)+/gi, "")
				.replace(/<p>/gi, "")
				.replace(/<\/p>/gi, "\n\n")
		: "";
	const contentProcess = process
		? decode(process[0])
		.replace(/<p>/gi, "")
		.replace(/<\/p>/gi, "")
		: "";


		console.log("Process and Story Object:", story, process)
	// const contentExcerpt = excerpt
	// 	? decode(excerpt[0])
		// .replace(/<p>/gi, "")
		// .replace(/<\/p>/gi, "")
		// : "";
	return {
		// heading: contentHeading,
		story: contentStory,
		process: contentProcess,
		// excerpt: contentExcerpt,
	};
}

/* Create storyObject from raw WP story response. */
async function createStoryObjects() {
	const unfilteredStoryObjects = await getAllStories();
	const filteredStoryObjects = await filterStories(unfilteredStoryObjects);
	return filteredStoryObjects;
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
		const responseJson = await coauthorResponse.json();
		const authorId = re.exec(responseJson.description)[0];
		const authorBioEndpoint = authorBioRoute + `${authorId}`;
		const authorBioResponse = await fetch(authorBioEndpoint, {
			method: "GET",
			headers: headers,
		});
		const authorBioResponseJson = await authorBioResponse.json();
		const thumbnailResponse = await fetch(
			mediaRoute + `${authorBioResponseJson.metadata._thumbnail_id[0]}`
		);
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

getAllStories();

export { createStoryObjects, getAuthor, getFeaturedMedia, htmlParser };


