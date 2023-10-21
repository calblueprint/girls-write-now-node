import { createClient } from '@supabase/supabase-js';
import "dotenv/config.js";
import { decode } from 'html-entities';
import { filterStories, getAllStories, getFeaturedMedia, htmlParser } from './index.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createStoryObject() {
    const unfilteredStoryData = await getAllStories();
    const storyData = await filterStories(unfilteredStoryData);
<<<<<<< HEAD
    return storyData;
=======
    console.log(storyData);
    storyData.forEach(async obj => {
        const { data, error } = await supabase
        .from('stories')
        .upsert([
        { 
            id: obj.id,
            date: obj.date, 
            title: obj.title.rendered, 
            content: obj.content.rendered, //need to push content through html parser 
            process: obj.content.rendered, //need to extract process content from content after its parsed 
            excerpt: obj.excerpt.rendered,
            featured_media: obj.featured_media  //featured media is currently just an ID, need to extract links somehow
        },
        ])

    })

>>>>>>> 14abb081fd599e6b6ef962f5726a151c0fba01a5
}

async function insertStoryData() {
    let storyObject;
    try {
        storyObject = await createStoryObject();
    } finally {
        storyObject.forEach(async obj => {
            const htmlParsedObject = htmlParser(obj.content.rendered, obj.excerpt.rendered); // returns object {heading:contentHeading, story:contentStory, process:contentProcess}
            const featuredMediaLink = await getFeaturedMedia(obj.featured_media);
            await insertStoryTags(obj);
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

// async function insertStoryTags(storyObject) {
//     const categories = ['tone', 'topic', 'genre-medium']
//     // const storyObject = await createStoryObject();
//     storyObject.forEach(async obj => {
//         let idArray = [];
//         for (const category in categories){
//             idArray = idArray.concat(obj[category]);
//         }
//         console.log(idArray);
//         })

async function insertStoryTags(storyObject) {
const categories = ['tone', 'topic', 'genre-medium'];
    for (const category of categories) {
      for (const tag of storyObject[category]) {
        try {
          const { error } = await supabase
            .from('stories_tags')
            .insert([{ story_id: story.id, tag_id: tag }]);
          console.log(`Added tag ${tag}`);
        } catch (error) {
          console.log(error);
        }
      }
		}
}

    // storyObject.forEach(async obj => {
    //     const idArray = [];
    //     for (const category of categories){
    //         idArray.concat(obj[category]); 
    //     }
    //     for (const id of idArray) {
    //         try {
    //             const {error} = await supabase
    //             .from('stories_tags')
    //             .insert([{story_id: obj.id, tag_id: id }])
    //         } catch (error) { 
    //             console.log(error)
    //         } 
    //     }
    // })




// createStoryObject();
insertStoryData();
// insertStoryTags();





