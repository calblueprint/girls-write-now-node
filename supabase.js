import { createClient } from '@supabase/supabase-js';
import "dotenv/config.js";
import { decode } from 'html-entities';
import { createStoryObjects, getFeaturedMedia, htmlParser } from './wordpress.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


async function insertStoryData() {
    let storyObject;
    try {
        storyObject = await createStoryObjects();
    } finally {
        storyObject.forEach(async obj => {
            const htmlParsedObject = htmlParser(obj.content.rendered, obj.excerpt.rendered); 
            const featuredMediaLink = await getFeaturedMedia(obj.featured_media);
            await insertStoryTags(obj);
            await insertCollectionTags(obj);
            await getAuthor(obj);

            try {
                const { data, error } = await supabase
                .from('stories')
                .upsert([
                { 
                    id: obj.id,
                    date: obj.date, 
                    title: decode(obj.title.rendered), 
                    content: htmlParsedObject.story, 
                     process: htmlParsedObject.process, 
                    excerpt: htmlParsedObject.excerpt,
                    featured_media: featuredMediaLink, 
                    link: obj.link 
                },
                ])
            } catch(error) {
                console.log(error);
            } 
        })
    }
}

async function insertStoryTags(storyObject) {
const categories = ['tone', 'topic', 'genre-medium'];
    for (const category of categories) {
      for (const tag of storyObject[category]) {
        try {
          const { error } = await supabase
            .from('stories_tags')
            .insert([{ story_id: storyObject.id, tag_id: tag }]);
          console.log(`Added tag ${tag}`);
        } catch (error) {
          console.log(`error message: adding story tags into stories_tag schema: ${error}`);
        }
      }
	}
}

async function insertCollectionTags(storyObject) {
    for (const id of storyObject['collection']) {
        try {
         const {error} = await supabase
          .from('collections_stories')
          .insert([{story_id: storyObject.id, collection_id: id }])
           console.log(`Added collection tag ${tag}`);
        } catch (error) {
          console.log(`error message: adding story tags into collections_stories schema: ${error}`);
            }
        }
}

const gwnEmail = process.env.GWN_USERNAME;
const gwnPassword = process.env.GWN_PASSWORD; 
const headers = new Headers();
headers.set('Authorization', 'Basic ' + Buffer.from(gwnEmail + ":" + gwnPassword).toString('base64')); //can i move this outside the function?


async function getAuthor(storyObject) {
    const re = /\d+/; //regex to extract integers from string 
    const endpoint = "https://girlswritenow.org/wp-json/wp/v2/story/" + `${storyObject.id}`;
    const coauthorObject = await fetch(endpoint); 
    const coauthorObjectJson = await coauthorObject.json();
    for (const coauthor of coauthorObjectJson.coauthors) {
        const coauthorUrl = `https://girlswritenow.org/wp-json/wp/v2/coauthors/${coauthor}`;
        const coauthorResponse = await fetch(coauthorUrl, {
            method:'GET',
            headers: headers, //global headers
       })
        const responseJson = await coauthorResponse.json();
        const authorId = re.exec(responseJson.description)[0]; 
        const authorMetadataUrl = `https://girlswritenow.org/wp-json/elm/v1/guest-authors/${authorId}`;
        const metadataResponse = await fetch(authorMetadataUrl, {
            method:'GET',
            headers: headers,
        })
        const metadataResponseJson = await metadataResponse.json();
        insertAuthors(metadataResponseJson, coauthor );
      }
    
}
async function insertAuthors(authorObject, id) {
    const thumbnailResponse = await fetch (`https://girlswritenow.org/wp-json/wp/v2/media/${authorObject.metadata._thumbnail_id[0]}`)
    const thumbnailResponseJson = await thumbnailResponse.json();
    const thumbnailJpeg = thumbnailResponseJson.guid.rendered;
    try {
        const {data, error} = await supabase
         .from('authors')
         .insert(
            {
                id: id, 
                name: authorObject.post_title,
                pronouns: authorObject.metadata.pronouns[0],
                bio: authorObject.metadata["cap-description"][0],
                artist_statement: authorObject.metadata.artist_statement[0],
                thumbnail: thumbnailJpeg
            })
        console.log(`Added author information ${id}`);
       } catch (error) {
         console.log(`error message: could not add author information to supabase ${error}`);
           }

}


export {
    insertStoryData
};
  







