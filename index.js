const express = require('express')
const bodyParser = require('body-parser')
const Keyv = require('keyv')

const question = new Keyv('sqlite://question.sqlite', {
    table: 'question'
})

const app = express()

app.listen(process.env.PORT || 8080)

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

app.get('/', (req,res) => {
    res.sendFile(__dirname + "/paths/index.html")
})

app.get('/error', (req,res) => {
    res.sendFile(__dirname + "/paths/error.html")
})

app.get('/a/:id', async (req,res) => {
    const param = req.params.id

    const q = await question.get(param)
    res.send(`<html>
    <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css">
        <script defer src="https://use.fontawesome.com/releases/v6.1.1/js/all.js"></script>
        <meta charset="utf-8">
        <title> しつもんばこ（もどき） </title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
        <section class="section">
            <div class="container has-text-centered">
                <h1 class="title"> ${q} </h1>
                <h1 class="subtitle"> こたえろ </h1>
              <div class="box">
                <form class="field" action="/a/cb" method="post">
                  <label class="label"> 質問（リダイレクト用） </label>
                    <div class="controls">
                      <input type="text" name="question_before" id="question" class="input" readonly></input>
                    </div>
                  <label class="label"> 回答欄 </label>
                  <div class="controls">
                    <textarea name="question" class="textarea" placeholder="かいとうをどうぞ (300文字いない)" maxlength="300"></textarea>
                  </div>
                </br>
                   <button action="post" class="button is-danger">おくる</button>
                </form>
            </div>
            </div>
            <script>
            var v = document.getElementById('question');
            window.onload = function(){
            v.value = "${q}"
            }
            </script>
        </section>
    </body>
</html>`)
})

const Ransuu = () => {
    var S = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    var N = 5
    let code = Array.from(Array(N)).map(() => S[Math.floor(Math.random() * S.length)]).join('')
    return code
}

app.post('/a/cb', async(req,res) => {
    console.log(req.body)
    res.redirect(`https://twitter.com/share?text=「${req.body.question_before}」の回答は「${req.body.question}」あきかきに質問をしよう！&url=http%3A%2F%2Flocalhost:8080/`)
})

app.post('/question', async (req,res) => {
    try{
    console.log(req.body)
    const q = await question.get('question')

    const q_id = await question.get('id')

    console.log(q)
    if(!q){
        //Array Generate
        const save_question = [req.body.question]
        const save_questionid = Ransuu()

        //Save
        await question.set('question',save_question)
        await question.set('id', save_questionid.split(','))
        await question.set(save_questionid, req.body.question)

        //Redirect
        await res.redirect('/')
        console.log(save_questionid, save_question)
    } else {
        // Situmon Id and Text
        const old = q.join(',')
        const old_id = q_id.join(',')

        const ids = Ransuu()

        //Save the id and Text
        const save_question = (`${old},${req.body.question}`).split(',')
        const save_questionid = (`${old_id},${ids}`).split(',')

        //Save on Save
        await question.set('question',save_question)
        await question.set('id', save_questionid)
        await question.set(ids, req.body.question)

        //Redirect
        await res.redirect('/')
        console.log(save_questionid, save_question)
    }
    }catch(e){
       res.redirect('/error')
       console.log(e)
    }
})

app.get('/answer', async (req,res) => {
   const q = await question.get('question')
   const qid = await question.get('id')

   let questions = ""
   let id
   let title

   qid.forEach(question => {
     q.forEach(text => {
        if(id === question) return;
        if(text === title) return;
       questions += `</br><a href='a/${question}'> ${text} </a> `
       id = question
       text = title
     })
   })

   res.send(questions)
})