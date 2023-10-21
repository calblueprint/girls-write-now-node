// Code goes here!
import { decode } from 'html-entities';
import fetch from 'node-fetch';

const collectionsRoute = 'https://girlswritenow.org/wp-json/wp/v2/collection';
const storyRoute = 'https://girlswritenow.org/wp-json/wp/v2/story/';
const topicRoute = 'https://girlswritenow.org/wp-json/wp/v2/topic';
const authorRoute = 'https://girlswritenow.org/wp-json/wp/v2/coauthors';
const genreMediumRoute = 'https://girlswritenow.org/wp-json/wp/v2/genre-medium/\?per_page=100';


//port all data from word press to supabase --> getAllCollections --> clean up data --> push to supabase (reference query syntax)
//will talk about schema during the meeting 

 const getAllCollections = async () => {
  try {
    const response = await fetch(collectionsRoute);
    const responseJson = await response.json();
    // console.log(responseJson);
    return responseJson;
  } catch (error) {
    console.log('Error');
    throw error;
  }
};

const getAllStories = async () => {
    try {
      const response = await fetch(storyRoute);
      const responseJson = await response.json();
    //   console.log(responseJson);
      return responseJson;
    } catch (error) {
      console.log('Error');
      throw error;
    }
  };


  const getAllTopics = async () => {
    try {
      const response = await fetch(topicRoute);
      const responseJson = await response.json();
      // console.log(responseJson);
      return responseJson;
    } catch (error) {
      console.log('Error');
      throw error;
    }
  };

   const getAllAuthors = async () => {
    try {
      const response = await fetch(authorRoute);
      const responseJson = await response.json();
      // console.log(responseJson);
      return responseJson;
    } catch (error) {
      console.log('Error');
      throw error;
    }
  };

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


//https://javascript.plainenglish.io/how-to-remove-objects-from-a-javascript-array-by-object-property-4c3da1b8393b#:~:text=We%20can%20use%20the%20JavaScript,the%20index%20returned%20by%20findIndex%20.

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
    // const unfilteredData = await getAllStories();
    const genreMediumResponse = await getAllGenreMediums();
    genreMediumResponse.map((obj) => {
        genreMediumDict[obj.id] = obj.name;
    });
    const indexList = [];
    storyObject.forEach((obj, index) => {
        if (obj["genre-medium"].includes(383) ||
            obj["genre-medium"].includes(405)|| 
            obj["genre-medium"].includes(414) ||
            obj["genre-medium"].includes(470) ||
            obj["genre-medium"].includes(478) ||
            obj["genre-medium"].includes(503) ||
            obj["genre-medium"].includes(568) ||
            obj["genre-medium"].includes(712) ||
            obj["genre-medium"].includes(635) ||
            obj["genre-medium"].includes(1202) ||
            obj["genre-medium"].includes(1216) ||
            obj["genre-medium"].includes(1315) ||
            obj["genre-medium"].includes(1885) ||
            obj["genre-medium"].includes(2437)) {
                indexList.push(index);
            }
    })
    const filteredData = removeElementsByIndexes(storyObject, indexList);
    return filteredData;
  }

  const getFeaturedMedia = async (featuredmediaId) => {
    const featuredMediaLink = 'https://girlswritenow.org/wp-json/wp/v2/media/' + `${featuredmediaId}`;
    const response = await fetch(featuredMediaLink);
    const responseJson = await response.json();
    return responseJson.link;

  }
  //returns link from featuredMedia endpoint query (usually an image or jpeg)


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
      : '';

    const contentStory = story
      ? decode(story[0])
      : '';
    const contentProcess = process
      ? decode(process[0])
      : '';
    const contentExcerpt = excerpt
      ? decode(excerpt[0])
      : '';
    return {
      heading: contentHeading,
      story: contentStory,
      process: contentProcess,
      excerpt: contentExcerpt
    };
  }





export {
  filterStories, getAllStories, getFeaturedMedia, htmlParser
};



