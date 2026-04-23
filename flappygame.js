const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");

function resize(){
  canvas.width=window.innerWidth*0.4;
  canvas.height=window.innerHeight*0.8;
}
resize();
window.addEventListener("resize",resize);


const bg=new Image();
bg.src="https://wallpapers.com/images/hd/flappy-bird-background-gecj5m4a9yhhjp87.jpg";
const birdImg=new Image();
birdImg.src="https://www.nicepng.com/png/full/828-8285914_flappy-bird-sprite-computer-icons-opengameart-flappy-bird.png";


const AudioCtx=window.AudioContext||window.webkitAudioContext;
const audioCtx=new AudioCtx();
function beep(freq,duration){
  let osc=audioCtx.createOscillator();
  let gain=audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value=freq;
  osc.start();
  setTimeout(()=>osc.stop(),duration);
}


let bird={x:80,y:150,w:40,h:30,gravity:0.6,lift:-10,velocity:0,rotation:0};
let pipes=[];
let frame=0;
let score=0;
let gameOver=false;


let level=1;
let pipeSpeed=4;
let pipeGap=150;


let highScore=localStorage.getItem("hs")||0;
let leaderboard=JSON.parse(localStorage.getItem("lb")||"[]");


let unlocked=[];


function restartGame(){
  pipes=[];
  bird.y=150;
  bird.velocity=0;
  score=0;
  gameOver=false;
}

function jump(){
  if(!gameOver){
    bird.velocity=bird.lift;
    beep(600,80);
    if(navigator.vibrate) navigator.vibrate(20);
  }else{
    restartGame();
  }
}

window.addEventListener("keydown",e=>{
  if(e.code==="Space") jump();
  if(e.code==="Enter" && gameOver) restartGame();
});
canvas.addEventListener("click",jump);


function updatePipes(){
  if(frame%Math.max(90-level*5,40)===0){
    let top=Math.random()*(canvas.height/2);
    pipes.push({x:canvas.width,w:70,top:top,bottom:canvas.height-top-pipeGap,passed:false});
  }

  pipes.forEach(p=>{
    p.x-=pipeSpeed;

    if(!p.passed && p.x+p.w<bird.x){
      score++;
      p.passed=true;
      beep(800,60);
      if(navigator.vibrate) navigator.vibrate(30);
    }

    if(
      bird.x<p.x+p.w &&
      bird.x+bird.w>p.x &&
      (bird.y<p.top || bird.y+bird.h>canvas.height-p.bottom)
    ){
      gameOver=true;
    }
  });

  pipes=pipes.filter(p=>p.x+p.w>0);
}


function updateLevel(){
  level=Math.floor(score/10)+1;
  pipeSpeed=4+level*0.5;
  pipeGap=Math.max(120,150-level*5);

  if(score>=10 && !unlocked.includes("Rookie")) unlocked.push("Rookie");
  if(score>=25 && !unlocked.includes("Skilled")) unlocked.push("Skilled");
  if(score>=50 && !unlocked.includes("Pro Player")) unlocked.push("Pro Player");
  if(score>=100 && !unlocked.includes("Legend")) unlocked.push("Legend");
}

function update(){
  bird.velocity+=bird.gravity;
  bird.y+=bird.velocity;
  bird.rotation=Math.min(Math.max(bird.velocity*3,-30),90);

  if(bird.y<0||bird.y+bird.h>canvas.height){
    gameOver=true;
  }
}

function drawPipes(){
  pipes.forEach(p=>{
    let grad=ctx.createLinearGradient(p.x,0,p.x+p.w,0);
    grad.addColorStop(0,"#2ecc71");
    grad.addColorStop(0.5,"#27ae60");
    grad.addColorStop(1,"#145a32");

    ctx.fillStyle=grad;
    ctx.fillRect(p.x,0,p.w,p.top);
    ctx.fillRect(p.x,canvas.height-p.bottom,p.w,p.bottom);

    ctx.fillStyle="#1e8449";
    ctx.fillRect(p.x-6,p.top-20,p.w+12,20);
    ctx.fillRect(p.x-6,canvas.height-p.bottom,p.w+12,20);

    ctx.fillStyle="rgba(255,255,255,0.2)";
    ctx.fillRect(p.x+6,0,5,p.top);
    ctx.fillRect(p.x+6,canvas.height-p.bottom,5,p.bottom);
  });
}

function draw(){
  ctx.drawImage(bg,0,0,canvas.width,canvas.height);
  drawPipes();

  ctx.save();
  ctx.translate(bird.x+bird.w/2,bird.y+bird.h/2);
  ctx.rotate(bird.rotation*Math.PI/180);
  ctx.drawImage(birdImg,-bird.w/2,-bird.h/2,bird.w,bird.h);
  ctx.restore();

  ctx.fillStyle="#fff";
  ctx.font="30px Arial";
  ctx.fillText("Score: "+score,20,40);
  ctx.fillText("Level: "+level,20,80);

  if(gameOver){

    if(score>highScore) highScore=score;

    leaderboard.push(score);
    leaderboard.sort((a,b)=>b-a);
    leaderboard=leaderboard.slice(0,5);

    localStorage.setItem("hs",highScore);
    localStorage.setItem("lb",JSON.stringify(leaderboard));


    ctx.fillStyle="rgba(0,0,0,0.75)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle="#fff";
    ctx.font="40px Arial";
    ctx.fillText("Game Over",canvas.width/2-120,canvas.height/2-80);

    ctx.font="20px Arial";
    ctx.fillText("Score: "+score,canvas.width/2-60,canvas.height/2-40);
    ctx.fillText("High: "+highScore,canvas.width/2-60,canvas.height/2-10);

    ctx.fillText("Press ENTER to Restart",canvas.width/2-120,canvas.height/2+60);
    ctx.fillText("Press SPACE to Restart",canvas.width/2-120,canvas.height/2+90);
    ctx.fillText("Click to Restart",canvas.width/2-120,canvas.height/2+120);
  }
}

canvas.addEventListener("click",()=>{
  if(gameOver){
    restartGame();
  }
});

function loop(){

  if(gameOver){
    draw();
    requestAnimationFrame(loop);
    return;
  }

  update();
  updatePipes();
  updateLevel();

  draw();
  frame++;
  requestAnimationFrame(loop);
}

loop();