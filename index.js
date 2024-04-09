const express = require("express")
const bodyParser = require('body-parser');
var cors = require('cors');
const fs = require('fs');
const { imagesUploader, imageUploaderWithBackground } = require("./middlewares/multiple-image-uploader");
const imageUploader = require('./middlewares/single-image-uploader');
const jwt = require('jsonwebtoken');
const config = require('./config');

const app = express()
app.use(bodyParser.json());
app.use(cors());

app.use('/', express.static("./uploads"))

app.get("/memory/:gameName", (req, res) => {
    let gamesData = JSON.parse(fs.readFileSync('./json-files/games.json'));
    var templateFile = fs.readFileSync('./html-files/index.html', 'utf8');

    const imageGridSize = {
      2: 2,
      3: 3,
      4: 4,
      6: 4,
      8: 4,
      10: 5,
      12: 6,
      15: 6,
    }

    const { gameName } = req.params;
    const game = gamesData[gameName.toLowerCase()];
  
    if (game === null || game === undefined) {
      const errorPage = fs.readFileSync('./html-files/error.html', 'utf-8')
      return res.status(404).send(errorPage);
    }
  
    const scriptResponse = `<script>
      const shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1)); 
          [array[i], array[j]] = [array[j], array[i]]; 
        } 
        return array; 
      };

      function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = secs.toString().padStart(2, '0');

          return formattedHours + ":" + formattedMinutes + ":" + formattedSeconds;
      }
      
      function startStopwatch() {
          const timer = setInterval(() => {
              seconds++;
              timePlayed.innerText = formatTime(seconds)
          }, 1000); // Update every second
          
          return timer; // Return the interval ID to stop the stopwatch later if needed
      }

      const startPlay = function(){ 
        timer = startStopwatch();
        playContainer.style.display = 'none';
        showImagesContent();
        playing = true;
        if(soundToggle) {
          backgroundSound.play();
        }
      }

      const continueGame = function(){
        timer = startStopwatch();
        continueContainer.style.display = 'none'
        showImagesContent();
      }

      const pauseGame = function(){
        clearInterval(timer)
        continueContainer.style.display = 'grid'
      }

      const replayGame = function(){
        clearInterval(timer)
        timePlayed.innerText = '00:00:00'
        seconds = 0
        numberOfMatches = 0
        currentGameNumberIdx = 0
        shuffleAndMakeGrid(imgNodes.slice(0, gameNumbers[currentGameNumberIdx] * 2))
        timer = startStopwatch()
        showImagesContent();
      }

      const playBtn = document.getElementById('play');
      const replayBtn = document.getElementById('replay');
      const continueBtn = document.getElementById('continue')
      const playContainer = document.getElementById('play-container');
      const replayContainer = document.getElementById('replay-container');
      const continueContainer = document.getElementById('continue-container');
      const result = document.getElementById('result');

      playBtn.addEventListener('click', startPlay);
      replayBtn.addEventListener('click', replayGame);
      continueBtn.addEventListener('click', continueGame)

      const timePlayed = document.getElementById('time-played');
      timePlayed.innerText = '00:00:00';

      var timer = null;
      var selectedNode = null;
      var seconds = 0;

      var onTimeout = false;

      var numberOfMatches = 0

      const handleImgClick = function (e) {

        if (!this.firstChild.classList.contains('matched') && !onTimeout){
          if(soundToggle) {
            clickSound.play();
          }
          
          if (selectedNode) {

            if (selectedNode.dataset.identifier === this.firstChild.dataset.identifier){
              this.firstChild.classList.add('matched')
              this.firstChild.classList.remove('unmatched')
              
              numberOfMatches++
              onTimeout = true

              setTimeout(()=>{
                onTimeout = false
                this.firstChild.classList.add('taken')
                selectedNode.classList.add('taken')
                if(soundToggle) {
                  matchingSound.play();
                }
                selectedNode = null
              }, 300)


              if (numberOfMatches === gameNumbers[currentGameNumberIdx] && gameNumbers[currentGameNumberIdx] === Math.floor(imgNodes.length/2)){
                clearInterval(timer)
                replayContainer.style.display = 'flex';
                result.innerText = 'Congratulations! You have won the game in ' + timePlayed.innerText + '!';
                timePlayed.innerText = '00:00:00'

              } else if (numberOfMatches === gameNumbers[currentGameNumberIdx]){
                currentGameNumberIdx++
                setTimeout(()=>{
                  shuffleAndMakeGrid(imgNodes.slice(0, 2 * gameNumbers[currentGameNumberIdx]))
                  pauseGame()
                }, 1600)
                numberOfMatches = 0
              }

            } else {

              this.firstChild.classList.remove('unmatched')
              this.firstChild.classList.add('matched')

              onTimeout = true
              setTimeout(()=>{
                onTimeout = false
                this.firstChild.classList.remove('matched')
                this.firstChild.classList.add('unmatched')
                selectedNode.classList.remove('matched')
                selectedNode.classList.add('unmatched')
                selectedNode = null
              }, 500)
            }

          } else {
            this.firstChild.classList.add('matched')
            this.firstChild.classList.remove('unmatched')
            selectedNode = this.firstChild
          } 
        } else {

        }
      }

      const showImagesContent = function (){
        newImgNodes.forEach((imgNode)=>{
          imgNode.firstChild.classList.remove('unmatched')
          imgNode.firstChild.classList.add('matched')
        })

        setTimeout(()=>{
          newImgNodes.forEach((imgNode)=>{
            imgNode.firstChild.classList.remove('matched')
            imgNode.firstChild.classList.add('unmatched')
          })
        }, 1500)
      }

      const shuffleAndMakeGrid = function (currentImageNodes){
        newImgNodes = shuffle(currentImageNodes)
        currentImageNodes = newImgNodes
        
        newImgNodes.forEach((imgNode)=>{
          imgNode.firstChild.classList.remove('taken')
          imgNode.firstChild.classList.remove('matched')
          imgNode.firstChild.classList.add('unmatched')
        })
        gridContainer.innerHTML = ''
        gridContainer.style.gridTemplateColumns = 'repeat(' + imageGridSize[gameNumbers[currentGameNumberIdx]] + ', 13%)'
        replayContainer.style.display = 'none';
        playContainer.style.display = 'none';
        continueContainer.style.display = 'none';
        gridContainer.appendChild(playContainer)
        gridContainer.appendChild(replayContainer)
        gridContainer.appendChild(continueContainer)
        newImgNodes.forEach((imgNode)=>{
          gridContainer.appendChild(imgNode)
        })
      }

      const handleMusicToogle = function (){
        if (soundToggle){
          soundToggle = false
          backgroundSound.pause();
          musicToggleContainer.children[0].style.display = 'block'
          musicToggleContainer.children[1].style.display = 'none'
        } else {
          if (playing){
            backgroundSound.play();
          }
          soundToggle = true
          musicToggleContainer.children[1].style.display = 'block'
          musicToggleContainer.children[0].style.display = 'none'
        }
      }

      function closestLowerOrEqualNumber(target) {
        let closest = -Infinity;
        arr = [2, 3, 4, 6, 8, 10, 12, 15]
    
        for (const num of arr) {
            if (num <= target && num > closest) {
                closest = num;
            }
        }
    
        return closest;
      }

      const imageGridSize = {
        2: 2,
        3: 3,
        4: 4,
        6: 4,
        8: 4,
        10: 5,
        12: 6,
        15: 6,
      }

      const gameNumbers = [2, 3, 4, 6, 8, 10, 12, 15];

      var currentGameNumberIdx = 0;

      const gameData = ${JSON.stringify({...game})};

      gameData.images = gameData.images.slice(0, closestLowerOrEqualNumber(gameData.images.length))

      console.log(gameData.images.length)

      timePlayed.style.color = gameData.counterColor

      const imgNodes = []

      gameData.images.forEach((element, index)=>{
        
        const img1Container = document.createElement("div")
        const img2Container = document.createElement("div")
        img1Container.classList.add("imgContainer")
        img2Container.classList.add("imgContainer")

        const imgElement1 = document.createElement("img")
        const imgElement2 = document.createElement("img")

        const overlay1 = document.createElement("div")
        const overlay2 = document.createElement("div")
        overlay1.classList.add('overlay')
        overlay2.classList.add('overlay')

        overlay1.style.backgroundImage = 'url("http://localhost:3000/${game.cardBackgroundImage}")'
        overlay2.style.backgroundImage = 'url("http://localhost:3000/${game.cardBackgroundImage}")'

        imgElement1.setAttribute("src", ${JSON.stringify(config.baseUrl + "/")} + gameData.images[index]);
        imgElement1.classList.add("unmatched");
        imgElement1.dataset.identifier = gameData.images[index]
        img1Container.addEventListener("click", handleImgClick)
        img1Container.appendChild(imgElement1)
        img1Container.appendChild(overlay1)

        imgElement2.setAttribute("src", ${JSON.stringify(config.baseUrl + "/")} + gameData.images[index]);
        imgElement2.dataset.identifier = gameData.images[index];
        imgElement2.classList.add("unmatched");
        img2Container.addEventListener("click", handleImgClick)
        img2Container.appendChild(imgElement2)
        img2Container.appendChild(overlay2)

        imgNodes.push(img1Container);
        imgNodes.push(img2Container);
      })

      const gridContainer = document.getElementById('gridContainer');
      const gameContainer = document.getElementById('gameContainer');
      const musicToggleContainer = document.getElementById('music-toogle-container');

      musicToggleContainer.children[0].children[0].setAttribute('stroke', gameData.counterColor)
      musicToggleContainer.children[1].children[0].setAttribute('stroke', gameData.counterColor)
      musicToggleContainer.children[0].addEventListener('click', handleMusicToogle);
      musicToggleContainer.children[1].addEventListener('click', handleMusicToogle);
      musicToggleContainer.children[0].style.display = 'none'

      var soundToggle = true;
      var playing = false;

      

      gameContainer.style.backgroundImage = 'url("http://localhost:3000/${game.backgroundImage}")'

      let currentImageNodes;

      shuffleAndMakeGrid(imgNodes.slice(0, gameNumbers[currentGameNumberIdx] * 2))

      playContainer.style.display = 'flex';

      const backgroundSound = new Audio('http://localhost:3000/background_sound.wav');
      backgroundSound.loop = true;
      backgroundSound.volume = 0.4;
      const clickSound = new Audio('http://localhost:3000/click_sound.wav');
      const matchingSound = new Audio('http://localhost:3000/matching_sound.wav');

    </script>`;

    templateFile = templateFile.replace('Game 12345678', gameName.charAt(0).toUpperCase() + gameName.slice(1));
    templateFile = templateFile.replace('</body>', `${scriptResponse}</body>`)

    res.send(templateFile.replace('http://localhost:3000', config.baseUrl));
})

app.post('/game', imageUploaderWithBackground, (req, res) => {

    let gamesData = JSON.parse(fs.readFileSync('./json-files/games.json'));
  
    if (!req.body.name || !req.body.images) {
      console.log(req.body)
      return res.status(400).send({
        error: true
      });
    }
  
    gamesData[req.body.name.toLowerCase()] = {
      name: req.body.name.toLowerCase(),
      backgroundImage: req.body.backgroundImage,
      cardBackgroundImage: req.body.cardBackgroundImage,
      counterColor: req.body.counterColor,
      images: req.body.images,
    }
    fs.writeFileSync('./json-files/games.json', JSON.stringify(gamesData, null, 2));

    res.json({
      success: true,
      url: config.baseUrl + `/memory/${req.body.name.toLowerCase()}`
    })
  });

  app.get('/addgame', (req, res) => {

    try {
        const templateFile = fs.readFileSync('./html-files/add-game.html', 'utf8');
        res.send(templateFile.replace('http://localhost:3000', config.baseUrl));

    } catch (e) {
      const errorPage = fs.readFileSync('./html-files/error.html', 'utf8');
      res.status(500).send(errorPage.replace('Page not found', "Couldn't create game"));
    }

  })

  app.get('/login', (req, res)=>{
    try {
      const loginFile = fs.readFileSync('html-files/login.html', 'utf-8');
      res.send(loginFile.replace('http://localhost:3000', config.baseUrl))

    } catch (e) {
      const errorPage = fs.readFileSync('./html-files/error.html', 'utf-8')
      res.send(
        errorPage
      )
    }
  })

  app.post('/login', (req, res)=>{
    try{

      let userData = JSON.parse(fs.readFileSync('./json-files/user.json'));

      if (userData['username'] !== req.body.username || userData['password'] !== req.body.password){

        res.status(401).send(
          {
            error: true
          }
        )
        return
      }

      const token = jwt.sign({username: userData['username']}, config.secretKey, {
        expiresIn: '7d',
      });

      res.send({
        token
      })

    } catch (e) {
      res.status(500).send({
        error: true
      })
    }
  })

  app.post('/verify', (req, res)=>{
    const token = req.header('Authorization');
    if (!token) return res.status(401).send(
        {
          error: true
        }
    )
    
    try {
        const decoded = jwt.verify(token, config.secretKey);
        req.userId = decoded.userId;
        res.send(
          {
            success: true
          }
        )

    } catch (error) {
        res.status(401).send(
           {
            error: true
           }
        );
    }
  })

  app.get('/games', (req, res) => {

    try {
      let gamesData = JSON.parse(fs.readFileSync('./json-files/games.json'));
      var templateFile = fs.readFileSync('./html-files/games.html', 'utf8');

      const games = Object.entries(gamesData).map((game)=>{
        return {
          ...game[1],
          numberOfImages: game[1].images.length,
          url: config.baseUrl + `/memory/${game[0].toLowerCase()}`
        }
      })

      const scriptResponse = `
        const cardsContainer = document.getElementById('cards-container')
        const gameData = ${JSON.stringify(games)}
        gameData.map((game)=>{
          cardsContainer.appendChild(createCard(game))
        })
      </script>
      `

      templateFile = templateFile.replace('</script>', scriptResponse)

      res.send(templateFile = templateFile.replace('http://localhost:3000', config.baseUrl))

    } catch(e){
      res.send({
        error: true
      })
    }
  })

  app.delete('/game/:name', (req, res)=>{
    try{
      const {name} = req.params;
      let gamesData = JSON.parse(fs.readFileSync('./json-files/games.json'));

      if (!name || !gamesData[name] ){
        res.status(400).send({
          error: true
        })
        return
      }

      delete gamesData[name]

      fs.writeFileSync('./json-files/games.json', JSON.stringify(gamesData, null, 2));

      res.send({
        success: true
      })

    }catch (e){
      res.status(400).send({
        error: true
      })
    }
  })

  app.put("/game/name/:name", (req, res)=>{
    try{
      const { name } = req.params;
      let gamesData = JSON.parse(fs.readFileSync('./json-files/games.json'));

      if (!name || !gamesData[name] || !req.body.name ){
        res.status(404).send({
          error: true
        })
        return
      }

      gamesData[name].name = req.body.name
      gamesData[req.body.name] = gamesData[name]
      delete gamesData[name]
      
      fs.writeFileSync('./json-files/games.json', JSON.stringify(gamesData, null, 2));
      
      res.send({
        success: true,
        game: gamesData[req.body.name]
      })

    } catch(e){
      res.status(400).send({
        error: true
      })
    }
  })

  app.put("/game/counter/:name", (req, res)=>{
    try{
      const {name} = req.params;
      let gamesData = JSON.parse(fs.readFileSync('./json-files/games.json'));

      if (!name || !gamesData[name] || !req.body.counterColor){
        res.status(404).send({
          error: true
        })
        return
      }

      gamesData[name].counterColor = req.body.counterColor
      
      fs.writeFileSync('./json-files/games.json', JSON.stringify(gamesData, null, 2));
      
      res.send({
        success: true
      })

    } catch(e){
      res.status(400).send({
        error: true
      })
    }
  })

  
  app.put("/game/cardbackground/:name", imageUploader, (req, res)=>{
    try{
      const {name} = req.params;
      let gamesData = JSON.parse(fs.readFileSync('./json-files/games.json'));

      if (!name || !gamesData[name] ){
        res.status(404).send({
          error: true
        })
        return
      }

      gamesData[name].cardBackgroundImage = req.body.image
      
      fs.writeFileSync('./json-files/games.json', JSON.stringify(gamesData, null, 2));
      
      res.send({
        success: true
      })
      
    } catch(e){
      res.status(400).send({
        error: true
      })
    }
  })

  app.put("/game/background/:name", imageUploader, (req, res)=>{
    try{
      const {name} = req.params;
      let gamesData = JSON.parse(fs.readFileSync('./json-files/games.json'));

      if (!name || !gamesData[name] ){
        res.status(404).send({
          error: true
        })
        return
      }

      gamesData[name].backgroundImage = req.body.image
      
      fs.writeFileSync('./json-files/games.json', JSON.stringify(gamesData, null, 2));
      
      res.send({
        success: true
      })
      
    } catch(e){
      res.status(400).send({
        error: true
      })
    }
  })

  app.put("/game/images/:name", imagesUploader, (req, res)=>{
    try{
      const {name} = req.params;
      let gamesData = JSON.parse(fs.readFileSync('./json-files/games.json'));

      if (!name || !gamesData[name] ){
        res.status(404).send({
          error: true
        })
        return
      }

      gamesData[name].images =  gamesData[name].images.concat(req.body.images)
      
      fs.writeFileSync('./json-files/games.json', JSON.stringify(gamesData, null, 2));
      
      res.send({
        success: true,
        images: gamesData[name].images
      })
      
    } catch(e){
      res.status(400).send({
        error: true
      })
    }
  })

  app.put("/game/deleteimages/:name", (req, res)=>{
    try{
      const {name} = req.params;
      let gamesData = JSON.parse(fs.readFileSync('./json-files/games.json'));

      if (!name || !gamesData[name] ){
        res.status(404).send({
          error: true
        })
        return
      }
      gamesData[name].images =  gamesData[name].images.filter((image)=>{
        return !req.body.images.includes(image)
      })
      
      fs.writeFileSync('./json-files/games.json', JSON.stringify(gamesData, null, 2));
      res.send({
        success: true,
        images: gamesData[name].images
      })
      
    } catch(e){
      res.status(400).send({
        error: true
      })
    }
  })

app.listen(config.PORT || 3000, () => {
    console.log(`Server is running on port ${config.PORT || 3000}`)
})