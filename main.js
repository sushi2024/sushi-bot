// Initialize dotenv
require('dotenv').config();

const axios = require('axios') //you can use any http client - http/https requests
const fs = require('fs'); // file system - for downloading image
const tf = require('@tensorflow/tfjs-node') // tensorflow - for NSFWJS
const nsfw = require('nsfwjs') // NSFWJS image detector

// Discord.js versions ^13.0 require us to explicitly define client intents
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});


//detect NSFW image using image file path
async function detectNSFW(imagePath) {
  const pic = await axios.get(imagePath, {
    responseType: 'arraybuffer',
  })
  const model = await nsfw.load() // To load a local model, nsfw.load('file://./path/to/model/')
  // Image must be in tf.tensor3d format
  // you can convert image to tf.tensor3d with tf.node.decodeImage(Uint8Array)
  const image = await tf.node.decodeImage(pic.data)
  const predictions = await model.classify(image)
  console.log(predictions)
  return predictions;
}


//download image avatar using url
async function downloadAvatar(avatarURL, filePath) {
    const response = await axios.get(avatarURL, { responseType: 'stream' });
    response.data.pipe(fs.createWriteStream(filePath));
}


// this function creates and returns a filepath based on the avatar file type and local directory path
function createFilePath(avatarURL) {
    // Specify the file path where you want to save the avatar
    
    // file types
    const avatarTypes = ['.gif', '.png', 'jpg', 'jpeg'];
    // check avatarURL file type using avatar url string contains substring of .gif, .png, .jpg
    for(i = 0; i < avatarTypes.length; i++) {
        if(avatarURL.includes(avatarTypes[i])){
            console.log(`Found file type: ${avatarTypes[i]}`);

            // create filepath using file type as file extension
            let filePath = `./avatars/user_avatar${avatarTypes[i]}`;

            // break for loop when function returns filepath
            return filePath;
        } else if(avatarURL.includes('.webp')){
            let filePath = `./avatars/user_avatar.png`;
            return filePath;
        }
    }
}


client.on('ready', () => {
 console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", msg => {
    if (msg.content === "Hi my child") {
      msg.reply("Hi mother");
    }
  })

  client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!avatar')) {
      const user = message.mentions.users.first() || message.author;
      const avatarURL = user.displayAvatarURL({ format: 'png', dynamic: true, size: 2048 });
      message.channel.send(`${user.tag}'s avatar: ${avatarURL}`);
    }
  });

  client.on('messageCreate', (message) => {
    if (message.content.startsWith('!getavatar')) {
        const user = message.mentions.users.first() || message.author;
        const avatarURL = user.displayAvatarURL({ format: 'png', dynamic: true, size: 2048 });
        message.channel.send(`${user.tag}'s avatar: ${avatarURL}`);

        //create filepath using crateFilePath function
        let filePath = createFilePath(avatarURL);

        // download avatar from url and put it in filepath specified
        downloadAvatar(avatarURL, filePath);
        console.log(avatarURL);

        async function getResults(url) {
            let avatarURL = url.replace('webp', 'png');
            console.log(avatarURL);
            let results = await detectNSFW(avatarURL);
            results.forEach(result => {
                message.channel.send(`${result.className}: ${Math.floor(result.probability * 100)}%`);
            });
        };
        getResults(avatarURL);

    }
  });


// Log In our bot
client.login(process.env.TOKEN);