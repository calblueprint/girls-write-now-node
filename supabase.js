import { createClient } from '@supabase/supabase-js';
import "dotenv/config.js";
import { filterStories, getAllStories } from './index.js';


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertStoryData() {
    const unfilteredStoryData = await getAllStories();
    const storyData = await filterStories(unfilteredStoryData);
    console.log(storyData);
    storyData.forEach(async obj => {
        const { data, error } = await supabase
        .from('stories')
        .insert([
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

}


insertStoryData();






