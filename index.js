const express = require("express")
const bodyParser = require('body-parser');
const fs = require('fs');
const imageUploader = require("./middlewares/image-uploader");
const jwt = require('jsonwebtoken');
const config = require('./config')

const app = express()
app.use(bodyParser.json());

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
    const gameImages = gamesData[gameName.toLowerCase()];
  
    if (!gameImages) {
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
          let seconds = 0;
          const timer = setInterval(() => {
              seconds++;
              timePlayed.innerText = formatTime(seconds)
          }, 1000); // Update every second
          
          return timer; // Return the interval ID to stop the stopwatch later if needed
      }

      const startPlay = function(){ 
        timer = startStopwatch()
        playContainer.style.display = 'none';
      }

      const replayGame = function(){
        clearInterval(timer)
        timePlayed.innerText = '00:00:00'
        numberOfMatches = 0
        currentGameNumberIdx = 0
        shuffleAndMakeGrid(imgNodes.slice(0, gameNumbers[currentGameNumberIdx] * 2))
        timer = startStopwatch()
      }

      const playBtn = document.getElementById('play');
      const replayBtn = document.getElementById('replay');
      const playContainer = document.getElementById('play-container');
      const replayContainer = document.getElementById('replay-container');
      const result = document.getElementById('result');

      playBtn.addEventListener('click', startPlay);
      replayBtn.addEventListener('click', replayGame);

      const timePlayed = document.getElementById('time-played');
      timePlayed.innerText = '00:00:00';

      var timer = null;
      var selectedNode = null;

      var onTimeout = false;

      var numberOfMatches = 0

      const handleImgClick = function (e) {

        if (!this.firstChild.classList.contains('matched') && !onTimeout){
          
          if (selectedNode) {

            if (selectedNode.dataset.identifier === this.firstChild.dataset.identifier){
              this.firstChild.classList.add('matched')
              this.firstChild.classList.remove('unmatched')
              selectedNode = null
              numberOfMatches++


              if (numberOfMatches === gameNumbers[currentGameNumberIdx] && gameNumbers[currentGameNumberIdx] === Math.floor(imgNodes.length/2)){
                clearInterval(timer)
                replayContainer.style.display = 'flex';
                result.innerText = 'Congratulations! You have won the game in ' + timePlayed.innerText + '!';
                timePlayed.innerText = '00:00:00'

              } else if (numberOfMatches === gameNumbers[currentGameNumberIdx]){
                console.log('next game')
                currentGameNumberIdx++
                shuffleAndMakeGrid(imgNodes.slice(0, 2 * gameNumbers[currentGameNumberIdx]))
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
              }, 1000)
            }

          } else {
            this.firstChild.classList.add('matched')
            this.firstChild.classList.remove('unmatched')
            selectedNode = this.firstChild
          } 
        } else {

        }
      }

      const shuffleAndMakeGrid = function (currentImageNodes){
        newImgNodes = shuffle(currentImageNodes)
        newImgNodes.forEach((imgNode)=>{
          imgNode.firstChild.classList.remove('matched')
          imgNode.firstChild.classList.add('unmatched')
        })
        gridContainer.innerHTML = ''
        gridContainer.style.gridTemplateColumns = 'repeat(' + imageGridSize[gameNumbers[currentGameNumberIdx]] + ', 1fr)'
        replayContainer.style.display = 'none';
        playContainer.style.display = 'none';
        gridContainer.appendChild(playContainer)
        gridContainer.appendChild(replayContainer)
        newImgNodes.forEach((imgNode)=>{
          gridContainer.appendChild(imgNode)
        })
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

      const gameData = ${JSON.stringify({name: gameName, images: gameImages})};
      
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

      const gridContainer = document.getElementById('gridContainer')

      shuffleAndMakeGrid(imgNodes.slice(0, gameNumbers[currentGameNumberIdx] * 2))

      playContainer.style.display = 'flex';

    </script>`;

    res.send(templateFile.replace('</body>', `${scriptResponse}</body>`));
})

app.post('/game', imageUploader, (req, res) => {

    let gamesData = JSON.parse(fs.readFileSync('./json-files/games.json'));
    const templateFile = fs.readFileSync('./html-files/index.html', 'utf8');
  
    if (!req.body.name || !req.body.images) {
      return res.status(400).send({
        error: true
      });
    }
  
    gamesData[req.body.name.toLowerCase()] = req.body.images;
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
          name: game[0],
          numberOfImages: game[1].length,
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

      templateFile = templateFile.replace('http://localhost:3000', config.baseUrl)

      res.send(templateFile.replace('</script>', scriptResponse))

    } catch(e){

    }
  })

  app.delete('/game/:name', (req, res)=>{
    try{
      console.log("request")
      const {name} = req.params;
      let gamesData = JSON.parse(fs.readFileSync('./json-files/games.json'));

      if (!name || !gamesData[name] ){
        res.status(400).send({
          error: true
        })
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

app.listen(config.PORT || 3000, () => {
    console.log(`Server is running on port ${config.PORT || 3000}`)
})