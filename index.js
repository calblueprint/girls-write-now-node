// Code goes here!
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const { decode } = require('html-entities');
const axios = require('axios');

const story = {
  id: 170947,
  date: '2023-08-31T15:59:30',
  title: 'It&#8217;s Carnival',
  content:
    '<p>When her alarm sounded, the sun had yet to break the darkness of night. Samantha dragged herself out of bed and became aware of the soca music already blasting through her house. Despite its recurrence every year, her heart always awaited the arrival of Carnival. Today was Labor Day and she was finally going to play Mas again. Her walls were adorned with past headpieces from both the main and kiddie carnival.&nbsp;</p>\n\n\n\n<p>A few hours later, Samantha and her family members were fully decked out. They all had on their costumes for their band. The theme this year was \u201cJewels of the Islands,\u201d having each section in rich jewel tones and plenty of bedazzling. Samantha had on a two piece composed of sparkly turquoise material that had gems strategically placed throughout. Her mother helped decorate her box braids with various charms the night before and her makeup had been done to match her costume. She looked over at herself in the mirror, the headpiece and backpack were too large to wear indoors, but she could already imagine the completed look.&nbsp;</p>\n\n\n\n<p>As they traveled to Eastern Parkway, the location of the West Indian Day Parade, it became clearer and clearer that everyone in the city intended to go. Samantha could not contain her smile. All around her, colors danced and the music boomed through her chest. She eyed different flags representing the entire Caribbean bobbing in the crowds and colorful costumes dancing alongside them. Her eyes caught an oversized Jamaican flag waving above the crowd.</p>\n\n\n\n<p>After registering with their band, Samantha and her family members joined everyone else and completed their costumes. She did a few spins with her full costume on, the headpiece and backpack increased her wingspan as the feathers gently caught the wind. The parkway was nothing less than packed as their band joined the procession at the beginning. Ahead of them, they could see the remnants of J\u2019Ouvert celebrators, who had been going since the night before. They danced along the road covered in brightly colored paint or oil with their signature horns and chains. Her eyes continued to scan the processions spotting a few heads that towered far above the crowds sporting Trinidadian flags.&nbsp;</p>\n\n\n\n<p>Her heart was filled with nothing but joy as she danced alongside her band, Machel Montano\u2019s voice sounded out through the speakers over the crowds. Her costume jumped in the air with each movement she did, the sunlight reflected off of the gems on her outfit. The other masqueraders continued to play and dance in her midst, together they formed an amazing colorfilled spectacle. Despite their attempts to remain \u201con duty,\u201d she spied many of the cops who accompanied them with bright smiles on their faces, dancing alongside them and having their own flags tied onto their uniforms.&nbsp;</p>\n\n\n\n<p>Samantha finally pulled out her phone whilst dancing, capturing a short video of herself singing along to Beenie Man while also showing the rest of the parade. Flags and feathers bobbed all around her and she could only assume what the background sounded like as the soca already beat into her heart. Light on her feet, she continued to dance as she posted it to her social media and returned to the moment.&nbsp;&nbsp;</p>\n\n\n\n<p>Further down the parkway, Samantha almost missed their calls. Eventually, the fervent waving of a group of people caught her attention. When she looked their way, her smile widened. It was her friends. Each one of them had their own outfits on, making clear which countries they hailed from. She eyed Grenada, Barbados, and Haiti. Unable to stop for long, she did another grand spin as they recorded and cheered her on, the feathers bouncing around her.&nbsp;</p>\n\n\n\n<p>Over the next few hours, Samantha continued to dance her way down the parkway. She watched as other people danced with each other. No parade-goer, including Samantha, could resist the powerful hold of the music, and the joy around them was nothing but infectious. She had also spied a few Caribbean performers atop trucks, singing their most popular hits and enjoying the parade.&nbsp;</p>\n\n\n\n<p>When they finally reached the end of the parade route, Samantha\u2019s body began to realize how much exercise she had been doing. After capturing a few photos of her costume, she retrieved a large Jamaican flag from her father\u2019s bag, tying it around her shoulders. She handed off her headpiece and backpack to her aunt then sought out her friends.&nbsp;</p>\n\n\n\n<p>\u201cSam!\u201d Samantha turned to the origin of the sound. Her friends waved her over and they exchanged hugs. She could hear the playing of steel pans, knowing a group must have passed earlier. Together, they danced down Flatbush avenue, picking up food and goods from the vendors who lined the streets. She found herself losing track of time once again as they all enjoyed themselves. Samantha only realized it had become night when the blinding NYPD lights switched on at every corner. Soon, they reached the end of the procession, and she rejoined her family members. Carnival was over for this year.&nbsp;</p>\n\n\n\n<p>Samantha couldn\u2019t wait for next year.</p>',
  process:
    'After three long years, the Labor Day Parade finally came back to New York City. I wanted to write something that captured the rich cultural experience that is Caribbean Carnival.',
  excerpt:
    "The colors, sights, and sounds of Carnival have long been a favorite of Samantha's. West Indians take over Brooklyn for the Labor Day weekend and make their presence known.",
  author: 'Allison Elliott',
  featured_media:
    'https://girlswritenow.org/wp-content/uploads/2023/08/Its-Carnvial-Allison-Elliott.png',
  collection: ['Cool Stories'],
  genreMedium: [475, 518],
  tone: [2675, 506, 1266],
  topic: [505, 453, 544, 356],
  link: 'https://girlswritenow.org/stories/its-carnival/',
};

const supabaseUrl =
  process.env.SUPABASE_URL || 'supabase url not found as an env variable';
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  'supabase anon key not found as an env variable';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const insertTags = async () => {
  const categories = [
    'https://girlswritenow.org/wp-json/wp/v2/genre-medium/?per_page=100',
    'https://girlswritenow.org/wp-json/wp/v2/topic/?per_page=100',
    'https://girlswritenow.org/wp-json/wp/v2/tone/?per_page=100',
  ];
  for (const category of categories) {
    axios
      .get(category)
      .then(async res => {
        for (const object of res.data) {
          try {
            const { error } = await supabase.from('tags').insert([
              {
                id: object.id,
                name: decode(object.name),
                category: object.taxonomy,
              },
            ]);
            console.log(`Added ${decode(object.name)}`);
          } catch (error) {
            console.log(error);
          }
        }
      })
      .catch(err => console.log(err));
  }
};

const insertStory = async story => {
  try {
    const { error } = await supabase.from('stories').upsert([
      {
        id: story.id,
        date: story.date,
        title: decode(story.title),
        content: decode(story.content),
        process: decode(story.process),
        excerpt: decode(story.excerpt),
        featured_media: story.featured_media,
        link: story.link,
      },
    ]);
  } catch (error) {
    console.log(error);
  } finally {
    const categories = ['tone', 'topic', 'genreMedium'];
    for (const category of categories) {
      for (const tag of story[category]) {
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
    console.log(`Success! Added ${decode(story.title)}`);
  }
};

insertStory(story);
// insertTags();
