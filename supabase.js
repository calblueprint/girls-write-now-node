import { createClient } from '@supabase/supabase-js';
import { filterStories } from './index';


const supabaseUrl = proccess.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertStoryData() {
    const storyData = filterStories();
    storyData.forEach(async obj => {
        const { data, error } = await supabase
        .from('stories')
        .insert([
        { id: obj.id,
         date: obj.date, 
         title: obj.title.rendered, 
         content: obj.content.rendered, 
        //  process: 'adfadf',
         excerpt: obj.excerpt.rendered,
        featured_media: obj.featured_media  },
        ])

    })

}


insertStoryData();







// async function insertData() {
//     const { data: result, error } = await supabase
//       .rpc('insert_data', { data });
  
//     if (error) {
//       console.error('Error inserting data:', error);
//     } else {
//       console.log('Data inserted successfully:', result);
//     }
//   }
  
//   insertData();




//supabase backend object looks like:
//{id:, date:, title:, content:, process:, excerpt:, featured_media:, link:  }
// const { error } = await supabase
//   .from('stories')
//   .insert({ id: 1, title: 'Denmark', content: adfasdfasd, process: adfadsf, excerpt: adfasdf, featured_media:aadsfafda, link:asdfasdfads })




//approach 1: iterate through filteredStories and pull data that I want to see in the database