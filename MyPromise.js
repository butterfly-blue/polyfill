//任务队列
const taskQueue = [];

//任务
class Task {
  constructor(promise, excutor) {
    this.wait = promise;
    this.excutor = excutor;
    taskQueue.push(this);
  }
  static notify(promise) {
    for(let i = 0; i < taskQueue.length; i++) {
      if(taskQueue[i].wait === promise) {
        const task = taskQueue[i];
        taskQueue.splice(i, 1);
        queueMicrotask(() => {
          task.excutor.call(task.wait);
        });
        break;
      }
    }
  }
}

//MyPromise
class MyPromise {
  constructor(excutor) {
    this.PromiseStatus = "pending";
    const resolve = value => {
      this.PromiseStatus = "resolved";
      this.PromiseValue = value;
      Task.notify(this);
    }
    const reject = reason => {
      this.PromiseStatus = "rejected";
      this.PromiseValue = reason;
      Task.notify(this);
    }
    if(typeof excutor === "function"){
      try{
        excutor(resolve, reject);
      }catch(reason){
        reject(reason);
      }
    }else{
      throw new TypeError("MyPromise resolver undefined is not a function")
    }
  }
  then(onFullfilled, onRejected){
    const nextPromise = Object.create(MyPromise.prototype);
    nextPromise.PromiseStatus = "pending";
    const excutor = function(){
      try{
        if(this.PromiseStatus === "resolved"){
          nextPromise.PromiseStatus = "resolved";
          if(typeof onFullfilled === "function"){
            nextPromise.PromiseValue = onFullfilled(this.PromiseValue);
          }else{
            nextPromise.PromiseValue = this.PromiseValue;
          }
        }else{
          if(typeof onRejected === "function"){
            nextPromise.PromiseStatus = "resolved";
            nextPromise.PromiseValue = onRejected(this.PromiseValue);
          }else{
            nextPromise.PromiseStatus = "rejected";
            nextPromise.PromiseValue = this.PromiseValue;
          }
        }
      }catch(reason){
        nextPromise.PromiseStatus = "rejected";
        nextPromise.PromiseValue = reason;
      }
      Task.notify(nextPromise);
    }
    if(this.PromiseStatus === "pending") {
      new Task(this, excutor);
    }else {
      queueMicrotask(() => {
        excutor.call(this);
      })
    }
    return nextPromise;
  }
  catch(onRejected){
    return this.then(undefined, onRejected);
  }
  static resolve(value) {
    return new MyPromise(function(resolve){
      resolve(value);
    });
  }
  static reject(reason){
    return new MyPromise(function(resolve, reject){
      reject(reason);
    });
  }
}

//测试
function test() {
  console.log("开始测试");
  const wait = function(time){
    return new MyPromise(function(resolve){
      setTimeout(resolve, time);
    });
  }
  wait(3000).then(function(){
    console.log("过了三秒");
  }).then(function(){
    console.log("吃饭");
  }).then(function(){
    console.log("洗澡");
  }).catch(function(reason){
    console.log(reason);
  });
}

test();