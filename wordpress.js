// Code goes here!
import { decode } from 'html-entities';
import fetch from 'node-fetch';

const storyRoute = 'https://girlswritenow.org/wp-json/wp/v2/story/\?per_page=20';
const genreMediumRoute = 'https://girlswritenow.org/wp-json/wp/v2/genre-medium/';


//function fetches story object from wordpress story endpoint
const getAllStories = async () => {
    try {
      const response = await fetch(storyRoute);
      const responseJson = await response.json();
      return responseJson;
    } catch (error) {
      console.log('Error');
      throw error;
    }
  };

  //function fetches genre medium object from wordpress genreMedium endpoint
  const getAllGenreMediums = async () => {
    try {
      const response = await fetch(genreMediumRoute);
      const responseJson = await response.json();
    //   console.log(responseJson);
      return responseJson;
    } catch (error) {
      console.log('Error');
      throw error;
    }
  }; 


//this function removes specific story objects after being passed in an array of indexes
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

//function will filter out non-text story objects
const filterStories = async (storyObject) => {
  const genreMediumDict = {};
    const genreMediumResponse = await getAllGenreMediums();
    genreMediumResponse.map((obj) => {
        genreMediumDict[obj.id] = obj.name;
    });
    const idArray = [344, 383, 405, 414, 416, 470, 478, 503, 564, 568, 635, 712, 1202, 1205, 1216, 1315, 1350, 1351, 1771, 1804, 1885, 2437, 2438];
    const indexList = [];
    for (const id of idArray) {
      storyObject.forEach((obj, index) => {
        if( obj["genre-medium"].includes(id)) {
          indexList.push(index);
        }
      })
    }
    console.log(indexList);
    const filteredData = removeElementsByIndexes(storyObject, indexList);
    return filteredData;
  }

  //function will return featured media link associated with each story (usually an image/jpeg)
  const getFeaturedMedia = async (featuredmediaId) => {
    const featuredMediaLink = 'https://girlswritenow.org/wp-json/wp/v2/media/' + `${featuredmediaId}`;
    const response = await fetch(featuredMediaLink);
    const responseJson = await response.json();
    return responseJson.link;

  }

  //function will apply regex functions to storyObject outputs such as process, story, heading, etc. 
  function htmlParser(htmlString, htmlExcerpt) {
    const regexHeading = /(<h2(.*?)h2>)/;
    const regexStory = /(\n+<p(.*?)p>)+/;
    const regexProcess = /<p>&nbsp(.*?)p>/;
    const regexExcerpt = /<p>(.*?)<\/p>/;
  
    const heading = regexHeading.exec(htmlString);
    const story = regexStory.exec(htmlString);
    const process = regexProcess.exec(htmlString);
    const excerpt = regexExcerpt.exec(htmlExcerpt);
  
    const contentHeading = heading
      ? decode(heading[0])
      .replace('</h2>', '')
      .replace(/<h2.+>/, '')
      : '';

    const contentStory = story
      ? decode(story[0])
      .replace(/(\n)+/gi, '')
      .replace(/<p>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      : '';
    const contentProcess = process
      ? decode(process[0])
      .replace(/<p>/gi, '')
      .replace(/<\/p>/gi, '')
      : '';
    const contentExcerpt = excerpt
      ? decode(excerpt[0])
      .replace(/<p>/gi, '')
      .replace(/<\/p>/gi, '')
      : '';
    return {
      heading: contentHeading,
      story: contentStory,
      process: contentProcess,
      excerpt: contentExcerpt
    };
  }


  //this function creates a story Object after running it through filterStories() and removing non-text related stories
  async function createStoryObjects() {
    const unfilteredStoryDataObject = await getAllStories();
    const storyData = await filterStories(unfilteredStoryDataObject);
    return storyData;
}

export { createStoryObjects, getFeaturedMedia, htmlParser };





